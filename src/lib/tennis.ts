// I tre percorsi della Young School Tennis e le loro quote.
//
// I contenuti stanno in src/content/listini-tennis/tennis.json, editabile da
// Tina: i prezzi cambiano ogni stagione e li aggiorna la segreteria.
//
// Il portale distingue le due platee con due categorie (3 non soci, 13 soci)
// e ogni riga di listino ha il suo prodotto in entrambe: gli id stanno nel
// JSON accanto ai prezzi, così un prezzo e il suo link si aggiornano insieme.

import { getEntry } from "astro:content";

export { euro } from "./formato";

const STORE_BASE = "https://inforyou.teamsystem.com/ronchiverdi/store/2";

export const STORE_TENNIS_NON_SOCI = `${STORE_BASE}/category/3`;
export const STORE_TENNIS_SOCI = `${STORE_BASE}/category/13`;

export function linkProdotto(id: number): string {
	return `${STORE_BASE}/product/${id}`;
}

export interface RigaTennis {
	/** Il nome del livello o del percorso: RonchiRed, Competizione, ... */
	voce: string;
	/** Quante volte a settimana. */
	dettaglio: string;
	/** Quello che distingue due righe altrimenti uguali (durata della lezione). */
	nota?: string;
	prezzoNonSoci: number;
	prezzoSoci: number;
	idNonSoci: number;
	idSoci: number;
}

export interface PercorsoTennis {
	slug: string;
	title: string;
	eyebrow: string;
	descrizione: string;
	punti: string[];
	image: string;
	imageAlt: string;
	listino: RigaTennis[];
}

async function documento() {
	const entry = await getEntry("listiniTennis", "tennis");
	if (!entry) throw new Error("Manca src/content/listini-tennis/tennis.json");
	return entry.data;
}

export async function getPercorsiTennis(): Promise<PercorsoTennis[]> {
	return (await documento()).percorsi as PercorsoTennis[];
}

export async function getListinoTennisAggiornatoAl(): Promise<string> {
	return (await documento()).aggiornatoAl;
}

/** Il prezzo più basso del percorso: serve alle card, per dire "da € 630". */
export function prezzoDaTennis(p: PercorsoTennis): number {
	return Math.min(...p.listino.map((r) => r.prezzoSoci));
}
