// Endpoint condiviso dai form di contatto del sito: il modal generico
// (LeadModal/leadForm.client.js) e i form inline specifici per pagina (es.
// Chinesis). Gira solo su Vercel — vedi astro.config.mjs — e scrive su
// Supabase con la service_role key, mai esposta al client.
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(v: unknown): string | null {
	return typeof v === "string" && v.trim() ? v.trim() : null;
}

function json(data: unknown, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export async function POST({ request }: { request: Request }) {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: "invalid_json" }, 400);
	}

	const nome = str(body.nome);
	const cognome = str(body.cognome);
	const email = str(body.email);
	const cellulare = str(body.cellulare);

	if (!nome || !cognome || !email || !cellulare) {
		return json({ ok: false, error: "missing_fields" }, 400);
	}
	if (!EMAIL_RE.test(email)) {
		return json({ ok: false, error: "invalid_email" }, 400);
	}

	const supabaseUrl = import.meta.env.SUPABASE_URL;
	const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !serviceRoleKey) {
		console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY non configurate su Vercel");
		return json({ ok: false, error: "server_not_configured" }, 500);
	}

	const supabase = createClient(supabaseUrl, serviceRoleKey);
	const dettagli = Array.isArray(body.dettagli) ? body.dettagli.filter((d) => typeof d === "string") : null;

	const { error } = await supabase.from("form_contatti").insert({
		origine: str(body.origine) ?? "lead-modal",
		pagina: str(body.pagina),
		cta: str(body.cta),
		attivita: str(body.attivita),
		attivita_label: str(body.attivitaLabel),
		audience: str(body.audience),
		dettagli: dettagli && dettagli.length ? dettagli : null,
		azione: str(body.azione),
		data_scelta: str(body.dataScelta),
		ora_scelta: str(body.oraScelta),
		messaggio: str(body.messaggioTesto) ?? str(body.messaggio),
		nome,
		cognome,
		email,
		cellulare,
		privacy: body.privacy === true,
		marketing: body.marketing === true,
		settore: str(body.settore),
		minore_nome: str(body.minoreNome),
		minore_cognome: str(body.minoreCognome),
		minore_data_nascita: str(body.minoreDataNascita),
	});

	if (error) {
		console.error("Errore inserimento form_contatti:", error.message);
		return json({ ok: false, error: "db_error" }, 500);
	}

	return json({ ok: true }, 200);
}
