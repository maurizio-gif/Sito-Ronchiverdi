// Avviso via email di una nuova richiesta dal sito, verso la casella della
// segreteria (form@ronchiverdi.it).
//
// Passa dall'API HTTP di SendGrid con una fetch, senza aggiungere dipendenze
// al progetto (@sendgrid/mail non serve per una sola chiamata: sarebbe un
// pacchetto in più da mantenere per niente).
//
// Se le variabili non sono configurate l'avviso viene semplicemente saltato,
// con una riga nei log: la richiesta è già salvata su Supabase, e non
// mandare un'email non è un motivo per far vedere un errore a chi ha appena
// compilato il form.

type CampiLead = Record<string, unknown>;

function testo(v: unknown): string | null {
	return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Cosa ha chiesto la persona, in una riga da mettere nell'oggetto. */
function tipoRichiesta(body: CampiLead): string {
	const azione = testo(body.azione);
	if (azione === "appuntamento") return "Appuntamento in sede";
	if (azione === "telefonata") return "Richiesta di telefonata";
	if (azione === "messaggio") return "Messaggio";
	if (testo(body.origine) === "chinesis-inline") return "Richiesta Chinesis";
	return "Richiesta informazioni";
}

function righe(body: CampiLead): string[] {
	const nome = [testo(body.nome), testo(body.cognome)].filter(Boolean).join(" ");
	const minore = [testo(body.minoreNome), testo(body.minoreCognome)].filter(Boolean).join(" ");
	const dettagli = Array.isArray(body.dettagli)
		? body.dettagli.filter((d) => typeof d === "string").join(", ")
		: null;

	const voci: [string, string | null][] = [
		["Attività", testo(body.attivitaLabel)],
		["Settore", testo(body.settore)],
		["Nome", nome || null],
		["Email", testo(body.email)],
		["Cellulare", testo(body.cellulare)],
		["Bambino/a", minore || null],
		["Data di nascita", testo(body.minoreDataNascita)],
		["Quando", [testo(body.dataScelta), testo(body.oraScelta)].filter(Boolean).join(" alle ") || null],
		["Interessi", dettagli || null],
		["Messaggio", testo(body.messaggioTesto) ?? testo(body.messaggio)],
		["Marketing", body.marketing === true ? "acconsente" : "no"],
		["Pagina", testo(body.pagina)],
		["Provenienza", [testo(body.utm_source), testo(body.utm_campaign)].filter(Boolean).join(" · ") || null],
	];

	return voci.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
}

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
	const chi = [testo(body.nome), testo(body.cognome)].filter(Boolean).join(" ") || "senza nome";
	const corpo = righe(body).join("\n");
	const emailPersona = testo(body.email);

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
