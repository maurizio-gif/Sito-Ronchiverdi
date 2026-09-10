// Il portale InforYou di TeamSystem, in un posto solo.
//
// È il gestionale del club, e per chi è già socio è l'area personale: da lì
// si comprano i corsi, si carica il regolamento firmato, si vedono le rate.
// Il certificato medico no: quello va per email alla casella dedicata — vedi
// src/data/certificatoMedico.ts. Il sito lo linka da tre posti diversi — la
// tabella dei listini, i due moduli delle modalità di iscrizione, il
// pannello dell'area riservata — e l'indirizzo base era scritto tre volte:
// `ListinoCorsi.astro`, `listiniSport.ts` e `scuolaNuoto.ts` avevano la
// stessa riga, copiata. Tre copie di un indirizzo sono tre occasioni di
// aggiornarne due.
//
// Il `2` in fondo è l'id del negozio del club dentro l'installazione
// InforYou: sta nella base perché ogni percorso qui sotto ci passa.
export const PORTALE_BASE = "https://inforyou.teamsystem.com/ronchiverdi/store/2";

/** La scheda di un singolo prodotto: si apre in una finestra sopra il catalogo. */
export function linkProdotto(id: number): string {
	return `${PORTALE_BASE}/product/${id}`;
}

/** Una categoria del catalogo: le platee (soci / non soci) sono due categorie. */
export function linkCategoria(id: number): string {
	return `${PORTALE_BASE}/category/${id}`;
}
