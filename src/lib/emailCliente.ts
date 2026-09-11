// Email che il sito manda a chi compila un form: la conferma di quello che
// ha appena chiesto e, per gli appuntamenti, il promemoria un'ora prima.
//
// Sono cosa diversa da notificaLead.ts, che avvisa la segreteria: lì basta un
// testo semplice letto da chi lavora le richieste, qui il messaggio lo legge
// un cliente e porta due azioni (annulla, sposta) che devono essere evidenti.
//
// Mittente e casella di risposta sono gli stessi del pannello (voucher e
// comunicazioni ai soci): chi riceve vede sempre lo stesso indirizzo. Il
// mittente dev'essere verificato su SendGrid, altrimenti l'invio viene
// rifiutato con 403 — non "finisce in spam", proprio non parte.

import {
	linkWhatsApp,
	referentePerLead,
	riferimentoCompleto,
	type Referente,
} from "../data/referenti";
import {
	INDIRIZZO_CLUB,
	TELEFONO_CLUB,
	bottone,
	esc,
	impagina,
	riquadro,
} from "./emailLayout";

const ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

const MITTENTE_EMAIL = import.meta.env.SENDGRID_FROM_EMAIL ?? "digital@ronchiverdi.it";
const MITTENTE_NOME = import.meta.env.SENDGRID_FROM_NAME ?? "Ronchiverdi Sport Club";
const RISPOSTE_A = import.meta.env.EMAIL_REPLY_TO ?? "info@ronchiverdi.it";

export type TipoAppuntamento = "appuntamento" | "telefonata";

export type DatiAppuntamento = {
	nome: string | null;
	email: string;
	cellulare: string | null;
	azione: string | null;
	data: string | null; // YYYY-MM-DD
	ora: string | null; // HH:MM
	attivita: string | null;
	token: string;
	/**
	 * Id dell'attività, settore e origine: servono solo a risolvere il
	 * referente da citare nell'email (vedi src/data/referenti.ts). `attivita`
	 * qui sopra è l'etichetta leggibile, e non basta a identificarlo.
	 */
	attivitaId?: string | null;
	settore?: string | null;
	origine?: string | null;
};

/**
 * Indirizzo pubblico del sito, per i link dentro le email.
 *
 * Stessa scala di astro.config.mjs: SITE_URL quando il dominio definitivo è
 * configurato, altrimenti l'indirizzo stabile del progetto Vercel. Un link in
 * un'email vive per giorni, quindi VERCEL_URL (che cambia a ogni deployment)
 * si usa solo come ultima spiaggia — meglio un link che scade fra due
 * deployment che nessun link.
 */
export function indirizzoSito(): string {
	const esplicito = import.meta.env.SITE_URL;
	if (esplicito) return String(esplicito).replace(/\/+$/, "");
	const vercel = import.meta.env.VERCEL_PROJECT_PRODUCTION_URL ?? import.meta.env.VERCEL_URL;
	if (vercel) return `https://${vercel}`;
	return "https://www.ronchiverdi.it";
}

export function linkGestione(token: string): string {
	return `${indirizzoSito()}/appuntamento?t=${encodeURIComponent(token)}`;
}

/** "sabato 12 settembre 2026" — la data come la direbbe una persona. */
export function dataLunga(giorno: string): string {
	const [a, m, g] = giorno.split("-").map(Number);
	if (!a || !m || !g) return giorno;
	return new Intl.DateTimeFormat("it-IT", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "Europe/Rome",
	}).format(new Date(Date.UTC(a, m - 1, g, 12)));
}

/**
 * Il riquadro coi contatti del referente: gli stessi che il form mostra
 * nell'ultimo passo.
 *
 * Ogni canale è un link, perché l'email si legge dal telefono: l'indirizzo
 * apre il client di posta, il numero apre il dialer, WhatsApp apre la chat
 * già intestata. Un numero scritto e non cliccabile va ricopiato a mano, ed è
 * il punto in cui la gente si ferma.
 */
function riquadroReferente(ref: Referente): string {
	const canali: [string, string, string][] = [];
	if (ref.email) canali.push(["Email", `mailto:${ref.email}`, ref.email]);
	canali.push(["WhatsApp", linkWhatsApp(ref), ref.telefonoDisplay]);
	// Dove il numero serve solo per WhatsApp la chiamata non va proposta: lo
	// stesso criterio del pannello del form.
	if (!ref.senzaChiamata) canali.push(["Telefono", `tel:${ref.telefonoHref}`, ref.telefonoDisplay]);

	const celle = canali
		.map(
			([canale, href, valore]) =>
				`<tr><td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#4a4a42;width:110px;vertical-align:top;">${esc(canale)}</td>
				 <td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;"><a href="${esc(href)}" style="color:#8b6c14;font-weight:bold;text-decoration:none;">${esc(valore)}</a></td></tr>`
		)
		.join("");

	return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;padding:16px 18px;background:#f8f2e5;border-radius:8px;">${celle}</table>`;
}

function contattiReferenteTesto(ref: Referente): string {
	const righe: string[] = [];
	if (ref.email) righe.push(`Email: ${ref.email}`);
	righe.push(`WhatsApp: ${linkWhatsApp(ref)} (${ref.telefonoDisplay})`);
	if (!ref.senzaChiamata) righe.push(`Telefono: ${ref.telefonoDisplay}`);
	return righe.join("\n");
}

/**
 * "il tuo riferimento è Silvana D'Auria, Responsabile Summer Camp".
 *
 * Il nome viene prima e il ruolo dopo, fra virgole: "il tuo riferimento è
 * Responsabile Summer Camp Silvana D'Auria" chiede un articolo davanti al
 * ruolo, e l'articolo giusto cambia da un ruolo all'altro. Dove risponde un
 * servizio e non una persona resta la forma del pannello del form.
 */
function presentazioneReferente(ref: Referente): string {
	if (!ref.nome) return `il tuo riferimento è la ${ref.etichetta}`;
	return `il tuo riferimento è ${[ref.nome, ref.titolo].filter(Boolean).join(", ")}`;
}

/**
 * Come si può contattare, all'infinito: "mandare una email, scrivere su
 * WhatsApp o chiamare".
 *
 * All'infinito e non con un pronome perché il referente può essere una donna,
 * un uomo o un servizio: "puoi scrivergli o chiamarlo" sbaglia in due casi su
 * tre. E i canali elencati sono solo quelli che quel referente ha davvero —
 * il Summer Camp risponde solo su WhatsApp, il padel non dà un'email.
 */
function azioniReferente(ref: Referente): string {
	const azioni: string[] = [];
	if (ref.email) azioni.push("mandare una email");
	azioni.push("scrivere su WhatsApp");
	if (!ref.senzaChiamata) azioni.push("chiamare");
	if (azioni.length === 1) return azioni[0];
	return `${azioni.slice(0, -1).join(", ")} o ${azioni[azioni.length - 1]}`;
}

/** Il referente da citare in questa email, se il percorso ne ha uno. */
function referenteDi(d: DatiAppuntamento): Referente | null {
	return referentePerLead({ attivita: d.attivitaId, settore: d.settore, origine: d.origine });
}

function etichettaTipo(azione: string | null): string {
	return azione === "telefonata" ? "telefonata" : "visita in sede";
}

function righeAppuntamento(d: DatiAppuntamento): [string, string][] {
	const righe: [string, string][] = [];
	if (d.data) righe.push(["Quando", `${dataLunga(d.data)}${d.ora ? ` alle ${d.ora}` : ""}`]);
	if (d.azione === "telefonata") {
		righe.push(["Come", `Ti chiamiamo noi${d.cellulare ? ` al ${d.cellulare}` : ""}`]);
	} else {
		righe.push(["Dove", INDIRIZZO_CLUB]);
	}
	if (d.attivita) righe.push(["Argomento", d.attivita]);
	return righe;
}

function saluto(nome: string | null): string {
	return nome ? `Ciao ${nome},` : "Ciao,";
}

// ── I quattro messaggi ────────────────────────────────────────────────────

/**
 * Conferma di una richiesta senza appuntamento.
 *
 * Dove l'attività ha un referente l'email non promette un richiamo: dà i suoi
 * contatti, gli stessi tre canali che il form mostra nell'ultimo passo. La
 * promessa di essere ricontattati è un filtro che ha senso solo dove la
 * richiesta la lavora la segreteria — Abbonamento Club e Family — e per tutto
 * il resto è solo un'attesa in più fra chi chiede e chi risponde.
 */
function contenutoConfermaMessaggio(
	nome: string | null,
	ref: Referente | null
): { oggetto: string; html: string; testo: string } {
	const oggetto = "Abbiamo ricevuto il tuo messaggio";

	if (ref) {
		const html = impagina(
			"Messaggio ricevuto",
			`<p style="margin:0 0 14px;">${esc(saluto(nome))}</p>
			 <p style="margin:0 0 4px;">grazie per averci scritto: la tua richiesta è arrivata, e ${esc(presentazioneReferente(ref))}. Puoi ${esc(azioniReferente(ref))} direttamente, senza aspettare che ti ricontattiamo noi.</p>
			 ${riquadroReferente(ref)}
			 ${ref.orari ? `<p style="margin:0 0 14px;font-size:13px;">${esc(ref.orari)}</p>` : ""}
			 <p style="margin:0;">Per tutto il resto ci trovi in segreteria allo <strong style="color:#1c1c18;">${esc(TELEFONO_CLUB)}</strong>.</p>`
		);
		const testo = `${saluto(nome)}

grazie per averci scritto: la tua richiesta è arrivata, e ${presentazioneReferente(ref)}. Puoi ${azioniReferente(ref)} direttamente, senza aspettare che ti ricontattiamo noi.

${contattiReferenteTesto(ref)}
${ref.orari ? `\n${ref.orari}\n` : ""}
Per tutto il resto ci trovi in segreteria allo ${TELEFONO_CLUB}.

Ronchiverdi Sport Club · ${INDIRIZZO_CLUB}
`;
		return { oggetto, html, testo };
	}

	const html = impagina(
		"Messaggio ricevuto",
		`<p style="margin:0 0 14px;">${esc(saluto(nome))}</p>
		 <p style="margin:0 0 14px;">grazie per averci scritto: la tua richiesta è arrivata allo staff del club e ti rispondiamo il prima possibile, di solito nel giro di pochi minuti negli orari di segreteria.</p>
		 <p style="margin:0;">Se nel frattempo hai bisogno di noi, ci trovi allo <strong style="color:#1c1c18;">${esc(TELEFONO_CLUB)}</strong>.</p>`
	);
	const testo = `${saluto(nome)}

grazie per averci scritto: la tua richiesta è arrivata allo staff del club e ti rispondiamo il prima possibile, di solito nel giro di pochi minuti negli orari di segreteria.

Se nel frattempo hai bisogno di noi, ci trovi allo ${TELEFONO_CLUB}.

Ronchiverdi Sport Club · ${INDIRIZZO_CLUB}
`;
	return { oggetto, html, testo };
}

function contenutoConfermaAppuntamento(d: DatiAppuntamento) {
	const tipo = etichettaTipo(d.azione);
	const quando = d.data ? `${dataLunga(d.data)}${d.ora ? ` alle ${d.ora}` : ""}` : "";
	const oggetto =
		d.azione === "telefonata"
			? `Ti chiamiamo ${quando}`
			: `Ti aspettiamo ${quando}`;
	const link = linkGestione(d.token);

	const html = impagina(
		d.azione === "telefonata" ? "Telefonata confermata" : "Appuntamento confermato",
		`<p style="margin:0 0 14px;">${esc(saluto(d.nome))}</p>
		 <p style="margin:0 0 4px;">la tua ${esc(tipo)} è confermata.</p>
		 ${riquadro(righeAppuntamento(d))}
		 <p style="margin:0 0 4px;">Ti serve cambiare? Da qui puoi spostare l'appuntamento a un altro orario o annullarlo, senza chiamare.</p>
		 ${bottone(link, "Sposta o annulla")}
		 <p style="margin:14px 0 0;font-size:13px;">Se il pulsante non funziona, copia questo indirizzo nel browser:<br /><a href="${esc(link)}" style="color:#8b6c14;">${esc(link)}</a></p>`
	);

	const dettagli = righeAppuntamento(d)
		.map(([k, v]) => `${k}: ${v}`)
		.join("\n");
	const testo = `${saluto(d.nome)}

la tua ${tipo} è confermata.

${dettagli}

Ti serve cambiare? Da questo indirizzo puoi spostare l'appuntamento a un altro orario o annullarlo, senza chiamare:
${link}

Ronchiverdi Sport Club · ${INDIRIZZO_CLUB} · ${TELEFONO_CLUB}
`;
	return { oggetto, html, testo };
}

function contenutoPromemoria(d: DatiAppuntamento) {
	const tipo = etichettaTipo(d.azione);
	const link = linkGestione(d.token);
	const oggetto =
		d.azione === "telefonata"
			? `Ti chiamiamo fra un'ora${d.ora ? `, alle ${d.ora}` : ""}`
			: `Ti aspettiamo fra un'ora${d.ora ? `, alle ${d.ora}` : ""}`;

	const html = impagina(
		"Promemoria",
		`<p style="margin:0 0 14px;">${esc(saluto(d.nome))}</p>
		 <p style="margin:0 0 4px;">ti ricordiamo la tua ${esc(tipo)} di oggi, fra circa un'ora.</p>
		 ${riquadro(righeAppuntamento(d))}
		 ${
				d.azione === "telefonata"
					? `<p style="margin:0 0 4px;">Se in questo momento non puoi rispondere, spostala qui: troviamo un orario migliore.</p>`
					: `<p style="margin:0 0 4px;">Se ti è successo qualcosa e non riesci a venire, avvisaci da qui: liberi il posto in un secondo.</p>`
			}
		 ${bottone(link, "Sposta o annulla")}
		 <p style="margin:14px 0 0;font-size:13px;">Se il pulsante non funziona, copia questo indirizzo nel browser:<br /><a href="${esc(link)}" style="color:#8b6c14;">${esc(link)}</a></p>`
	);

	const dettagli = righeAppuntamento(d)
		.map(([k, v]) => `${k}: ${v}`)
		.join("\n");
	const testo = `${saluto(d.nome)}

ti ricordiamo la tua ${tipo} di oggi, fra circa un'ora.

${dettagli}

Se non riesci, puoi spostarla o annullarla da qui:
${link}

Ronchiverdi Sport Club · ${INDIRIZZO_CLUB} · ${TELEFONO_CLUB}
`;
	return { oggetto, html, testo };
}

// ── Invio ─────────────────────────────────────────────────────────────────

/**
 * Non lancia mai. Chi chiama ha già salvato la richiesta su Supabase: un
 * problema col servizio di posta non deve diventare un errore in faccia a chi
 * ha appena compilato il form.
 */
async function invia(a: string, oggetto: string, html: string, testo: string): Promise<boolean> {
	const apiKey = import.meta.env.SENDGRID_API_KEY;
	if (!apiKey) {
		console.log("Email al cliente non inviata: SENDGRID_API_KEY non configurata");
		return false;
	}

	try {
		const risposta = await fetch(ENDPOINT, {
			method: "POST",
			headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
			body: JSON.stringify({
				personalizations: [{ to: [{ email: a }] }],
				from: { email: MITTENTE_EMAIL, name: MITTENTE_NOME },
				reply_to: { email: RISPOSTE_A },
				subject: oggetto,
				content: [
					// L'ordine conta per la specifica MIME: prima il testo, poi l'HTML.
					{ type: "text/plain", value: testo },
					{ type: "text/html", value: html },
				],
			}),
		});

		// SendGrid risponde 202 quando ha accettato il messaggio in coda.
		if (!risposta.ok) {
			console.error("Email al cliente rifiutata da SendGrid:", risposta.status, await risposta.text());
			return false;
		}
		return true;
	} catch (e) {
		console.error("Email al cliente non inviata:", e);
		return false;
	}
}

/**
 * Conferma di una richiesta appena arrivata dal form.
 *
 * Un appuntamento o una telefonata arrivano solo dai percorsi che passano
 * dalla segreteria (Abbonamento Club e Family), che non hanno un referente di
 * attività: là l'email conferma data e ora. Tutto il resto prende la conferma
 * col referente, quando quel percorso ne ha uno.
 */
export async function confermaAlCliente(d: DatiAppuntamento): Promise<boolean> {
	if (!d.email) return false;
	const eAppuntamento = d.azione === "appuntamento" || d.azione === "telefonata";
	const { oggetto, html, testo } =
		eAppuntamento && d.data
			? contenutoConfermaAppuntamento(d)
			: contenutoConfermaMessaggio(d.nome, referenteDi(d));
	return invia(d.email, oggetto, html, testo);
}

/** Promemoria di un'ora prima. */
export async function promemoriaAlCliente(d: DatiAppuntamento): Promise<boolean> {
	if (!d.email || !d.data) return false;
	const { oggetto, html, testo } = contenutoPromemoria(d);
	return invia(d.email, oggetto, html, testo);
}

/**
 * Conferma dello spostamento o dell'annullamento fatto dal cliente. Serve a
 * chiudere il cerchio: chi clicca "annulla" deve trovare in casella la prova
 * che è andata, altrimenti richiama la segreteria per sincerarsene.
 */
export async function esitoModificaAlCliente(
	d: DatiAppuntamento,
	tipoModifica: "spostato" | "annullato"
): Promise<boolean> {
	if (!d.email) return false;

	if (tipoModifica === "annullato") {
		const tipo = etichettaTipo(d.azione);
		const oggetto = `${d.azione === "telefonata" ? "Telefonata" : "Appuntamento"} annullato`;
		const html = impagina(
			"Appuntamento annullato",
			`<p style="margin:0 0 14px;">${esc(saluto(d.nome))}</p>
			 <p style="margin:0 0 14px;">la tua ${esc(tipo)} è stata annullata: non devi fare altro.</p>
			 <p style="margin:0;">Quando vuoi riprovare ci trovi sul sito o allo <strong style="color:#1c1c18;">${esc(TELEFONO_CLUB)}</strong>.</p>`
		);
		const testo = `${saluto(d.nome)}

la tua ${tipo} è stata annullata: non devi fare altro.

Quando vuoi riprovare ci trovi sul sito o allo ${TELEFONO_CLUB}.
`;
		return invia(d.email, oggetto, html, testo);
	}

	// Spostato: stessa forma della conferma iniziale, con l'orario nuovo.
	const { html, testo } = contenutoConfermaAppuntamento(d);
	const quando = d.data ? `${dataLunga(d.data)}${d.ora ? ` alle ${d.ora}` : ""}` : "";
	return invia(d.email, `Nuovo orario: ${quando}`, html, testo);
}
