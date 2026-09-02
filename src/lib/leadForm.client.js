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

	var WEBHOOK_LEAD = "/api/lead";

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
	// appuntamento/telefonata/messaggio; "settore-tennis" (Young School Tennis)
	// fa scegliere il settore e raccoglie i dati di genitore e bambino/a;
	// "young-diretto" (Young School Nuoto e Triathlon) raccoglie gli stessi dati
	// di genitore e bambino/a saltando la scelta del settore; "padel" (Corsi
	// Padel, solo adulti) raccoglie subito i dati dell'adulto. Tutte mettono poi
	// in contatto diretto col referente. Le altre attività restano sul
	// segnaposto, in attesa dei referenti da definire attività per attività.
	var NEXT_STEP_FALLBACK = "2";

	function nextStepFor(id) {
		var att = ACTIVITIES[id] || {};
		if (att.contactFlow === "azione") return "2-scelta";
		if (att.contactFlow === "settore-tennis") return "2-settore-tennis";
		if (att.contactFlow === "padel") return "2-dati-padel";
		// Stesso pannello dati del tennis: identici campi genitore + minore.
		if (att.contactFlow === "young-diretto") return "3-dati-young";
		return NEXT_STEP_FALLBACK;
	}

	// A quale pallino dell'indicatore corrisponde ogni step, e se la barra va
	// mostrata: i passi di dettaglio (calendario, messaggio, conferma) restano
	// fuori dai tre pallini principali, esattamente come nel form TCA.
	var STEP_DOT = {
		1: 1,
		2: 2,
		"2-scelta": 2,
		"2-settore-tennis": 2,
		"2-dati-padel": 2,
		"3-dati-young": 3,
		"4-dati": 3,
	};

	// Referenti Young School Tennis: contatto diretto (chiamata o email), senza
	// passare dai passi di raccolta dati condivisi dagli altri percorsi.
	var REFERENTI_TENNIS = {
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

	// Referente Corsi Padel: contatto diretto via WhatsApp o chiamata, nessuna
	// email proposta per questo percorso.
	var REFERENTE_PADEL = {
		titolo: "Istruttore 1° livello Padel FITP",
		nome: "Davide Casale",
		telefonoDisplay: "+39 339 8817507",
		telefonoHref: "+393398817507",
	};

	// Referenti dei percorsi Young senza scelta di settore, per id attività:
	// stesso pannello finale (chiamata, WhatsApp, email, salva contatto), con
	// gli orari della segreteria mostrati solo dove sono stati comunicati.
	var REFERENTI_YOUNG_DIRETTO = {
		"scuola-nuoto": {
			titolo: "Responsabile Young School Nuoto",
			nome: "Sara Tugnolo",
			telefonoDisplay: "+39 380 7522285",
			telefonoHref: "+393807522285",
			email: "youngschoolnuoto@ronchiverdi.it",
			orari: "Segreteria telefonica dedicata: dal lunedì al venerdì, 10:00–13:00 e 16:00–18:00.",
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

	// "Salva contatto": un file .vcf generato al volo, così chi arriva al
	// referente può aggiungerlo in rubrica con nome, cognome e ruolo ai
	// Ronchiverdi senza doverli ricopiare a mano.
	function vcardEscape(v) {
		return String(v)
			.replace(/\\/g, "\\\\")
			.replace(/;/g, "\\;")
			.replace(/,/g, "\\,")
			.replace(/\n/g, "\\n");
	}

	function buildVCardUrl(ref) {
		var spazio = ref.nome.indexOf(" ");
		var datoNome = spazio === -1 ? ref.nome : ref.nome.slice(0, spazio);
		var datoCognome = spazio === -1 ? "" : ref.nome.slice(spazio + 1);

		var righe = [
			"BEGIN:VCARD",
			"VERSION:3.0",
			"N:" + vcardEscape(datoCognome) + ";" + vcardEscape(datoNome) + ";;;",
			"FN:" + vcardEscape(ref.nome),
			"ORG:Ronchiverdi Sport Club",
			"TITLE:" + vcardEscape(ref.titolo),
			"TEL;TYPE=CELL,VOICE:" + ref.telefonoHref,
		];
		if (ref.email) righe.push("EMAIL;TYPE=INTERNET:" + ref.email);
		righe.push("END:VCARD");

		return "data:text/vcard;charset=utf-8," + encodeURIComponent(righe.join("\r\n"));
	}

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
		genitoreNome: "Inserisci il nome del genitore.",
		genitoreCognome: "Inserisci il cognome del genitore.",
		genitoreEmail: "Inserisci un'email valida per il genitore.",
		genitoreCellulare: "Inserisci un numero di cellulare valido per il genitore.",
		bambinoNome: "Inserisci il nome del bambino/a.",
		bambinoCognome: "Inserisci il cognome del bambino/a.",
		bambinoDataNascita: "Inserisci la data di nascita del bambino/a.",
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
			settore: null,
			minoreNome: "",
			minoreCognome: "",
			minoreDataNascita: "",
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
	// Selettore scoperto allo step: ".lf__choice" torna anche nello step
	// 2-settore-tennis (stesso stile, scelta diversa) e i due listener non
	// vanno mescolati.
	getStep("2-scelta").querySelectorAll(".lf__choice").forEach(function (btn) {
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

	// ── STEP 2-SETTORE-TENNIS · Scuola o Competizione ───────────────────
	// Prima di mostrare i contatti diretti del referente raccogliamo i dati di
	// genitore e bambino/a (obbligatori per questo percorso): la scelta del
	// settore porta quindi allo step 3-dati-young, non ancora al contatto.
	root.querySelectorAll("[data-settore]").forEach(function (btn) {
		btn.addEventListener("click", function () {
			state.settore = btn.dataset.settore;
			showStep("3-dati-young");
		});
	});

	// ── STEP 3-DATI-YOUNG · Dati genitore e bambino/a ───────────────────
	var dyGenEmail = root.querySelector("#" + P + "-dy-gen-email");
	var dyGenCell = root.querySelector("#" + P + "-dy-gen-cellulare");
	var dyGenPrefisso = root.querySelector("#" + P + "-dy-gen-prefisso");

	if (dyGenEmail) {
		dyGenEmail.addEventListener("blur", function () {
			dyGenEmail.classList.toggle("lf__input--error", !!dyGenEmail.value && !isValidEmail(dyGenEmail.value));
		});
		dyGenEmail.addEventListener("input", function () {
			if (isValidEmail(dyGenEmail.value)) dyGenEmail.classList.remove("lf__input--error");
		});
	}
	if (dyGenCell) {
		dyGenCell.addEventListener("blur", function () {
			dyGenCell.classList.toggle("lf__input--error", !!dyGenCell.value && !isValidPhone(dyGenCell.value));
		});
		dyGenCell.addEventListener("input", function () {
			if (isValidPhone(dyGenCell.value)) dyGenCell.classList.remove("lf__input--error");
		});
	}

	// Il pannello dati è condiviso: il tennis ci arriva dalla scelta del
	// settore, nuoto e triathlon direttamente dallo step 1.
	var dyBack = root.querySelector("#" + P + "-dy-back");
	if (dyBack) {
		dyBack.addEventListener("click", function () {
			showStep(REFERENTI_YOUNG_DIRETTO[state.attivita] ? 1 : "2-settore-tennis");
		});
	}

	var dyInvia = root.querySelector("#" + P + "-dy-invia");
	if (dyInvia) {
		dyInvia.addEventListener("click", function () {
			var s = getStep("3-dati-young");
			clearError(s);

			var genNome = root.querySelector("#" + P + "-dy-gen-nome");
			var genCognome = root.querySelector("#" + P + "-dy-gen-cognome");
			var bamNome = root.querySelector("#" + P + "-dy-bam-nome");
			var bamCognome = root.querySelector("#" + P + "-dy-bam-cognome");
			var bamNascita = root.querySelector("#" + P + "-dy-bam-nascita");
			var privacy = root.querySelector("#" + P + "-dy-privacy");

			if (!genNome.value.trim()) {
				showError(s, ERR.genitoreNome);
				genNome.focus();
				return;
			}
			if (!genCognome.value.trim()) {
				showError(s, ERR.genitoreCognome);
				genCognome.focus();
				return;
			}
			if (!isValidEmail(dyGenEmail.value)) {
				dyGenEmail.classList.add("lf__input--error");
				showError(s, ERR.genitoreEmail);
				dyGenEmail.focus();
				return;
			}
			if (!isValidPhone(dyGenCell.value)) {
				dyGenCell.classList.add("lf__input--error");
				showError(s, ERR.genitoreCellulare);
				dyGenCell.focus();
				return;
			}
			if (!bamNome.value.trim()) {
				showError(s, ERR.bambinoNome);
				bamNome.focus();
				return;
			}
			if (!bamCognome.value.trim()) {
				showError(s, ERR.bambinoCognome);
				bamCognome.focus();
				return;
			}
			if (!bamNascita.value) {
				showError(s, ERR.bambinoDataNascita);
				bamNascita.focus();
				return;
			}
			if (!privacy.checked) return showError(s, ERR.privacy);

			state.nome = genNome.value.trim();
			state.cognome = genCognome.value.trim();
			state.email = dyGenEmail.value.trim();
			state.cellulare = (dyGenPrefisso ? dyGenPrefisso.value : "+39") + " " + dyGenCell.value.trim();
			state.minoreNome = bamNome.value.trim();
			state.minoreCognome = bamCognome.value.trim();
			state.minoreDataNascita = bamNascita.value;
			state.privacy = true;
			state.marketing = root.querySelector("#" + P + "-dy-marketing").checked;

			inviaRichiestaYoung();
		});
	}

	function inviaRichiestaYoung() {
		if (WEBHOOK_LEAD) {
			try {
				fetch(WEBHOOK_LEAD, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(state),
				});
			} catch (e) {}
		}

		// Lo stesso pannello dati serve tennis (con settore) e nuoto/triathlon
		// (senza): il pannello finale da mostrare dipende da quale.
		var refDiretto = REFERENTI_YOUNG_DIRETTO[state.attivita];
		if (refDiretto) {
			renderReferenteYoungDiretto(refDiretto);
			showStep("4-referente-young");
		} else {
			renderReferenteTennis(state.settore);
			showStep("4-referente-tennis");
		}
	}

	function renderReferenteYoungDiretto(ref) {
		var intro = root.querySelector("#" + P + "-young-intro");
		if (intro) {
			intro.innerHTML =
				"Il tuo riferimento è <strong>" +
				esc(ref.titolo) +
				" " +
				esc(ref.nome) +
				"</strong>: " +
				(ref.senzaChiamata
					? "puoi scrivere su WhatsApp o mandare una email."
					: "puoi chiamare, scrivere su WhatsApp o mandare una email.");
		}

		var orari = root.querySelector("#" + P + "-young-orari");
		if (orari) {
			orari.textContent = ref.orari || "";
			orari.hidden = !ref.orari;
		}

		// Dove il numero serve solo per WhatsApp la chiamata non va proposta:
		// il pulsante sparisce invece di rimandare a un numero che non risponde.
		var callBtn = root.querySelector("#" + P + "-young-chiama");
		if (callBtn) {
			callBtn.hidden = !!ref.senzaChiamata;
			callBtn.href = "tel:" + ref.telefonoHref;
		}
		var callLabel = root.querySelector("#" + P + "-young-tel-label");
		if (callLabel) callLabel.textContent = ref.telefonoDisplay;

		var waBtn = root.querySelector("#" + P + "-young-whatsapp");
		if (waBtn) {
			waBtn.href = "https://wa.me/" + ref.telefonoHref.replace("+", "");
			// Senza il pulsante Chiama, WhatsApp diventa l'azione principale.
			waBtn.classList.toggle("lf__referente-btn--outline", !ref.senzaChiamata);
		}

		var emailBtn = root.querySelector("#" + P + "-young-email");
		if (emailBtn) emailBtn.href = "mailto:" + ref.email;
		var emailLabel = root.querySelector("#" + P + "-young-email-label");
		if (emailLabel) emailLabel.textContent = ref.email;

		var salvaBtn = root.querySelector("#" + P + "-young-salva");
		if (salvaBtn) {
			salvaBtn.href = buildVCardUrl(ref);
			salvaBtn.download = ref.nome + ".vcf";
		}
	}

	function renderReferenteTennis(settore) {
		var ref = REFERENTI_TENNIS[settore];
		if (!ref) return;

		var intro = root.querySelector("#" + P + "-referente-intro");
		if (intro) {
			intro.innerHTML =
				"Per il <strong>" +
				esc(settore === "scuola" ? "Settore Scuola" : "Settore Competizione") +
				"</strong> il tuo riferimento è <strong>" +
				esc(ref.titolo) +
				" " +
				esc(ref.nome) +
				"</strong>: puoi chiamare o scrivere direttamente.";
		}

		var callBtn = root.querySelector("#" + P + "-referente-chiama");
		if (callBtn) callBtn.href = "tel:" + ref.telefonoHref;
		var callLabel = root.querySelector("#" + P + "-referente-tel-label");
		if (callLabel) callLabel.textContent = ref.telefonoDisplay;

		var emailBtn = root.querySelector("#" + P + "-referente-email");
		if (emailBtn) emailBtn.href = "mailto:" + ref.email;
		var emailLabel = root.querySelector("#" + P + "-referente-email-label");
		if (emailLabel) emailLabel.textContent = ref.email;

		var salvaBtn = root.querySelector("#" + P + "-referente-salva");
		if (salvaBtn) {
			salvaBtn.href = buildVCardUrl(ref);
			salvaBtn.download = ref.nome + ".vcf";
		}
	}

	// ── STEP 2-DATI-PADEL · Dati dell'adulto (Corsi Padel) ──────────────
	var dpEmail = root.querySelector("#" + P + "-dp-email");
	var dpCell = root.querySelector("#" + P + "-dp-cellulare");
	var dpPrefisso = root.querySelector("#" + P + "-dp-prefisso");

	if (dpEmail) {
		dpEmail.addEventListener("blur", function () {
			dpEmail.classList.toggle("lf__input--error", !!dpEmail.value && !isValidEmail(dpEmail.value));
		});
		dpEmail.addEventListener("input", function () {
			if (isValidEmail(dpEmail.value)) dpEmail.classList.remove("lf__input--error");
		});
	}
	if (dpCell) {
		dpCell.addEventListener("blur", function () {
			dpCell.classList.toggle("lf__input--error", !!dpCell.value && !isValidPhone(dpCell.value));
		});
		dpCell.addEventListener("input", function () {
			if (isValidPhone(dpCell.value)) dpCell.classList.remove("lf__input--error");
		});
	}

	var dpInvia = root.querySelector("#" + P + "-dp-invia");
	if (dpInvia) {
		dpInvia.addEventListener("click", function () {
			var s = getStep("2-dati-padel");
			clearError(s);

			var nome = root.querySelector("#" + P + "-dp-nome");
			var cognome = root.querySelector("#" + P + "-dp-cognome");
			var privacy = root.querySelector("#" + P + "-dp-privacy");

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
			if (!isValidEmail(dpEmail.value)) {
				dpEmail.classList.add("lf__input--error");
				showError(s, ERR.email);
				dpEmail.focus();
				return;
			}
			if (!isValidPhone(dpCell.value)) {
				dpCell.classList.add("lf__input--error");
				showError(s, ERR.cellulare);
				dpCell.focus();
				return;
			}
			if (!privacy.checked) return showError(s, ERR.privacy);

			state.nome = nome.value.trim();
			state.cognome = cognome.value.trim();
			state.email = dpEmail.value.trim();
			state.cellulare = (dpPrefisso ? dpPrefisso.value : "+39") + " " + dpCell.value.trim();
			state.privacy = true;
			state.marketing = root.querySelector("#" + P + "-dp-marketing").checked;

			inviaRichiestaPadel();
		});
	}

	function inviaRichiestaPadel() {
		if (WEBHOOK_LEAD) {
			try {
				fetch(WEBHOOK_LEAD, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(state),
				});
			} catch (e) {}
		}
		renderReferentePadel();
		showStep("3-referente-padel");
	}

	function renderReferentePadel() {
		var ref = REFERENTE_PADEL;

		var intro = root.querySelector("#" + P + "-padel-intro");
		if (intro) {
			intro.innerHTML =
				"Il tuo riferimento per i Corsi Padel è <strong>" +
				esc(ref.titolo) +
				" " +
				esc(ref.nome) +
				"</strong>: puoi scrivere su WhatsApp o chiamare direttamente.";
		}

		var waBtn = root.querySelector("#" + P + "-padel-whatsapp");
		if (waBtn) waBtn.href = "https://wa.me/" + ref.telefonoHref.replace("+", "");

		var callBtn = root.querySelector("#" + P + "-padel-chiama");
		if (callBtn) callBtn.href = "tel:" + ref.telefonoHref;
		var callLabel = root.querySelector("#" + P + "-padel-tel-label");
		if (callLabel) callLabel.textContent = ref.telefonoDisplay;

		var salvaBtn = root.querySelector("#" + P + "-padel-salva");
		if (salvaBtn) {
			salvaBtn.href = buildVCardUrl(ref);
			salvaBtn.download = ref.nome + ".vcf";
		}
	}

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
		[
			"#" + P + "-messaggio-testo",
			"#" + P + "-dati-nome",
			"#" + P + "-dati-cognome",
			"#" + P + "-dati-email",
			"#" + P + "-dati-cellulare",
			"#" + P + "-dy-gen-nome",
			"#" + P + "-dy-gen-cognome",
			"#" + P + "-dy-gen-email",
			"#" + P + "-dy-gen-cellulare",
			"#" + P + "-dy-bam-nome",
			"#" + P + "-dy-bam-cognome",
			"#" + P + "-dy-bam-nascita",
			"#" + P + "-dp-nome",
			"#" + P + "-dp-cognome",
			"#" + P + "-dp-email",
			"#" + P + "-dp-cellulare",
		].forEach(function (sel) {
			var el = root.querySelector(sel);
			if (el) el.value = "";
		});
		[emailInput, cellInput, dyGenEmail, dyGenCell, dpEmail, dpCell].forEach(function (el) {
			if (el) el.classList.remove("lf__input--error");
		});
		if (prefissoSelect) prefissoSelect.value = "+39";
		if (dyGenPrefisso) dyGenPrefisso.value = "+39";
		if (dpPrefisso) dpPrefisso.value = "+39";
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
