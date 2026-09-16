// Ponte per uscire dalla PWA del CRM.
//
// Il CRM (crm.ronchiverdi.it) è installabile come app a schermo intero
// (display: 'standalone' nel suo manifest): un link `target="_blank"` verso
// una pagina dello stesso dominio, cliccato da dentro l'app installata,
// riapre l'app invece di una scheda del browser — è così che iOS/Chrome
// trattano la navigazione dentro lo `scope` di una PWA.
//
// Questo endpoint sta su un dominio diverso (ronchiverdi.it), quindi non
// rientra in quello scope: il sistema apre il browser vero per seguirlo, e
// da lì il redirect riporta sulla pagina del CRM voluta — che così si apre
// davvero in una scheda, non nell'app.
//
// Il parametro `to` è ristretto a un solo percorso possibile — la scheda di
// una persona, con un id fatto solo di quello che un uuid può contenere —
// apposta per non diventare un redirect aperto verso un indirizzo a piacere.

export const prerender = false;

const PERCORSO_CONSENTITO = /^\/dashboard\/persone\/[0-9a-f-]{36}$/i;
const CRM_ORIGIN = "https://crm.ronchiverdi.it";

export async function GET({ request }: { request: Request }) {
	const url = new URL(request.url);
	const to = url.searchParams.get("to") ?? "";

	const destinazione = PERCORSO_CONSENTITO.test(to) ? to : "/dashboard";

	return Response.redirect(`${CRM_ORIGIN}${destinazione}`, 302);
}
