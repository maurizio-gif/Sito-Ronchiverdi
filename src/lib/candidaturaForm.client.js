// @ts-nocheck — script vanilla per il browser, come leadForm.client.js.
//
// Il modulo di /lavora-con-noi. L'invio è in tre passi, e il secondo non passa
// dal nostro server:
//
//   1. POST /api/candidatura/upload  → firma il caricamento e dà il percorso
//   2. PUT sull'URL firmata          → il file va dal browser a Supabase
//   3. POST /api/candidatura         → salva il testo del modulo e il percorso
//
// Il file salta il nostro server perché una function Vercel accetta 4,5 MB nel
// corpo e il modulo ne promette 5. Se il caricamento fallisce ci si ferma lì:
// una candidatura senza curriculum è una candidatura da rincorrere, e chi ha
// appena scritto tre paragrafi merita di saperlo subito, non dopo.

import { erroreFile, CV_MAX_MB, CV_FORMATI_TESTO } from "./candidature";
import { withTracking } from "./tracking.client.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function telefonoValido(v) {
	const cifre = v.replace(/[^0-9]/g, "");
	if (!/^[0-9\s+-]+$/.test(v.trim())) return false;
	if (cifre.length < 6 || cifre.length > 14) return false;
	if (/^(\d)\1+$/.test(cifre)) return false;
	return true;
}

/** Dimensione leggibile per l'etichetta del file scelto. */
function pesoLeggibile(byte) {
	if (byte < 1024) return `${byte} byte`;
	if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
	return `${(byte / 1024 / 1024).toFixed(1)} MB`.replace(".", ",");
}

export function initCandidaturaForm() {
	const form = document.getElementById("candidatura-form");
	if (!form) return;

	const errore = document.getElementById("cd-errore");
	const conferma = document.getElementById("cd-conferma");
	const confermaTesto = document.getElementById("cd-conferma-testo");
	const invia = document.getElementById("cd-invia");
	const fileInput = document.getElementById("cd-cv");
	const fileNome = document.getElementById("cd-cv-nome");
	const etichettaInvio = invia.textContent;

	function mostraErrore(messaggio, campo) {
		errore.textContent = messaggio;
		errore.hidden = false;
		errore.scrollIntoView({ block: "center" });
		if (campo) campo.focus();
		invia.disabled = false;
		invia.textContent = etichettaInvio;
	}

	// Nome e peso del file scelto sotto il pulsante: senza, chi allega il file
	// sbagliato se ne accorge solo dopo l'invio.
	fileInput.addEventListener("change", () => {
		errore.hidden = true;
		const file = fileInput.files && fileInput.files[0];
		if (!file) {
			fileNome.textContent = "";
			return;
		}
		const problema = erroreFile({ nome: file.name, dimensione: file.size });
		if (problema) {
			fileInput.value = "";
			fileNome.textContent = "";
			return mostraErrore(problema, fileInput);
		}
		fileNome.textContent = `${file.name} · ${pesoLeggibile(file.size)}`;
	});

	/** Carica il CV e ritorna il percorso nello storage. Lancia in caso di errore. */
	async function caricaCv(file) {
		const firma = await fetch("/api/candidatura/upload", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nomeFile: file.name, dimensione: file.size }),
		});
		const datiFirma = await firma.json().catch(() => ({}));
		if (!firma.ok || !datiFirma.urlFirmata) {
			throw new Error(datiFirma.messaggio || "firma non riuscita");
		}

		// Il Content-Type lo detta il server, non il browser: sui .doc alcuni
		// browser mandano un tipo vuoto, e il bucket filtra per MIME.
		const caricamento = await fetch(datiFirma.urlFirmata, {
			method: "PUT",
			headers: { "Content-Type": datiFirma.tipo, "x-upsert": "false" },
			body: file,
		});
		if (!caricamento.ok) throw new Error("caricamento non riuscito");

		return datiFirma.percorso;
	}

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		errore.hidden = true;

		const campo = (id) => document.getElementById(id);
		const nome = campo("cd-nome");
		const cognome = campo("cd-cognome");
		const email = campo("cd-email");
		const prefisso = campo("cd-prefisso");
		const cellulare = campo("cd-cellulare");
		const citta = campo("cd-citta");
		const area = campo("cd-area");
		const disponibilita = campo("cd-disponibilita");
		const presentazione = campo("cd-presentazione");
		const esperienza = campo("cd-esperienza");
		const privacy = campo("cd-privacy");

		if (!nome.value.trim()) return mostraErrore("Inserisci il tuo nome.", nome);
		if (!cognome.value.trim()) return mostraErrore("Inserisci il tuo cognome.", cognome);
		if (!EMAIL_RE.test(email.value)) return mostraErrore("Inserisci un indirizzo email valido.", email);
		if (!telefonoValido(cellulare.value)) return mostraErrore("Inserisci un numero di cellulare valido.", cellulare);
		if (!area.value) return mostraErrore("Scegli l'area per cui ti candidi.", area);
		if (presentazione.value.trim().length < 40) {
			return mostraErrore("Raccontaci qualcosa in più di te: bastano poche righe.", presentazione);
		}

		const file = fileInput.files && fileInput.files[0];
		if (!file) {
			return mostraErrore(`Allega il tuo curriculum (${CV_FORMATI_TESTO}, massimo ${CV_MAX_MB} MB).`, fileInput);
		}
		const problemaFile = erroreFile({ nome: file.name, dimensione: file.size });
		if (problemaFile) return mostraErrore(problemaFile, fileInput);

		if (!privacy.checked) {
			return mostraErrore("Per candidarti serve il consenso al trattamento dei dati.", privacy);
		}

		invia.disabled = true;
		invia.textContent = "Caricamento del curriculum…";

		let cvPath;
		try {
			cvPath = await caricaCv(file);
		} catch {
			return mostraErrore(
				"Non siamo riusciti a caricare il curriculum. Controlla il file e riprova, oppure scrivici a info@ronchiverdi.it."
			);
		}

		invia.textContent = "Invio in corso…";

		const scelta = area.options[area.selectedIndex];
		const dati = {
			nome: nome.value.trim(),
			cognome: cognome.value.trim(),
			email: email.value.trim(),
			cellulare: `${prefisso.value} ${cellulare.value.trim()}`,
			citta: citta.value.trim(),
			area: area.value,
			areaLabel: scelta ? scelta.textContent.trim() : null,
			disponibilita: disponibilita.value,
			presentazione: presentazione.value.trim(),
			esperienza: esperienza.value.trim(),
			cvPath,
			cvNome: file.name,
			privacy: true,
			pagina: location.pathname,
		};

		try {
			const res = await fetch("/api/candidatura", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(withTracking(dati)),
			});
			if (!res.ok) throw new Error("request failed");
		} catch {
			return mostraErrore(
				"Non siamo riusciti a inviare la candidatura. Riprova fra poco, oppure scrivici a info@ronchiverdi.it."
			);
		}

		confermaTesto.textContent = `Grazie ${dati.nome}, abbiamo ricevuto la tua candidatura e il tuo curriculum. Se il tuo profilo è in linea con quello che cerchiamo ti scriviamo a ${dati.email}.`;
		form.hidden = true;
		conferma.hidden = false;
		conferma.scrollIntoView({ block: "center" });
	});
}
