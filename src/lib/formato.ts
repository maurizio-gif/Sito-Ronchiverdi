// Formattazione dei prezzi.
//
// Il separatore delle migliaia è messo a mano e non con toLocaleString("it-IT"):
// su un Node compilato senza ICU completa quella chiamata non fallisce, ma
// ignora la lingua e restituisce "1025" invece di "1.025" — un prezzo giusto
// scritto male, che è peggio di un errore, perché non se ne accorge nessuno.
// Verificato: su questa macchina succede davvero.

/** "€ 1.025" — separatore delle migliaia, niente decimali (sono sempre zero). */
export function euro(n: number): string {
	const intero = Math.round(n).toString();
	return `€ ${intero.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}
