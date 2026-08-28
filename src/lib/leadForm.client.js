// @ts-nocheck — script vanilla per il browser (accesso al DOM, niente tipi)
//
// Logica del form contatti Ronchiverdi. Vive qui una volta sola, come nel
// progetto TCA, perché il form è destinato a comparire in due contenitori: il
// modal aperto dai pulsanti "Contattaci" / "Prenota un tour" e (in seguito) una
// versione inline in fondo alle pagine. Ogni contenitore la inizializza
// passando il proprio nodo radice e il prefisso degli id usato da
// LeadFormBody.astro ("lm" o "li").
//
// initLeadForm(root, { prefix, onClose }) restituisce:
//   .open(pagina, cta, attivita) → registra la provenienza, preseleziona
//                                  eventualmente un'attività, mostra lo step 1
//   .clear()                     → azzera stato e campi, senza chiudere nulla
//
// I pulsanti di chiusura interni chiamano onClose(): la pulizia non va fatta
// qui ma quando il contenitore si è davvero chiuso (il <dialog> si chiude anche
// con Esc, senza passare da nessun pulsante), così ogni via di uscita — X,
// backdrop, Esc — lascia il form nello stesso stato pulito.

export function initLeadForm(root, options) {
	var P = options.prefix;
	var onClose = options.onClose || function () {};

	// Non ancora configurato: i referenti a cui instradare ogni attività
	// arrivano dal cliente attività per attività. Il punto di invio è già
	// cablato — appena l'endpoint esiste basta valorizzare questa costante.
	var WEBHOOK_LEAD = "";

	// Placeholder in attesa degli orari reali del club: nessuna chiusura,
	// stessa fascia oraria ogni giorno. Da sostituire quando il cliente
	// conferma orari di segreteria e durata di visita/chiamata per attività.
	var DISPONIBILITA = {
		giorniAvanti: 14,
		oraApertura: "09:00",
		oraChiusura: "19:00",
		passoAppuntamento: 30,
		passoTelefonata: 15,
	};

	// Mappa id → { label, audience, contactFlow }, serializzata dal componente
	// Astro su data-activities: le etichette restano definite una volta sola in
	// src/data/leadActivities.ts e non vanno tenute allineate a mano qui.
	var ACTIVITIES = (function () {
		try {
			return JSON.parse(root.dataset.activities || "{}");
		} catch (e) {
			return {};
		}
	})();

	// Ramificazioni: attività scelta → step successivo. Le attività con
	// contactFlow "azione" (oggi: Abbonamento Club e Family) propongono
	// appuntamento/telefonata/messaggio; le altre restano sul segnaposto, in
	// attesa dei referenti da definire attività per attività.
	var NEXT_STEP_FALLBACK = "2";

	function nextStepFor(id) {
		var att = ACTIVITIES[id] || {};
		return att.contactFlow === "azione" ? "2-scelta" : NEXT_STEP_FALLBACK;
	}

	// A quale pallino dell'indicatore corrisponde ogni step, e se la barra va
	// mostrata: i passi di dettaglio (calendario, messaggio, conferma) restano
	// fuori dai tre pallini principali, esattamente come nel form TCA.
	var STEP_DOT = { 1: 1, 2: 2, "2-scelta": 2, "4-dati": 3 };

	var ERR = {
		attivita: "Scegli l'attività che ti interessa per continuare.",
		giorno: "Scegli un giorno per continuare.",
		orario: "Scegli un orario per continuare.",
		messaggio: "Scrivi la tua richiesta prima di continuare.",
		nome: "Inserisci il tuo nome.",
		cognome: "Inserisci il tuo cognome.",
		email: "Inserisci un indirizzo email valido.",
		cellulare: "Inserisci un numero di cellulare valido.",
		privacy: "Il consenso alla Privacy Policy è obbligatorio.",
	};

	function initialState() {
		return {
			attivita: null,
			attivitaLabel: "",
			audience: "",
			dettagli: [],
			pagina: "",
			cta: "",
			azione: null,
			dataScelta: null,
			oraScelta: null,
			messaggioTesto: "",
			nome: "",
			cognome: "",
			email: "",
			cellulare: "",
			privacy: false,
			marketing: false,
		};
	}
	var state = initialState();

	// ── Navigazione fra step ───────────────────────────────────────────
	var stepsBar = root.querySelector(".lf__steps");
	var stepDots = root.querySelectorAll("[data-step-dot]");

	function showStep(n) {
		var key = String(n);
		root.querySelectorAll("[data-step]").forEach(function (el) {
			el.hidden = el.dataset.step !== key;
		});
		var dot = STEP_DOT[key];
		if (stepsBar) stepsBar.hidden = !dot;
		if (dot) {
			stepDots.forEach(function (d) {
				var i = parseInt(d.dataset.stepDot, 10);
				d.classList.toggle("is-active", i === dot);
				d.classList.toggle("is-done", i < dot);
			});
		}
		root.scrollTop = 0;
	}

	function getStep(n) {
		return root.querySelector('[data-step="' + n + '"]');
	}

	function showError(el, msg) {
		var err = el.querySelector(".lf__error");
		if (err) {
			err.textContent = msg;
			err.hidden = false;
		}
	}

	function clearError(el) {
		var err = el.querySelector(".lf__error");
		if (err) err.hidden = true;
	}

	function esc(str) {
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	function isValidEmail(v) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
	}

	// Solo cifre/spazi/trattini, lunghezza plausibile per un cellulare reale;
	// esclude anche le cifre tutte uguali (es. 0000000000), che supererebbero
	// il controllo di lunghezza senza essere un numero vero.
	function isValidPhone(v) {
		var cifre = v.replace(/[^0-9]/g, "");
		if (!/^[0-9\s-]+$/.test(v.trim())) return false;
		if (cifre.length < 6 || cifre.length > 14) return false;
		if (/^(\d)\1+$/.test(cifre)) return false;
		return true;
	}

	// ── STEP 1 · Attività di interesse ─────────────────────────────────
	var radios = root.querySelectorAll('input[name="attivita"]');
	var nextBtn = root.querySelector("#" + P + "-step1-next");

	// I chip di dettaglio appartengono a una sola opzione: quando cambia la
	// scelta vanno chiusi e svuotati, altrimenti resterebbero nel payload
	// dettagli riferiti a un'attività che l'utente non ha più selezionato.
	function syncExtras(selectedId) {
		root.querySelectorAll("[data-extra-for]").forEach(function (panel) {
			var mine = panel.dataset.extraFor === selectedId;
			panel.hidden = !mine;
			if (!mine) {
				panel.querySelectorAll('input[type="checkbox"]').forEach(function (c) {
					c.checked = false;
				});
			}
		});
	}

	radios.forEach(function (radio) {
		radio.addEventListener("change", function () {
			if (!radio.checked) return;
			state.attivita = radio.value;
			state.audience = radio.dataset.audience || "";
			state.attivitaLabel = (ACTIVITIES[radio.value] || {}).label || radio.value;
			syncExtras(radio.value);
			if (nextBtn) nextBtn.disabled = false;
			clearError(getStep(1));
		});
	});

	if (nextBtn) {
		nextBtn.addEventListener("click", function () {
			var s1 = getStep(1);
			clearError(s1);

			if (!state.attivita) {
				showError(s1, ERR.attivita);
				return;
			}

			state.dettagli = Array.from(
				root.querySelectorAll('input[name="dettagli"]:checked')
			).map(function (c) {
				return c.value;
			});

			var next = nextStepFor(state.attivita);
			if (next === "2") renderRecap();
			showStep(next);
		});
	}

	// Riepilogo del segnaposto: mostra il ramo imboccato per le attività senza
	// ancora un referente definito, così in anteprima si verifica che lo step 1
	// instradi correttamente. Sparirà quando quei rami saranno costruiti.
	function renderRecap() {
		var box = root.querySelector("#" + P + "-recap");
		if (!box) return;
		var rows = [
			["Attività", state.attivitaLabel],
			["Percorso", state.audience],
		];
		if (state.dettagli.length) rows.push(["Interessi", state.dettagli.join(", ")]);
		box.innerHTML = rows.map(recapRow).join("");
	}

	function recapRow(pair) {
		return (
			'<div class="lf__recap-row"><span>' +
			esc(pair[0]) +
			"</span><span>" +
			esc(pair[1]) +
			"</span></div>"
		);
	}

	// ── STEP 2-SCELTA · Come possiamo aiutarti ──────────────────────────
	root.querySelectorAll(".lf__choice").forEach(function (btn) {
		btn.addEventListener("click", function () {
			var azione = btn.dataset.azione;
			state.azione = azione;
			if (azione === "messaggio") {
				showStep("3-messaggio");
			} else {
				buildPicker(azione);
				showStep("3-" + azione);
			}
		});
	});

	// ── Calendario: fascia di giorni + orari a chip ─────────────────────
	// A differenza del form TCA non c'è una griglia mensile con paginazione:
	// una fascia di ~2 settimane scorrevole copre lo stesso orizzonte di
	// prenotazione con molto meno codice e si scorre col dito su mobile.
	var DOW_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
	var MESI_BREVI = [
		"Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
		"Lug", "Ago", "Set", "Ott", "Nov", "Dic",
	];
	var FASCE = [
		{ label: "Mattina", h1: 0, h2: 13 },
		{ label: "Pomeriggio", h1: 13, h2: 17 },
		{ label: "Sera", h1: 17, h2: 24 },
	];

	function pad2(n) {
		return String(n).padStart(2, "0");
	}

	function isoDateLocal(d) {
		return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
	}

	function parseHHMM(s) {
		var m = /^(\d{1,2}):(\d{2})$/.exec(String(s || "").trim());
		return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
	}

	function slotsInRange(stepMinutes) {
		var start = parseHHMM(DISPONIBILITA.oraApertura);
		var end = parseHHMM(DISPONIBILITA.oraChiusura);
		var slots = [];
		for (var t = start; t < end; t += stepMinutes) {
			slots.push(pad2(Math.floor(t / 60)) + ":" + pad2(t % 60));
		}
		return slots;
	}

	// Ora corrente nel fuso del club (Europe/Rome), indipendente dal fuso del
	// dispositivo di chi visita il sito da un altro paese.
	function oraLocaleClub() {
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

	// Slot disponibili per un giorno: per oggi si escludono quelli entro le
	// prossime 2 ore, così non si propone un orario che il club non farebbe
	// in tempo a onorare.
	function slotsDisponibili(date, stepMinutes) {
		var slots = slotsInRange(stepMinutes);
		var ora = oraLocaleClub();
		var eOggi = date.getFullYear() === ora.y && date.getMonth() + 1 === ora.m && date.getDate() === ora.d;
		if (eOggi) {
			var soglia = ora.minuti + 120;
			slots = slots.filter(function (s) {
				return parseHHMM(s) >= soglia;
			});
		}
		return slots;
	}

	function buildPicker(tipo) {
		var stepMinutes = tipo === "appuntamento" ? DISPONIBILITA.passoAppuntamento : DISPONIBILITA.passoTelefonata;
		var stripEl = document.getElementById(P + "-giorni-" + tipo);
		var slotsEl = document.getElementById(P + "-slots-" + tipo);
		var nextEl = document.getElementById(P + "-" + tipo + "-next");

		var oggi = new Date();
		oggi.setHours(0, 0, 0, 0);

		var giorni = [];
		for (var i = 0; i < DISPONIBILITA.giorniAvanti; i++) {
			var d = new Date(oggi);
			d.setDate(oggi.getDate() + i);
			giorni.push(d);
		}

		var selDate = null;
		var selTime = null;
		if (nextEl) nextEl.disabled = true;
		slotsEl.hidden = true;
		slotsEl.innerHTML = "";

		stripEl.innerHTML = "";
		giorni.forEach(function (d) {
			var slotsGiorno = slotsDisponibili(d, stepMinutes);
			var btn = document.createElement("button");
			btn.type = "button";
			btn.className = "lf__day";
			if (!slotsGiorno.length) btn.disabled = true;

			var dow = document.createElement("span");
			dow.className = "lf__day-dow";
			dow.textContent = DOW_SHORT[(d.getDay() + 6) % 7];

			var num = document.createElement("span");
			num.className = "lf__day-num";
			num.textContent = String(d.getDate()) + (d.getDate() === 1 ? " " + MESI_BREVI[d.getMonth()] : "");

			btn.appendChild(dow);
			btn.appendChild(num);

			btn.addEventListener("click", function () {
				selDate = d;
				selTime = null;
				if (nextEl) nextEl.disabled = true;
				stripEl.querySelectorAll(".lf__day").forEach(function (b) {
					b.classList.remove("is-selected");
				});
				btn.classList.add("is-selected");
				renderSlots(d, slotsGiorno);
			});

			stripEl.appendChild(btn);
		});

		function renderSlots(d, slots) {
			slotsEl.hidden = false;
			slotsEl.innerHTML = "";

			if (!slots.length) {
				var vuoto = document.createElement("p");
				vuoto.className = "lf__picker-empty";
				vuoto.textContent = "Nessun orario disponibile per questo giorno.";
				slotsEl.appendChild(vuoto);
				return;
			}

			FASCE.forEach(function (fascia) {
				var inFascia = slots.filter(function (s) {
					var h = parseInt(s, 10);
					return h >= fascia.h1 && h < fascia.h2;
				});
				if (!inFascia.length) return;

				var gruppo = document.createElement("div");
				gruppo.className = "lf__slots-group";
				var label = document.createElement("p");
				label.className = "lf__slots-group-label";
				label.textContent = fascia.label;
				var riga = document.createElement("div");
				riga.className = "lf__slots-row";

				inFascia.forEach(function (ora) {
					var sb = document.createElement("button");
					sb.type = "button";
					sb.className = "lf__slot";
					sb.textContent = ora;
					sb.addEventListener("click", function () {
						slotsEl.querySelectorAll(".lf__slot").forEach(function (b) {
							b.classList.remove("is-selected");
						});
						sb.classList.add("is-selected");
						selTime = ora;
						state.dataScelta = d;
						state.oraScelta = ora;
						if (nextEl) nextEl.disabled = false;
					});
					riga.appendChild(sb);
				});

				gruppo.appendChild(label);
				gruppo.appendChild(riga);
				slotsEl.appendChild(gruppo);
			});
		}
	}

	["appuntamento", "telefonata"].forEach(function (tipo) {
		var btn = document.getElementById(P + "-" + tipo + "-next");
		if (!btn) return;
		btn.addEventListener("click", function () {
			var s = getStep("3-" + tipo);
			clearError(s);
			if (!state.dataScelta) return showError(s, ERR.giorno);
			if (!state.oraScelta) return showError(s, ERR.orario);
			showStep("4-dati");
		});
	});

	// ── STEP 3-MESSAGGIO ─────────────────────────────────────────────────
	var messaggioNext = root.querySelector("#" + P + "-messaggio-next");
	if (messaggioNext) {
		messaggioNext.addEventListener("click", function () {
			var s = getStep("3-messaggio");
			clearError(s);
			var testo = root.querySelector("#" + P + "-messaggio-testo");
			if (!testo.value.trim()) {
				showError(s, ERR.messaggio);
				testo.focus();
				return;
			}
			state.messaggioTesto = testo.value.trim();
			showStep("4-dati");
		});
	}

	// ── STEP 4-DATI · Contatto, condiviso dai tre percorsi ──────────────
	var datiBack = root.querySelector("#" + P + "-dati-back");
	if (datiBack) {
		datiBack.addEventListener("click", function () {
			showStep(state.azione === "messaggio" ? "3-messaggio" : "3-" + state.azione);
		});
	}

	var emailInput = root.querySelector("#" + P + "-dati-email");
	var cellInput = root.querySelector("#" + P + "-dati-cellulare");
	var prefissoSelect = root.querySelector("#" + P + "-dati-prefisso");

	emailInput.addEventListener("blur", function () {
		emailInput.classList.toggle("lf__input--error", !!emailInput.value && !isValidEmail(emailInput.value));
	});
	emailInput.addEventListener("input", function () {
		if (isValidEmail(emailInput.value)) emailInput.classList.remove("lf__input--error");
	});
	cellInput.addEventListener("blur", function () {
		cellInput.classList.toggle("lf__input--error", !!cellInput.value && !isValidPhone(cellInput.value));
	});
	cellInput.addEventListener("input", function () {
		if (isValidPhone(cellInput.value)) cellInput.classList.remove("lf__input--error");
	});

	var datiInvia = root.querySelector("#" + P + "-dati-invia");
	if (datiInvia) {
		datiInvia.addEventListener("click", function () {
			var s = getStep("4-dati");
			clearError(s);
			var nome = root.querySelector("#" + P + "-dati-nome");
			var cognome = root.querySelector("#" + P + "-dati-cognome");
			var privacy = root.querySelector("#" + P + "-dati-privacy");

			if (!nome.value.trim()) {
				showError(s, ERR.nome);
				nome.focus();
				return;
			}
			if (!cognome.value.trim()) {
				showError(s, ERR.cognome);
				cognome.focus();
				return;
			}
			if (!isValidEmail(emailInput.value)) {
				emailInput.classList.add("lf__input--error");
				showError(s, ERR.email);
				emailInput.focus();
				return;
			}
			if (!isValidPhone(cellInput.value)) {
				cellInput.classList.add("lf__input--error");
				showError(s, ERR.cellulare);
				cellInput.focus();
				return;
			}
			if (!privacy.checked) return showError(s, ERR.privacy);

			state.nome = nome.value.trim();
			state.cognome = cognome.value.trim();
			state.email = emailInput.value.trim();
			state.cellulare = (prefissoSelect ? prefissoSelect.value : "+39") + " " + cellInput.value.trim();
			state.privacy = true;
			state.marketing = root.querySelector("#" + P + "-dati-marketing").checked;

			inviaRichiesta();
		});
	}

	function fmtDataLunga(d) {
		var GIORNI_LUNGHI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
		var MESI_LUNGHI = [
			"gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
			"luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
		];
		return GIORNI_LUNGHI[d.getDay()] + " " + d.getDate() + " " + MESI_LUNGHI[d.getMonth()];
	}

	var CONFERMA = {
		appuntamento: { titolo: "Ti aspettiamo <em>al Club!</em>" },
		telefonata: { titolo: "Perfetto! <em>Ti richiamiamo noi.</em>" },
		messaggio: { titolo: "Messaggio <em>ricevuto!</em>" },
	};

	function inviaRichiesta() {
		if (WEBHOOK_LEAD) {
			var payload = Object.assign({}, state, {
				dataScelta: state.dataScelta ? isoDateLocal(state.dataScelta) : null,
			});
			try {
				fetch(WEBHOOK_LEAD, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
			} catch (e) {}
		}

		var titolo = root.querySelector("#" + P + "-confirm-title");
		if (titolo) titolo.innerHTML = CONFERMA[state.azione].titolo;

		var rows = [["Attività", state.attivitaLabel]];
		if (state.azione !== "messaggio") {
			rows.push(["Quando", fmtDataLunga(state.dataScelta) + " · ore " + state.oraScelta]);
		}
		rows.push(["Nome", state.nome + " " + state.cognome]);
		rows.push(["Email", state.email]);
		rows.push(["Cellulare", state.cellulare]);
		if (state.azione === "messaggio") rows.push(["Richiesta", state.messaggioTesto]);

		var box = root.querySelector("#" + P + "-confirm-summary");
		if (box) box.innerHTML = rows.map(recapRow).join("");

		showStep("5-conferma");
	}

	// ── Back generico ──────────────────────────────────────────────────
	root.addEventListener("click", function (e) {
		var btn = e.target.closest("[data-step-back]");
		if (!btn) return;
		showStep(btn.dataset.stepBack);
	});

	// Chiusura dai pulsanti [data-lf-close] interni a root (la "X" e i pulsanti
	// "Chiudi"): chiedono al contenitore di chiudersi, la pulizia arriva dopo.
	root.addEventListener("click", function (e) {
		if (e.target.closest("[data-lf-close]")) onClose();
	});

	function clear() {
		state = initialState();

		root.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(function (c) {
			c.checked = false;
		});
		["#" + P + "-messaggio-testo", "#" + P + "-dati-nome", "#" + P + "-dati-cognome", "#" + P + "-dati-email", "#" + P + "-dati-cellulare"].forEach(
			function (sel) {
				var el = root.querySelector(sel);
				if (el) el.value = "";
			}
		);
		[emailInput, cellInput].forEach(function (el) {
			if (el) el.classList.remove("lf__input--error");
		});
		if (prefissoSelect) prefissoSelect.value = "+39";
		syncExtras(null);
		if (nextBtn) nextBtn.disabled = true;
		["appuntamento", "telefonata"].forEach(function (tipo) {
			var strip = document.getElementById(P + "-giorni-" + tipo);
			var slots = document.getElementById(P + "-slots-" + tipo);
			var next = document.getElementById(P + "-" + tipo + "-next");
			if (strip) strip.innerHTML = "";
			if (slots) {
				slots.innerHTML = "";
				slots.hidden = true;
			}
			if (next) next.disabled = true;
		});
		root.querySelectorAll(".lf__error").forEach(function (err) {
			err.hidden = true;
		});
		showStep(1);
	}

	return {
		open: function (pagina, cta, attivita) {
			state.pagina = pagina || location.pathname;
			state.cta = cta || "";
			// Preselezione da data-interest sul pulsante che ha aperto il form:
			// chi arriva dalla pagina Padel non deve ripetere che gli interessa il padel.
			if (attivita) {
				var radio = root.querySelector('input[name="attivita"][value="' + attivita + '"]');
				if (radio) {
					radio.checked = true;
					radio.dispatchEvent(new Event("change", { bubbles: true }));
				}
			}
			showStep(1);
		},
		clear: clear,
	};
}
