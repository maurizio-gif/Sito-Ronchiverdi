// Regole di prenotazione dell'agenda del club: quando si può prenotare, con
// che passo, e quali orari risultano già occupati.
//
// Le usano il modulo di contatto (leadForm.client.js, dove si prende
// l'appuntamento), la pagina che permette di spostarlo (appuntamento.astro) e
// l'endpoint che quello spostamento lo esegue (api/appuntamento.ts) — per
// questo il file non ha il suffisso .client: gira anche sul server, dove è
// l'unica difesa contro una richiesta costruita a mano.
//
// Stanno qui e non in due copie perché sono la stessa agenda: se il sabato
// cambia orario, o cambia il passo di una telefonata, i due punti devono
// muoversi insieme — altrimenti il sito lascia spostare un appuntamento a
// un'ora che non avrebbe mai offerto in prenotazione.

// Endpoint del pannello che dice quali orari sono già occupati, mettendo
// insieme gli appuntamenti presi dalla segreteria e quelli prenotati da altri
// visitatori. Sta su un dominio diverso dal sito (il pannello è un'app Next
// su Vercel) e risponde con CORS aperto: espone solo giorno, ora e durata,
// nessun dato di chi ha prenotato.
//
// L'indirizzo è il dominio personalizzato del pannello, non l'alias
// *.vercel.app: quello è coperto dalla Vercel Authentication, e se un giorno
// la protezione arrivasse a coprire anche le route API il calendario del sito
// smetterebbe di sapere cosa è occupato — in silenzio, perché una chiamata
// fallita qui vale "niente occupato" (vedi caricaOccupati).
export var ENDPOINT_DISPONIBILITA = "https://crm.ronchiverdi.it/api/disponibilita";

// Il sabato si ricevono solo nel pomeriggio e la domenica non si prendono
// appuntamenti: un giorno senza fascia (null) non produce orari.
export var ORARI_CLUB = {
	feriali: { apre: "10:00", chiude: "19:00" },
	sabato: { apre: "14:30", chiude: "18:00" },
	domenica: null,
};

// I passi (45 e 20 minuti) sono anche le durate con cui il pannello occupa
// l'agenda: vivono in DURATA_PREDEFINITA in lib/agenda.ts dell'app, e vanno
// cambiati nei due posti insieme, altrimenti il sito offre slot che l'agenda
// calcola più lunghi o più corti.
//
// Il preavviso minimo evita di proporre un orario che il club non farebbe in
// tempo a onorare, e l'orizzonte è volutamente corto sulla telefonata: una
// chiamata si fissa per i prossimi giorni, non fra due settimane.
export var DISPONIBILITA = {
	appuntamento: { giorniAvanti: 7, passoMinuti: 45, orari: ORARI_CLUB },
	telefonata: { giorniAvanti: 3, passoMinuti: 20, orari: ORARI_CLUB },
	preavvisoMinuti: 120,
};

export function regoleDi(tipo) {
	return DISPONIBILITA[tipo] || DISPONIBILITA.appuntamento;
}

export function pad2(n) {
	return String(n).padStart(2, "0");
}

export function isoDateLocal(d) {
	return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

export function parseHHMM(s) {
	var m = /^(\d{1,2}):(\d{2})$/.exec(String(s || "").trim());
	return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
}

// La fascia dipende dal giorno: feriali per intero, sabato solo il
// pomeriggio, domenica niente (null).
export function fasciaDelGiorno(tipo, date) {
	var dow = date.getDay(); // 0 = domenica, 6 = sabato
	var orari = regoleDi(tipo).orari;
	if (dow === 0) return orari.domenica;
	if (dow === 6) return orari.sabato;
	return orari.feriali;
}

export function slotsInRange(tipo, date) {
	var fascia = fasciaDelGiorno(tipo, date);
	if (!fascia) return []; // giorno di chiusura
	var passo = regoleDi(tipo).passoMinuti;
	var start = parseHHMM(fascia.apre);
	var end = parseHHMM(fascia.chiude);
	var slots = [];
	// `t + passo <= end`: l'ultimo slot deve stare dentro l'orario, non
	// cominciare all'ora di chiusura. Con passi di 45 minuti su 10:00–19:00
	// l'ultimo utile è 18:15, non 18:45.
	for (var t = start; t + passo <= end; t += passo) {
		slots.push(pad2(Math.floor(t / 60)) + ":" + pad2(t % 60));
	}
	return slots;
}

// Due impegni si sovrappongono se uno comincia prima che l'altro sia finito:
// non basta confrontare le ore di inizio, perché una visita da 45 minuti alle
// 10:00 occupa anche lo slot delle 10:20 di una telefonata.
export function siSovrappone(inizioA, durataA, inizioB, durataB) {
	return inizioA < inizioB + durataB && inizioB < inizioA + durataA;
}

// Chiede al pannello gli orari già occupati per i prossimi `giorni`.
// Se non risponde — rete assente, endpoint giù — si prosegue come se non ci
// fosse nulla occupato: un doppione raro è meno grave di un calendario vuoto
// che impedisce di prenotare.
export function caricaOccupati(giorni) {
	var oggi = new Date();
	var fine = new Date();
	fine.setDate(oggi.getDate() + giorni - 1);
	var url = ENDPOINT_DISPONIBILITA + "?da=" + isoDateLocal(oggi) + "&a=" + isoDateLocal(fine);

	try {
		return fetch(url, { headers: { Accept: "application/json" } })
			.then(function (r) {
				return r.ok ? r.json() : null;
			})
			.then(function (dati) {
				return (dati && dati.occupati) || {};
			})
			.catch(function () {
				return {};
			});
	} catch (e) {
		return Promise.resolve({});
	}
}

// Ora corrente nel fuso del club (Europe/Rome), indipendente dal fuso del
// dispositivo di chi visita il sito da un altro paese.
export function oraLocaleClub() {
	var parts = {};
	new Intl.DateTimeFormat("en-GB", {
		timeZone: "Europe/Rome",
		year: "numeric", month: "2-digit", day: "2-digit",
		hour: "2-digit", minute: "2-digit", hour12: false,
	})
		.formatToParts(new Date())
		.forEach(function (p) { parts[p.type] = p.value; });
	return {
		y: parseInt(parts.year, 10),
		m: parseInt(parts.month, 10),
		d: parseInt(parts.day, 10),
		minuti: (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10),
	};
}

// Slot proponibili per un giorno: si togliono quelli entro il preavviso
// minimo (solo per oggi) e quelli che si sovrappongono a un impegno già in
// agenda.
//
// `escludi` serve a chi sta spostando un appuntamento: il proprio orario
// attuale risulta occupato in agenda da sé stesso, e senza questo non
// comparirebbe più fra quelli scegliibili.
export function slotsDisponibili(date, tipo, occupati, escludi) {
	var slots = slotsInRange(tipo, date);
	var durata = regoleDi(tipo).passoMinuti;

	var ora = oraLocaleClub();
	var eOggi = date.getFullYear() === ora.y && date.getMonth() + 1 === ora.m && date.getDate() === ora.d;
	if (eOggi) {
		var soglia = ora.minuti + DISPONIBILITA.preavvisoMinuti;
		slots = slots.filter(function (s) {
			return parseHHMM(s) >= soglia;
		});
	}

	var presi = (occupati && occupati[isoDateLocal(date)]) || [];
	if (escludi && escludi.data === isoDateLocal(date)) {
		presi = presi.filter(function (p) {
			return String(p.ora).slice(0, 5) !== String(escludi.ora).slice(0, 5);
		});
	}
	if (!presi.length) return slots;

	return slots.filter(function (s) {
		var inizio = parseHHMM(s);
		return !presi.some(function (p) {
			var inizioPreso = parseHHMM(p.ora);
			if (inizioPreso === null) return false;
			return siSovrappone(inizio, durata, inizioPreso, Number(p.durataMinuti) || durata);
		});
	});
}
