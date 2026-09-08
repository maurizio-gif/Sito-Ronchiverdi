// Contenuti della pagina /lavora-con-noi.
//
// Il club non pubblica posizioni aperte: qui stanno le AREE in cui cerca
// persone di solito, con i ruoli che ciascuna comprende. È un elenco di
// "mansioni possibili", non un annuncio — chi si candida sceglie l'area e
// scrive di sé, e la segreteria legge tutto dal pannello (sezione Curriculum).
//
// Aggiungere un'area: una voce qui, e basta. La chiave finisce su Supabase
// insieme all'etichetta, quindi resta leggibile anche se poi l'elenco cambia:
// per questo una chiave già usata non va riciclata per un'altra cosa — valgono
// anche le aree tolte dall'elenco ("spa-benessere" e "club-house"), che
// restano nelle candidature gia' arrivate.

export interface AreaLavoro {
	/** Chiave salvata su Supabase: stabile, non cambiarla dopo il go-live. */
	chiave: string;
	label: string;
	descrizione: string;
	/** I ruoli tipici dell'area, come li chiamerebbe chi si candida. */
	ruoli: string[];
}

export const AREE: AreaLavoro[] = [
	{
		chiave: "tecnici-sportivi",
		label: "Tecnici e istruttori sportivi",
		descrizione:
			"Chi sta in campo, in vasca e in sala: la parte del club che i soci incontrano ogni giorno.",
		ruoli: [
			"Maestro/a di tennis e padel",
			"Istruttore/istruttrice di nuoto",
			"Assistente bagnanti",
			"Personal trainer",
			"Istruttore/istruttrice di corsi fitness e acqua fitness",
			"Tecnico/a di triathlon e preparazione atletica",
		],
	},
	{
		chiave: "young-school",
		label: "Young School e attività per bambini",
		descrizione:
			"I corsi dei più piccoli e il Summer Camp: servono competenza tecnica e mano ferma con i gruppi.",
		ruoli: [
			"Istruttore/istruttrice Young School",
			"Animatore/animatrice Summer Camp",
			"Assistente allo spogliatoio del Kids Village",
		],
	},
	{
		chiave: "reception-segreteria",
		label: "Reception e segreteria",
		descrizione:
			"Il primo volto del club: accoglienza, iscrizioni, telefono, gestione delle richieste che arrivano dal sito.",
		ruoli: [
			"Addetto/a alla reception",
			"Segreteria corsi e iscrizioni",
			"Back office e amministrazione",
		],
	},
	{
		chiave: "commerciale",
		label: "Commerciale e marketing",
		descrizione:
			"Chi accompagna una persona dalla prima visita all'abbonamento, e chi racconta il club fuori dal club.",
		ruoli: [
			"Consulente commerciale",
			"Fitness manager",
			"Social media e contenuti",
		],
	},
	{
		chiave: "manutenzione",
		label: "Manutenzione e strutture",
		descrizione:
			"Campi, impianti, piscine e verde: 35.000 mq che funzionano solo se qualcuno se ne occupa.",
		ruoli: [
			"Manutentore/manutentrice",
			"Addetto/a al trattamento acque e impianti piscina",
			"Cura dei campi in terra rossa",
			"Addetto/a alle pulizie",
		],
	},
	{
		chiave: "stage",
		label: "Stage e tirocini",
		descrizione:
			"Percorsi per studenti di scienze motorie, fisioterapia, marketing e gestione dello sport.",
		ruoli: ["Tirocinio curricolare", "Stage post diploma o laurea", "Servizio civile"],
	},
	{
		chiave: "altro",
		label: "Un'altra strada",
		descrizione:
			"Non ti riconosci in nessuna delle aree qui sopra ma pensi di poterci servire: raccontacelo.",
		ruoli: ["Candidatura spontanea"],
	},
];

/** Disponibilità dichiarabile nel modulo: una sola scelta, per orientare la lettura. */
export const DISPONIBILITA = [
	"Full time",
	"Part time",
	"Weekend e festivi",
	"Solo stagionale (estate)",
	"A collaborazione / partita IVA",
	"Da valutare insieme",
];

/** I tre motivi che la pagina mette davanti al modulo. Testo del club, non slogan. */
export const MOTIVI = [
	{
		titolo: "Un club, non una palestra",
		testo:
			"Tennis, padel, nuoto, fitness, triathlon e una Young School che segue i ragazzi per anni: chi lavora qui vede crescere le persone, non passare gli abbonamenti.",
	},
	{
		titolo: "Formazione e federazioni",
		testo:
			"Lavoriamo con FITP, FIN, FITRI, FIDAL e CSI. I tecnici si aggiornano, e i percorsi di qualifica si costruiscono dentro il club.",
	},
	{
		titolo: "Squadre stabili",
		testo:
			"Cerchiamo persone da tenere, non stagioni da coprire: la maggior parte dei nostri collaboratori è con noi da anni.",
	},
];
