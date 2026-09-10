// ─────────────────────────────────────────────────────────────────────────────
// L'area riservata: quello che serve a chi è già socio.
//
// Il sito parla quasi solo a chi non lo è ancora — attività, abbonamenti,
// prenota un tour — e chi il club lo frequenta già cercava le sue quattro
// cose in giro per le pagine: l'App del Club era citata dentro due f.a.q.
// del fitness, Wansport dentro la pagina del padel, il portale InforYou
// sotto ai prezzi dei listini, gli orari nel menu. Nessuna pagina le teneva
// insieme, e da nessun punto del sito si arrivava al proprio account.
//
// `AccountModal` le raccoglie dietro l'omino della barra. Le voci stanno qui
// e non nel markup del pannello perché sono le stesse che vivono già dentro
// le pagine: gli indirizzi si leggono da dove il sito li tiene già —
// `APP_URL` e `WANSPORT_URL` da `data/faq.ts`, la base del portale da
// `lib/portale.ts` — così un indirizzo che cambia cambia in un posto solo e
// il pannello non può raccontare una cosa diversa dalla pagina.
//
// Tre blocchi, perché sono tre gesti diversi: **prenotare** (che qui vuol
// dire aprire un'app), **il proprio account** sul portale, e **iscriversi**
// a un corso. L'ordine segue la frequenza: si prenota ogni settimana, si
// entra nel portale ogni tanto, ci si iscrive una volta a stagione.
// ─────────────────────────────────────────────────────────────────────────────

import { APP_URL, WANSPORT_URL } from "./faq";
import { PORTALE_BASE } from "../lib/portale";
import { url } from "../lib/paths";

/** Una voce del pannello. */
export interface VoceArea {
	label: string;
	/** La riga sotto l'etichetta: dice a cosa serve, non ripete l'etichetta.
	 *  Sta in una riga su un telefono da 390px, quindi resta sotto i ~35
	 *  caratteri: quella che va a capo alza la sua riga e sola fra otto. */
	nota?: string;
	href: string;
	/** Fuori dal sito: apre in una scheda nuova, come ogni link esterno. */
	esterno?: boolean;
	/** Il comando pieno: uno solo per pannello, ed è quello che cerca la
	 *  maggioranza — prenotare un corso dall'app. */
	pieno?: boolean;
}

/** Le pagine di iscrizione ai corsi, in un posto solo.
 *
 *  Le usano il pannello e il footer, che prima ne teneva una lista sua — con
 *  il padel dei ragazzi mancante, perché quella pagina è arrivata dopo che la
 *  lista era stata scritta. È il motivo per cui la lista sta qui: una copia
 *  non si accorge di una pagina nuova. */
export const ISCRIZIONI = [
	{ sport: "Tennis", href: url("/attivita/tennis/iscrizione") },
	{ sport: "Scuola Nuoto", href: url("/attivita/scuola-nuoto/iscrizione") },
	{ sport: "Triathlon", href: url("/attivita/triathlon/iscrizione") },
	{ sport: "Padel Young", href: url("/attivita/padel/iscrizione") },
];

export const BLOCCHI: {
	eyebrow: string;
	/** Voci di una parola e senza nota: stanno in due colonne invece che in
	 *  quattro righe. Con quattro righe intere il pannello superava l'altezza
	 *  dello schermo su una scrivania da 900px e l'ultimo blocco finiva sotto
	 *  il bordo — cioè le iscrizioni si vedevano solo scorrendo un pannello
	 *  che non sembra averne bisogno. */
	compatto?: boolean;
	voci: VoceArea[];
}[] = [
	{
		eyebrow: "Prenota",
		voci: [
			{
				label: "App del Club",
				nota: "I corsi in palinsesto e gli avvisi",
				href: APP_URL,
				esterno: true,
				pieno: true,
			},
			{
				label: "App Wansport",
				nota: "I campi da padel",
				href: WANSPORT_URL,
				esterno: true,
			},
			{
				label: "Orari e planning",
				nota: "Il palinsesto del mese",
				href: url("/planning"),
			},
		],
	},
	{
		eyebrow: "Il tuo account",
		voci: [
			{
				/* Il portale è la porta dell'area personale: da lì si entra, si
				   carica il regolamento firmato, si vedono le rate. Il
				   certificato medico va per email, non qui: vedi
				   src/data/certificatoMedico.ts. L'indirizzo è quello del catalogo del club,
				   che è l'unico che il sito conosce e che il login attraversa:
				   un percorso di login scritto a intuito sarebbe un indirizzo
				   inventato, e un indirizzo inventato non dà errore — porta
				   una persona su una pagina che non c'è. Se il club ci dà il
				   link diretto all'accesso, si aggiunge qui sopra. */
				label: "Portale InforYou",
				nota: "Documenti, iscrizioni, pagamenti",
				href: PORTALE_BASE,
				esterno: true,
			},
			{
				/* Le credenziali non si recuperano da soli: la f.a.q.
				   dell'iscrizione alla scuola nuoto e la nota della pagina del
				   padel dicono entrambe di chiamare la segreteria, che le
				   ritrova. Quindi il comando è il telefono e non una pagina di
				   reset che il portale, per quanto ne sappiamo, non espone. */
				label: "Credenziali smarrite",
				nota: "Chiama la segreteria: 011 6612146",
				href: "tel:+390116612146",
			},
		],
	},
	{
		eyebrow: "Iscrizioni online",
		compatto: true,
		voci: ISCRIZIONI.map((i) => ({ label: i.sport, href: i.href })),
	},
];
