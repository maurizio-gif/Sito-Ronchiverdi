// I quattro corsi della Young School Nuoto, con il loro listino.
//
// Sorgente unica: la usano la pagina della scuola nuoto (le card dei corsi),
// l'hub delle modalità di iscrizione e le quattro pagine di iscrizione, una
// per corso. Prima gli stessi testi stavano dentro scuola-nuoto.astro e i
// prezzi da nessuna parte.
//
// ── I prezzi ──────────────────────────────────────────────────────────────
// Sono ricopiati dal negozio InforYou (categoria 2 non soci, categoria 10
// soci) e vanno aggiornati a mano quando il club cambia il listino: il
// portale non espone i prodotti in una forma che il sito possa leggere da sé.
// `listinoAggiornatoAl` compare in fondo alla tabella, così chi guarda vede
// di quando è il dato — un prezzo vecchio senza data è peggio di nessun
// prezzo.
//
// ── I link ────────────────────────────────────────────────────────────────
// Si può portare solo alla categoria, non alla singola riga: l'indirizzo del
// prodotto (/store/2/product/201) esiste mentre si naviga dentro InforYou, ma
// aperto da fuori ignora l'id e mostra sempre il primo prodotto della
// categoria — verificato su più prodotti. Se TeamSystem darà un indirizzo
// diretto per prodotto, basterà aggiungerlo qui accanto al prezzo.

export const STORE_NON_SOCI = "https://inforyou.teamsystem.com/ronchiverdi/store/2/category/2";
export const STORE_SOCI = "https://inforyou.teamsystem.com/ronchiverdi/store/2/category/10";

export const listinoAggiornatoAl = "settembre 2026";

export interface RigaListino {
	/** Come la chiama il club sul portale: "Quadrimestrale", "Stagionale". */
	formula: string;
	/** Il periodo coperto, come sta sul listino. */
	periodo: string;
	/** Note che distinguono due righe altrimenti uguali (es. le frequenze). */
	dettaglio?: string;
	prezzoNonSoci: number;
	prezzoSoci: number;
}

export interface CorsoNuoto {
	/** Ultimo pezzo dell'indirizzo: /attivita/scuola-nuoto/iscrizione/<slug> */
	slug: string;
	title: string;
	/** Titolo esteso, dove serve il nome per intero. */
	titleLungo?: string;
	ageLabel: string;
	percorso: string;
	obiettivi: string[];
	durata: string;
	vasca: string;
	image: string;
	imageAlt: string;
	listino: RigaListino[];
}

export const corsiNuoto: CorsoNuoto[] = [
	{
		slug: "acquaticita",
		title: "Acquaticità",
		titleLungo: "Acquaticità Neonatale e Avanzata",
		ageLabel: "3–18 mesi · 19–36 mesi",
		percorso:
			"Percorso in acqua accompagnato da un genitore, che entra in vasca insieme al bambino: è l'unico corso in cui è previsto.",
		obiettivi: [
			"Sviluppo psicomotorio precoce",
			"Ambientamento acquatico",
			"Gestione della respirazione e del galleggiamento",
		],
		durata: "40 minuti",
		vasca: "Vasca di ambientamento · 32°C",
		image: "images/activities/acquaticita-baby.jpg",
		imageAlt: "Bambino in vasca con un genitore durante il corso di acquaticità a Ronchiverdi",
		listino: [
			{ formula: "Quadrimestrale", periodo: "21 settembre – 31 gennaio", prezzoNonSoci: 415, prezzoSoci: 365 },
			{ formula: "Stagionale", periodo: "21 settembre – 5 giugno", prezzoNonSoci: 600, prezzoSoci: 550 },
		],
	},
	{
		slug: "baby",
		title: "Baby",
		ageLabel: "3–5 anni",
		percorso:
			"Corsi mirati all'autonomia acquatica e alla scoperta ludica dei movimenti base, per introdurre in forma ludica i primi elementi dei quattro stili.",
		obiettivi: [
			"Autonomia acquatica",
			"Scoperta ludica dei movimenti base",
			"Primi elementi dei quattro stili",
		],
		durata: "40 minuti",
		vasca: "Vasca di ambientamento · 32°C",
		image: "images/activities/scuola-nuoto-young.jpg",
		imageAlt: "Bambini del corso Baby in vasca con l'istruttrice a Ronchiverdi",
		listino: [
			{ formula: "Quadrimestrale", periodo: "21 settembre – 31 gennaio", prezzoNonSoci: 420, prezzoSoci: 370 },
			{ formula: "Stagionale", periodo: "21 settembre – 5 giugno", prezzoNonSoci: 610, prezzoSoci: 560 },
		],
	},
	{
		slug: "open",
		title: "Open",
		ageLabel: "6–8 anni",
		percorso:
			"Corsi strutturati in livelli (1 e 2) per consolidare le capacità natatorie e proseguire nell'apprendimento tecnico dei quattro stili.",
		obiettivi: [
			"Livello 1 e Livello 2",
			"Consolidamento delle capacità natatorie",
			"Apprendimento tecnico dei quattro stili",
		],
		durata: "40 minuti",
		vasca: "Vasca grande 25 m · 28°C",
		image: "images/activities/nuoto-open.jpg",
		imageAlt: "Bambini del corso Open con la tavoletta nella vasca grande di Ronchiverdi",
		listino: [
			{ formula: "Quadrimestrale", periodo: "21 settembre – 31 gennaio", prezzoNonSoci: 415, prezzoSoci: 365 },
			{ formula: "Stagionale", periodo: "21 settembre – 5 giugno", prezzoNonSoci: 600, prezzoSoci: 550 },
		],
	},
	{
		slug: "propaganda",
		title: "Propaganda",
		ageLabel: "9–14 anni",
		percorso:
			"Corso avanzato con obiettivi tecnici specifici, per chi vuole affinare la tecnica e avvicinarsi al mondo agonistico.",
		obiettivi: [
			"Perfezionamento dei quattro stili",
			"Esercitazioni su partenze e tecniche di gara",
			"Introduzione alla preparazione pre-agonistica",
		],
		durata: "60 minuti",
		vasca: "Vasca grande 25 m · 28°C",
		image: "images/activities/nuoto-propaganda.jpg",
		imageAlt: "Ragazzi del corso Propaganda in allenamento nella vasca grande di Ronchiverdi",
		listino: [
			{
				formula: "Quadrimestrale",
				periodo: "21 settembre – 31 gennaio",
				dettaglio: "1 lezione a settimana",
				prezzoNonSoci: 490,
				prezzoSoci: 440,
			},
			{
				formula: "Stagionale",
				periodo: "21 settembre – 5 giugno",
				dettaglio: "1 lezione a settimana",
				prezzoNonSoci: 705,
				prezzoSoci: 655,
			},
			{
				formula: "Quadrimestrale",
				periodo: "21 settembre – 31 gennaio",
				dettaglio: "2 lezioni a settimana",
				prezzoNonSoci: 690,
				prezzoSoci: 640,
			},
			{
				formula: "Stagionale",
				periodo: "21 settembre – 5 giugno",
				dettaglio: "2 lezioni a settimana",
				prezzoNonSoci: 890,
				prezzoSoci: 840,
			},
		],
	},
];

export function corsoDaSlug(slug: string): CorsoNuoto | undefined {
	return corsiNuoto.find((c) => c.slug === slug);
}

/** Il prezzo più basso del corso: serve alle card, per dire "da €365". */
export function prezzoDa(corso: CorsoNuoto): number {
	return Math.min(...corso.listino.map((r) => r.prezzoSoci));
}

/** "€ 415" — senza decimali, che nel listino sono sempre zero. */
export function euro(n: number): string {
	return `€ ${n.toLocaleString("it-IT")}`;
}
