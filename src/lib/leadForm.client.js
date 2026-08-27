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

	// Mappa id → { label, audience }, serializzata dal componente Astro su
	// data-activities: le etichette restano definite una volta sola in
	// src/data/leadActivities.ts e non vanno tenute allineate a mano qui.
	var ACTIVITIES = (function () {
		try {
			return JSON.parse(root.dataset.activities || "{}");
		} catch (e) {
			return {};
		}
	})();

	// Ramificazioni: attività scelta → step successivo. Oggi tutte convergono sul
	// segnaposto; quando i percorsi saranno definiti basterà puntare ogni voce al
	// proprio step ("2-club", "2-young", "2-family", …) senza toccare lo step 1.
	var BRANCHES = {};
	var NEXT_STEP_FALLBACK = "2";

	function nextStepFor(id) {
		return BRANCHES[id] || NEXT_STEP_FALLBACK;
	}

	var ERR = {
		attivita: "Scegli l'attività che ti interessa per continuare.",
	};

	function initialState() {
		return {
			attivita: null,
			attivitaLabel: "",
			audience: "",
			dettagli: [],
			pagina: "",
			cta: "",
		};
	}
	var state = initialState();

	// ── Navigazione fra step ───────────────────────────────────────────
	var stepsBar = root.querySelector(".lf__steps");
	var stepDots = root.querySelectorAll("[data-step-dot]");

	function showStep(n, activeDot) {
		var key = String(n);
		root.querySelectorAll("[data-step]").forEach(function (el) {
			el.hidden = el.dataset.step !== key;
		});
		if (stepsBar) stepsBar.hidden = false;
		if (activeDot !== undefined) {
			stepDots.forEach(function (dot) {
				var d = parseInt(dot.dataset.stepDot, 10);
				dot.classList.toggle("is-active", d === activeDot);
				dot.classList.toggle("is-done", d < activeDot);
			});
		}
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

			renderRecap();
			showStep(nextStepFor(state.attivita), 2);
		});
	}

	// Riepilogo del segnaposto: mostra il ramo imboccato, così in anteprima si
	// verifica che lo step 1 instradi correttamente. Sparirà quando gli step
	// successivi saranno implementati.
	function renderRecap() {
		var box = root.querySelector("#" + P + "-recap");
		if (!box) return;
		var rows = [
			["Attività", state.attivitaLabel],
			["Percorso", state.audience],
		];
		if (state.dettagli.length) rows.push(["Interessi", state.dettagli.join(", ")]);
		box.innerHTML = rows
			.map(function (r) {
				return (
					'<div class="lf__recap-row"><span>' +
					esc(r[0]) +
					"</span><span>" +
					esc(r[1]) +
					"</span></div>"
				);
			})
			.join("");
	}

	// ── Back generico ──────────────────────────────────────────────────
	root.addEventListener("click", function (e) {
		var btn = e.target.closest("[data-step-back]");
		if (!btn) return;
		var t = btn.dataset.stepBack;
		showStep(t, parseInt(t, 10) || 1);
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
		syncExtras(null);
		if (nextBtn) nextBtn.disabled = true;
		var s1 = getStep(1);
		if (s1) clearError(s1);
		showStep(1, 1);
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
			showStep(1, 1);
		},
		clear: clear,
	};
}
