// I referenti delle attività: chi risponde, con quali contatti.
//
// Questa è l'unica fonte di verità. Prima gli stessi dati stavano scritti a
// mano dentro leadForm.client.js, che li usa per il pannello finale del form,
// e non esistevano da nessun'altra parte: l'email di conferma non poteva
// citarli, e diceva "ti rispondiamo il prima possibile" anche a chi nel form
// aveva appena letto numero e indirizzo del referente. Ora il pannello e
// l'email leggono la stessa riga, e un numero cambiato si cambia qui.
//
// Il client li riceve come JSON da LeadModal.astro (data-referenti), come già
// accade per leadActivityMap: nessuno dei due li ricopia.

export interface Referente {
	/** Il ruolo, dove il riferimento è una persona ("Responsabile Summer Camp"). */
	titolo?: string;
	nome?: string;
	/**
	 * Il nome del servizio, dove risponde una segreteria e non una persona:
	 * così il pannello non espone un nominativo che cambia con i turni.
	 * Ogni referente ha o `nome` (con `titolo`) o `etichetta`.
	 */
	etichetta?: string;
	telefonoDisplay: string;
	/** In formato +39…, senza spazi: ci si costruiscono tel: e wa.me. */
	telefonoHref: string;
	email?: string;
	/** Mostrato solo dove gli orari sono stati comunicati. */
	orari?: string;
	/** Numero solo per WhatsApp: la chiamata non viene proposta. */
	senzaChiamata?: boolean;
}

/** Young School Tennis: il referente dipende dal settore scelto nel form. */
export const referentiTennis: Record<string, Referente> = {
	scuola: {
		titolo: "Maestro Nazionale FITP",
		nome: "Stefano Bertone",
		telefonoDisplay: "+39 335 320334",
		telefonoHref: "+39335320334",
		email: "s.bertone@ronchiverdi.it",
	},
	competizione: {
		titolo: "Maestro Nazionale FITP",
		nome: "Dario Andrea",
		telefonoDisplay: "+39 335 7032403",
		telefonoHref: "+393357032403",
		email: "a.dario@ronchiverdi.it",
	},
};

/** Corsi Padel: WhatsApp o chiamata, nessuna email per questo percorso. */
export const referentePadel: Referente = {
	titolo: "Istruttore 1° livello Padel FITP",
	nome: "Davide Casale",
	telefonoDisplay: "+39 339 8817507",
	telefonoHref: "+393398817507",
};

/** I percorsi Young senza scelta di settore, per id attività. */
export const referentiYoungDiretto: Record<string, Referente> = {
	"scuola-nuoto": {
		etichetta: "Young School Nuoto",
		telefonoDisplay: "+39 380 7522285",
		telefonoHref: "+393807522285",
		email: "youngschoolnuoto@ronchiverdi.it",
		orari: "Puoi contattarci nei seguenti giorni e orari: dal lunedì al venerdì, 10:00–13:00 e 16:00–18:00.",
	},
	"triathlon-young": {
		titolo: "Responsabile Young School Triathlon",
		nome: "Giorgio Mortara",
		telefonoDisplay: "+39 348 1541597",
		telefonoHref: "+393481541597",
		email: "g.mortara@ronchiverdi.it",
	},
	"summer-camp": {
		titolo: "Responsabile Summer Camp",
		nome: "Silvana D'Auria",
		telefonoDisplay: "+39 349 7026694",
		telefonoHref: "+393497026694",
		email: "kidsvillage@ronchiverdi.it",
		// Per il Summer Camp il numero si usa solo su WhatsApp.
		senzaChiamata: true,
	},
};

/**
 * I form inline delle singole pagine, che non passano dall'alberatura delle
 * attività ma mandano un `origine` (vedi src/pages/api/lead.ts).
 *
 * Chinesis va qui appena arrivano i contatti del referente: finché la voce
 * manca, l'email di conferma resta quella generica. Aggiungerne uno è una
 * riga, e da quel momento l'email lo cita da sola.
 */
export const referentiPerOrigine: Record<string, Referente> = {};

/**
 * Il referente di una richiesta, o null se quel percorso non ne ha uno.
 *
 * Restano senza referente, di proposito, l'Abbonamento Club e il Family: là
 * la richiesta la lavora la segreteria, e mandare le persone da un referente
 * di attività sarebbe mandarle dalla persona sbagliata.
 */
export function referentePerLead(opts: {
	attivita?: string | null;
	settore?: string | null;
	origine?: string | null;
}): Referente | null {
	const { attivita, settore, origine } = opts;

	if (attivita === "corsi-tennis") {
		return (settore && referentiTennis[settore]) || null;
	}
	if (attivita === "corsi-padel") return referentePadel;
	if (attivita && referentiYoungDiretto[attivita]) return referentiYoungDiretto[attivita];
	if (origine && referentiPerOrigine[origine]) return referentiPerOrigine[origine];

	return null;
}

/** Il nome da mostrare: la persona dove c'è, altrimenti il servizio. */
export function nomeReferente(ref: Referente): string {
	return ref.nome ?? ref.etichetta ?? "";
}

/** Come si presenta il riferimento: "Responsabile Summer Camp Silvana D'Auria". */
export function riferimentoCompleto(ref: Referente): string {
	return [ref.titolo, nomeReferente(ref)].filter(Boolean).join(" ");
}

export function linkWhatsApp(ref: Referente): string {
	return `https://wa.me/${ref.telefonoHref.replace("+", "")}`;
}

/** Il pacchetto che LeadModal passa al client: tutto quello che serve al pannello. */
export const referentiPerClient = {
	tennis: referentiTennis,
	padel: referentePadel,
	youngDiretto: referentiYoungDiretto,
};
