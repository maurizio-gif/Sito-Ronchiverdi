// Endpoint di tracciamento sessioni: riceve dal browser l'apertura di una
// sessione e ogni cambio pagina, e scrive su Supabase con la service_role key.
// Gira come function su Vercel — vedi astro.config.mjs — quindi tutta la
// scrittura è server-side: nessuna chiave Supabase esposta al client e nessun
// servizio esterno di mezzo (niente n8n).
//
// Due tabelle (vedi scripts/sql/2026-09-02-sessioni.sql):
//   sessioni        → una riga per session_id, con la provenienza della visita
//   sessioni_pagine → una riga per pagina vista, per ricostruire il percorso
//
// Il legame col form è il session_id: /api/lead lo salva su form_contatti e
// marca la sessione come convertita, così la vista sessioni_con_lead unisce
// "da dove è arrivato" e "cosa ha compilato".
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

/** Limite di lunghezza per ogni campo testuale: taglia, non rifiuta. */
const MAX_LEN = 500;

/** Un session_id nostro è un uuid oppure il fallback "s-<base36>-<base36>". */
const SESSION_ID_RE = /^(?:[0-9a-f-]{36}|s-[a-z0-9]+-[a-z0-9]+)$/i;

function str(v: unknown, max = MAX_LEN): string | null {
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
 * La città arriva percent-encoded dall'header di Vercel. Se la decodifica
 * fallisce — sequenza malformata — si tiene il valore grezzo: un nome di
 * città storto è meglio di una sessione senza città.
 */
function decodeCitta(valore: string | null): string | null {
	if (!valore) return null;
	try {
		return decodeURIComponent(valore);
	} catch {
		return valore;
	}
}

/** Tipo di dispositivo dallo user agent: basta la distinzione grossolana. */
function deviceType(ua: string | null): string | null {
	if (!ua) return null;
	if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
	if (/Mobi|Android.+Mobile|iPhone|iPod/i.test(ua)) return "mobile";
	return "desktop";
}

export async function POST({ request }: { request: Request }) {
	// L'endpoint è pubblico per forza di cose (lo chiama il browser di chiunque
	// visiti il sito), ma almeno le chiamate che dichiarano un'origine diversa
	// dalla nostra le scartiamo: tiene fuori l'abuso casuale da altri siti.
	const origin = request.headers.get("origin");
	if (origin) {
		try {
			if (new URL(origin).host !== new URL(request.url).host) {
				return json({ ok: false, error: "origine_non_valida" }, 403);
			}
		} catch {
			return json({ ok: false, error: "origine_non_valida" }, 403);
		}
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: "invalid_json" }, 400);
	}

	const sessionId = str(body.session_id, 64);
	if (!sessionId || !SESSION_ID_RE.test(sessionId)) {
		return json({ ok: false, error: "invalid_session_id" }, 400);
	}

	const supabaseUrl = import.meta.env.SUPABASE_URL;
	const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !serviceRoleKey) {
		console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY non configurate su Vercel");
		return json({ ok: false, error: "server_not_configured" }, 500);
	}
	const supabase = createClient(supabaseUrl, serviceRoleKey);

	// Geolocalizzazione e user agent li prendiamo dagli header che Vercel
	// aggiunge alla richiesta: l'indirizzo IP non viene mai salvato, solo il
	// paese/regione/città che Vercel ha già derivato da esso.
	const h = request.headers;
	const userAgent = str(h.get("user-agent"), 300);
	const paese = str(h.get("x-vercel-ip-country"), 8);
	const regione = str(h.get("x-vercel-ip-country-region"), 16);
	// Vercel manda la città URL-encoded: senza decodificare, in tabella
	// finisce "San%20Jose" invece di "San Jose".
	const citta = decodeCitta(str(h.get("x-vercel-ip-city"), 120));

	const pagina = str(body.pagina) ?? "/";

	// La riga di sessione si scrive una volta sola con i dati di ingresso: gli
	// UPDATE successivi (via RPC) toccano solo ultimo contatto e contatore, per
	// non sovrascrivere la provenienza originale con quella dell'ultima pagina.
	const sessione = {
		session_id: sessionId,
		visitor_id: str(body.visitor_id, 64),
		ga_session_id: str(body.ga_session_id, 64),
		ga_client_id: str(body.ga_client_id, 64),
		utm_source: str(body.utm_source),
		utm_medium: str(body.utm_medium),
		utm_campaign: str(body.utm_campaign),
		utm_term: str(body.utm_term),
		utm_content: str(body.utm_content),
		utm_id: str(body.utm_id),
		gclid: str(body.gclid),
		gbraid: str(body.gbraid),
		wbraid: str(body.wbraid),
		fbclid: str(body.fbclid),
		ttclid: str(body.ttclid),
		msclkid: str(body.msclkid),
		li_fat_id: str(body.li_fat_id),
		landing_page: str(body.landing_page) ?? pagina,
		referrer: str(body.referrer),
		user_agent: userAgent,
		dispositivo: deviceType(userAgent),
		paese,
		regione,
		citta,
		lingua: str(body.lingua, 32),
		schermo: str(body.schermo, 32),
		consent_analytics: body.consent_analytics === true,
		consent_advertisement: body.consent_advertisement === true,
	};

	// Un solo round-trip: la funzione SQL registra_pagina fa upsert della
	// sessione (senza sovrascrivere la provenienza), incrementa il contatore
	// pagine e inserisce la riga in sessioni_pagine.
	const { error } = await supabase.rpc("registra_pagina", {
		p_sessione: sessione,
		p_pagina: pagina,
		p_titolo: str(body.titolo, 300),
		p_referrer_pagina: str(body.referrer_pagina),
	});

	if (error) {
		console.error("Errore tracciamento sessione:", error.message);
		return json({ ok: false, error: "db_error" }, 500);
	}

	// 204: al client non serve nessun corpo, e la risposta più leggera
	// possibile è quella giusta per una chiamata che parte a ogni pagina.
	return new Response(null, { status: 204 });
}
