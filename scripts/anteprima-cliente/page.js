// Interazione dello step 1, replicata per la pagina di presentazione:
// selezione singola, chip facoltativi, Continua → riepilogo, Indietro.
// (Nel sito la stessa logica vive in src/lib/leadForm.client.js.)
(function () {
	var panel = document.querySelector(".lf__panel");
	if (!panel) return;

	var frame = document.querySelector(".pg-frame");
	var nextBtn = document.getElementById("lm-step1-next");
	var recap = document.getElementById("lm-recap");
	var radios = panel.querySelectorAll('input[name="attivita"]');
	var LABELS = {};
	try {
		LABELS = JSON.parse(document.getElementById("lead-activities").textContent);
	} catch (e) {}

	function step(n, dot) {
		panel.querySelectorAll("[data-step]").forEach(function (el) {
			el.hidden = el.dataset.step !== String(n);
		});
		panel.querySelectorAll("[data-step-dot]").forEach(function (d) {
			var i = parseInt(d.dataset.stepDot, 10);
			d.classList.toggle("is-active", i === dot);
			d.classList.toggle("is-done", i < dot);
		});
		panel.scrollTop = 0;
	}

	function syncExtras(id) {
		panel.querySelectorAll("[data-extra-for]").forEach(function (p) {
			var mine = p.dataset.extraFor === id;
			p.hidden = !mine;
			if (!mine) {
				p.querySelectorAll('input[type="checkbox"]').forEach(function (c) {
					c.checked = false;
				});
			}
		});
	}

	radios.forEach(function (r) {
		r.addEventListener("change", function () {
			if (!r.checked) return;
			syncExtras(r.value);
			nextBtn.disabled = false;
		});
	});

	function esc(s) {
		return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	nextBtn.addEventListener("click", function () {
		var sel = panel.querySelector('input[name="attivita"]:checked');
		if (!sel) return;
		var info = LABELS[sel.value] || { label: sel.value, audience: sel.dataset.audience };
		var chips = Array.prototype.map.call(
			panel.querySelectorAll('input[name="dettagli"]:checked'),
			function (c) {
				return c.value;
			}
		);
		var righe = [
			["Attività", info.label],
			["Percorso", info.audience],
		];
		if (chips.length) righe.push(["Interessi", chips.join(", ")]);
		recap.innerHTML = righe
			.map(function (r) {
				return '<div class="lf__recap-row"><span>' + esc(r[0]) + "</span><span>" + esc(r[1]) + "</span></div>";
			})
			.join("");
		step(2, 2);
	});

	panel.addEventListener("click", function (e) {
		if (e.target.closest("[data-step-back]")) step(1, 1);
	});

	function reset() {
		panel.querySelectorAll("input").forEach(function (c) {
			c.checked = false;
		});
		syncExtras(null);
		nextBtn.disabled = true;
		step(1, 1);
	}

	// La "X" nel sito chiude il modal: qui lo mostriamo chiuso, con il
	// pulsante per riaprirlo — così si vede anche che riparte pulito.
	panel.addEventListener("click", function (e) {
		if (e.target.closest("[data-lf-close]")) {
			reset();
			frame.classList.add("is-closed");
		}
	});
	document.querySelector(".pg-reopen").addEventListener("click", function () {
		frame.classList.remove("is-closed");
	});
})();
