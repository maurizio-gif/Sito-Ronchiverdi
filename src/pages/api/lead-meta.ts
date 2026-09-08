// Endpoint per i lead dei moduli istantanei di Meta (Facebook e Instagram).
//
// Gemello di lead.ts, e volutamente un file a parte invece di un ramo dentro
// quello: le due sorgenti hanno regole di validazione opposte. Il form del
// sito può pretendere nome, cognome, email e cellulare perché li chiede tutti
// e quattro; un modulo istantaneo di Meta spesso raccoglie il nome intero e
// un solo recapito, e allentare la validazione di lead.ts per accoglierli
// vorrebbe dire indebolirla anche per il sito.
//
// Chi chiama non è un browser ma l'automazione (n8n, o un giorno un webhook
// nostro): l'accesso è quindi un segreto condiviso in header, non un form
// pubblico. Senza, questo endpoint sarebbe un modo per scrivere in anagrafica
// da fuori.
//
// La destinazione è la stessa tabella dei lead del sito, `form_contatti`, e
// non una tabella "lead_meta" a parte: da lì passano già la deduplicazione
// dell'anagrafica (trigger → trova_o_crea_persona), l'apertura della
// trattativa per Club e Family, l'Agenda e le sezioni del pannello. Una
// seconda tabella significherebbe riscrivere tutto quello.
import { createClient } from "@supabase/supabase-js";
import { leadActivityMap } from "../../data/leadActivities";
import { notificaLead } from "../../lib/notificaLead";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// I due canali del tennis nel pannello filtrano entrambi per `settore` (vedi
// CANALI in lib/richieste.ts dell'app): una richiesta "corsi-tennis" senza
// settore non compare né in Scuola né in Competizione. Meglio rifiutarla qui
// che salvarla e non far vedere il lead a nessuno.
const SETTORI_TENNIS = ["scuola", "competizione"];

// Nomi dei campi standard dei moduli Meta. Le domande personalizzate hanno
// nomi liberi e finiscono nel messaggio: qui restano solo quelle che hanno una
// colonna in cui andare.
const CAMPI_STANDARD = new Set([
	"full_name",
	"first_name",
	"last_name",
	"email",
	"phone_number",
]);

function str(v: unknown): string | null {
	return typeof v === "string" && v.trim() ? v.trim() : null;
}

function json(data: unknown, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

/**
 * `field_data` di Meta è un array di `{ name, values }`. Qui diventa una mappa
 * nome → valore, con i valori multipli (le caselle a scelta multipla) uniti in
 * una riga sola: nel pannello si leggono, non si filtrano.
 */
function raccogliCampi(fieldData: unknown): Map<string, string> {
	const campi = new Map<string, string>();
	if (!Array.isArray(fieldData)) return campi;

	for (const voce of fieldData) {
		if (!voce || typeof voce !== "object") continue;
		const nome = str((voce as Record<string, unknown>).name);
		if (!nome) continue;

		const valori = (voce as Record<string, unknown>).values;
		const valore = Array.isArray(valori)
			? valori.map(str).filter(Boolean).join(", ")
			: str(valori);
		if (valore) campi.set(nome.toLowerCase(), valore);
	}

	return campi;
}

/**
 * Meta consegna `full_name` come campo unico. Si divide sul primo spazio: in
 * italiano funziona nella maggioranza dei casi e sbaglia sui nomi composti
 * ("Maria Grazia Rossi" diventa nome "Maria" e cognome "Grazia Rossi").
 *
 * Non è una cosa che si risolve indovinando meglio: se il cognome deve essere
 * giusto, il modulo su Meta va configurato con "Nome" e "Cognome" separati,
 * che arrivano come first_name e last_name e non passano da qui.
 */
function dividiNome(intero: string): { nome: string; cognome: string | null } {
	const parti = intero.split(/\s+/).filter(Boolean);
	if (parti.length < 2) return { nome: parti[0] ?? intero, cognome: null };
	return { nome: parti[0], cognome: parti.slice(1).join(" ") };
}

export async function POST({ request }: { request: Request }) {
	const segreto = import.meta.env.LEAD_META_SECRET;
	if (!segreto) {
		console.error("LEAD_META_SECRET non configurata su Vercel");
		return json({ ok: false, error: "server_not_configured" }, 500);
	}
	if (request.headers.get("x-lead-meta-secret") !== segreto) {
		return json({ ok: false, error: "unauthorized" }, 401);
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: "invalid_json" }, 400);
	}

	// ── L'attività: è ciò che decide chi vede il lead ──────────────────────
	//
	// Nel pannello le richieste non sono un elenco unico: ogni canale pesca le
	// sue per `attivita` (o per `origine`, i form inline). Un valore inventato
	// non corrisponde a nessun canale e il lead resta invisibile — salvato, ma
	// invisibile, che è il modo peggiore di perdere un contatto pagato. Per
	// questo si valida contro leadActivities.ts, la stessa fonte da cui il form
	// del sito prende le sue opzioni, e non contro un elenco copiato qui.
	const attivita = str(body.attivita);
	if (!attivita || !(attivita in leadActivityMap)) {
		return json(
			{
				ok: false,
				error: "unknown_attivita",
				valide: Object.keys(leadActivityMap),
			},
			400
		);
	}

	const settore = str(body.settore);
	if (attivita === "corsi-tennis" && !(settore && SETTORI_TENNIS.includes(settore))) {
		return json({ ok: false, error: "missing_settore", valide: SETTORI_TENNIS }, 400);
	}

	// ── I contatti ────────────────────────────────────────────────────────
	const campi = raccogliCampi(body.field_data);

	const nomeIntero = str(body.nome) ?? campi.get("first_name") ?? null;
	const cognomeDiretto = str(body.cognome) ?? campi.get("last_name") ?? null;
	const fullName = campi.get("full_name") ?? null;

	let nome = nomeIntero;
	let cognome = cognomeDiretto;
	if (!nome && fullName) {
		const diviso = dividiNome(fullName);
		nome = diviso.nome;
		cognome = cognome ?? diviso.cognome;
	}

	const email = str(body.email) ?? campi.get("email") ?? null;
	const cellulare = str(body.cellulare) ?? campi.get("phone_number") ?? null;

	if (!nome) {
		return json({ ok: false, error: "missing_nome" }, 400);
	}
	// Almeno un recapito, e non è una scelta di comodo: senza email né
	// cellulare trova_o_crea_persona non può deduplicare e restituisce null, e
	// il lead resterebbe una richiesta senza persona in anagrafica.
	if (!email && !cellulare) {
		return json({ ok: false, error: "missing_contatto" }, 400);
	}
	if (email && !EMAIL_RE.test(email)) {
		return json({ ok: false, error: "invalid_email" }, 400);
	}

	// ── Le domande personalizzate ─────────────────────────────────────────
	//
	// Tutto ciò che non è un campo standard è una domanda che il club ha
	// aggiunto al modulo, e per chi lavora la richiesta è il contenuto che
	// conta. Va in `dettagli` con la stessa forma che usa il sito — un array di
	// stringhe — così il pannello lo mostra come già fa, senza modifiche.
	const dettagli = [...campi.entries()]
		.filter(([nomeCampo]) => !CAMPI_STANDARD.has(nomeCampo))
		.map(([nomeCampo, valore]) => `${nomeCampo}: ${valore}`);

	const supabaseUrl = import.meta.env.SUPABASE_URL;
	const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !serviceRoleKey) {
		console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY non configurate su Vercel");
		return json({ ok: false, error: "server_not_configured" }, 500);
	}

	const supabase = createClient(supabaseUrl, serviceRoleKey);

	// ── Provenienza ───────────────────────────────────────────────────────
	//
	// `utm_source` social + `utm_medium` "paid" è ciò che classificaCanaleTraffico
	// (lib/analytics.ts dell'app) legge come "Social a pagamento": con altri
	// valori questi lead finirebbero in "Traffico diretto" e il rendimento
	// delle campagne Meta risulterebbe zero.
	const piattaforma = str(body.piattaforma)?.toLowerCase();
	const utm_source = piattaforma === "instagram" ? "instagram" : "facebook";

	const riga = {
		origine: "meta-lead-ads",
		attivita,
		attivita_label: str(body.attivitaLabel) ?? leadActivityMap[attivita].label,
		settore,
		audience: leadActivityMap[attivita].audience,
		// Il modulo, non una pagina del sito: chi legge la richiesta vede da
		// quale modulo è arrivata invece di una colonna vuota.
		pagina: str(body.form_name),
		cta: "Modulo istantaneo Meta",
		messaggio: str(body.messaggio),
		dettagli: dettagli.length ? dettagli : null,
		nome,
		cognome,
		email,
		cellulare,
		// Un modulo istantaneo non si invia senza passare dall'informativa che
		// il modulo stesso mostra: la spunta è implicita nell'invio.
		privacy: true,
		// Il consenso commerciale no: quello esiste solo se il modulo fa una
		// domanda esplicita, e il nome di quel campo lo conosce chi ha
		// configurato il modulo. Lo decide quindi l'automazione che chiama qui,
		// e in assenza di risposta resta false.
		marketing: body.marketing === true,
		meta_leadgen_id: str(body.leadgen_id),
		utm_source,
		utm_medium: "paid",
		utm_campaign: str(body.campaign_name),
		utm_content: str(body.form_name),
		utm_id: str(body.campaign_id),
		consent_analytics: false,
		consent_advertisement: false,
	};

	const { error } = await supabase.from("form_contatti").insert(riga);

	if (error) {
		// 23505 è la violazione del vincolo di unicità su meta_leadgen_id: è
		// Meta che rimanda lo stesso lead, non un errore. Si risponde 200,
		// altrimenti il webhook continuerebbe a ritentare per sempre.
		if (error.code === "23505") {
			return json({ ok: true, duplicato: true }, 200);
		}
		console.error("Errore inserimento lead Meta:", error.message);
		return json({ ok: false, error: "db_error" }, 500);
	}

	// Avviso alla segreteria, come per i lead del sito: un lead che arriva alle
	// nove di sera e nessuno lo sa è un lead perso. L'errore resta dentro
	// notificaLead — la richiesta è già salvata, e un problema col servizio di
	// posta non deve far ritentare il webhook.
	await notificaLead({ ...body, origine: "meta-lead-ads", attivitaLabel: riga.attivita_label });

	return json({ ok: true }, 200);
}
