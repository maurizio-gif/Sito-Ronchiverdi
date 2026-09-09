// Gli operatori di segreteria: chi, al banco, registra una persona che si è
// presentata in sede (vedi src/pages/guest-register.astro).
//
// L'elenco vive su staff_users nel database del CRM, con il flag
// `operatore_segreteria` che si accende dalla gestione utenti dell'app. Il
// sito lo legge con la service_role key, mai esposta al browser.
//
// Nel menu della pagina ogni operatore è uno **slug**, non la sua email: la
// pagina guest register è pubblica, e le email dello staff non vanno nel
// sorgente di una pagina che chiunque può aprire. L'email torna dallo slug
// lato server quando la richiesta arriva (src/pages/api/lead.ts), perché è
// così che il CRM identifica le persone dello staff — vedi
// opportunita.assegnato_a e form_contatti.gestito_da.
import { createClient } from "@supabase/supabase-js";

export interface Operatore {
	/** Quello che viaggia nel form. */
	slug: string;
	/** Quello che l'operatore vede nel menu. */
	nome: string;
}

/**
 * Slug stabile di un operatore. Nome e cognome quando ci sono — è ciò che
 * cambia meno spesso e resta leggibile in un payload — altrimenti la parte
 * locale dell'email, che su staff_users c'è sempre.
 */
export function slugOperatore(
	nome: string | null | undefined,
	cognome: string | null | undefined,
	email: string
): string {
	const base = [nome, cognome].filter(Boolean).join(" ").trim() || email.split("@")[0];
	return base
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

/**
 * Lo slug che arriva dal form → l'email con cui il CRM conosce l'operatore
 * (è così che identifica lo staff: vedi opportunita.assegnato_a).
 *
 * Uno slug che non corrisponde a nessun operatore abilitato vale "nessuna
 * firma": la richiesta di una persona in sede non va persa perché il menu
 * portava un nome che nel frattempo è stato disattivato.
 */
export async function risolviOperatore(slug: string | null): Promise<string | null> {
	if (!slug) return null;

	const supabaseUrl = import.meta.env.SUPABASE_URL;
	const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !serviceRoleKey) return null;

	const supabase = createClient(supabaseUrl, serviceRoleKey);
	const { data, error } = await supabase
		.from("staff_users")
		.select("email, nome, cognome")
		.eq("operatore_segreteria", true);
	if (error || !data) return null;

	const trovato = data.find((r) => slugOperatore(r.nome, r.cognome, r.email) === slug);
	return trovato?.email ?? null;
}

/** Nome e cognome, o l'email quando l'operatore non li ha ancora compilati. */
function nomeVisibile(
	nome: string | null | undefined,
	cognome: string | null | undefined,
	email: string
): string {
	return [nome, cognome].filter(Boolean).join(" ").trim() || email;
}

/**
 * Gli operatori di segreteria abilitati, in ordine alfabetico.
 *
 * Un elenco vuoto non è un errore da mostrare: il campo operatore è
 * facoltativo, e una segreteria che non ha ancora acceso il flag a nessuno
 * deve poter registrare comunque chi ha davanti. Per lo stesso motivo un
 * problema di lettura o le variabili non configurate valgono "nessun
 * operatore", con una riga nei log.
 */
export async function getOperatoriSegreteria(): Promise<Operatore[]> {
	const supabaseUrl = import.meta.env.SUPABASE_URL;
	const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !serviceRoleKey) {
		console.warn("Menu operatori vuoto: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY non configurate");
		return [];
	}

	const supabase = createClient(supabaseUrl, serviceRoleKey);
	const { data, error } = await supabase
		.from("staff_users")
		.select("email, nome, cognome")
		.eq("operatore_segreteria", true);

	if (error) {
		console.error("Operatori di segreteria non letti:", error.message);
		return [];
	}

	return (data ?? [])
		.map((r) => ({
			slug: slugOperatore(r.nome, r.cognome, r.email),
			nome: nomeVisibile(r.nome, r.cognome, r.email),
		}))
		.sort((a, b) => a.nome.localeCompare(b.nome, "it"));
}
