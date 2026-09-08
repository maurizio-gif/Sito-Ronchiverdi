// Pagina "sposta o annulla": la parte che si muove.
//
// Il calendario è lo stesso del modulo di contatto — stesse regole da
// agendaSlot.js, stesse classi .lf__day/.lf__slot già disegnate dagli stili
// globali del LeadModal — così chi ha prenotato ritrova esattamente il
// calendario su cui aveva scelto la prima volta.

import { caricaOccupati, regoleDi, slotsDisponibili } from "./agendaSlot.js";

const DOW_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MESI_BREVI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
const FASCE = [
	{ label: "Mattina", h1: 0, h2: 13 },
	{ label: "Pomeriggio", h1: 13, h2: 17 },
	{ label: "Sera", h1: 17, h2: 24 },
];

export function initGestioneAppuntamento(root) {
	const token = root.dataset.token;
	const tipo = root.dataset.tipo === "telefonata" ? "telefonata" : "appuntamento";
	const attuale = { data: root.dataset.data || null, ora: root.dataset.ora || null };

	const pannelloSposta = root.querySelector("[data-pannello=sposta]");
	const pannelloAnnulla = root.querySelector("[data-pannello=annulla]");
	const stripEl = root.querySelector("[data-giorni]");
	const slotsEl = root.querySelector("[data-slots]");
	const confermaSposta = root.querySelector("[data-conferma=sposta]");
	const confermaAnnulla = root.querySelector("[data-conferma=annulla]");
	const erroreEl = root.querySelector("[data-errore]");
	const azioniEl = root.querySelector("[data-azioni]");
	const esitoEl = root.querySelector("[data-esito]");

	let scelta = { data: null, ora: null };
	let caricato = false;

	function mostraErrore(msg) {
		if (!erroreEl) return;
		erroreEl.textContent = msg;
		erroreEl.hidden = !msg;
	}

	function apri(pannello) {
		mostraErrore("");
		if (pannelloSposta) pannelloSposta.hidden = pannello !== "sposta";
		if (pannelloAnnulla) pannelloAnnulla.hidden = pannello !== "annulla";
		if (pannello === "sposta" && !caricato) {
			caricato = true;
			disegnaCalendario();
		}
	}

	root.querySelectorAll("[data-apri]").forEach((btn) => {
		btn.addEventListener("click", () => apri(btn.dataset.apri));
	});
	root.querySelectorAll("[data-chiudi]").forEach((btn) => {
		btn.addEventListener("click", () => {
			if (pannelloSposta) pannelloSposta.hidden = true;
			if (pannelloAnnulla) pannelloAnnulla.hidden = true;
			mostraErrore("");
		});
	});

	function disegnaCalendario() {
		const regole = regoleDi(tipo);
		const oggi = new Date();
		oggi.setHours(0, 0, 0, 0);

		const giorni = [];
		for (let i = 0; i < regole.giorniAvanti; i++) {
			const d = new Date(oggi);
			d.setDate(oggi.getDate() + i);
			giorni.push(d);
		}

		stripEl.innerHTML = "";
		const attesa = document.createElement("p");
		attesa.className = "lf__picker-empty";
		attesa.textContent = "Verifico gli orari disponibili…";
		stripEl.appendChild(attesa);

		// Come nel modulo: prima si sa cosa è occupato, poi si disegnano i
		// giorni. Mostrare orari che spariscono sotto le dita è peggio di una
		// breve attesa.
		caricaOccupati(regole.giorniAvanti).then((occupati) => {
			stripEl.innerHTML = "";
			giorni.forEach((d) => {
				const liberi = slotsDisponibili(d, tipo, occupati, attuale);
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "lf__day";
				if (!liberi.length) btn.classList.add("is-unavailable");

				const dow = document.createElement("span");
				dow.className = "lf__day-dow";
				dow.textContent = DOW_SHORT[(d.getDay() + 6) % 7];

				const num = document.createElement("span");
				num.className = "lf__day-num";
				num.textContent = String(d.getDate()) + (d.getDate() === 1 ? " " + MESI_BREVI[d.getMonth()] : "");

				btn.append(dow, num);
				btn.addEventListener("click", () => {
					scelta = { data: iso(d), ora: null };
					if (confermaSposta) confermaSposta.disabled = true;
					stripEl.querySelectorAll(".lf__day").forEach((b) => b.classList.remove("is-selected"));
					btn.classList.add("is-selected");
					disegnaSlot(liberi);
				});
				stripEl.appendChild(btn);
			});
		});
	}

	function disegnaSlot(liberi) {
		slotsEl.hidden = false;
		slotsEl.innerHTML = "";

		if (!liberi.length) {
			const vuoto = document.createElement("p");
			vuoto.className = "lf__picker-empty";
			vuoto.textContent =
				"Per questo giorno non ci sono orari liberi. Prova un altro giorno, oppure chiamaci allo 011 6612146.";
			slotsEl.appendChild(vuoto);
			return;
		}

		FASCE.forEach((fascia) => {
			const inFascia = liberi.filter((s) => {
				const h = parseInt(s, 10);
				return h >= fascia.h1 && h < fascia.h2;
			});
			if (!inFascia.length) return;

			const gruppo = document.createElement("div");
			gruppo.className = "lf__slots-group";
			const label = document.createElement("p");
			label.className = "lf__slots-group-label";
			label.textContent = fascia.label;
			const riga = document.createElement("div");
			riga.className = "lf__slots-row";

			inFascia.forEach((ora) => {
				const sb = document.createElement("button");
				sb.type = "button";
				sb.className = "lf__slot";
				sb.textContent = ora;
				sb.addEventListener("click", () => {
					slotsEl.querySelectorAll(".lf__slot").forEach((b) => b.classList.remove("is-selected"));
					sb.classList.add("is-selected");
					scelta.ora = ora;
					if (confermaSposta) confermaSposta.disabled = false;
				});
				riga.appendChild(sb);
			});

			gruppo.append(label, riga);
			slotsEl.appendChild(gruppo);
		});
	}

	function iso(d) {
		const p = (n) => String(n).padStart(2, "0");
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
	}

	const MESSAGGI = {
		non_trovato: "Questo link non è più valido. Chiamaci allo 011 6612146 e sistemiamo insieme.",
		gia_annullato: "Questo appuntamento risulta già annullato.",
		gia_passato: "Questo appuntamento è già passato: per fissarne un altro chiamaci allo 011 6612146.",
		orario_non_disponibile: "Quell'orario è appena stato occupato. Scegline un altro.",
		fuori_periodo: "Quella data è troppo lontana: scegli un giorno fra quelli proposti.",
		orario_non_valido: "Scegli giorno e orario prima di confermare.",
	};

	async function invia(azione, extra) {
		mostraErrore("");
		const bottone = azione === "annulla" ? confermaAnnulla : confermaSposta;
		if (bottone) {
			bottone.disabled = true;
			bottone.dataset.etichetta = bottone.textContent;
			bottone.textContent = "Un attimo…";
		}

		try {
			const risposta = await fetch("/api/appuntamento", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, azione, ...extra }),
			});
			const dati = await risposta.json().catch(() => ({}));

			if (!risposta.ok || !dati.ok) {
				mostraErrore(
					MESSAGGI[dati.errore] || "Non siamo riusciti a salvare la modifica. Riprova fra poco."
				);
				if (bottone) {
					bottone.disabled = false;
					bottone.textContent = bottone.dataset.etichetta;
				}
				return;
			}

			// Riuscito: la pagina non serve più, resta solo l'esito.
			if (azioniEl) azioniEl.hidden = true;
			if (pannelloSposta) pannelloSposta.hidden = true;
			if (pannelloAnnulla) pannelloAnnulla.hidden = true;
			if (esitoEl) {
				esitoEl.hidden = false;
				esitoEl.dataset.tipo = dati.stato;
				const titolo = esitoEl.querySelector("[data-esito-titolo]");
				const testo = esitoEl.querySelector("[data-esito-testo]");
				if (dati.stato === "annullato") {
					if (titolo) titolo.textContent = "Appuntamento annullato";
					if (testo)
						testo.textContent =
							"Non devi fare altro: ti abbiamo mandato la conferma via email. Quando vuoi riprovare ci trovi sul sito.";
				} else {
					if (titolo) titolo.textContent = "Nuovo orario confermato";
					if (testo)
						testo.textContent = `Ti aspettiamo ${formattaData(dati.data)} alle ${dati.ora}. Trovi la conferma anche via email.`;
				}
				esitoEl.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		} catch (e) {
			mostraErrore("Connessione assente. Riprova fra poco.");
			if (bottone) {
				bottone.disabled = false;
				bottone.textContent = bottone.dataset.etichetta;
			}
		}
	}

	function formattaData(giorno) {
		const [a, m, g] = String(giorno).split("-").map(Number);
		if (!a) return giorno;
		return new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" }).format(
			new Date(a, m - 1, g)
		);
	}

	if (confermaSposta) {
		confermaSposta.addEventListener("click", () => {
			if (!scelta.data || !scelta.ora) {
				mostraErrore("Scegli giorno e orario prima di confermare.");
				return;
			}
			invia("sposta", { data: scelta.data, ora: scelta.ora });
		});
	}
	if (confermaAnnulla) {
		confermaAnnulla.addEventListener("click", () => invia("annulla", {}));
	}
}
