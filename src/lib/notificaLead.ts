// Avviso via email di una nuova richiesta dal sito, verso la casella della
// segreteria (form@ronchiverdi.it). È il registro di tutto quello che entra:
// parte per ogni richiesta, di qualunque percorso.
//
// L'avviso al responsabile dell'attività — con i dati in chiaro e il pulsante
// per il CRM — è un'altra email e sta in notificaResponsabile.ts. I campi
// della richiesta sono gli stessi per entrambe, e stanno in campiLead.ts.
//
// Passa dall'API HTTP di SendGrid con una fetch, senza aggiungere dipendenze
// al progetto (@sendgrid/mail non serve per una sola chiamata: sarebbe un
// pacchetto in più da mantenere per niente).
//
// Se le variabili non sono configurate l'avviso viene semplicemente saltato,
// con una riga nei log: la richiesta è già salvata su Supabase, e non
// mandare un'email non è un motivo per far vedere un errore a chi ha appena
// compilato il form.

import { campiLeadTesto, nomeCompleto, tipoRichiesta, type CampiLead } from "./campiLead";

export async function notificaLead(body: CampiLead): Promise<void> {
	const apiKey = import.meta.env.SENDGRID_API_KEY;
	const a = import.meta.env.EMAIL_NOTIFICHE_A ?? "form@ronchiverdi.it";
	// Il mittente deve essere un indirizzo verificato su SendGrid — basta la
	// Single Sender Verification, non serve autenticare tutto il dominio:
	// finché non lo è, l'invio viene rifiutato con 403.
	const da = import.meta.env.EMAIL_NOTIFICHE_DA;

	if (!apiKey || !da) {
		console.log("Avviso email non inviato: SENDGRID_API_KEY o EMAIL_NOTIFICHE_DA non configurate");
		return;
	}

	const tipo = tipoRichiesta(body);
	const chi = nomeCompleto(body) ?? "senza nome";
	const corpo = campiLeadTesto(body);
	const emailPersona =
		typeof body.email === "string" && body.email.trim() ? body.email.trim() : null;

	try {
		const risposta = await fetch("https://api.sendgrid.com/v3/mail/send", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				personalizations: [{ to: [{ email: a }] }],
				from: { email: da, name: "Sito Ronchiverdi" },
				// Rispondere all'avviso scrive direttamente alla persona, senza
				// ricopiarne l'indirizzo a mano.
				...(emailPersona ? { reply_to: { email: emailPersona } } : {}),
				subject: `${tipo} — ${chi}`,
				content: [{ type: "text/plain", value: `${tipo}\n\n${corpo}\n` }],
			}),
		});

		// SendGrid risponde 202 quando ha accettato il messaggio in coda.
		if (!risposta.ok) {
			console.error("Avviso email rifiutato da SendGrid:", risposta.status, await risposta.text());
		}
	} catch (e) {
		console.error("Avviso email non inviato:", e);
	}
}
