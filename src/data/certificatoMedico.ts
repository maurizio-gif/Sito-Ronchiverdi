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
//   • non agonistica: solo email, il cartaceo non va consegnato. Dirlo è
//     il punto — chi non lo legge si presenta in reception con il foglio,
//     e qualcuno deve rimandarlo indietro;
//   • agonistica: l'email serve comunque, e in più va consegnato l'originale
//     cartaceo al responsabile del settore.
//
// Le pagine importano queste costanti invece di riscrivere l'indirizzo: il
// giorno che la casella cambia, cambia qui.
// ─────────────────────────────────────────────────────────────────────────────

/** La casella che riceve i certificati medici di tutti i settori. */
export const EMAIL_CERTIFICATI = "certificatimedici@ronchiverdi.it";

/** L'indirizzo come link, per i testi passati con `set:html`. */
export const MAILTO_CERTIFICATI = `<a href="mailto:${EMAIL_CERTIFICATI}">${EMAIL_CERTIFICATI}</a>`;

/** Idoneità non agonistica: solo email, niente cartaceo. Versione con link. */
export const INVIO_NON_AGONISTICO = `Si invia esclusivamente via email, in allegato a ${MAILTO_CERTIFICATI}: il cartaceo non va consegnato.`;

/** Idoneità agonistica: email e, in più, l'originale a mano. Versione con link. */
export const INVIO_AGONISTICO = `Si invia in allegato a ${MAILTO_CERTIFICATI} e in questo caso va consegnato anche l'originale cartaceo al responsabile del settore.`;

/** Le stesse due frasi in solo testo, per le FAQ e i posti senza markup. */
export const INVIO_NON_AGONISTICO_TESTO = `Si invia esclusivamente via email, in allegato a ${EMAIL_CERTIFICATI}: il cartaceo non va consegnato.`;
export const INVIO_AGONISTICO_TESTO = `Si invia in allegato a ${EMAIL_CERTIFICATI} e in questo caso va consegnato anche l'originale cartaceo al responsabile del settore.`;
