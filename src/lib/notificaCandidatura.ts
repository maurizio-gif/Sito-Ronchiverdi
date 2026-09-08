// Avviso via email di una nuova candidatura dalla pagina /lavora-con-noi.
//
// Stessa impostazione di notificaLead (SendGrid via fetch, nessuna dipendenza
// in più, errori ingoiati), ma casella e testo separati: le candidature le
// legge chi si occupa del personale, non chi lavora le richieste dei soci.
// Con EMAIL_CANDIDATURE_A non configurata l'avviso va alla stessa casella
// degli altri moduli — meglio nella posta sbagliata che in nessuna posta.
//
// Il curriculum non viaggia allegato: sta nel bucket privato e si scarica dal
// pannello, sezione Curriculum. Un CV che gira per email è una copia in più di
// dati personali, in un posto dove nessuno la cancella più.

type Candidatura = {
	nome: string;
	cognome: string;
	email: string;
	cellulare: string;
	citta: string | null;
	areaLabel: string | null;
	disponibilita: string | null;
	presentazione: string;
	esperienza: string | null;
	cvNome: string | null;
};

/** Taglia i campi lunghi nell'email: il testo intero si legge nel pannello. */
function estratto(testo: string | null, max = 600): string | null {
	if (!testo) return null;
	const pulito = testo.trim();
	if (!pulito) return null;
	return pulito.length > max ? `${pulito.slice(0, max)}…` : pulito;
}

function righe(c: Candidatura): string[] {
	const voci: [string, string | null][] = [
		["Area", c.areaLabel],
		["Nome", `${c.nome} ${c.cognome}`.trim()],
		["Email", c.email],
		["Cellulare", c.cellulare],
		["Città", c.citta],
		["Disponibilità", c.disponibilita],
		["Curriculum", c.cvNome ?? "non allegato — da richiedere"],
		["Chi è", estratto(c.presentazione)],
		["Esperienza", estratto(c.esperienza)],
	];
	return voci.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
}

export async function notificaCandidatura(c: Candidatura): Promise<void> {
	const apiKey = import.meta.env.SENDGRID_API_KEY;
	const a =
		import.meta.env.EMAIL_CANDIDATURE_A ??
		import.meta.env.EMAIL_NOTIFICHE_A ??
		"form@ronchiverdi.it";
	const da = import.meta.env.EMAIL_NOTIFICHE_DA;

	if (!apiKey || !da) {
		console.log("Avviso candidatura non inviato: SENDGRID_API_KEY o EMAIL_NOTIFICHE_DA non configurate");
		return;
	}

	const chi = `${c.nome} ${c.cognome}`.trim() || "senza nome";
	const corpo = righe(c).join("\n");

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
				// Rispondere all'avviso scrive alla persona che si è candidata.
				reply_to: { email: c.email },
				subject: `Candidatura — ${chi}${c.areaLabel ? ` · ${c.areaLabel}` : ""}`,
				content: [
					{
						type: "text/plain",
						value: `Nuova candidatura dal sito\n\n${corpo}\n\nIl curriculum si scarica dal pannello, sezione Curriculum.\n`,
					},
				],
			}),
		});

		if (!risposta.ok) {
			console.error("Avviso candidatura rifiutato da SendGrid:", risposta.status, await risposta.text());
		}
	} catch (e) {
		console.error("Avviso candidatura non inviato:", e);
	}
}
