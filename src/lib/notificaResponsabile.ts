// Avviso al responsabile dell'attività: una nuova richiesta è arrivata, ed
// è sua.
//
// È cosa diversa dall'avviso alla segreteria (notificaLead.ts), che continua
// a partire come prima verso form@ronchiverdi.it. Quello è il registro di
// tutto quello che entra; questo va alla persona che quella richiesta la
// lavora — il responsabile della Young School Nuoto, il maestro di tennis del
// settore scelto, chi tiene il Summer Camp — e quindi porta due cose che alla
// segreteria non servono: tutti i dati della richiesta in chiaro, e il
// pulsante per aprire il CRM.
//
// Chi è il responsabile lo dice src/data/referenti.ts, che è la stessa fonte
// già usata dal form (ultimo passo, coi contatti) e dall'email di conferma al
// cliente. Un indirizzo si cambia lì e cambia in tutti e tre i posti.
//
// I percorsi senza responsabile non mandano niente, ed è voluto: Abbonamento
// Club e Family li lavora la segreteria, e avvisare un responsabile di
// attività sarebbe avvisare la persona sbagliata.

import { referentePerLead, riferimentoCompleto, nomeReferente } from "../data/referenti";
import { campiLead, campiLeadTesto, nomeCompleto, tipoRichiesta, type CampiLead } from "./campiLead";
import { bottone, esc, impagina, riquadro } from "./emailLayout";

const ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

/** L'oggetto dell'email, per esteso in cima al messaggio. */
const TITOLO = "C'è una nuova richiesta";

/**
 * Indirizzo del CRM per il pulsante.
 *
 * Il dominio personalizzato e non l'alias *.vercel.app: quello è coperto
 * dalla Vercel Authentication e chiederebbe prima di autenticarsi a Vercel,
 * cosa che un responsabile non ha motivo di poter fare. Configurabile perché
 * un domani il CRM può cambiare indirizzo, e un link in un'email vive per
 * giorni.
 */
function linkCrm(idRichiesta: string | null): string {
	const base = (import.meta.env.CRM_URL ?? "https://crm.ronchiverdi.it").replace(/\/+$/, "");
	// Con l'id si va sulla richiesta, che si apre da sola e viene segnata; il
	// canale in cui finisce lo calcola il CRM, che è l'unico a saperlo (vedi
	// app/dashboard/richiesta/[id] di quel repository). Senza id — una
	// richiesta che per qualche motivo non è stata salvata — resta la
	// dashboard: un pulsante che porta nel pannello vale più di nessun
	// pulsante.
	return idRichiesta ? `${base}/dashboard/richiesta/${encodeURIComponent(idRichiesta)}` : `${base}/dashboard`;
}

function contenuto(body: CampiLead, destinatario: string, idRichiesta: string | null) {
	const tipo = tipoRichiesta(body);
	const chi = nomeCompleto(body) ?? "una persona senza nome";
	const attivita = typeof body.attivitaLabel === "string" ? body.attivitaLabel.trim() : "";
	const crm = linkCrm(idRichiesta);

	// L'apertura dice in una riga quello che serve per decidere se leggere
	// subito o dopo: che tipo di richiesta è, di chi, e per quale attività.
	const apertura = attivita
		? `${tipo} per <strong>${esc(attivita)}</strong>, da <strong>${esc(chi)}</strong>.`
		: `${tipo} da <strong>${esc(chi)}</strong>.`;

	const html = impagina(
		TITOLO,
		`<p style="margin:0 0 4px;">${destinatario ? `${esc(destinatario)}, ` : ""}${apertura}</p>
		${riquadro(campiLead(body))}
		${bottone(crm, "Accedi al CRM")}
		<p style="margin:14px 0 0;font-size:13px;">
			Il pulsante apre questa richiesta nel CRM, dove si prende in carico e si scrive
			com'è andata: così il club sa sempre a che punto è. Rispondendo a questa email
			scrivi invece direttamente a chi l'ha mandata.
		</p>`
	);

	const testo = `${TITOLO}

${attivita ? `${tipo} per ${attivita}, da ${chi}.` : `${tipo} da ${chi}.`}

${campiLeadTesto(body)}

Accedi al CRM: ${crm}

Il pulsante apre questa richiesta nel CRM, dove si prende in carico e si scrive
com'è andata. Rispondendo a questa email scrivi direttamente a chi l'ha mandata.
`;

	return { html, testo, tipo, chi, attivita };
}

/**
 * Manda l'avviso al responsabile dell'attività, se quel percorso ne ha uno
 * con un indirizzo email.
 *
 * Non blocca e non rilancia mai: la richiesta è già salvata su Supabase e
 * l'avviso alla segreteria è già partito. Un problema col servizio di posta
 * non deve diventare un errore in faccia a chi ha appena compilato il form.
 */
export async function notificaResponsabile(
	body: CampiLead,
	idRichiesta?: string | null
): Promise<void> {
	const referente = referentePerLead({
		attivita: typeof body.attivita === "string" ? body.attivita : null,
		settore: typeof body.settore === "string" ? body.settore : null,
		origine: typeof body.origine === "string" ? body.origine : null,
	});

	if (!referente) return;

	// Un referente può avere solo il telefono: il Padel è così per scelta del
	// club — quel percorso si lavora al telefono e su WhatsApp, e nessuno
	// controlla una casella. Non è quindi una riga da completare: se un
	// domani quel referente avrà un indirizzo in src/data/referenti.ts,
	// l'email comincerà a partire da sola. La riga nei log serve solo a
	// rendere visibile la scelta a chi legge i log e non il codice.
	if (!referente.email) {
		console.log(
			`Avviso al responsabile non inviato: ${riferimentoCompleto(referente) || "il referente"} non ha un indirizzo email (percorso da lavorare al telefono)`
		);
		return;
	}

	const apiKey = import.meta.env.SENDGRID_API_KEY;
	// Stesso mittente dell'avviso alla segreteria: è la stessa famiglia di
	// email — il sito che avvisa il club — e deve arrivare dallo stesso posto.
	const da = import.meta.env.EMAIL_NOTIFICHE_DA ?? import.meta.env.SENDGRID_FROM_EMAIL;

	if (!apiKey || !da) {
		console.log(
			"Avviso al responsabile non inviato: SENDGRID_API_KEY o EMAIL_NOTIFICHE_DA non configurate"
		);
		return;
	}

	const { html, testo, tipo, chi } = contenuto(body, nomeReferente(referente), idRichiesta ?? null);
	const emailPersona = typeof body.email === "string" && body.email.trim() ? body.email.trim() : null;

	try {
		const risposta = await fetch(ENDPOINT, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				personalizations: [{ to: [{ email: referente.email }] }],
				from: { email: da, name: "Sito Ronchiverdi" },
				// Rispondere all'avviso scrive a chi ha compilato, senza
				// ricopiarne l'indirizzo a mano: è il gesto più probabile.
				...(emailPersona ? { reply_to: { email: emailPersona } } : {}),
				subject: `${TITOLO} — ${tipo} · ${chi}`,
				// Prima il testo e poi l'HTML: SendGrid vuole le parti in
				// ordine crescente di ricchezza, e chi legge in chiaro riceve
				// comunque tutti i dati.
				content: [
					{ type: "text/plain", value: testo },
					{ type: "text/html", value: html },
				],
			}),
		});

		if (!risposta.ok) {
			console.error(
				"Avviso al responsabile rifiutato da SendGrid:",
				risposta.status,
				await risposta.text()
			);
		}
	} catch (e) {
		console.error("Avviso al responsabile non inviato:", e);
	}
}
