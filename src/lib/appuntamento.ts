// Lettura e modifica di un appuntamento prenotato dal sito, a partire dal
// token che sta nel link delle email.
//
// Server-only: usa la service_role key di Supabase. La sicurezza è tutta nel
// token — un uuid casuale, non elencabile e non indovinabile — quindi ogni
// query filtra per token e mai per id o email: chi ha il link gestisce quel
// solo appuntamento, e nient'altro.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Appuntamento = {
	id: string;
	token: string;
	azione: string | null;
	data: string | null;
	ora: string | null;
	nome: string | null;
	cognome: string | null;
	email: string | null;
	cellulare: string | null;
	attivita: string | null;
	annullatoIl: string | null;
};

const CAMPI =
	"id, token_gestione, azione, data_scelta, ora_scelta, nome, cognome, email, cellulare, attivita_label, appuntamento_annullato_il";

/** Un token è utile solo se è un uuid: filtra prima di interrogare il DB. */
export function tokenValido(t: string | null | undefined): t is string {
	return !!t && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t);
}

export function creaClient(): SupabaseClient | null {
	const url = import.meta.env.SUPABASE_URL;
	const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY non configurate");
		return null;
	}
	return createClient(url, key);
}

function daRiga(r: Record<string, unknown>): Appuntamento {
	return {
		id: String(r.id),
		token: String(r.token_gestione),
		azione: (r.azione as string) ?? null,
		data: r.data_scelta ? String(r.data_scelta).slice(0, 10) : null,
		ora: r.ora_scelta ? String(r.ora_scelta).slice(0, 5) : null,
		nome: (r.nome as string) ?? null,
		cognome: (r.cognome as string) ?? null,
		email: (r.email as string) ?? null,
		cellulare: (r.cellulare as string) ?? null,
		attivita: (r.attivita_label as string) ?? null,
		annullatoIl: (r.appuntamento_annullato_il as string) ?? null,
	};
}

export async function leggiAppuntamento(
	supabase: SupabaseClient,
	token: string
): Promise<Appuntamento | null> {
	const { data, error } = await supabase
		.from("form_contatti")
		.select(CAMPI)
		.eq("token_gestione", token)
		.maybeSingle();

	if (error) {
		console.error("Appuntamento non letto:", error.message);
		return null;
	}
	return data ? daRiga(data as Record<string, unknown>) : null;
}

/** Solo una visita o una telefonata con una data si possono spostare. */
export function eGestibile(a: Appuntamento): boolean {
	return (a.azione === "appuntamento" || a.azione === "telefonata") && !!a.data;
}

/**
 * Un appuntamento già passato non si annulla e non si sposta: a quel punto o
 * è stato fatto, o è saltato, e in entrambi i casi la cosa si risolve con la
 * segreteria. Il confronto è nel fuso del club, non in quello di chi apre il
 * link: chi guarda il messaggio da un altro paese vedrebbe altrimenti un
 * appuntamento "già passato" con ore di anticipo.
 */
export function eGiaPassato(a: Appuntamento): boolean {
	if (!a.data) return false;
	const adesso = oraClub();
	const quando = `${a.data} ${a.ora ?? "23:59"}`;
	return quando < adesso;
}

/** "YYYY-MM-DD HH:MM" nel fuso Europe/Rome. */
export function oraClub(): string {
	const p: Record<string, string> = {};
	new Intl.DateTimeFormat("en-GB", {
		timeZone: "Europe/Rome",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	})
		.formatToParts(new Date())
		.forEach((x) => (p[x.type] = x.value));
	return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}
