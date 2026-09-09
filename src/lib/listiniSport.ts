// I listini dei corsi per sport: tennis, padel, triathlon.
//
// I contenuti stanno in src/content/listini-sport/<sport>.json, editabili da
// Tina: i prezzi cambiano ogni stagione e li aggiorna la segreteria.
//
// Il portale distingue le due platee con due categorie (3 non soci, 13 soci)
// e ogni riga di listino ha il suo prodotto in entrambe: gli id stanno nel
// JSON accanto ai prezzi, così un prezzo e il suo link si aggiornano insieme.

import { getEntry } from "astro:content";
import { linkCategoria } from "./portale";

export { euro } from "./formato";
/** La scheda di un singolo prodotto sul portale. */
export { linkProdotto } from "./portale";

export const STORE_NON_SOCI_TENNIS = linkCategoria(3);
export const STORE_SOCI_TENNIS = linkCategoria(13);

export interface RigaSport {
	/** Il nome del livello o del percorso: RonchiRed, Competizione, ... */
	voce: string;
	/** Colore del gruppo, dove i corsi ne hanno uno (i livelli del tennis). */
	colore?: string;
	/** Quante volte a settimana. */
	dettaglio: string;
	/** Quello che distingue due righe altrimenti uguali (durata della lezione). */
	nota?: string;
	prezzoNonSoci: number;
	prezzoSoci: number;
	idNonSoci: number;
	idSoci: number;
}

export interface PercorsoSport {
	slug: string;
	title: string;
	eyebrow: string;
	descrizione: string;
	punti: string[];
	image: string;
	imageAlt: string;
	/** Le voci prese dalla scheda del prodotto sul portale. */
	dettagli?: { label: string; valore: string }[];
	listino: RigaSport[];
}

export type Sport = "tennis" | "padel" | "triathlon";

async function documento(sport: Sport) {
	const entry = await getEntry("listiniSport", sport);
	if (!entry) throw new Error(`Manca src/content/listini-sport/${sport}.json`);
	return entry.data;
}

export async function getPercorsi(sport: Sport): Promise<PercorsoSport[]> {
	return (await documento(sport)).percorsi as PercorsoSport[];
}

export async function getListinoAggiornatoAl(sport: Sport): Promise<string> {
	return (await documento(sport)).aggiornatoAl;
}

/** Comodo dove serve un solo percorso, come padel e triathlon. */
export async function getPercorso(sport: Sport, slug?: string): Promise<PercorsoSport> {
	const percorsi = await getPercorsi(sport);
	return slug ? (percorsi.find((p) => p.slug === slug) ?? percorsi[0]) : percorsi[0];
}

/** Il prezzo più basso del percorso: serve alle card, per dire "da € 630". */
export function prezzoDa(p: PercorsoSport): number {
	return Math.min(...p.listino.map((r) => r.prezzoSoci));
}
