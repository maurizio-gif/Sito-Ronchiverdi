// ─────────────────────────────────────────────────────────────────────────────
// Come arriva al club il certificato medico.
//
// Una casella sola per tutti i settori: il documento va a chi tiene lo
// scadenziario, non al maestro del corso. Prima le pagine dicevano tre cose
// diverse — caricalo sul portale, portalo in reception, consegnalo prima
// dell'inizio — e un certificato che arriva per tre strade è un certificato
// che alla scadenza non si trova.
//
// La distinzione che conta è fra le due idoneità:
//   • non agonistica: basta l'email;
//   • agonistica: l'email serve comunque, ma va consegnato anche l'originale
//     cartaceo al responsabile del settore.
//
// Le pagine importano queste costanti invece di riscrivere l'indirizzo: il
// giorno che la casella cambia, cambia qui.
// ─────────────────────────────────────────────────────────────────────────────

/** La casella che riceve i certificati medici di tutti i settori. */
export const EMAIL_CERTIFICATI = "certificatimedici@ronchiverdi.it";

/** L'indirizzo come link, per i testi passati con `set:html`. */
export const MAILTO_CERTIFICATI = `<a href="mailto:${EMAIL_CERTIFICATI}">${EMAIL_CERTIFICATI}</a>`;

/** Idoneità non agonistica: si invia e basta. Versione con link. */
export const INVIO_NON_AGONISTICO = `Si invia in allegato a ${MAILTO_CERTIFICATI}.`;

/** Idoneità agonistica: email più originale a mano. Versione con link. */
export const INVIO_AGONISTICO = `Si invia in allegato a ${MAILTO_CERTIFICATI} e l'originale va consegnato al responsabile del settore.`;

/** Le stesse due frasi in solo testo, per le FAQ e i posti senza markup. */
export const INVIO_NON_AGONISTICO_TESTO = `Si invia in allegato a ${EMAIL_CERTIFICATI}.`;
export const INVIO_AGONISTICO_TESTO = `Si invia in allegato a ${EMAIL_CERTIFICATI} e l'originale va consegnato al responsabile del settore.`;
