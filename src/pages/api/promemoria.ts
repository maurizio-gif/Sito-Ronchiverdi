// Promemoria di un'ora prima, per le visite in sede e le telefonate
// prenotate dal sito.
//
// Non è un endpoint pubblico: lo chiama uno schedulatore ogni cinque minuti
// (vercel.json, sezione "crons") portando un segreto. Vercel manda da sé
// `Authorization: Bearer $CRON_SECRET`; PROMEMORIA_TOKEN esiste per poterlo
// chiamare da fuori — un pg_cron su Supabase, o una prova manuale — senza
// dover conoscere il segreto di piattaforma.
//
// Senza nessuno dei due configurato l'endpoint resta chiuso: meglio nessun
// promemoria che un indirizzo che chiunque può far partire a raffica.
//
// Perché uno schedulatore esterno e non un timer: una funzione serverless
// vive il tempo della richiesta, non può "aspettare fino a un'ora prima".
//
// Idempotente per costruzione: la riga aggiornata è solo quella che aveva
// promemoria_inviato_il nullo, quindi due giri ravvicinati non mandano due
// email. Il campo si azzera quando l'appuntamento viene spostato, così il
// promemoria riparte sul nuovo orario.

import { createClient } from "@supabase/supabase-js";
import { promemoriaAlCliente } from "../../lib/emailCliente";
import { oraClub } from "../../lib/appuntamento";

export const prerender = false;

// Quanto prima dell'appuntamento parte il promemoria, e quanto largo è il
// bersaglio. La finestra è più ampia dell'intervallo dello schedulatore
// (5 minuti): se un giro salta, il successivo recupera invece di perdere
// l'invio per sempre.
const ANTICIPO_MINUTI = 60;
const FINESTRA_MINUTI = 20;

function json(data: unknown, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function minutiDi(ora: string): number {
	const m = /^(\d{1,2}):(\d{2})/.exec(ora);
	return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : -1;
}

async function esegui(request: Request): Promise<Response> {
	const segreti = [import.meta.env.CRON_SECRET, import.meta.env.PROMEMORIA_TOKEN].filter(Boolean);
	if (!segreti.length) {
		console.error("CRON_SECRET / PROMEMORIA_TOKEN non configurati: endpoint promemoria disattivato");
		return json({ ok: false, errore: "non_configurato" }, 503);
	}

	const url = new URL(request.url);
	const fornito =
		request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
		request.headers.get("x-promemoria-token") ??
		url.searchParams.get("token");

	if (!fornito || !segreti.includes(fornito)) {
		return json({ ok: false, errore: "non_autorizzato" }, 401);
	}

	const supabaseUrl = import.meta.env.SUPABASE_URL;
	const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !serviceRoleKey) {
		return json({ ok: false, errore: "server_non_configurato" }, 500);
	}
	const supabase = createClient(supabaseUrl, serviceRoleKey);

	// L'ora del club, non quella del server: su Vercel è UTC, e d'estate
	// manderebbe i promemoria con due ore di scarto.
	const adesso = oraClub(); // "YYYY-MM-DD HH:MM"
	const oggi = adesso.slice(0, 10);
	const oraAdesso = minutiDi(adesso.slice(11));

	const da = oraAdesso + ANTICIPO_MINUTI - FINESTRA_MINUTI;
	const a = oraAdesso + ANTICIPO_MINUTI;

	const { data: righe, error } = await supabase
		.from("form_contatti")
		.select(
			"id, token_gestione, azione, data_scelta, ora_scelta, nome, email, cellulare, attivita_label"
		)
		.eq("data_scelta", oggi)
		.in("azione", ["appuntamento", "telefonata"])
		.is("appuntamento_annullato_il", null)
		.is("promemoria_inviato_il", null)
		.not("email", "is", null);

	if (error) {
		console.error("Promemoria: lettura fallita:", error.message);
		return json({ ok: false, errore: "errore_lettura" }, 500);
	}

	const daAvvisare = (righe ?? []).filter((r) => {
		if (!r.ora_scelta) return false;
		const m = minutiDi(String(r.ora_scelta));
		return m >= da && m <= a;
	});

	let inviati = 0;
	for (const r of daAvvisare) {
		const ok = await promemoriaAlCliente({
			nome: r.nome,
			email: String(r.email),
			cellulare: r.cellulare,
			azione: r.azione,
			data: String(r.data_scelta).slice(0, 10),
			ora: String(r.ora_scelta).slice(0, 5),
			attivita: r.attivita_label,
			token: String(r.token_gestione),
		});

		// Si segna solo quello che è davvero partito: se SendGrid rifiuta, la
		// riga resta da fare e il giro successivo ci riprova, finché la
		// finestra è aperta.
		if (!ok) continue;
		const { error: erroreUpdate } = await supabase
			.from("form_contatti")
			.update({ promemoria_inviato_il: new Date().toISOString() })
			.eq("id", r.id);
		if (erroreUpdate) {
			console.error("Promemoria inviato ma non segnato:", r.id, erroreUpdate.message);
		}
		inviati++;
	}

	return json({ ok: true, candidati: daAvvisare.length, inviati }, 200);
}

export async function POST({ request }: { request: Request }) {
	return esegui(request);
}

// Anche in GET: alcuni schedulatori sanno fare solo una GET, e l'operazione
// è comunque protetta dal segreto e idempotente.
export async function GET({ request }: { request: Request }) {
	return esegui(request);
}
