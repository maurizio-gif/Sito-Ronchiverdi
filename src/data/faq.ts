import { url } from "../lib/paths";

// ─────────────────────────────────────────────────────────────────────────────
// Le domande frequenti del club, in un posto solo.
//
// Erano nate dentro le singole pagine, una lista per pagina. Tenendole qui
// succedono tre cose: la stessa risposta può comparire su più pagine senza
// essere riscritta, ogni pagina che le mostra pubblica in automatico lo
// structured data FAQPage (vedi Faq.astro), e /faq può raccoglierle tutte in
// una pagina sola — la knowledge base che oggi manca e che manda in reception
// chi cerca una risposta.
//
// Per aggiungere una domanda: un oggetto in `faq` con `pagina` valorizzata a
// una delle chiavi di PAGINE. Comparirà da sola sulla pagina indicata e nella
// wiki. Per mostrarla su più pagine, usa `anche` con le altre chiavi.
// ─────────────────────────────────────────────────────────────────────────────

/** Link per scaricare l'App del Club (prenotazione corsi, avvisi). */
export const APP_URL = "https://onelink.to/tqhpzr";
/** Link per scaricare Wansport, l'app con cui si prenotano i campi da padel. */
export const WANSPORT_URL = "https://wansport.com/scarica-la-nuova-app/?venue=2xia7hbqfbsgal19mxe0h8w7";

/** Chiusure della Scuola Nuoto: citate nella FAQ dedicata e nella pagina. */
export const sospensioni = [
	{ nome: "Ponte dell'Immacolata", periodo: "da lunedì 7 a martedì 8 dicembre 2026" },
	{ nome: "Vacanze di Natale", periodo: "da mercoledì 23 dicembre 2026 a mercoledì 6 gennaio 2027" },
	{ nome: "Vacanze di Carnevale", periodo: "da sabato 6 a mercoledì 10 febbraio 2027" },
	{ nome: "Vacanze di Pasqua", periodo: "da giovedì 25 a martedì 30 marzo 2027" },
	{ nome: "Festa dei Lavoratori", periodo: "sabato 1° maggio 2027" },
	{ nome: "Festa della Repubblica", periodo: "mercoledì 2 giugno 2027" },
];

/** Le pagine che ospitano delle FAQ, con l'area in cui la wiki le raggruppa. */
export const PAGINE = {
	"abbonamenti": { label: "Abbonamenti", href: "/abbonamenti", area: "Abbonamenti e orari" },
	"planning": { label: "Planning", href: "/planning", area: "Abbonamenti e orari" },
	"tennis": { label: "Tennis", href: "/attivita/tennis", area: "Tennis" },
	"tennis-iscrizione": { label: "Iscrizione Tennis", href: "/attivita/tennis/iscrizione", area: "Tennis" },
	"padel": { label: "Padel", href: "/attivita/padel", area: "Padel" },
	"nuoto-libero": { label: "Nuoto libero", href: "/attivita/nuoto-libero", area: "Nuoto e piscine" },
	"scuola-nuoto": { label: "Scuola Nuoto", href: "/attivita/scuola-nuoto", area: "Nuoto e piscine" },
	"scuola-nuoto-iscrizione": { label: "Iscrizione Scuola Nuoto", href: "/attivita/scuola-nuoto/iscrizione", area: "Nuoto e piscine" },
	"acqua-fitness": { label: "Acqua Fitness", href: "/attivita/acqua-fitness", area: "Nuoto e piscine" },
	"piscina-esterna": { label: "Piscina estiva", href: "/servizi/piscina-esterna", area: "Nuoto e piscine" },
	"gym-floor": { label: "Gym Floor", href: "/attivita/gym-floor", area: "Fitness e Hyrox" },
	"corsi-fitness": { label: "Corsi Fitness", href: "/attivita/corsi-fitness", area: "Fitness e Hyrox" },
	"hyrox": { label: "Hyrox", href: "/hyrox", area: "Fitness e Hyrox" },
	"triathlon": { label: "Triathlon", href: "/attivita/triathlon", area: "Triathlon" },
	"triathlon-iscrizione": { label: "Iscrizione Triathlon", href: "/attivita/triathlon/iscrizione", area: "Triathlon" },
	"summer-camp": { label: "Summer Camp", href: "/attivita/summer-camp", area: "Young School" },
	"spa": { label: "Spa", href: "/servizi/spa", area: "Spa e benessere" },
	"chinesis": { label: "Chinesis", href: "/servizi/chinesis", area: "Spa e benessere" },
} as const;

export type ChiavePagina = keyof typeof PAGINE;

/** Ordine delle aree nella wiki: segue il percorso di chi cerca, non l'alfabeto. */
export const AREE = [
	"Abbonamenti e orari",
	"Tennis",
	"Padel",
	"Nuoto e piscine",
	"Fitness e Hyrox",
	"Triathlon",
	"Young School",
	"Spa e benessere",
] as const;

export type Area = (typeof AREE)[number];

export interface FaqItem {
	/** Ancora stabile: /faq#<id> deve continuare a funzionare nel tempo. */
	id: string;
	/** Pagina "di casa" della domanda. */
	pagina: ChiavePagina;
	/** Altre pagine su cui mostrarla, se la stessa risposta serve più volte. */
	anche?: ChiavePagina[];
	q: string;
	/** Risposta in testo semplice. */
	a?: string;
	/** Risposta con markup, quando servono link o elenchi. */
	html?: string;
}

export const faq: FaqItem[] = [

	// ── Abbonamenti ─────────────────────────────────────────────────────────
	{
		id: "abbonamenti-il-prezzo-mostrato-e-mensile",
		pagina: "abbonamenti",
		q: "Il prezzo mostrato è mensile?",
		a: "Sì, il prezzo indicato è relativo alla rata mensile di un abbonamento annuale. Per maggiori info sulle modalità di pagamento, prenota un tour o contatta la reception."
	},
	{
		id: "abbonamenti-cosa-include-l-abbonamento-swim",
		pagina: "abbonamenti",
		q: "Cosa include l'abbonamento Swim?",
		a: "L'abbonamento Swim ha una durata di 11 mesi (agosto escluso) e include l'accesso a nuoto libero e acqua fitness, ma non alla piscina estiva né alle altre aree del club."
	},
	{
		id: "abbonamenti-posso-passare-da-un-abbonamento-all-altro",
		pagina: "abbonamenti",
		q: "Posso passare da un abbonamento all'altro?",
		a: "Sì, è possibile aggiornare il proprio abbonamento in corso d'anno. Vieni in reception o contattaci per valutare insieme la formula più adatta."
	},

	// ── Planning ─────────────────────────────────────────────────────────
	{
		id: "planning-devo-prenotare-per-partecipare-a-un-corso",
		pagina: "planning",
		q: "Devo prenotare per partecipare a un corso?",
		a: "Dipende dall'attività: per il nuoto libero non serve prenotare, mentre per i corsi in sala o in acqua ti consigliamo di verificare gli orari e contattarci in caso di dubbi."
	},
	{
		id: "planning-gli-orari-mostrati-sono-sempre-aggiornati",
		pagina: "planning",
		q: "Gli orari mostrati sono sempre aggiornati?",
		a: "I palinsesti Corsi Fitness e Acqua Fitness e gli orari Gym Floor sono aggiornati; il planning del Nuoto Libero è al momento una bozza in fase di aggiornamento."
	},
	{
		id: "planning-cosa-succede-se-un-corso-non-e-disponibile-nella-fascia-che-mi-interes",
		pagina: "planning",
		q: "Cosa succede se un corso non è disponibile nella fascia che mi interessa?",
		a: "Contattaci: ti aiutiamo a trovare l'alternativa più vicina ai tuoi orari tra le diverse discipline del club."
	},

	// ── Tennis ─────────────────────────────────────────────────────────
	{
		id: "tennis-e-possibile-effettuare-una-lezione-di-prova",
		pagina: "tennis",
		q: "È possibile effettuare una lezione di prova?",
		a: "Sì. È possibile effettuare una lezione di prova gratuita, su appuntamento e in base alla disponibilità dei corsi, dal lunedì al venerdì. Le prove non sono disponibili durante il weekend. Per richiedere la prova è necessario compilare il form presente in questa pagina."
	},
	{
		id: "tennis-come-vengono-formati-i-gruppi",
		pagina: "tennis",
		q: "Come vengono formati i gruppi?",
		a: "I gruppi vengono organizzati in base all'età e al livello di gioco degli allievi."
	},
	{
		id: "tennis-e-necessario-possedere-tutta-l-attrezzatura-fin-da-subito",
		pagina: "tennis",
		q: "È necessario possedere tutta l'attrezzatura fin da subito?",
		a: "Per iniziare è sufficiente indossare un abbigliamento sportivo adeguato. Nella fase iniziale la racchetta può essere fornita da Ronchiverdi."
	},
	{
		id: "tennis-cosa-succede-se-mio-figlio-salta-un-allenamento",
		pagina: "tennis",
		q: "Cosa succede se mio figlio salta un allenamento?",
		a: "I recuperi sono garantiti esclusivamente in caso di giornate annullate per maltempo o per cause imputabili all'organizzazione."
	},
	{
		id: "tennis-durante-l-anno-vengono-organizzati-eventi-o-gare",
		pagina: "tennis",
		q: "Durante l'anno vengono organizzati eventi o gare?",
		a: "Sì. Durante la stagione Ronchiverdi organizza tornei interni, eventi, stage e momenti di aggregazione dedicati agli allievi."
	},
	{
		id: "tennis-la-preparazione-atletica-e-inclusa",
		pagina: "tennis",
		q: "La preparazione atletica è inclusa?",
		a: "Sì, la preparazione atletica è inclusa per tutti i livelli, ad eccezione del livello Red."
	},
	{
		id: "tennis-e-necessario-il-tesseramento",
		pagina: "tennis",
		q: "È necessario il tesseramento?",
		a: "Sì. Nell'iscrizione è incluso il tesseramento FITP non agonistico."
	},
	{
		id: "tennis-e-richiesto-il-certificato-medico",
		pagina: "tennis",
		q: "È richiesto il certificato medico?",
		a: "Sì. È necessario presentare il certificato medico di idoneità all'attività non agonistica. Per gli allievi in possesso della tessera atleta è richiesto il certificato medico di idoneità all'attività agonistica."
	},

	// ── Iscrizione Tennis ─────────────────────────────────────────────────────────
	{
		id: "tennis-iscrizione-da-dove-parto-se-non-ho-mai-giocato-a-tennis",
		pagina: "tennis-iscrizione",
		q: "Da dove parto se non ho mai giocato a tennis?",
		a: "Richiedi una lezione di prova: per i bambini si individua il gruppo Young School adatto all'età e al livello, per gli adulti si valuta se un corso collettivo o una lezione individuale è la scelta più adatta."
	},
	{
		id: "tennis-iscrizione-la-lezione-di-prova-e-sempre-gratuita",
		pagina: "tennis-iscrizione",
		q: "La lezione di prova è sempre gratuita?",
		a: "Sì, per Young School e per adulti: è su appuntamento, in base alla disponibilità dei corsi, dal lunedì al venerdì (non disponibile nel weekend)."
	},
	{
		id: "tennis-iscrizione-cosa-serve-il-primo-giorno",
		pagina: "tennis-iscrizione",
		q: "Cosa serve il primo giorno?",
		a: "Abbigliamento sportivo adeguato: la racchetta, nella fase iniziale della Young School, può essere fornita da Ronchiverdi. Certificato medico e tesseramento FITP vanno perfezionati in reception prima dell'inizio dei corsi."
	},

	// ── Padel ─────────────────────────────────────────────────────────
	{
		id: "padel-e-possibile-prenotare-un-campo-anche-senza-essere-soci",
		pagina: "padel",
		q: "È possibile prenotare un campo anche senza essere soci?",
		a: "Sì. I campi da padel possono essere prenotati anche da utenti esterni. Non è necessario sottoscrivere alcuna tessera di iscrizione."
	},
	{
		id: "padel-e-possibile-noleggiare-una-racchetta",
		pagina: "padel",
		q: "È possibile noleggiare una racchetta?",
		a: "Sì. Chi non dispone di una racchetta può noleggiarla direttamente presso il Club al costo di 4 euro."
	},
	{
		id: "padel-sono-disponibili-corsi-di-gruppo",
		pagina: "padel",
		q: "Sono disponibili corsi di gruppo?",
		a: "Sì. È possibile organizzare lezioni di gruppo per 2, 3 o 4 persone, in base al livello e alle disponibilità dei maestri."
	},
	{
		id: "padel-e-possibile-prenotare-lezioni-private",
		pagina: "padel",
		q: "È possibile prenotare lezioni private?",
		a: "Sì. Le lezioni individuali possono essere concordate contattando direttamente il maestro."
	},
	{
		id: "padel-come-si-prenotano-i-campi",
		pagina: "padel",
		q: "Come si prenotano i campi?",
		html: `<p>I campi si prenotano tramite l'<strong>App Wansport</strong>, dalla quale è possibile verificare giorni, orari e disponibilità. Puoi <a href="${WANSPORT_URL}" target="_blank" rel="noopener">scaricare l'app qui</a>.</p>`
	},
	{
		id: "padel-e-disponibile-uno-spogliatoio-dedicato",
		pagina: "padel",
		q: "È disponibile uno spogliatoio dedicato?",
		a: "Sì. È presente uno spogliatoio dedicato agli utenti di tennis e padel."
	},
	{
		id: "padel-esistono-gruppi-o-chat-per-trovare-altri-giocatori",
		pagina: "padel",
		q: "Esistono gruppi o chat per trovare altri giocatori?",
		a: "Sì. Sono disponibili chat dedicate, organizzate in base al livello di gioco, per facilitare la ricerca di compagni e l'organizzazione delle partite."
	},
	{
		id: "padel-sono-disponibili-pacchetti-di-lezioni-o-di-utilizzo-dei-campi",
		pagina: "padel",
		q: "Sono disponibili pacchetti di lezioni o di utilizzo dei campi?",
		a: "Sì. Sono disponibili pacchetti dedicati alle lezioni e all'utilizzo dei campi, acquistabili tramite il maestro oppure presso la Reception."
	},
	{
		id: "padel-quali-sono-gli-orari-di-utilizzo-dei-campi",
		pagina: "padel",
		q: "Quali sono gli orari di utilizzo dei campi?",
		html: "<p>I campi da tennis e padel sono disponibili dal <strong>lunedì al venerdì dalle 08:00 alle 23:00</strong> e il <strong>sabato, domenica e nei giorni festivi dalle 09:00 alle 20:00</strong>. Eventuali variazioni vengono comunicate attraverso i canali ufficiali del Club.</p>"
	},

	// ── Nuoto libero ─────────────────────────────────────────────────────────
	{
		id: "nuoto-libero-serve-prenotare-per-il-nuoto-libero",
		pagina: "nuoto-libero",
		q: "Serve prenotare per il nuoto libero?",
		a: "No, nessuna prenotazione: il nuoto libero è incluso nel tuo abbonamento e ti aspetta durante tutti gli orari di apertura del club, ogni giorno della settimana."
	},
	{
		id: "nuoto-libero-e-garantita-sempre-una-corsia",
		pagina: "nuoto-libero",
		q: "È garantita sempre una corsia?",
		a: "Sì. Se hai un abbonamento attivo, una corsia libera per il nuoto è sempre garantita, senza eccezioni — al massimo condivisa con qualche altro socio, mai negata."
	},
	{
		id: "nuoto-libero-il-nuoto-libero-e-disponibile-anche-d-estate",
		pagina: "nuoto-libero",
		q: "Il nuoto libero è disponibile anche d'estate?",
		a: "Sì, da giugno ad agosto la vasca esterna si aggiunge a quella interna. L'accesso alla piscina esterna è riservato agli abbonamenti Gold e Silver (non incluso nell'abbonamento Swim)."
	},

	// ── Scuola Nuoto ─────────────────────────────────────────────────────────
	{
		id: "scuola-nuoto-come-posso-iscrivere-mio-figlio",
		pagina: "scuola-nuoto",
		q: "Come posso iscrivere mio figlio?",
		html: `<p>Le iscrizioni ai corsi della Young School Nuoto Ronchiverdi si effettuano esclusivamente online attraverso il nostro sito. Dal sito è possibile consultare le disponibilità, scegliere il corso più adatto e completare la procedura di iscrizione. Trovi tutti i passaggi nella pagina <a href="${url("/attivita/scuola-nuoto/iscrizione")}">modalità di iscrizione</a>.</p>`
	},
	{
		id: "scuola-nuoto-quanto-durano-le-lezioni",
		pagina: "scuola-nuoto",
		q: "Quanto durano le lezioni?",
		a: "Le lezioni di Acquaticità, Baby e Open durano 40 minuti. Le lezioni del corso Propaganda durano 60 minuti."
	},
	{
		id: "scuola-nuoto-e-possibile-fare-una-prova-gratuita",
		pagina: "scuola-nuoto",
		q: "È possibile fare una prova gratuita?",
		html: `<p>Sì, è possibile effettuare una prova gratuita, previa disponibilità dei posti e organizzazione con la scuola nuoto. <button type="button" class="faq-inline-btn" data-open-contact data-interest="scuola-nuoto">Scrivici per prenotarla</button>.</p>`
	},
	{
		id: "scuola-nuoto-i-corsi-sono-divisi-per-eta-e-livello",
		pagina: "scuola-nuoto",
		q: "I corsi sono divisi per età e livello?",
		a: "Sì. I gruppi vengono organizzati tenendo conto sia dell'età sia del livello dei bambini, per rendere il percorso più omogeneo, sicuro ed efficace."
	},
	{
		id: "scuola-nuoto-dove-si-svolgono-i-corsi",
		pagina: "scuola-nuoto",
		q: "Dove si svolgono i corsi?",
		a: "Il corso di Acquaticità si svolge nella vasca di ambientamento, con acqua a circa 32°C. Il corso Baby si svolge sia nella vasca di ambientamento sia nella vasca grande da 25 metri, con acqua a circa 28°C. I corsi Open e Propaganda si svolgono nella vasca grande."
	},
	{
		id: "scuola-nuoto-cosa-devo-portare-per-mio-figlio-a-per-svolgere-la-lezione-di-nuoto",
		pagina: "scuola-nuoto",
		q: "Cosa devo portare per mio figlio/a per svolgere la lezione di nuoto?",
		html: `<p>Per i corsi Baby, Open e Propaganda sono necessari cuffia, costume, accappatoio e ciabatte; gli occhialini sono facoltativi per i bambini più piccoli.</p><p>Per il corso di Acquaticità neonatale, dai 3 ai 36 mesi, sono obbligatori il pannolino swimming e il costume contenitivo.</p>`
	},
	{
		id: "scuola-nuoto-il-corso-di-acquaticita-prevede-l-ingresso-in-acqua-con-il-proprio-fig",
		pagina: "scuola-nuoto",
		q: "Il corso di acquaticità prevede l'ingresso in acqua con il proprio figlio/a?",
		a: "Sì. Solo per il corso di acquaticità è previsto l'ingresso in acqua insieme al bambino."
	},
	{
		id: "scuola-nuoto-i-genitori-possono-assistere-alla-lezione",
		pagina: "scuola-nuoto",
		q: "I genitori possono assistere alla lezione?",
		a: "Sì. I genitori possono seguire la lezione dall'esterno, dal gazebo dedicato. Per motivi organizzativi e di sicurezza non è previsto l'accesso al bordo vasca."
	},
	{
		id: "scuola-nuoto-i-genitori-possono-entrare-negli-spogliatoi",
		pagina: "scuola-nuoto",
		q: "I genitori possono entrare negli spogliatoi?",
		a: "No. Ronchiverdi offre un servizio di assistenza spogliatoio: il nostro personale si occupa dei bambini sia all'arrivo sia al termine della lezione, accompagnandoli nelle operazioni di cambio."
	},
	{
		id: "scuola-nuoto-e-obbligatorio-il-certificato-medico",
		pagina: "scuola-nuoto",
		q: "È obbligatorio il certificato medico?",
		a: "Il certificato medico è obbligatorio per i bambini sopra i 6 anni."
	},
	{
		id: "scuola-nuoto-e-possibile-recuperare-le-lezioni-perse",
		pagina: "scuola-nuoto",
		q: "È possibile recuperare le lezioni perse?",
		html: `<p>Sì. I recuperi vanno concordati direttamente con la scuola nuoto e sono soggetti alla disponibilità dei gruppi. Sono previsti fino a 2 recuperi per i corsi quadrimestrali e fino a 4 recuperi per i corsi stagionali. <button type="button" class="faq-inline-btn" data-open-contact data-interest="scuola-nuoto">Contattaci per concordare il recupero</button>.</p>`
	},
	{
		id: "scuola-nuoto-e-disponibile-un-parcheggio",
		pagina: "scuola-nuoto",
		q: "È disponibile un parcheggio?",
		a: "Sì. Ronchiverdi dispone di un parcheggio gratuito a disposizione delle famiglie."
	},
	{
		id: "scuola-nuoto-a-che-ora-bisogna-arrivare-in-piscina",
		pagina: "scuola-nuoto",
		q: "A che ora bisogna arrivare in piscina?",
		a: "Si raccomanda di arrivare negli spogliatoi sempre con 20 minuti di anticipo rispetto all'orario di inizio della lezione, non solo il primo giorno di corso."
	},
	{
		id: "scuola-nuoto-festivita-e-sospensioni",
		pagina: "scuola-nuoto",
		q: "Festività e sospensioni",
		html: `<ul class="faq-sospensioni">${sospensioni.map((s) => `<li><strong>${s.nome}:</strong> ${s.periodo}</li>`).join("")}</ul>`
	},
	{
		id: "scuola-nuoto-come-posso-ricevere-maggiori-informazioni",
		pagina: "scuola-nuoto",
		q: "Come posso ricevere maggiori informazioni?",
		html: `<p>Per informazioni su corsi, orari, disponibilità, prove gratuite, recuperi e modalità di iscrizione <button type="button" class="faq-inline-btn" data-open-contact data-interest="scuola-nuoto">compila il form di contatto</button>: ti risponde lo staff della Young School Nuoto.</p>`
	},

	// ── Iscrizione Scuola Nuoto ─────────────────────────────────────────────────────────
	{
		id: "scuola-nuoto-iscrizione-ho-perso-le-credenziali-del-portale-cosa-faccio",
		pagina: "scuola-nuoto-iscrizione",
		q: "Ho perso le credenziali del portale, cosa faccio?",
		a: "Contatta la segreteria allo 011 6612146: se il bambino ha già ricevuto in passato le credenziali, te le recuperiamo noi."
	},
	{
		id: "scuola-nuoto-iscrizione-cosa-succede-se-non-completo-il-pagamento",
		pagina: "scuola-nuoto-iscrizione",
		q: "Cosa succede se non completo il pagamento?",
		a: "In assenza di regolare pagamento non sarà possibile partecipare alle lezioni."
	},
	{
		id: "scuola-nuoto-iscrizione-il-braccialetto-badge-e-obbligatorio",
		pagina: "scuola-nuoto-iscrizione",
		q: "Il braccialetto badge è obbligatorio?",
		a: "Sì, va indossato sempre, sin dalla prima lezione. Se lo possiedi già da corsi precedenti va vidimato in reception; altrimenti si acquista al costo di 10,00 €."
	},

	// ── Acqua Fitness ─────────────────────────────────────────────────────────
	{
		id: "acqua-fitness-in-quale-piscina-si-svolgono-i-corsi",
		pagina: "acqua-fitness",
		q: "In quale piscina si svolgono i corsi?",
		a: "Sempre in vasca grande: in piscina interna da autunno a fine maggio, in piscina esterna da giugno ad agosto."
	},
	{
		id: "acqua-fitness-posso-partecipare-ai-corsi-estivi-in-piscina-esterna",
		pagina: "acqua-fitness",
		q: "Posso partecipare ai corsi estivi in piscina esterna?",
		a: "L'accesso alla piscina esterna, e quindi ai corsi estivi, è riservato agli abbonamenti Gold e Silver (non incluso nell'abbonamento Swim)."
	},
	{
		id: "acqua-fitness-i-corsi-sono-adatti-anche-ai-principianti",
		pagina: "acqua-fitness",
		q: "I corsi sono adatti anche ai principianti?",
		a: "Sì, i corsi sono adatti a tutti i livelli: gli istruttori propongono sempre varianti su misura per ogni partecipante."
	},

	// ── Piscina estiva ─────────────────────────────────────────────────────────
	{
		id: "piscina-esterna-chi-puo-accedere-alla-piscina-esterna",
		pagina: "piscina-esterna",
		q: "Chi può accedere alla piscina esterna?",
		a: "L'accesso è riservato agli abbonati Gold e Silver (non incluso nell'abbonamento Swim), e si entra passando il badge personale ai tornelli d'ingresso: senza badge non è possibile accedere all'area piscina."
	},
	{
		id: "piscina-esterna-in-che-periodo-dell-anno-e-aperta",
		pagina: "piscina-esterna",
		q: "In che periodo dell'anno è aperta?",
		a: "La piscina esterna è aperta indicativamente dai primi giorni di giugno al 15 settembre, compatibilmente con le condizioni meteorologiche."
	},
	{
		id: "piscina-esterna-cosa-posso-fare-oltre-a-nuotare",
		pagina: "piscina-esterna",
		q: "Cosa posso fare oltre a nuotare?",
		a: "Oltre al nuoto libero e ai corsi in acqua, trovi lettini, ombrelloni e un ampio solarium per rilassarti all'aria aperta."
	},

	// ── Gym Floor ─────────────────────────────────────────────────────────
	{
		id: "gym-floor-quali-sono-gli-orari-di-apertura-della-palestra",
		pagina: "gym-floor",
		q: "Quali sono gli orari di apertura della palestra?",
		a: "La sala fitness è aperta dal lunedì al venerdì dalle 7:00 alle 22:00, il sabato, la domenica e i festivi dalle 9:00 alle 20:00. Eventuali variazioni vengono comunicate tramite l'App del Club, che è il canale ufficiale per tutti gli aggiornamenti."
	},
	{
		id: "gym-floor-cosa-serve-per-accedere-alla-sala-fitness",
		pagina: "gym-floor",
		q: "Cosa serve per accedere alla sala fitness?",
		a: "Per accedere alla palestra servono un abbonamento attivo, un certificato medico in corso di validità e il proprio braccialetto personale per l'ingresso. In sala pesi sono obbligatorie calzature sportive pulite, dedicate all'uso in palestra, e l'asciugamano personale da appoggiare sulle panche e sugli attrezzi: se lo dimentichi, puoi noleggiarlo in reception."
	},
	{
		id: "gym-floor-e-sempre-presente-un-istruttore-in-sala",
		pagina: "gym-floor",
		q: "È sempre presente un istruttore in sala?",
		a: "La sala fitness è accessibile durante tutto l'orario di apertura, mentre la presenza dell'istruttore è garantita dal lunedì al venerdì dalle 9:00 alle 21:30, il sabato dalle 10:00 alle 19:30 e la domenica dalle 11:00 alle 19:30. Fuori da queste fasce puoi comunque allenarti, senza la presenza continuativa di un trainer."
	},
	{
		id: "gym-floor-e-prevista-una-scheda-di-allenamento-personalizzata",
		pagina: "gym-floor",
		q: "È prevista una scheda di allenamento personalizzata?",
		a: "Sì. Il servizio fitness comprende Technogym Checkup, valutazione iniziale, programma di allenamento personalizzato e aggiornamenti periodici della scheda. Il programma viene elaborato in base agli obiettivi, alle caratteristiche fisiche e al livello di allenamento della persona, e viene aggiornato indicativamente ogni sei settimane tenendo conto dei progressi raggiunti e della frequenza di allenamento."
	},
	{
		id: "gym-floor-che-cos-e-la-consulenza-iniziale",
		pagina: "gym-floor",
		q: "Che cos'è la consulenza iniziale?",
		a: "È un servizio di consulenza gratuito per chi entra nel club: si parte da una conversazione sui tuoi interessi e sull'abbonamento che hai scelto, per ricevere consigli sul mix di attività più adatto agli obiettivi e al tempo che hai a disposizione. Se l'interesse è sul fitness, si prosegue con il Technogym Checkup e il primo programma di allenamento."
	},
	{
		id: "gym-floor-che-differenza-c-e-tra-il-programma-incluso-e-il-personal-training",
		pagina: "gym-floor",
		q: "Che differenza c'è tra il programma incluso e il personal training?",
		a: "Il programma incluso è già costruito sui tuoi obiettivi. Il personal training è un servizio extra, con un livello di dettaglio diverso: misurazioni più precise da parte del professionista, un programma calibrato sulla tua storia e linee guida che ti accompagnano per tutto il percorso."
	},
	{
		id: "gym-floor-i-corsi-di-gruppo-sono-inclusi-nell-abbonamento",
		pagina: "gym-floor",
		q: "I corsi di gruppo sono inclusi nell'abbonamento?",
		html: `<p>Sì. I corsi di gruppo sono inclusi nell'abbonamento fitness, salvo eventuali attività speciali per le quali siano previste condizioni differenti. Puoi consultare il palinsesto completo nel <a href="${url("/planning")}">planning</a>.</p>`
	},
	{
		id: "gym-floor-come-posso-prenotare-i-corsi-di-gruppo",
		pagina: "gym-floor",
		q: "Come posso prenotare i corsi di gruppo?",
		html: `<p>Tutti i corsi devono essere prenotati tramite l'App del Club, fino a esaurimento dei posti disponibili. Puoi <a href="${APP_URL}" target="_blank" rel="noopener">scaricare l'app qui</a>.</p>`
	},
	{
		id: "gym-floor-il-gym-floor-e-compreso-in-tutti-gli-abbonamenti",
		pagina: "gym-floor",
		q: "Il Gym Floor è compreso in tutti gli abbonamenti?",
		a: "Il Gym Floor è compreso negli abbonamenti Gold, Silver e Gym. L'abbonamento Swim è invece dedicato alla sola area acqua."
	},
	{
		id: "gym-floor-posso-allenarmi-nell-area-funzionale-lacertosus-in-autonomia",
		pagina: "gym-floor",
		q: "Posso allenarmi nell'area funzionale Lacertosus in autonomia?",
		a: "Sì, negli orari in cui l'area non ospita i corsi fitness funzionali e Airbox. Gli orari dei corsi sono consultabili nel planning settimanale."
	},

	// ── Corsi Fitness ─────────────────────────────────────────────────────────
	{
		id: "corsi-fitness-devo-prenotare-per-partecipare-a-un-corso",
		pagina: "corsi-fitness",
		q: "Devo prenotare per partecipare a un corso?",
		html: `<p>Sì, tutti i corsi si prenotano tramite l'<strong>App del Club</strong>, fino a esaurimento dei posti disponibili. Puoi <a href="${APP_URL}" target="_blank" rel="noopener">scaricare l'app qui</a>.</p>`
	},
	{
		id: "corsi-fitness-i-corsi-sono-adatti-anche-ai-principianti",
		pagina: "corsi-fitness",
		q: "I corsi sono adatti anche ai principianti?",
		a: "Sì, il palinsesto comprende corsi per ogni livello: gli istruttori propongono sempre varianti su misura per chi inizia e per chi è già allenato."
	},
	{
		id: "corsi-fitness-i-corsi-sono-inclusi-nell-abbonamento",
		pagina: "corsi-fitness",
		q: "I corsi sono inclusi nell'abbonamento?",
		a: "Sì, i corsi fitness sono inclusi negli abbonamenti Gold, Silver e Gym, salvo eventuali attività speciali per cui sono previste condizioni differenti."
	},

	// ── Hyrox ─────────────────────────────────────────────────────────
	{
		id: "hyrox-devo-essere-gia-allenato-per-iniziare",
		pagina: "hyrox",
		q: "Devo essere già allenato per iniziare?",
		a: "No. Si parte dal Functional Training, che costruisce forza, resistenza e mobilità, e si passa alle sessioni Hyrox Workout quando le basi ci sono. I coach ti indicano da dove cominciare in base al tuo livello."
	},
	{
		id: "hyrox-serve-iscriversi-a-una-gara-per-allenarsi-qui",
		pagina: "hyrox",
		q: "Serve iscriversi a una gara per allenarsi qui?",
		a: "No. Il format Hyrox è un ottimo allenamento anche per chi non ha in programma nessuna competizione: si lavora su corsa, forza e capacità di recupero in un'unica sessione."
	},
	{
		id: "hyrox-gli-allenamenti-hyrox-sono-compresi-nell-abbonamento",
		pagina: "hyrox",
		q: "Gli allenamenti Hyrox sono compresi nell'abbonamento?",
		html: `<p>Sì. Allenamento libero nella Functional Area, sessioni guidate e gruppi di corsa outdoor sono inclusi nell'abbonamento fitness. Puoi confrontare le formule nella pagina <a href="${url("/abbonamenti")}">abbonamenti</a>.</p>`
	},
	{
		id: "hyrox-posso-allenarmi-nella-functional-area-quando-voglio",
		pagina: "hyrox",
		q: "Posso allenarmi nella Functional Area quando voglio?",
		html: `<p>Negli orari in cui l'area non ospita i corsi, sì. Le fasce occupate sono quelle che trovi nel <a href="${url("/planning")}">planning settimanale</a>.</p>`
	},
	{
		id: "hyrox-che-categorie-esistono-in-gara",
		pagina: "hyrox",
		q: "Che categorie esistono in gara?",
		a: "Open, Pro, Doubles e Relay. Il format degli esercizi resta identico in tutto il mondo: cambiano i carichi e il modo in cui la prova viene distribuita fra gli atleti."
	},
	{
		id: "hyrox-la-corsa-fa-parte-della-preparazione",
		pagina: "hyrox",
		q: "La corsa fa parte della preparazione?",
		html: `<p>Sì, è metà della gara: otto chilometri divisi fra una stazione e l'altra. Per questo il club organizza gruppi di corsa outdoor guidati dai coach, in città e in collina, inclusi nell'abbonamento e visibili nel <a href="${url("/planning")}">planning</a>.</p>`
	},

	// ── Triathlon ─────────────────────────────────────────────────────────
	{
		id: "triathlon-da-quale-eta-si-puo-iniziare-e-come-sono-divise-le-categorie",
		pagina: "triathlon",
		q: "Da quale età si può iniziare e come sono divise le categorie?",
		a: "Il percorso triathlon copre tutte le età: la Young School è rivolta a bambini e ragazzi dai 6 ai 13 anni, la Triathlon Academy a ragazzi e ragazze dai 14 ai 23 anni, il Triathlon Age Group Senior Master ai soci dai 23 anni in avanti. Il passaggio dalla Young School all'Academy è automatico, salvo eccezioni valutate con i tecnici."
	},
	{
		id: "triathlon-come-vengono-formati-i-gruppi",
		pagina: "triathlon",
		q: "Come vengono formati i gruppi?",
		a: "Nella Young School i gruppi sono organizzati per età e livello di preparazione, così da proporre attività adeguate alle capacità di ciascuno. Nell'Academy gli atleti sono suddivisi in base a età, livello tecnico e obiettivi personali e agonistici."
	},
	{
		id: "triathlon-e-possibile-fare-una-lezione-di-prova",
		pagina: "triathlon",
		q: "È possibile fare una lezione di prova?",
		html: `<p>Sì, per tutte e tre le categorie. Nella Young School la prima settimana di attività è dedicata alle lezioni di prova gratuite, durante le quali i ragazzi conoscono i tecnici e sperimentano le diverse discipline. Per Academy e Age Group Senior Master è possibile partecipare a una lezione di prova per conoscere gli allenatori, il gruppo e il metodo di allenamento: puoi richiederla con il <button type="button" class="faq-inline-btn" data-open-contact>form di questa pagina</button>.</p>`
	},
	{
		id: "triathlon-bisogna-avere-gia-esperienza-nel-triathlon",
		pagina: "triathlon",
		q: "Bisogna avere già esperienza nel triathlon?",
		a: "No. Nella Young School non è richiesta esperienza, ma è necessario saper nuotare e andare in bicicletta a un livello base: le attività vengono poi proposte gradualmente. Gli allenamenti Age Group Senior Master sono aperti a tutti i soci, anche a chi non ha mai praticato triathlon, ed è possibile partecipare partendo anche da una sola disciplina tra nuoto, corsa e ciclismo."
	},
	{
		id: "triathlon-quante-volte-ci-si-allena-a-settimana",
		pagina: "triathlon",
		q: "Quante volte ci si allena a settimana?",
		a: "Nella Young School sono disponibili programmi con 1, 2 o 3 allenamenti settimanali, per un totale rispettivamente di 2, 4 o 6 ore: gli allenamenti si svolgono il lunedì, mercoledì, giovedì e venerdì e ogni famiglia sceglie i giorni in base al programma acquistato. Academy e Age Group Senior Master prevedono invece attività distribuite lungo tutta la settimana, con frequenza modulata dai tecnici in base al periodo della stagione, al livello e agli obiettivi."
	},
	{
		id: "triathlon-e-possibile-recuperare-un-allenamento-perso",
		pagina: "triathlon",
		q: "È possibile recuperare un allenamento perso?",
		a: "Sì. Nella Young School un allenamento non svolto può essere recuperato in un altro giorno della stessa settimana oppure in una settimana successiva, compatibilmente con il programma scelto e con l'organizzazione delle attività."
	},
	{
		id: "triathlon-quale-attrezzatura-e-necessaria",
		pagina: "triathlon",
		q: "Quale attrezzatura è necessaria?",
		a: "Servono abbigliamento sportivo adatto alla corsa, costume e materiale per il nuoto, la bicicletta e il casco, obbligatorio durante gli allenamenti in bici. È consigliato utilizzare una bicicletta personale: nelle prime fasi del corso Young School, in base alla disponibilità, Ronchiverdi può metterne una a disposizione. Per tutti gli atleti è disponibile un deposito dedicato alle biciclette."
	},
	{
		id: "triathlon-e-obbligatorio-partecipare-alle-gare",
		pagina: "triathlon",
		q: "È obbligatorio partecipare alle gare?",
		a: "No, in nessuna delle tre categorie. Durante la stagione vengono organizzati eventi e gare di corsa, acquathlon, duathlon e triathlon con il supporto dei tecnici, e la squadra partecipa alle principali competizioni FITRI, ma la partecipazione resta una scelta: ci si può allenare con il gruppo anche senza attività agonistica."
	},
	{
		id: "triathlon-sono-previsti-programmi-di-allenamento-personalizzati",
		pagina: "triathlon",
		q: "Sono previsti programmi di allenamento personalizzati?",
		a: "Sì, per Academy e Age Group Senior Master. I tecnici predispongono una programmazione individuale in base a livello di preparazione, obiettivi personali e agonistici, calendario delle gare, periodo della stagione e — per gli Age Group Senior Master — disponibilità settimanale e impegni di lavoro e famiglia. Il programma viene aggiornato in base ai progressi."
	},
	{
		id: "triathlon-come-ci-si-iscrive-quali-documenti-servono-e-come-arrivano-le-comunica",
		pagina: "triathlon",
		q: "Come ci si iscrive, quali documenti servono e come arrivano le comunicazioni?",
		a: "L'iscrizione alla Young School si effettua online dal sito Ronchiverdi, quella all'Academy presso la Reception del Club. Serve un certificato medico in corso di validità: dai 12 anni è richiesto il certificato medico agonistico, obbligatorio anche per Academy e Age Group Senior Master e per il tesseramento federale. La quota Young School comprende i tesseramenti FITRI e FIDAL, quella Academy il tesseramento FITRI con validità annuale. Allenamenti, uscite in bici, gare e iniziative vengono comunicati tramite il gruppo di messaggistica dedicato agli atleti e alle famiglie."
	},

	// ── Iscrizione Triathlon ─────────────────────────────────────────────────────────
	{
		id: "triathlon-iscrizione-come-ci-si-iscrive-categoria-per-categoria",
		pagina: "triathlon-iscrizione",
		q: "Come ci si iscrive, categoria per categoria?",
		a: "Alla Young School ci si iscrive online dal sito Ronchiverdi, scegliendo il programma dal listino del corso. Academy e Age Group Senior Master non si acquistano online e si iscrivono alla Reception del Club: l'Academy versando la quota annuale di 1.200 €, l'Age Group Senior Master attivando l'abbonamento al Club — Gold o Silver, gli unici piani che comprendono piscina, palestra e triathlon. In tutti i casi puoi scriverci con il modulo di contatto e ti seguiamo noi nella procedura."
	},
	{
		id: "triathlon-iscrizione-posso-provare-prima-di-iscrivermi",
		pagina: "triathlon-iscrizione",
		q: "Posso provare prima di iscrivermi?",
		a: "Sì. Nella Young School la prima settimana di attività è dedicata alle lezioni di prova gratuite. Per Academy e Age Group Senior Master è possibile richiedere una lezione di prova per conoscere gli allenatori, il gruppo e il metodo di allenamento."
	},
	{
		id: "triathlon-iscrizione-quali-documenti-servono",
		pagina: "triathlon-iscrizione",
		q: "Quali documenti servono?",
		a: "Per la Young School serve un certificato medico in corso di validità, che dai 12 anni deve essere agonistico. Per Academy e Age Group Senior Master è obbligatorio il certificato medico agonistico, necessario anche per il tesseramento federale."
	},
	{
		id: "triathlon-iscrizione-cosa-comprende-la-quota",
		pagina: "triathlon-iscrizione",
		q: "Cosa comprende la quota?",
		a: "La Young School ha un listino corso a 1, 2 o 3 allenamenti settimanali, e la quota comprende i tesseramenti FITRI e FIDAL. L'Academy ha una quota unica di 1.200 € all'anno, che comprende il tesseramento FITRI e l'accesso al club tutti i giorni, anche fuori dagli orari di allenamento: si versa in Reception e non passa dal portale. L'Age Group Senior Master non ha una quota corso — l'attività della squadra è compresa nell'abbonamento al Club, Gold o Silver."
	},

	// ── Summer Camp ─────────────────────────────────────────────────────────
	{
		id: "summer-camp-l-iscrizione-e-riservata-ai-soci-del-club",
		pagina: "summer-camp",
		q: "L'iscrizione è riservata ai soci del Club?",
		a: "No: il Summer Camp è aperto sia ai soci sia a chi non è ancora iscritto al Club, con condizioni diverse tra le due opzioni. Scrivici per conoscere prezzi, settimane disponibili e come completare l'iscrizione."
	},
	{
		id: "summer-camp-come-si-struttura-una-settimana-tipo",
		pagina: "summer-camp",
		q: "Come si struttura una settimana tipo?",
		a: "Il lunedì si parte per una nuova destinazione della macchina del tempo; da martedì a giovedì si susseguono attività a tema, sport e laboratori; il venerdì si chiude con spettacolo finale e premiazioni."
	},
	{
		id: "summer-camp-e-previsto-un-potenziamento-della-lingua-inglese",
		pagina: "summer-camp",
		q: "È previsto un potenziamento della lingua inglese?",
		a: "Sì: durante le settimane di Summer Camp è possibile arricchire l'esperienza con un percorso di potenziamento della lingua inglese, con attività svolte durante le ore al camp e guidate da docenti madrelingua."
	},
	{
		id: "summer-camp-cosa-serve-portare-ogni-giorno",
		pagina: "summer-camp",
		q: "Cosa serve portare ogni giorno?",
		a: "Costume e telo da bagno, un cambio completo, crema solare e cappellino: il resto — materiale sportivo e dei laboratori — è già a disposizione al Club."
	},

	// ── Spa ─────────────────────────────────────────────────────────
	{
		id: "spa-la-relax-zone-e-inclusa-in-tutti-gli-abbonamenti",
		pagina: "spa",
		q: "La Relax Zone è inclusa in tutti gli abbonamenti?",
		a: "Sì, la Spa con Chinesis Postural Lab e Relax Zone è inclusa in tutte le formule di abbonamento: Gold, Silver, Gym e Swim."
	},
	{
		id: "spa-cosa-comprende-il-percorso-benessere",
		pagina: "spa",
		q: "Cosa comprende il percorso benessere?",
		a: "Sauna, bagno di vapore, cascata di ghiaccio e percorso Kneipp verticale, per un'esperienza completa tra caldo e freddo."
	},
	{
		id: "spa-e-adatta-anche-a-chi-non-si-allena-in-palestra",
		pagina: "spa",
		q: "È adatta anche a chi non si allena in palestra?",
		a: "Certamente: la Relax Zone è pensata per il recupero e il benessere di tutti i soci, indipendentemente dall'attività sportiva praticata."
	},

	// ── Chinesis ─────────────────────────────────────────────────────────
	{
		id: "chinesis-serve-una-valutazione-prima-di-iniziare-un-trattamento",
		pagina: "chinesis",
		q: "Serve una valutazione prima di iniziare un trattamento?",
		a: "Sì, si parte sempre da una valutazione posturale approfondita, utile a costruire un percorso personalizzato in base alle esigenze di ciascuno."
	},
	{
		id: "chinesis-i-trattamenti-sono-adatti-anche-a-chi-ha-infortuni-sportivi",
		pagina: "chinesis",
		q: "I trattamenti sono adatti anche a chi ha infortuni sportivi?",
		a: "Sì, massaggi terapeutici e sportivi e la rieducazione funzionale sono pensati anche per il recupero muscolare e la prevenzione degli infortuni."
	},
	{
		id: "chinesis-cos-e-il-pilates-reformer",
		pagina: "chinesis",
		q: "Cos'è il Pilates Reformer?",
		a: "È un allenamento su una macchina dedicata, il Reformer, che lavora su rinforzo muscolare e controllo posturale."
	},
];

/** Le domande da mostrare su una pagina, nell'ordine in cui sono scritte. */
export function faqDiPagina(pagina: ChiavePagina): FaqItem[] {
	return faq.filter((f) => f.pagina === pagina || f.anche?.includes(pagina));
}

/** La wiki: aree → pagine → domande, saltando i gruppi rimasti vuoti. */
export function faqPerArea() {
	return AREE.map((area) => ({
		area,
		gruppi: (Object.keys(PAGINE) as ChiavePagina[])
			.filter((chiave) => PAGINE[chiave].area === area)
			.map((chiave) => ({ chiave, ...PAGINE[chiave], items: faq.filter((f) => f.pagina === chiave) }))
			.filter((g) => g.items.length > 0),
	})).filter((a) => a.gruppi.length > 0);
}

/** L'indirizzo della pagina in cui la domanda vive per esteso. */
export function hrefPagina(chiave: ChiavePagina): string {
	return url(PAGINE[chiave].href);
}

/**
 * Lo structured data FAQPage per un elenco di domande.
 *
 * Google lo usa per i risultati espansi e i motori conversazionali per citare
 * la risposta: va emesso solo dove le domande sono davvero visibili in pagina,
 * altrimenti è markup ingannevole. Il testo viene ripulito dai tag perché lo
 * schema vuole il contenuto, non il markup.
 */
export function schemaFaq(
	items: Array<{ q: string; a?: string; html?: string }>,
	titolo: string,
	pagina?: URL | string
) {
	if (!items.length) return undefined;
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		name: titolo,
		...(pagina ? { url: pagina.toString() } : {}),
		mainEntity: items.map((item) => ({
			"@type": "Question",
			name: item.q,
			acceptedAnswer: {
				"@type": "Answer",
				text: (item.a ?? item.html ?? "")
					.replace(/<li>/g, "• ")
					.replace(/<\/(p|li|ul|div)>/g, " ")
					.replace(/<[^>]+>/g, "")
					.replace(/\s+/g, " ")
					.trim(),
			},
		})),
	};
}
