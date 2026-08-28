// Alberatura delle attività di interesse — primo step del form "Contattaci".
//
// Questa è l'unica fonte di verità: da qui derivano le opzioni mostrate nello
// step 1, le etichette inviate all'app e (in seguito) il ramo di domande che il
// form propone dopo la scelta. Aggiungere un'attività significa aggiungere una
// voce qui, non toccare il markup.
//
// A differenza del form del TC Ambrosiano la scelta è **singola**: l'utente
// indica un solo interesse e il form si ramifica su quello. Chi deve chiedere
// per più persone della propria famiglia sceglie l'opzione "Family", l'unico
// caso in cui una voce sola non basta.

export type LeadAudience = "adulti" | "young" | "misto" | "famiglia";

export interface LeadActivity {
	/** Id stabile: viaggia nei payload, non cambiarlo per motivi di copy. */
	id: string;
	label: string;
	/** Etichetta breve accanto al titolo (es. "Adulti"). */
	badge?: string;
	/** Riga che spiega cosa comprende l'opzione: è ciò che rende leggibile un macro-gruppo. */
	sub: string;
	/**
	 * Attività comprese: elencate sulla card perché si vedano a colpo d'occhio,
	 * e selezionabili come chip facoltativi quando l'opzione viene scelta.
	 */
	includes?: string[];
	/** Serve alle ramificazioni: chi frequenta è un adulto, un ragazzo, o entrambi. */
	audience: LeadAudience;
	icon: string;
}

export interface LeadActivityGroup {
	id: string;
	label: string;
	items: LeadActivity[];
}

const ICON_MEMBERSHIP = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="5" width="19" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 9.5h19" stroke="currentColor" stroke-width="1.5"/><path d="M6 14h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

const ICON_TENNIS = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5"/><path d="M5.6 6.2c2.7 2 3.9 5.9 2.8 9.9M18.4 6.2c-2.7 2-3.9 5.9-2.8 9.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

const ICON_PADEL = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5.5" y="2.5" width="13" height="14" rx="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M12 16.5v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9.5" cy="8" r="1" fill="currentColor"/><circle cx="14.5" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="11.5" r="1" fill="currentColor"/></svg>`;

const ICON_NUOTO = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="7" r="1.8" stroke="currentColor" stroke-width="1.5"/><path d="M4 12.5l4-1.5 4 3 4-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.5 18c2-1.4 3.7-1.4 5.7 0s3.7 1.4 5.7 0 3.7-1.4 5.6 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

const ICON_TRIATHLON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="5.5" cy="16.5" r="3.5" stroke="currentColor" stroke-width="1.5"/><circle cx="18.5" cy="16.5" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 16.5l4-7h5l4 7M9.5 9.5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="5" r="1.6" stroke="currentColor" stroke-width="1.5"/></svg>`;

const ICON_CAMP = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

const ICON_FAMILY = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="7" r="2.8" stroke="currentColor" stroke-width="1.5"/><circle cx="17" cy="8.5" r="2.2" stroke="currentColor" stroke-width="1.5"/><path d="M2.8 19.5c0-2.9 2.3-5.2 5.2-5.2s5.2 2.3 5.2 5.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M15.4 14.6c.5-.2 1-.3 1.6-.3 2.3 0 4.2 1.9 4.2 4.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

export const leadActivityGroups: LeadActivityGroup[] = [
	{
		id: "abbonamento",
		label: "Abbonamento",
		items: [
			{
				id: "club-adulti",
				label: "Abbonamento Club",
				badge: "Adulti",
				sub: "Seleziona questa opzione se ti interessano queste attività:",
				includes: [
					"Gym Floor",
					"Corsi Fitness",
					"Hyrox",
					"Acqua Fitness",
					"Nuoto Libero",
					"Triathlon",
					"Tennis",
					"Padel",
				],
				audience: "adulti",
				icon: ICON_MEMBERSHIP,
			},
			{
				id: "family",
				label: "Abbonamento Family",
				sub: "Vuoi informazioni per più persone della tua famiglia? Partiamo da qui.",
				audience: "famiglia",
				icon: ICON_FAMILY,
			},
		],
	},
	{
		id: "corsi",
		label: "Corsi e scuole",
		items: [
			{
				id: "corsi-tennis",
				label: "Young School Tennis",
				badge: "Bambini",
				sub: "Tennis per bambini e ragazzi, dal primo approccio alla racchetta ai percorsi agonistici.",
				audience: "young",
				icon: ICON_TENNIS,
			},
			{
				id: "scuola-nuoto",
				label: "Young School Nuoto",
				badge: "Bambini",
				sub: "Corsi di nuoto per bambini e ragazzi, dall'ambientamento al perfezionamento.",
				audience: "young",
				icon: ICON_NUOTO,
			},
			{
				id: "triathlon-young",
				label: "Young School Triathlon",
				badge: "Bambini",
				sub: "Nuoto, bici e corsa per bambini e ragazzi dai 6 ai 13 anni.",
				audience: "young",
				icon: ICON_TRIATHLON,
			},
			{
				id: "corsi-padel",
				label: "Corsi Padel",
				sub: "Corsi di gruppo e lezioni individuali, per bambini e per adulti.",
				audience: "misto",
				icon: ICON_PADEL,
			},
			{
				id: "summer-camp",
				label: "Summer Camp",
				sub: "Le settimane estive per bambini e ragazzi: sport, piscina e gioco tutto il giorno.",
				audience: "young",
				icon: ICON_CAMP,
			},
		],
	},
];

/** Tutte le attività in un unico elenco, nell'ordine in cui compaiono a video. */
export const leadActivities: LeadActivity[] = leadActivityGroups.flatMap((g) => g.items);

/**
 * Mappa id → { label, audience } passata al client come JSON: serve a comporre
 * il riepilogo e il payload senza duplicare i testi nello script.
 */
export const leadActivityMap = Object.fromEntries(
	leadActivities.map((a) => [a.id, { label: a.label, audience: a.audience }])
);
