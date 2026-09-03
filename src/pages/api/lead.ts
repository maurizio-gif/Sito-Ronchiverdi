// Endpoint condiviso dai form di contatto del sito: il modal generico
// (LeadModal/leadForm.client.js) e i form inline specifici per pagina (es.
// Chinesis). Gira solo su Vercel — vedi astro.config.mjs — e scrive su
// Supabase con la service_role key, mai esposta al client.
import { createClient } from "@supabase/supabase-js";
import { notificaLead } from "../../lib/notificaLead";

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

	// Provenienza: campi calcolati dal client (src/lib/tracking.client.js) e
	// spediti insieme al form. Tutti opzionali — un lead resta valido anche se
	// arriva senza UTM, e i campi restano semplicemente nulli.
	const tracking = {
		session_id: str(body.session_id),
		ga_session_id: str(body.ga_session_id),
		ga_client_id: str(body.ga_client_id),
		utm_source: str(body.utm_source),
		utm_medium: str(body.utm_medium),
		utm_campaign: str(body.utm_campaign),
		utm_term: str(body.utm_term),
		utm_content: str(body.utm_content),
		utm_id: str(body.utm_id),
		first_utm_source: str(body.first_utm_source),
		first_utm_medium: str(body.first_utm_medium),
		first_utm_campaign: str(body.first_utm_campaign),
		first_utm_term: str(body.first_utm_term),
		first_utm_content: str(body.first_utm_content),
		gclid: str(body.gclid),
		gbraid: str(body.gbraid),
		wbraid: str(body.wbraid),
		fbclid: str(body.fbclid),
		ttclid: str(body.ttclid),
		msclkid: str(body.msclkid),
		li_fat_id: str(body.li_fat_id),
		landing_page: str(body.landing_page),
		referrer: str(body.referrer),
		first_touch_at: str(body.first_touch_at),
		consent_analytics: body.consent_analytics === true,
		consent_advertisement: body.consent_advertisement === true,
	};

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
		// Una colonna sola per "il testo che ha scritto la persona": il
		// messaggio del percorso libero e l'oggetto di un appuntamento o di una
		// telefonata sono la stessa cosa per chi lavora la richiesta, e `azione`
		// dice già in quale dei due modi è arrivato. Con due colonne il CRM
		// dovrebbe leggerle entrambe ovunque, e prima o poi ne dimenticherebbe una.
		messaggio: str(body.messaggioTesto) ?? str(body.oggetto) ?? str(body.messaggio),
		nome,
		cognome,
		email,
		cellulare,
		privacy: body.privacy === true,
		marketing: body.marketing === true,
		settore: str(body.settore),
		// Data di nascita di chi compila: la chiede il form della consulenza
		// col Fitness Manager. Resta nulla per tutti gli altri percorsi.
		data_nascita: str(body.dataNascita),
		minore_nome: str(body.minoreNome),
		minore_cognome: str(body.minoreCognome),
		minore_data_nascita: str(body.minoreDataNascita),
		...tracking,
	});

	if (error) {
		console.error("Errore inserimento form_contatti:", error.message);
		return json({ ok: false, error: "db_error" }, 500);
	}

	// Avviso alla segreteria. Dopo l'insert e con l'errore ingoiato dentro
	// notificaLead: la richiesta è già salvata, e un problema col servizio di
	// posta non deve diventare un errore in faccia a chi ha compilato il form.
	await notificaLead(body);

	// Marca la sessione come convertita, così il tasso di conversione per
	// campagna si legge direttamente da campagne_rendimento. Non è bloccante:
	// se la riga di sessione non è mai arrivata (utente con JS parziale, o
	// /api/track non raggiunto) il lead resta comunque salvato.
	if (tracking.session_id) {
		const { error: errSessione } = await supabase.rpc("marca_sessione_convertita", {
			p_session_id: tracking.session_id,
		});
		if (errSessione) {
			console.error("Sessione non marcata come convertita:", errSessione.message);
		}
	}

	return json({ ok: true }, 200);
}
