// Dati centralizzati di orari e planning settimanali.
// Modificare qui aggiorna automaticamente tutte le pagine che usano
// i componenti HoursTable / WeeklySchedule con questi dataset.

export const DAYS = [
	{ key: "lunedi", short: "Lun", full: "Lunedì" },
	{ key: "martedi", short: "Mar", full: "Martedì" },
	{ key: "mercoledi", short: "Mer", full: "Mercoledì" },
	{ key: "giovedi", short: "Gio", full: "Giovedì" },
	{ key: "venerdi", short: "Ven", full: "Venerdì" },
	{ key: "sabato", short: "Sab", full: "Sabato" },
	{ key: "domenica", short: "Dom", full: "Domenica" },
];

// --- Gym Floor: semplice tabella orari di apertura ---
export const gymFloorHours = [
	{ label: "Lunedì – Venerdì", hours: "7:00 – 22:00" },
	{ label: "Sabato, domenica e festivi", hours: "9:00 – 20:00" },
];

// --- Gym Floor: fasce in cui è garantita la presenza dell'istruttore ---
export const gymFloorTrainerHours = [
	{ label: "Lunedì – Venerdì", hours: "9:00 – 21:30" },
	{ label: "Sabato", hours: "10:00 – 19:30" },
	{ label: "Domenica", hours: "11:00 – 19:30" },
];

// --- Tennis e Padel: orari di utilizzo dei campi ---
export const tennisPadelHours = [
	{ label: "Lunedì – Venerdì", hours: "8:00 – 23:00" },
	{ label: "Sabato, domenica e festivi", hours: "9:00 – 20:00" },
];

// --- Corsi Fitness: palinsesto settimanale completo ---
export const corsiFitnessLessons = {
	"full-body-workout": {
		name: "Full Body Workout",
		description: "Lezione di tonificazione atta a migliorare la qualità muscolare. Le sessioni possono includere l'uso di attrezzi quali manubri, bilancieri, bande elastiche che verranno alternati a fasi cardio o di recupero attivo. L'obiettivo è di far vivere un allenamento total body toccando le diverse aree muscolari, partendo dalla stazione eretta e finendo al suolo con un lavoro specifico sul tappetino ed uno stretching in chiusura.",
	},
	"flex-mobility": {
		name: "Flex & Mobility",
		description: "Una lezione adatta a tutti indipendentemente dal livello di preparazione. Un'ottima opportunità per migliorare la mobilità e la flessibilità del corpo. Può aiutare ad alleviare le tensioni, a prevenire gli infortuni, migliorare la performance sportiva e favorire il benessere generale.",
	},
	"hi-energy-wake-up": {
		name: "Hi Energy Wake Up",
		description: "Iniziare la giornata con una energica attivazione è una bella sfida. 45 minuti di lavoro funzionale con una fase di stretching finale vi darà la giusta carica per partire con slancio.",
	},
	"qi-cong": {
		name: "Qi Cong",
		description: "Una pratica dolce che unisce respirazione, movimento lento e concentrazione, ispirata alle discipline orientali. Aiuta a sciogliere le tensioni, migliorare l'equilibrio e ritrovare calma ed energia, con un lavoro adatto a ogni livello.",
	},
	pilates: {
		name: "Pilates Matwork",
		description: "Concentrazione, controllo, centratura, fluidità, precisione e respirazione. Ecco i 6 principi pilastro della tecnica di Pilates Matwork. Questi parametri saranno i temi fondamentali della lezione. Allenare forza e flessibilità con il sussidio di piccoli attrezzi, trovare un equilibrio stabile, destabilizzare per ritrovare la giusta postura saranno gli obiettivi principali della vostra lezione.",
	},
	"yoga-per-tutti": {
		name: "Yoga per Tutti",
		description: "Un approccio inclusivo e accessibile che mira a rendere la pratica dello yoga disponibile a persone di tutte le età e livello di preparazione. Le posizioni sono adattabili a tutti, permettendo a ciascun partecipante di lavorare secondo le sue capacità.",
	},
	"back-prevention": {
		name: "Back Prevention",
		description: "Una lezione progettata per educare e rafforzare la schiena e tutto il corsetto addominale. Grande attenzione sulla postura corretta atta a ridurre lo stress sulla colonna vertebrale. Rinforzo del core, stretching della schiena, mobilizzazione articolare per migliorare la consapevolezza del proprio corpo e promuovere abitudini salutari.",
	},
	"movimento-latino": {
		name: "Movimento Latino",
		description: "Osvaldo è il maestro indiscusso di questo format. Parola d'ordine il divertimento! Le coreografie sono semplicissime, la musica latina è la colonna sonora che vi accompagnerà e voi non dovrete che sorridere.",
	},
	"postural-stretch": {
		name: "Postural Stretch",
		description: "La lezione di Matteo si concentra sul miglioramento della postura e sul rilascio delle tensioni muscolari attraverso una serie di esercizi mirati ad aumentare l'ampiezza dei movimenti. Gli esercizi includono allungamenti statici e dinamici, movimenti articolari e tecniche di respirazione.",
	},
	"pilates-creativo": {
		name: "Pilates Creativo",
		description: "Una lezione di pilates matwork arricchita dalla contaminazione. Il format avrà come caratteristica dominante gli esercizi base, ma la fluidità delle transizioni, la molteplicità degli esercizi proposti presi in prestito dal mondo della danza e dello stretching dinamico, lo renderà un'esperienza unica e rigenerante.",
	},
	"hyrox-workout": {
		name: "Hyrox Workout",
		description: "Vuoi avvicinarti al concetto di Hyrox? Il tuo obiettivo è quello di partecipare ad una delle competizioni basate sul lavoro funzionale più partecipate al mondo? Le nostre sessioni dedicate, condotte da coach certificati, ti aspettano per conoscere tutti gli aspetti della gara.",
	},
	"functional-training": {
		name: "Functional Training",
		description: "L'allenamento funzionale è un metodo efficace per allenare le nostre capacità condizionali: forza, mobilità, resistenza, flessibilità e coordinazione. La nuova area dedicata, attrezzata in collaborazione con l'azienda leader del settore Lacertosus, offre l'opportunità di partecipare a molteplici sessioni d'allenamento durante la settimana. Un lavoro a circuito gestito da un trainer dedicato che vi farà vivere un'esperienza allenante unica nel suo genere.",
	},
	"running-training": {
		name: "Running Training",
		description: "Sessioni di corsa guidate per migliorare tecnica, resistenza e passo. Un allenamento cardiovascolare completo, con progressioni pensate sia per chi corre per la prima volta sia per chi si prepara a una gara.",
	},
	"indoor-cycling": {
		name: "Indoor Cycling",
		description: "Un allenamento cardio ad alta energia in sella alla bike, guidato dalla musica: sprint, salite simulate e fasi di recupero si alternano per un lavoro cardiovascolare intenso e coinvolgente, adatto a ogni livello di preparazione.",
	},
	"movida-fitness": {
		name: "Movida Fitness",
		description: "Un programma pre-coreografato che combina fitness, danza e divertimento. Si spazia dal latino al jazz, dal rock al funk, dall'oriente al country. Facile divertente allenante!",
	},
	"hatha-yoga": {
		name: "Hatha Yoga",
		description: "L'hatha yoga, conosciuto anche come yoga della forza, è uno stile di yoga che tramite le asana permette di ritrovare un equilibrio tra mente e corpo. Questo stile è caratterizzato da asana (posizioni) semplici eseguite con calma ed unisce tecniche di respirazione con tecniche di rilassamento.",
	},
	"body-power": {
		name: "Body Power",
		description: "Una lezione “strong” per chi ha già una buona consapevolezza delle proprie capacità. Il lavoro a circuito è ad alta intensità e combina esercizi cardiovascolari e di resistenza muscolare atti a massimizzare il consumo calorico. Ogni esercizio viene eseguito in un tempo prestabilito nel quale si eseguono tante ripetizioni quante se ne riescono a fare senza andare in debito, seguito poi da brevi pause di recupero. Grande energia e coinvolgimento... una vera sfida!",
	},
	"power-pump-tone": {
		name: "Power Pump",
		description: "La lezione di Power Pump prevede l'uso di un bilanciere, manubri e di uno step utilizzato come base d'appoggio. Gli insegnanti offrono varianti e modifiche per garantire che ciascun partecipante possa lavorare secondo le proprie capacità. Gli esercizi vengono eseguiti in modo ritmico accompagnati da una musica coinvolgente ed energica creando così l'atmosfera ideale per una resa efficace.",
	},
	zumba: {
		name: "Zumba",
		description: "Il programma di fama mondiale progettato per essere divertente, coinvolgente e capace di trasformare un semplice esercizio in una esperienza festosa. Salsa, merengue, reggaetone ed altri mille stili musicali mixati in un'unica lezione. Adatta a tutti i livelli e non richiede esperienza specifica nella danza. Divertirsi allenandovi!",
	},
	"hiit-training": {
		name: "Hiit Training",
		description: "High Intensity Interval Training è un allenamento che alterna brevi esercizi ad alta intensità a periodi di recupero di bassa intensità. Questo metodo nasce con l'unico obiettivo di massimizzare il consumo calorico e migliorare la resistenza cardiovascolare in un tempo relativamente breve. Le lezioni di Hiit sono facilmente adattabili alle diverse condizioni fisiche dei partecipanti ed è per questo motivo che la lezione è accessibile a tutti.",
	},
	"metabolic-workout": {
		name: "Metabolic Workout",
		description: "Un tipo di allenamento progettato per stimolare il metabolismo e massimizzare la combustione dei grassi attraverso esercizi ad alta intensità e circuiti di resistenza. Questo approccio combina movimenti cardiovascolari e di tonificazione, con l'obiettivo di migliorare le capacità aerobiche, la forza e la resistenza muscolare in un'unica sessione.",
	},
	"postural-yoga": {
		name: "Postural Yoga",
		description: "Una pratica yoga dolce e mirata al riequilibrio della postura, che unisce respirazione, allungamenti e consapevolezza corporea per allentare le tensioni accumulate e migliorare l'allineamento della schiena.",
	},
	"hybrid-arena-workout": {
		name: "Hybrid Arena Workout",
		description: "Un allenamento funzionale a circuito che combina forza, resistenza e coordinazione in un unico format dinamico, pensato per mettere alla prova capacità diverse in un'unica sessione di gruppo.",
	},
	"jolly-class": {
		name: "Jolly Class",
		description: "Il format jolly della domenica: una lezione a tema variabile, pensata per completare la settimana con un allenamento diverso di volta in volta, adatto a tutta la sala.",
	},
};

export const corsiFitnessSchedule = {
	lunedi: [
		{ time: "9.30 – 10.30", id: "full-body-workout" },
		{ time: "10.30 – 11.30", id: "flex-mobility" },
		{ time: "11.30 – 12.30", id: "qi-cong" },
		{ time: "13.00 – 14.00", id: "postural-stretch" },
		{ time: "13.00 – 14.00", id: "running-training" },
		{ time: "13.00 – 14.00", id: "indoor-cycling" },
		{ time: "13.15 – 14.00", id: "hyrox-workout" },
		{ time: "14.00 – 15.00", id: "movimento-latino" },
		{ time: "17.00 – 18.00", id: "hatha-yoga" },
		{ time: "18.00 – 19.00", id: "body-power" },
		{ time: "18.30 – 19.00", id: "hyrox-workout" },
		{ time: "19.00 – 20.00", id: "pilates-creativo" },
		{ time: "19.00 – 20.00", id: "indoor-cycling" },
		{ time: "19.30 – 20.30", id: "hyrox-workout" },
	],
	martedi: [
		{ time: "7.45 – 8.30", id: "hi-energy-wake-up" },
		{ time: "9.30 – 10.30", id: "full-body-workout" },
		{ time: "10.30 – 11.30", id: "pilates" },
		{ time: "11.30 – 12.30", id: "yoga-per-tutti" },
		{ time: "13.00 – 14.00", id: "full-body-workout" },
		{ time: "13.00 – 14.00", id: "running-training" },
		{ time: "13.00 – 14.00", id: "indoor-cycling" },
		{ time: "17.00 – 18.00", id: "flex-mobility" },
		{ time: "18.00 – 19.00", id: "running-training" },
		{ time: "18.00 – 19.00", id: "full-body-workout" },
		{ time: "18.30 – 19.15", id: "hyrox-workout" },
		{ time: "19.00 – 20.00", id: "body-power" },
	],
	mercoledi: [
		{ time: "9.30 – 10.30", id: "full-body-workout" },
		{ time: "10.30 – 11.30", id: "back-prevention" },
		{ time: "11.30 – 12.30", id: "movimento-latino" },
		{ time: "13.00 – 14.00", id: "pilates-creativo" },
		{ time: "13.00 – 14.00", id: "running-training" },
		{ time: "13.15 – 14.00", id: "functional-training" },
		{ time: "14.00 – 15.00", id: "movida-fitness" },
		{ time: "17.15 – 18.15", id: "flex-mobility" },
		{ time: "18.15 – 19.15", id: "full-body-workout" },
		{ time: "18.30 – 19.15", id: "hyrox-workout" },
		{ time: "19.00 – 20.00", id: "indoor-cycling" },
		{ time: "19.15 – 20.15", id: "pilates-creativo" },
		{ time: "19.30 – 20.30", id: "hyrox-workout" },
	],
	giovedi: [
		{ time: "7.30 – 8.15", id: "hi-energy-wake-up" },
		{ time: "9.30 – 10.30", id: "full-body-workout" },
		{ time: "10.30 – 11.30", id: "pilates" },
		{ time: "11.30 – 12.30", id: "yoga-per-tutti" },
		{ time: "13.00 – 14.00", id: "metabolic-workout" },
		{ time: "13.00 – 14.00", id: "running-training" },
		{ time: "13.00 – 14.00", id: "indoor-cycling" },
		{ time: "13.15 – 14.15", id: "hyrox-workout" },
		{ time: "14.00 – 15.00", id: "movimento-latino" },
		{ time: "17.00 – 18.00", id: "back-prevention" },
		{ time: "18.00 – 19.00", id: "running-training" },
		{ time: "18.00 – 19.00", id: "full-body-workout" },
		{ time: "18.30 – 19.15", id: "hyrox-workout" },
		{ time: "19.00 – 20.00", id: "body-power" },
		{ time: "19.30 – 20.30", id: "indoor-cycling" },
	],
	venerdi: [
		{ time: "9.30 – 10.30", id: "full-body-workout" },
		{ time: "10.30 – 11.30", id: "flex-mobility" },
		{ time: "11.30 – 12.30", id: "movida-fitness" },
		{ time: "13.00 – 14.00", id: "power-pump-tone" },
		{ time: "13.15 – 14.15", id: "hyrox-workout" },
		{ time: "17.00 – 18.00", id: "hatha-yoga" },
		{ time: "18.00 – 19.00", id: "full-body-workout" },
		{ time: "18.30 – 19.15", id: "hyrox-workout" },
		{ time: "19.00 – 20.00", id: "flex-mobility" },
	],
	sabato: [
		{ time: "9.30 – 10.30", id: "postural-yoga" },
		{ time: "10.00 – 10.50", id: "indoor-cycling" },
		{ time: "10.30 – 11.30", id: "hiit-training" },
		{ time: "11.00 – 11.50", id: "indoor-cycling" },
		{ time: "11.30 – 12.30", id: "zumba" },
		{ time: "11.30 – 12.30", id: "hybrid-arena-workout" },
		{ time: "12.00 – 12.50", id: "indoor-cycling" },
		{ time: "13.00 – 13.45", id: "functional-training" },
	],
	domenica: [{ time: "11.00 – 12.00", id: "jolly-class" }],
};

// --- Acqua Fitness: palinsesto settimanale (BOZZA, da confermare) ---
export const acquaFitnessLessons = {
	"acqua-trekking": {
		name: "Acqua Trekking",
		description: "Camminata in acqua a ritmo sostenuto: lavora su resistenza e tonificazione con il minimo impatto sulle articolazioni.",
	},
	hydrobike: {
		name: "Hydrobike",
		description: "Pedalata su bike subacquea a ritmo di musica: un allenamento cardio intenso, divertente e a bassissimo impatto.",
	},
	"step-acqua": {
		name: "Step Acqua",
		description: "Il classico step rivisitato in acqua, su base rialzata: coordinazione, resistenza cardiovascolare e tonificazione.",
	},
	acquagym: {
		name: "Acquagym",
		description: "Ginnastica a corpo libero in acqua, a ritmo di musica: un allenamento completo per tonificare tutto il corpo.",
	},
	"swim-training": {
		name: "Swim Training",
		description: "Allenamento di nuoto strutturato, per chi vuole migliorare tecnica e resistenza nelle quattro nuotate.",
	},
	"total-body-acqua": {
		name: "Total Body Acqua",
		description: "Circuito a corpo libero in acqua che alterna forza, resistenza e mobilità per un allenamento a 360°.",
	},
};

export const acquaFitnessSchedule = {
	lunedi: [
		{ time: "9.00 – 9.45", id: "acqua-trekking" },
		{ time: "18.30 – 19.15", id: "acquagym" },
	],
	martedi: [
		{ time: "9.00 – 9.45", id: "hydrobike" },
		{ time: "18.30 – 19.15", id: "step-acqua" },
	],
	mercoledi: [
		{ time: "9.00 – 9.45", id: "acqua-trekking" },
		{ time: "18.30 – 19.15", id: "total-body-acqua" },
	],
	giovedi: [
		{ time: "9.00 – 9.45", id: "hydrobike" },
		{ time: "18.30 – 19.15", id: "acquagym" },
	],
	venerdi: [
		{ time: "9.00 – 9.45", id: "swim-training" },
		{ time: "18.30 – 19.15", id: "step-acqua" },
	],
	sabato: [{ time: "10.00 – 10.45", id: "acquagym" }],
	domenica: [],
};

// --- Nuoto Libero: fasce settimanali (BOZZA, da confermare) ---
export const nuotoLiberoLessons = {
	"nuoto-libero": {
		name: "Nuoto Libero",
		description: "Accesso libero alla vasca, senza prenotazione: nuota quando vuoi, per tutta la durata della fascia oraria indicata.",
	},
};

export const nuotoLiberoSchedule = {
	lunedi: [
		{ time: "7.00 – 12.00", id: "nuoto-libero" },
		{ time: "14.00 – 22.00", id: "nuoto-libero" },
	],
	martedi: [
		{ time: "7.00 – 12.00", id: "nuoto-libero" },
		{ time: "14.00 – 22.00", id: "nuoto-libero" },
	],
	mercoledi: [
		{ time: "7.00 – 12.00", id: "nuoto-libero" },
		{ time: "14.00 – 22.00", id: "nuoto-libero" },
	],
	giovedi: [
		{ time: "7.00 – 12.00", id: "nuoto-libero" },
		{ time: "14.00 – 22.00", id: "nuoto-libero" },
	],
	venerdi: [
		{ time: "7.00 – 12.00", id: "nuoto-libero" },
		{ time: "14.00 – 22.00", id: "nuoto-libero" },
	],
	sabato: [{ time: "9.00 – 20.00", id: "nuoto-libero" }],
	domenica: [{ time: "9.00 – 20.00", id: "nuoto-libero" }],
};
