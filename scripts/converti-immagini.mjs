// Genera le versioni AVIF e WebP di tutte le foto in public/.
//
// JPEG e PNG sono formati degli anni '90: a parità di resa visiva pesano il
// doppio o il triplo di AVIF e WebP. Sul sito sono ~18 MB di foto, ed è la voce
// più pesante di ogni pagina — PageSpeed lo segnala come primo intervento
// possibile ("Migliora il caricamento delle immagini").
//
// Lo script NON sostituisce gli originali: li affianca. Accanto a
// `piscina-esterna.jpg` scrive `piscina-esterna.avif` e `piscina-esterna.webp`,
// e il sito li propone al browser in quest'ordine tramite <picture>, tenendo il
// JPEG come ultima spiaggia per i browser vecchi. Nessun visitatore resta senza
// immagine, e chi ha un browser degli ultimi anni scarica un terzo dei byte.
//
// Cosa resta fuori, e perché:
//   - public/og/     le anteprime social. Facebook, WhatsApp e LinkedIn leggono
//                    og:image con i loro crawler, che AVIF e WebP non li
//                    supportano tutti: un'anteprima che non si vede vale meno
//                    dei kB risparmiati.
//   - favicon.png, apple-touch-icon.png
//                    li legge il browser (e iOS) fuori dall'HTML, senza
//                    possibilità di offrire un'alternativa.
//
// Uso:  node scripts/converti-immagini.mjs [--forza] [--silenzioso]
// Gira anche da solo prima di ogni build (vedi "prebuild" in package.json): le
// foto caricate da TinaCMS vengono convertite al primo deploy utile senza che
// nessuno debba ricordarsene. I file già convertiti vengono saltati, quindi
// rilanciarlo non costa niente; --forza li rigenera comunque.
//
// In coda scrive src/data/immagini-ottimizzate.json, l'elenco di cosa è stato
// davvero prodotto: il sito si fida di quello e non dell'esistenza presunta di
// un file. È la differenza fra un'immagine alleggerita e un'immagine rotta —
// <picture> sceglie la prima sorgente che il browser dichiara di saper leggere,
// e se quel file non esiste mostra il vuoto senza ripiegare sul JPEG.
//
// Nel manifest sta anche l'impronta del file di partenza, ed è quella a dire
// se una foto va riconvertita. Guardare le date non funziona: git non
// conserva le date di modifica, e a ogni clone (cioè a ogni build in CI) le
// riscrive tutte nello stesso istante, in ordine alfabetico. `spa.avif` viene
// prima di `spa.jpg`, quindi il derivato risulta *più vecchio* del suo
// originale e sembra da rifare — un quarto delle foto del sito, dieci minuti
// di CPU a ogni deploy, per riprodurre file identici a quelli già presenti.

import sharp from "sharp";
import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const MANIFEST = path.join(ROOT, "src", "data", "immagini-ottimizzate.json");

const forza = process.argv.includes("--forza");
const silenzioso = process.argv.includes("--silenzioso");

/** Percorsi (relativi a public/) da non toccare. Vedi l'intestazione. */
const ESCLUSI = [/^og\//, /^favicon\.png$/, /^apple-touch-icon\.png$/];

// Le qualità sono scelte per essere indistinguibili dall'originale a schermo,
// non per spremere l'ultimo kB: queste sono foto di un club, non icone.
// AVIF regge una qualità nominale più bassa del WebP a parità di resa — è il
// motivo per cui pesa meno. `effort` è quanto tempo l'encoder ci mette a
// cercare la compressione migliore: 6 su 9 per AVIF è il punto oltre il quale
// si paga molto tempo per pochi byte.
const QUALITA = {
	avif: { quality: 50, effort: 6 },
	webp: { quality: 75, effort: 5 },
};

// Larghezze intermedie, oltre al file a piena risoluzione: coprono il logo
// (badge da un centinaio di pixel), le anteprime nelle slideshow e le foto a
// mezza larghezza degli hero, senza dover indovinare caso per caso quanto
// grande serva davvero un'immagine. Una larghezza si scarta quando la foto di
// partenza non è abbastanza più grande di lei (SOGLIA_RIDUZIONE): produrre un
// "-1080" da un originale di 1150px non risparmierebbe quasi nulla.
const LARGHEZZE = [320, 640, 1080];
const SOGLIA_RIDUZIONE = 150;

/** Tutti i file sotto `cartella`, ricorsivamente, come percorsi assoluti. */
function scorri(cartella, raccolti = []) {
	for (const voce of readdirSync(cartella, { withFileTypes: true })) {
		const completo = path.join(cartella, voce.name);
		if (voce.isDirectory()) scorri(completo, raccolti);
		else raccolti.push(completo);
	}
	return raccolti;
}

/** Impronta del contenuto di un file. 16 cifre esadecimali bastano: qui serve
 *  a dire "è cambiato?", non a difendersi da nessuno. */
function impronta(file) {
	return createHash("sha1").update(readFileSync(file)).digest("hex").slice(0, 16);
}

/** Il manifest della passata precedente, se c'è: dice quali originali erano
 *  già stati convertiti e con che contenuto. */
function manifestPrecedente() {
	if (forza || !existsSync(MANIFEST)) return {};
	try {
		return JSON.parse(readFileSync(MANIFEST, "utf8"));
	} catch {
		// Un manifest illeggibile non è un motivo per fermarsi: si riconverte
		// tutto e lo si riscrive sano.
		return {};
	}
}

const kB = (byte) => Math.round(byte / 1024);

async function converti() {
	const sorgenti = scorri(PUBLIC)
		.filter((f) => /\.(jpe?g|png)$/i.test(f))
		.map((f) => path.relative(PUBLIC, f).split(path.sep).join("/"))
		.filter((rel) => !ESCLUSI.some((regola) => regola.test(rel)))
		.sort();

	const precedente = manifestPrecedente();

	/** Percorso originale → impronta della sorgente, formati e larghezze
	 *  disponibili. */
	const manifest = {};
	let byteOriginali = 0;
	let byteAvif = 0;
	let byteWebp = 0;
	let byteVarianti = 0;
	let generati = 0;

	for (const rel of sorgenti) {
		const assoluto = path.join(PUBLIC, rel);
		const pesoOriginale = statSync(assoluto).size;
		byteOriginali += pesoOriginale;

		const origine = impronta(assoluto);
		// La foto è la stessa dell'ultima passata: i suoi derivati, se sono
		// ancora al loro posto, vanno bene così.
		const invariata = precedente[`/${rel}`]?.origine === origine;

		// La larghezza reale serve per decidere quali formati intermedi
		// generare, e finisce nel manifest così <picture> sa a che punto
		// del suo srcset sta il file a piena risoluzione. Ricalcolarla ogni
		// volta costerebbe una decodifica per foto anche quando non è
		// cambiato nulla: se l'originale è lo stesso, la si eredita.
		const larghezzaOriginale =
			invariata && precedente[`/${rel}`].larghezzaOriginale
				? precedente[`/${rel}`].larghezzaOriginale
				: (await sharp(assoluto).rotate().metadata()).width;

		// Le larghezze che vale la pena produrre per questa foto: quelle
		// abbastanza più piccole dell'originale da risparmiare qualcosa (vedi
		// SOGLIA_RIDUZIONE). Un'icona da 200px non genera nessuna variante,
		// una foto da 2000px le genera tutte.
		const larghezzeApplicabili = LARGHEZZE.filter((w) => larghezzaOriginale - w >= SOGLIA_RIDUZIONE);

		const formatiOk = [];
		const variantiOk = {};

		for (const formato of ["avif", "webp"]) {
			const relDerivato = rel.replace(/\.(jpe?g|png)$/i, `.${formato}`);
			const assDerivato = path.join(PUBLIC, relDerivato);
			// Un formato che l'ultima volta era stato scartato (derivato più
			// pesante dell'originale) resta scartato finché la foto non cambia:
			// senza questo controllo verrebbe riprovato — e riscartato — ogni
			// volta, che è il caso peggiore, tutto il lavoro e nessun file.
			const scartatoPrima = invariata && !precedente[`/${rel}`].formati.includes(formato);
			const giaPronto = invariata && (existsSync(assDerivato) || scartatoPrima);

			if (!giaPronto) {
				mkdirSync(path.dirname(assDerivato), { recursive: true });
				const buffer = await sharp(assoluto)
					.rotate() // applica l'orientamento EXIF prima di perderlo
					[formato](QUALITA[formato])
					.toBuffer();

				// Un derivato più pesante dell'originale è un derivato inutile:
				// capita con i PNG piatti (loghi, poche tinte), dove la
				// compressione senza perdita del PNG è già ottima. In quel caso
				// il file non va scritto — e se esisteva da una conversione
				// precedente va tolto, altrimenti il manifest e il disco
				// raccontano due storie diverse.
				if (buffer.length >= pesoOriginale) {
					if (existsSync(assDerivato)) unlinkSync(assDerivato);
					if (!silenzioso) {
						console.log(`  ~ ${relDerivato} scartato (${kB(buffer.length)} kB ≥ originale)`);
					}
					continue;
				}

				writeFileSync(assDerivato, buffer);
				generati++;
				if (!silenzioso) {
					const risparmio = Math.round((1 - buffer.length / pesoOriginale) * 100);
					console.log(`  + ${relDerivato}  ${kB(pesoOriginale)} → ${kB(buffer.length)} kB  (-${risparmio}%)`);
				}
			}

			if (!existsSync(assDerivato)) continue;
			formatiOk.push(formato);
			const peso = statSync(assDerivato).size;
			if (formato === "avif") byteAvif += peso;
			else byteWebp += peso;

			// Le varianti più piccole, una per larghezza applicabile. A
			// differenza del file a piena risoluzione non c'è un caso di
			// scarto (rimpicciolire pesa sempre meno), quindi "già pronta"
			// vuol dire solo che il file esiste ed è della stessa foto.
			const larghezzeOk = [];
			for (const w of larghezzeApplicabili) {
				const relVariante = rel.replace(/\.(jpe?g|png)$/i, `-${w}.${formato}`);
				const assVariante = path.join(PUBLIC, relVariante);
				const variantePronta = invariata && existsSync(assVariante);

				if (!variantePronta) {
					const bufferVariante = await sharp(assoluto)
						.rotate()
						.resize({ width: w })
						[formato](QUALITA[formato])
						.toBuffer();
					writeFileSync(assVariante, bufferVariante);
					generati++;
					if (!silenzioso) console.log(`  + ${relVariante}  ${kB(bufferVariante.length)} kB`);
				}

				if (!existsSync(assVariante)) continue;
				larghezzeOk.push(w);
				byteVarianti += statSync(assVariante).size;
			}
			variantiOk[formato] = larghezzeOk;
		}

		manifest[`/${rel}`] = { origine, formati: formatiOk, larghezzaOriginale, varianti: variantiOk };
		if (!formatiOk.length) {
			// Nessun formato moderno conviene: il conteggio finale deve
			// comunque tornare, quindi l'originale conta per sé.
			byteAvif += pesoOriginale;
			byteWebp += pesoOriginale;
		}
	}

	mkdirSync(path.dirname(MANIFEST), { recursive: true });
	writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, "\t")}\n`);

	const percentuale = (byte) => Math.round((1 - byte / byteOriginali) * 100);
	console.log(
		[
			"",
			`Immagini convertite: ${sorgenti.length} sorgenti, ${generati} file generati in questa passata.`,
			`  originali  ${kB(byteOriginali)} kB`,
			`  webp       ${kB(byteWebp)} kB  (-${percentuale(byteWebp)}%)`,
			`  avif       ${kB(byteAvif)} kB  (-${percentuale(byteAvif)}%)`,
			`  varianti   ${kB(byteVarianti)} kB  (larghezze ${LARGHEZZE.join(", ")}px, oltre alla piena risoluzione)`,
			`Manifest: ${path.relative(ROOT, MANIFEST)}`,
		].join("\n")
	);
}

converti().catch((errore) => {
	console.error("Conversione immagini fallita:", errore);
	process.exit(1);
});
