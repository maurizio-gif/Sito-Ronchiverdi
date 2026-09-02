// @ts-nocheck — script vanilla per il browser (accesso al DOM, niente tipi)
//
// Correlazione UTM ↔ Session ID per i lead del sito.
//
// Cosa fa, in breve:
//   1. genera (o recupera) un session_id first-party per la visita corrente;
//   2. legge le UTM / click id dall'URL di ingresso e le conserva come
//      "first touch" (prima campagna che ha portato l'utente sul sito) e
//      "last touch" (campagna della sessione corrente);
//   3. quando il consenso lo permette, legge anche il session id di GA4 dal
//      cookie _ga_* così lo stesso lead è ritrovabile dentro GA4/BigQuery;
//   4. manda ogni pagina vista a /api/track, che su Vercel scrive sessione e
//      pageview su Supabase: così sono tracciate TUTTE le sessioni, non solo
//      quelle che compilano un form;
//   5. espone getTrackingPayload() — i campi che i form allegano a /api/lead —
//      e pushDataLayer() per l'evento generate_lead verso GTM.
//
// Tutte le scritture su Supabase passano da function Vercel (/api/track e
// /api/lead): la service_role key non arriva mai al browser e non c'è nessun
// servizio intermedio.
//
// Rapporto con CookieYes (installato nel <head> di Layout.astro):
//   - il session_id vive in sessionStorage: dura quanto la scheda, non è un
//     cookie di profilazione e serve al funzionamento del form, quindi parte
//     sempre. È la chiave che lega il lead salvato su Supabase alla sua
//     provenienza;
//   - la persistenza cross-sessione del first touch (localStorage, 90 giorni)
//     e la lettura del cookie GA4 avvengono SOLO con consenso analytics o
//     advertisement. Senza consenso il first touch resta nella sola scheda;
//   - al variare del consenso (evento cookieyes_consent_update) rivalutiamo:
//     se l'utente accetta dopo l'atterraggio, il first touch già raccolto
//     viene promosso in localStorage e il session id GA4 diventa leggibile.
//
// Il consenso NON blocca l'invio delle UTM a /api/lead: sono dati che l'utente
// ci sta consegnando insieme al form, con la sua privacy policy accettata,
// non tracciamento di terze parti.

var SESSION_KEY = "rv_session";
var FIRST_TOUCH_KEY = "rv_first_touch";
var LAST_TOUCH_KEY = "rv_last_touch";
var VISITOR_KEY = "rv_visitor";

/** Endpoint che registra sessioni e pagine viste (Vercel → Supabase). */
var TRACK_ENDPOINT = "/api/track";

/** Minuti di inattività dopo i quali la sessione è considerata nuova. */
var SESSION_TIMEOUT_MIN = 30;
/** Giorni di conservazione del first touch, quando il consenso lo permette. */
var FIRST_TOUCH_DAYS = 90;

var UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"];
var CLICK_IDS = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid", "li_fat_id"];

// ---------------------------------------------------------------- utilità

function now() {
	return Date.now();
}

function uuid() {
	if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
	// Fallback per browser senza randomUUID: sufficiente a distinguere sessioni.
	return "s-" + now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function readJSON(store, key) {
	try {
		var raw = store.getItem(key);
		return raw ? JSON.parse(raw) : null;
	} catch (e) {
		return null;
	}
}

function writeJSON(store, key, value) {
	try {
		store.setItem(key, JSON.stringify(value));
	} catch (e) {}
}

function removeKey(store, key) {
	try {
		store.removeItem(key);
	} catch (e) {}
}

function isEmptyTouch(touch) {
	if (!touch) return true;
	for (var i = 0; i < UTM_PARAMS.length; i++) if (touch[UTM_PARAMS[i]]) return false;
	for (var j = 0; j < CLICK_IDS.length; j++) if (touch[CLICK_IDS[j]]) return false;
	return !touch.referrer;
}

// ------------------------------------------------------------ consenso CY

/**
 * Legge il cookie cookieyes-consent, nel formato
 * "consentid:xxx,consent:yes,necessary:yes,analytics:yes,advertisement:no,...".
 * Ritorna null se CookieYes non ha ancora scritto nulla (banner mai chiuso).
 */
function readCookieYesConsent() {
	if (typeof document === "undefined") return null;
	var match = document.cookie.match(/(?:^|;\s*)cookieyes-consent=([^;]*)/);
	if (!match) return null;
	var raw = "";
	try {
		raw = decodeURIComponent(match[1]);
	} catch (e) {
		raw = match[1];
	}
	var out = {};
	raw.split(",").forEach(function (pair) {
		var idx = pair.indexOf(":");
		if (idx === -1) return;
		out[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
	});
	return out;
}

/** true se l'utente ha dato consenso analytics o advertisement. */
export function hasTrackingConsent() {
	var consent = readCookieYesConsent();
	if (!consent) return false;
	return consent.analytics === "yes" || consent.advertisement === "yes";
}

/** Categoria singola, es. hasConsentFor("analytics"). */
export function hasConsentFor(category) {
	var consent = readCookieYesConsent();
	return !!consent && consent[category] === "yes";
}

// --------------------------------------------------------------- sessione

/**
 * Session id della visita corrente. Vive in sessionStorage con timestamp di
 * ultimo contatto: oltre SESSION_TIMEOUT_MIN di inattività ne nasce uno nuovo,
 * come fa GA4. Ogni chiamata rinfresca il timestamp.
 */
export function getSessionId() {
	var store;
	try {
		store = window.sessionStorage;
	} catch (e) {
		return null;
	}

	var s = readJSON(store, SESSION_KEY);
	var expired = !s || !s.id || !s.ts || now() - s.ts > SESSION_TIMEOUT_MIN * 60 * 1000;

	if (expired) {
		s = { id: uuid(), start: now(), ts: now(), n: s && s.n ? s.n + 1 : 1 };
	} else {
		s.ts = now();
	}
	writeJSON(store, SESSION_KEY, s);
	return s.id;
}

/**
 * Session id di GA4, estratto dal cookie _ga_<CONTAINER_ID>, il cui valore ha
 * forma "GS1.1.<session_id>.<session_number>...": il terzo segmento è il
 * session id che GA4 usa anche in BigQuery. Richiede consenso analytics —
 * senza consenso il cookie non esiste nemmeno.
 */
export function getGaSessionId() {
	if (typeof document === "undefined") return null;
	if (!hasConsentFor("analytics")) return null;
	var match = document.cookie.match(/(?:^|;\s*)_ga_[A-Z0-9]+=([^;]*)/);
	if (!match) return null;
	var parts = match[1].split(".");
	return parts.length > 2 && parts[2] ? parts[2] : null;
}

/** Client id di GA4 dal cookie _ga ("GA1.1.<client_id>"): serve a unire le sessioni. */
export function getGaClientId() {
	if (typeof document === "undefined") return null;
	if (!hasConsentFor("analytics")) return null;
	var match = document.cookie.match(/(?:^|;\s*)_ga=([^;]*)/);
	if (!match) return null;
	var parts = match[1].split(".");
	return parts.length > 3 ? parts[2] + "." + parts[3] : null;
}

// ----------------------------------------------------------------- touch

/** UTM, click id, landing page e referrer letti dall'URL corrente. */
function readTouchFromUrl() {
	var params;
	try {
		params = new URL(window.location.href).searchParams;
	} catch (e) {
		return null;
	}

	var touch = { ts: now(), landing_page: window.location.pathname + window.location.search };

	UTM_PARAMS.concat(CLICK_IDS).forEach(function (key) {
		var v = params.get(key);
		if (v) touch[key] = v.slice(0, 255);
	});

	// Referrer utile solo se esterno: la navigazione interna non è provenienza.
	var ref = document.referrer || "";
	if (ref) {
		try {
			if (new URL(ref).host !== window.location.host) touch.referrer = ref.slice(0, 500);
		} catch (e) {}
	}

	return touch;
}

/**
 * Aggiorna first touch e last touch.
 *
 * - last touch: sovrascritto ogni volta che l'URL porta UTM/click id nuovi,
 *   altrimenti conserva quello della sessione;
 * - first touch: scritto una volta sola, e mai sovrascritto finché non scade.
 *
 * Il first touch va in localStorage (cross-sessione) solo con consenso; senza
 * consenso resta in sessionStorage, quindi limitato alla scheda corrente.
 */
function updateTouches() {
	var session, local;
	try {
		session = window.sessionStorage;
		local = window.localStorage;
	} catch (e) {
		return;
	}

	var incoming = readTouchFromUrl();
	var consent = hasTrackingConsent();

	// --- last touch
	if (incoming && !isEmptyTouch(incoming)) {
		writeJSON(session, LAST_TOUCH_KEY, incoming);
	}

	// --- first touch
	var stored = readJSON(local, FIRST_TOUCH_KEY);
	if (stored && stored.ts && now() - stored.ts > FIRST_TOUCH_DAYS * 86400000) {
		removeKey(local, FIRST_TOUCH_KEY);
		stored = null;
	}
	var first = stored || readJSON(session, FIRST_TOUCH_KEY);

	// A differenza del last touch, il first touch si registra anche senza UTM:
	// per un lead diretto landing page e referrer sono l'unica provenienza che
	// abbiamo, e vale la pena saperla.
	if (!first && incoming) {
		first = incoming;
		writeJSON(session, FIRST_TOUCH_KEY, first);
	}

	// Con il consenso il first touch già raccolto viene promosso a persistente:
	// così chi accetta il banner dopo l'atterraggio non perde l'attribuzione.
	if (first && consent && !stored) writeJSON(local, FIRST_TOUCH_KEY, first);
	// Consenso revocato: via la copia persistente, resta quella di sessione.
	if (!consent && stored) removeKey(local, FIRST_TOUCH_KEY);
}

function getTouch(key) {
	try {
		return (
			(key === FIRST_TOUCH_KEY ? readJSON(window.localStorage, key) : null) ||
			readJSON(window.sessionStorage, key)
		);
	} catch (e) {
		return null;
	}
}

// --------------------------------------------------------------- visitatore

/**
 * Id persistente del visitatore, per riconoscere sessioni diverse della stessa
 * persona. È un identificativo che dura nel tempo, quindi esiste solo con
 * consenso analytics/advertisement: senza consenso resta null e le sessioni
 * restano tra loro slegate.
 */
export function getVisitorId() {
	if (!hasTrackingConsent()) return null;
	try {
		var store = window.localStorage;
		var v = store.getItem(VISITOR_KEY);
		if (!v) {
			v = uuid();
			store.setItem(VISITOR_KEY, v);
		}
		return v;
	} catch (e) {
		return null;
	}
}

// ------------------------------------------------------------- pageview

/**
 * Registra su Supabase la sessione e la pagina corrente, passando da
 * /api/track (function Vercel: la service_role key non tocca mai il browser).
 *
 * keepalive: true perché la richiesta deve sopravvivere all'utente che clicca
 * subito su un link — altrimenti il browser la annulla al cambio pagina.
 * L'errore è volutamente ignorato: il tracciamento non deve mai rompere la
 * navigazione né bloccare un form.
 */
export function trackPageview() {
	if (typeof window === "undefined") return;

	var payload = getTrackingPayload();
	payload.visitor_id = getVisitorId();
	payload.pagina = window.location.pathname;
	payload.titolo = document.title ? String(document.title).slice(0, 300) : null;
	payload.lingua = navigator.language || null;
	payload.referrer_pagina = document.referrer || null;
	try {
		payload.schermo = window.screen.width + "x" + window.screen.height;
	} catch (e) {}

	try {
		fetch(TRACK_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
			keepalive: true,
		}).catch(function () {});
	} catch (e) {}
}

// --------------------------------------------------------------- payload

/**
 * I campi di provenienza da allegare al POST /api/lead. Nomi in snake_case
 * perché corrispondono uno a uno alle colonne di form_contatti.
 */
export function getTrackingPayload() {
	var first = getTouch(FIRST_TOUCH_KEY) || {};
	var last = getTouch(LAST_TOUCH_KEY) || first;

	var payload = {
		session_id: getSessionId(),
		ga_session_id: getGaSessionId(),
		ga_client_id: getGaClientId(),
		consent_analytics: hasConsentFor("analytics"),
		consent_advertisement: hasConsentFor("advertisement"),
		landing_page: first.landing_page || null,
		referrer: first.referrer || null,
		first_touch_at: first.ts ? new Date(first.ts).toISOString() : null,
	};

	// Le UTM "nude" sono quelle dell'ultimo contatto — la campagna che ha
	// generato la conversione — e in più teniamo il first touch prefissato.
	UTM_PARAMS.concat(CLICK_IDS).forEach(function (key) {
		payload[key] = last[key] || null;
	});
	UTM_PARAMS.forEach(function (key) {
		payload["first_" + key] = first[key] || null;
	});

	return payload;
}

/** Aggiunge i campi di provenienza a un payload di form, senza sovrascriverlo. */
export function withTracking(payload) {
	return Object.assign({}, getTrackingPayload(), payload || {});
}

/**
 * Push su dataLayer per GTM/GA4. Non gestiamo qui il consenso: GTM riceve da
 * CookieYes il Consent Mode e decide lui se i tag possono scattare. Se GTM non
 * è installato l'array resta in pagina e non fa danni.
 */
export function pushDataLayer(event, extra) {
	if (typeof window === "undefined") return;
	window.dataLayer = window.dataLayer || [];
	try {
		window.dataLayer.push(Object.assign({ event: event }, getTrackingPayload(), extra || {}));
	} catch (e) {}
}

/** Evento di conversione lead, chiamato dai form al POST riuscito. */
export function trackLead(state) {
	pushDataLayer("generate_lead", {
		lead_origine: (state && state.origine) || null,
		lead_pagina: (state && state.pagina) || null,
		lead_cta: (state && state.cta) || null,
		lead_attivita: (state && state.attivita) || null,
		lead_azione: (state && state.azione) || null,
	});
}

// ------------------------------------------------------------------ init

/**
 * Da chiamare una volta per pagina, il più presto possibile: apre la sessione
 * e fissa le UTM di ingresso prima che l'utente navighi altrove. Riparte al
 * variare del consenso CookieYes per promuovere/rimuovere il first touch.
 */
export function initTracking() {
	if (typeof window === "undefined") return;
	getSessionId();
	updateTouches();
	trackPageview();

	if (!window.__rvTrackingConsentBound) {
		window.__rvTrackingConsentBound = true;
		document.addEventListener("cookieyes_consent_update", function () {
			updateTouches();
			// Il consenso appena dato porta visitor_id e id GA4: rimandiamo la
			// riga di sessione così su Supabase si completa da sé.
			trackPageview();
		});
	}
}
