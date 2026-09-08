// I quattro corsi della Young School Nuoto e le loro quote.
//
// I contenuti stanno in src/content/listini/scuola-nuoto.json, editabile da
// Tina: i prezzi cambiano ogni stagione e li aggiorna la segreteria, quindi
// non vivono nel codice. Qui restano solo le costanti tecniche e le funzioni
// che servono a mostrarli.
//
// Sorgente unica per la pagina della scuola nuoto (le card dei corsi), l'hub
// delle modalità di iscrizione e le quattro pagine di iscrizione.

import { getEntry } from "astro:content";

export { euro } from "./formato";

// ── Il portale ────────────────────────────────────────────────────────────
// Ogni prezzo porta alla sua riga di listino: /store/2/product/<id> apre la
// scheda di quel prodotto in una finestra sopra il catalogo. Gli id stanno
// nel JSON accanto al prezzo, perché sono la stessa informazione: se cambia
// il listino si aggiornano insieme.
const STORE_BASE = "https://inforyou.teamsystem.com/ronchiverdi/store/2";

export const STORE_NON_SOCI = `${STORE_BASE}/category/2`;
export const STORE_SOCI = `${STORE_BASE}/category/10`;

/** La scheda di un singolo prodotto sul portale. */
export function linkProdotto(id: number): string {
	return `${STORE_BASE}/product/${id}`;
}

/** Il numero della segreteria, usato nelle informative dell'iscrizione. */
export const TELEFONO_CLUB = "011 6612146";

export interface RigaListino {
	formula: string;
	periodo: string;
	dettaglio?: string;
	prezzoNonSoci: number;
	prezzoSoci: number;
	idNonSoci: number;
	idSoci: number;
}

export interface CorsoNuoto {
	/** Ultimo pezzo dell'indirizzo: /attivita/scuola-nuoto/iscrizione/<slug> */
	slug: string;
	title: string;
	titleLungo?: string;
	ageLabel: string;
	percorso: string;
	obiettivi: string[];
	durata: string;
	vasca: string;
	image: string;
	imageAlt: string;
	/** Le voci prese dalla scheda del prodotto sul portale. */
	dettagli?: { label: string; valore: string }[];
	listino: RigaListino[];
}

async function listino() {
	const entry = await getEntry("listini", "scuola-nuoto");
	if (!entry) throw new Error("Manca src/content/listini/scuola-nuoto.json");
	return entry.data;
}

/** I corsi, nell'ordine in cui stanno su Tina. */
export async function getCorsiNuoto(): Promise<CorsoNuoto[]> {
	return (await listino()).corsi as CorsoNuoto[];
}

export async function getCorsoNuoto(slug: string): Promise<CorsoNuoto | undefined> {
	return (await getCorsiNuoto()).find((c) => c.slug === slug);
}

/** "settembre 2026" — la data che compare sotto la tabella delle quote. */
export async function getListinoAggiornatoAl(): Promise<string> {
	return (await listino()).aggiornatoAl;
}

/** Il prezzo più basso del corso: serve alle card, per dire "da € 365". */
export function prezzoDa(corso: CorsoNuoto): number {
	return Math.min(...corso.listino.map((r) => r.prezzoSoci));
}
