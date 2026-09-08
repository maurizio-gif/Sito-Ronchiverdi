// Salvataggio di una candidatura spontanea dalla pagina /lavora-con-noi.
//
// Arriva dopo che il browser ha caricato il CV con l'URL firmata da
// /api/candidatura/upload: qui c'è solo il testo del modulo più il percorso
// del file. Gira su Vercel e scrive su Supabase con la service_role key.
//
// La candidatura NON passa da form_contatti: chi si candida non è un lead, non
// entra in anagrafica e non apre una trattativa. Vedi il commento in testa a
// scripts/sql/2026-09-08-candidature.sql.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CV_BUCKET, CV_MAX_BYTE, percorsoValido } from "../../lib/candidature";
import { notificaCandidatura } from "../../lib/notificaCandidatura";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Tetto ai campi liberi: una candidatura è una pagina, non un romanzo. */
const MAX_TESTO = 5000;

function str(v: unknown, max = 300): string | null {
	if (typeof v !== "string") return null;
	const s = v.trim();
	return s ? s.slice(0, max) : null;
}

function json(data: unknown, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

/**
 * Il percorso arriva dal browser, quindi non ci si fida: si controlla che
 * l'oggetto esista davvero nel bucket e quanto pesa. Senza questa verifica una
 * candidatura potrebbe dichiarare il CV di qualcun altro — i percorsi sono
 * imprendibili, ma "difficile da indovinare" non è un controllo di accesso.
 *
 * Ritorna i metadati del file, o null se non c'è.
 */
async function verificaCv(
	supabase: SupabaseClient,
	percorso: string
): Promise<{ dimensione: number; tipo: string | null } | null> {
	const taglio = percorso.lastIndexOf("/");
	const cartella = percorso.slice(0, taglio);
	const nome = percorso.slice(taglio + 1);

	const { data, error } = await supabase.storage.from(CV_BUCKET).list(cartella, {
		limit: 2,
		search: nome,
	});
	if (error) {
		console.error("Verifica del CV caricato fallita:", error.message);
		return null;
	}

	const file = (data ?? []).find((f) => f.name === nome);
	if (!file) return null;

	const metadati = (file.metadata ?? {}) as { size?: number; mimetype?: string };
	const dimensione = typeof metadati.size === "number" ? metadati.size : 0;
	if (dimensione <= 0 || dimensione > CV_MAX_BYTE) return null;

	return { dimensione, tipo: metadati.mimetype ?? null };
}

export async function POST({ request }: { request: Request }) {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: "invalid_json" }, 400);
	}

	const nome = str(body.nome, 120);
	const cognome = str(body.cognome, 120);
	const email = str(body.email, 200);
	const cellulare = str(body.cellulare, 40);
	const presentazione = str(body.presentazione, MAX_TESTO);

	if (!nome || !cognome || !email || !cellulare || !presentazione) {
		return json({ ok: false, error: "missing_fields" }, 400);
	}
	if (!EMAIL_RE.test(email)) {
		return json({ ok: false, error: "invalid_email" }, 400);
	}
	// Il consenso è la base su cui trattiamo la candidatura: senza, non si
	// salva niente. Il modulo lo impone, ma il controllo vero sta qui.
	if (body.privacy !== true) {
		return json({ ok: false, error: "privacy_mancante" }, 400);
	}

	const supabaseUrl = import.meta.env.SUPABASE_URL;
	const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !serviceRoleKey) {
		console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY non configurate su Vercel");
		return json({ ok: false, error: "server_not_configured" }, 500);
	}
	const supabase = createClient(supabaseUrl, serviceRoleKey);

	// Il CV: obbligatorio nel modulo, ma se il percorso non regge il controllo
	// la candidatura si salva lo stesso senza allegato. Perdere il contatto di
	// una persona perché il suo file è sparito sarebbe il danno peggiore: la
	// segreteria vede "curriculum mancante" e glielo richiede.
	const cvPath = str(body.cvPath, 300);
	let cv: { path: string; nome: string; tipo: string | null; dimensione: number } | null = null;
	if (cvPath && percorsoValido(cvPath)) {
		const file = await verificaCv(supabase, cvPath);
		if (file) {
			cv = {
				path: cvPath,
				nome: str(body.cvNome, 200) ?? cvPath.split("/").pop() ?? "curriculum",
				tipo: file.tipo,
				dimensione: file.dimensione,
			};
		} else {
			console.error("Candidatura con CV dichiarato ma non trovato nel bucket:", cvPath);
		}
	}

	const { error } = await supabase.from("candidature").insert({
		nome,
		cognome,
		email,
		cellulare,
		citta: str(body.citta, 120),
		area: str(body.area, 60),
		area_label: str(body.areaLabel, 120),
		disponibilita: str(body.disponibilita, 60),
		presentazione,
		esperienza: str(body.esperienza, MAX_TESTO),
		cv_path: cv?.path ?? null,
		cv_nome: cv?.nome ?? null,
		cv_tipo: cv?.tipo ?? null,
		cv_dimensione: cv?.dimensione ?? null,
		privacy: true,
		session_id: str(body.session_id, 64),
		pagina: str(body.pagina),
		landing_page: str(body.landing_page),
		referrer: str(body.referrer),
		utm_source: str(body.utm_source),
		utm_medium: str(body.utm_medium),
		utm_campaign: str(body.utm_campaign),
	});

	if (error) {
		console.error("Errore inserimento candidatura:", error.message);
		return json({ ok: false, error: "db_error" }, 500);
	}

	// Avviso alla casella che legge le candidature. Errore ingoiato dentro
	// notificaCandidatura: la candidatura è già salvata, e un problema col
	// servizio di posta non deve diventare un errore in faccia a chi si è
	// appena candidato.
	await notificaCandidatura({
		nome,
		cognome,
		email,
		cellulare,
		citta: str(body.citta, 120),
		areaLabel: str(body.areaLabel, 120),
		disponibilita: str(body.disponibilita, 60),
		presentazione,
		esperienza: str(body.esperienza, MAX_TESTO),
		cvNome: cv?.nome ?? null,
	});

	return json({ ok: true }, 200);
}
