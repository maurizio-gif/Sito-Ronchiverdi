// Prepara un .mp4 per il web: sposta l'indice (atom `moov`) all'inizio del file.
//
// Un mp4 è fatto di "atom": `mdat` sono i fotogrammi, `moov` è l'indice che dice
// al browser dove trovarli. Molti programmi di export scrivono `moov` in fondo,
// dopo i fotogrammi: in quel caso il browser deve scaricare tutto il file prima
// di poter far partire un solo frame. Su desktop non si nota, da mobile il video
// resta fermo sul poster per secondi — o per sempre, se la rete è lenta.
// Spostare `moov` davanti ("fast start") fa partire il video appena arrivano i
// primi kB. Non è una riconversione: i fotogrammi non vengono toccati, la
// qualità e il peso restano identici.
//
// Uso:  node scripts/prepara-video.mjs [file...]
//       node scripts/prepara-video.mjs --poster public/videos/hero.mp4
// Senza argomenti controlla tutti i video in public/videos/.
// I file già a posto vengono lasciati stare, quindi si può rilanciare sempre.
// Con --poster rigenera anche il fermo immagine dal primo fotogramma (serve
// macOS: usa avconvert e qlmanage, già presenti di sistema).

import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

/** Scorre gli atom di un buffer restituendo tipo, posizione e dimensioni. */
function* atom(buf, inizio = 0, fine = buf.length) {
	let pos = inizio;
	while (pos + 8 <= fine) {
		let dimensione = buf.readUInt32BE(pos);
		const tipo = buf.toString("latin1", pos + 4, pos + 8);
		let intestazione = 8;
		if (dimensione === 1) {
			// dimensione a 64 bit: sta negli 8 byte dopo il tipo
			dimensione = Number(buf.readBigUInt64BE(pos + 8));
			intestazione = 16;
		} else if (dimensione === 0) {
			dimensione = fine - pos; // "fino alla fine del file"
		}
		if (dimensione < 8 || pos + dimensione > fine) return;
		yield { tipo, pos, dimensione, intestazione };
		pos += dimensione;
	}
}

/** Somma `scarto` a tutti i puntatori ai fotogrammi dentro il `moov`. */
function spostaPuntatori(moov, scarto, inizio = 0, fine = moov.length) {
	for (const a of atom(moov, inizio, fine)) {
		const corpo = a.pos + a.intestazione;
		const dopo = a.pos + a.dimensione;
		// I contenitori si aprono e si guarda dentro; le tabelle si riscrivono.
		if (["moov", "trak", "mdia", "minf", "stbl"].includes(a.tipo)) {
			spostaPuntatori(moov, scarto, corpo, dopo);
		} else if (a.tipo === "stco") {
			const quanti = moov.readUInt32BE(corpo + 4);
			for (let i = 0; i < quanti; i++) {
				const p = corpo + 8 + i * 4;
				moov.writeUInt32BE(moov.readUInt32BE(p) + scarto, p);
			}
		} else if (a.tipo === "co64") {
			const quanti = moov.readUInt32BE(corpo + 4);
			for (let i = 0; i < quanti; i++) {
				const p = corpo + 8 + i * 8;
				moov.writeBigUInt64BE(moov.readBigUInt64BE(p) + BigInt(scarto), p);
			}
		}
	}
}

/** Il codec del primo traccia video, per avvisare se è HEVC. */
function codecVideo(moov) {
	const codec = [];
	const cerca = (inizio, fine) => {
		for (const a of atom(moov, inizio, fine)) {
			const corpo = a.pos + a.intestazione;
			const dopo = a.pos + a.dimensione;
			if (["moov", "trak", "mdia", "minf", "stbl"].includes(a.tipo)) {
				cerca(corpo, dopo);
			} else if (a.tipo === "stsd") {
				codec.push(moov.toString("latin1", corpo + 12, corpo + 16));
			}
		}
	};
	cerca(0, moov.length);
	return codec;
}

function prepara(file) {
	const originale = readFileSync(file);
	const atomPrincipali = [...atom(originale)];
	const moov = atomPrincipali.find((a) => a.tipo === "moov");
	const mdat = atomPrincipali.find((a) => a.tipo === "mdat");
	const nome = path.basename(file);

	if (!moov || !mdat) {
		console.warn(`  ! ${nome}: non sembra un mp4 (manca moov o mdat), saltato`);
		return false;
	}

	const contenuto = originale.subarray(moov.pos, moov.pos + moov.dimensione);
	for (const codec of codecVideo(contenuto)) {
		if (codec === "hvc1" || codec === "hev1") {
			console.warn(
				`  ! ${nome}: è codificato in HEVC (H.265). Su Safari e iPhone va,` +
					` ma i browser senza decoder HEVC mostrano solo il poster:` +
					` conviene esportarlo in H.264.`,
			);
		}
	}

	if (moov.pos < mdat.pos) {
		console.log(`  · ${nome}: già pronto per il web`);
		return false;
	}

	// `moov` va inserito subito dopo `ftyp`: tutto quello che sta in mezzo si
	// sposta in avanti della sua lunghezza, e i puntatori vanno corretti.
	const nuovoMoov = Buffer.from(contenuto);
	spostaPuntatori(nuovoMoov, moov.dimensione);

	const ftyp = atomPrincipali.find((a) => a.tipo === "ftyp");
	const testa = ftyp ? ftyp.pos + ftyp.dimensione : 0;
	const pezzi = [
		originale.subarray(0, testa),
		nuovoMoov,
		originale.subarray(testa, moov.pos),
		originale.subarray(moov.pos + moov.dimensione),
	];

	const nuovo = Buffer.concat(pezzi);
	if (nuovo.length !== originale.length) {
		throw new Error(`${nome}: la riscrittura ha cambiato il peso del file`);
	}
	writeFileSync(file, nuovo);
	console.log(`  → ${nome}: moov spostato in testa (${nuovo.length} byte, invariati)`);
	return true;
}

/** Il poster di un video sta in public/images/<nome>-video-poster.jpg. */
function posterDi(file) {
	return path.join("public/images", `${path.basename(file, ".mp4")}-video-poster.jpg`);
}

/**
 * Rigenera il fermo immagine dal primo fotogramma del video.
 * Il poster è quello che si vede nei decimi di secondo prima che il video
 * parta: se non è il primo fotogramma, all'avvio l'immagine "salta".
 * QuickLook da solo sceglie un fotogramma "rappresentativo" a caso in mezzo al
 * filmato, quindi prima si ritaglia con avconvert uno spezzone di due decimi —
 * così l'unico fotogramma disponibile è quello giusto.
 */
async function rigeneraPoster(file) {
	const nome = path.basename(file);
	const uscita = posterDi(file);
	const tmp = mkdtempSync(path.join(tmpdir(), "poster-"));
	try {
		const spezzone = path.join(tmp, "primo.mp4");
		execFileSync("avconvert", [
			"--source", file,
			"--output", spezzone,
			"--preset", "Preset1920x1080",
			"--duration", "0.2",
			"--replace",
		], { stdio: "ignore" });
		execFileSync("qlmanage", ["-t", "-s", "1920", "-o", tmp, spezzone], { stdio: "ignore" });
		const png = path.join(tmp, "primo.mp4.png");
		if (!existsSync(png)) throw new Error("QuickLook non ha prodotto il fotogramma");

		const { default: sharp } = await import("sharp");
		await sharp(png)
			.resize(1600, 900, { fit: "cover" })
			.jpeg({ quality: 82, mozjpeg: true })
			.toFile(uscita);
		console.log(`  → ${nome}: poster rigenerato in ${uscita}`);
	} catch (errore) {
		console.warn(`  ! ${nome}: poster non rigenerato (${errore.message})`);
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
}

const CARTELLA = "public/videos";
const argomenti = process.argv.slice(2);
const poster = argomenti.includes("--poster");
const file = argomenti.filter((a) => a !== "--poster");
const daFare = file.length
	? file
	: readdirSync(CARTELLA)
			.filter((f) => f.endsWith(".mp4") && !f.startsWith("._"))
			.map((f) => path.join(CARTELLA, f));

let sistemati = 0;
for (const f of daFare) {
	if (prepara(f)) sistemati++;
	if (poster) await rigeneraPoster(f);
}
console.log(`\n${sistemati} video su ${daFare.length} sistemati.`);
