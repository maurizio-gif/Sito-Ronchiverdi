// Avviso via email di una nuova richiesta dal sito, verso la casella della
// segreteria (form@ronchiverdi.it).
//
// Passa dall'API HTTP di Resend con una fetch, senza aggiungere dipendenze al
// progetto: è una sola chiamata, e un pacchetto in più andrebbe mantenuto per
// niente.
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
	const apiKey = import.meta.env.RESEND_API_KEY;
	const a = import.meta.env.EMAIL_NOTIFICHE_A ?? "form@ronchiverdi.it";
	// Il mittente deve stare su un dominio verificato in Resend: finché
	// ronchiverdi.it non lo è, l'invio viene rifiutato dal servizio.
	const da = import.meta.env.EMAIL_NOTIFICHE_DA;

	if (!apiKey || !da) {
		console.log("Avviso email non inviato: RESEND_API_KEY o EMAIL_NOTIFICHE_DA non configurate");
		return;
	}

	const tipo = tipoRichiesta(body);
	const chi = [testo(body.nome), testo(body.cognome)].filter(Boolean).join(" ") || "senza nome";
	const corpo = righe(body).join("\n");

	try {
		const risposta = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: da,
				to: [a],
				// Rispondere all'avviso scrive direttamente alla persona, senza
				// ricopiarne l'indirizzo a mano.
				reply_to: testo(body.email) ?? undefined,
				subject: `${tipo} — ${chi}`,
				text: `${tipo}\n\n${corpo}\n`,
			}),
		});

		if (!risposta.ok) {
			console.error("Avviso email rifiutato da Resend:", risposta.status, await risposta.text());
		}
	} catch (e) {
		console.error("Avviso email non inviato:", e);
	}
}
