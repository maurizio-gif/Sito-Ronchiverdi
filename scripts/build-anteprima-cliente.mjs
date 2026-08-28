// Genera public/anteprima-modulo-contatti.html: la pagina che si manda al
// cliente per far approvare il primo step del modulo contatti.
//
// La pagina NON riscrive il modulo: ne estrae markup e CSS dalla build reale
// (dist/index.html — il modal è ora globale, presente su ogni pagina del sito
// tramite Layout.astro), così quello che vede il cliente e quello che c'è nel
// sito non possono divergere. Attorno ci mette la cornice editoriale che vive
// in scripts/anteprima-cliente/ (testi, stili e interazione della sola pagina
// di presentazione).
//
// Il file finale è autonomo: font inclusi come data URI, nessuna richiesta
// esterna, apribile anche fuori dal sito.
//
// Uso:
//   npx astro build                            # serve la build da cui estrarre
//   node scripts/build-anteprima-cliente.mjs   # scrive in public/
//   npx astro build                            # ricopia public/ dentro dist/
//
// Il secondo build serve perché Astro copia public/ in dist/ solo in fase di
// build: in CI (e su Vercel) basta il build normale, perché il file è già
// committato in public/.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const PARTS = path.join(ROOT, "scripts", "anteprima-cliente");
const SORGENTE = path.join(DIST, "index.html");
const USCITA = path.join(ROOT, "public", "anteprima-modulo-contatti.html");

if (!fs.existsSync(SORGENTE)) {
	console.error(`Manca ${path.relative(ROOT, SORGENTE)}: esegui prima "npx astro build".`);
	process.exit(1);
}

const html = fs.readFileSync(SORGENTE, "utf8");

// ── 1 · Markup del modulo, dalla build ──────────────────────────────────
const dialog = html.match(/<dialog[^>]*id="lead-modal"[\s\S]*?<\/dialog>/)?.[0];
if (!dialog) {
	console.error("Nel file di partenza non c'è il modal #lead-modal.");
	process.exit(1);
}
const pannello = dialog.replace(/^<dialog[^>]*>/, "").replace(/<\/dialog>$/, "").trim();
const attivita = dialog
	.match(/data-activities="([^"]*)"/)[1]
	.replace(/&quot;/g, '"')
	.replace(/&amp;/g, "&");

// ── 2 · Fogli di stile: solo quelli che riguardano il modulo ────────────
// La home page carica anche un grosso bundle di CSS suo (hero, sezioni,
// homepage-only): non ci serve. Il modal è globale (Layout.astro), quindi le
// sue regole .lf__ vivono nel bundle condiviso insieme a token/base — è
// quello, e solo quello, che si deve incollare qui dentro.
const tuttiIFogli = [...html.matchAll(/<link rel="stylesheet" href="\/[^/]+\/([^"]+)"/g)].map((m) => m[1]);
const fogli = tuttiIFogli.filter((f) => {
	const contenuto = fs.readFileSync(path.join(DIST, f), "utf8");
	return contenuto.includes(".lf__") || contenuto.includes("--accent:");
});
if (!fogli.length) {
	console.error("Nessun foglio di stile con le regole .lf__ trovato: controlla la build.");
	process.exit(1);
}
let css = fogli.map((f) => fs.readFileSync(path.join(DIST, f), "utf8")).join("\n");

// ── 3 · Font: teniamo solo i sottoinsiemi latini e li incorporiamo ──────
// I nomi dei file portano l'hash della build, quindi vanno ricavati dal CSS
// e mai fissati qui: cambierebbero al primo rebuild.
let inclusi = 0;
css = css.replace(/@font-face\s*\{[^}]*\}/g, (blocco) => {
	const file = blocco.match(/url\(\/[^/]+\/([^)]+\.woff2)\)/)?.[1];
	if (!file) return "";
	const nome = path.basename(file);
	// "jost-latin-400-normal…" sì; "-latin-ext-", "-cyrillic-", "-vietnamese-" no.
	if (!/-latin-\d/.test(nome)) return "";
	const dati = fs.readFileSync(path.join(DIST, file)).toString("base64");
	inclusi++;
	// Va riscritto tutto il src, non solo la prima url(): fontsource elenca
	// anche un .woff di ripiego, che lascerebbe un riferimento a un file
	// esterno dentro una pagina che deve funzionare da sola.
	return blocco.replace(/src:[^;}]*/, `src:url(data:font/woff2;base64,${dati}) format("woff2")`);
});

const leggi = (f) => fs.readFileSync(path.join(PARTS, f), "utf8");

const corpo = [
	leggi("head.html"),
	pannello,
	leggi("tail.html"),
	`<script type="application/json" id="lead-activities">${attivita}</script>`,
	`<style>\n${css}\n${leggi("page.css")}\n</style>`,
	`<script>\n${leggi("page.js")}\n</script>`,
].join("\n");

const documento = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<meta name="robots" content="noindex, nofollow" />
<meta name="description" content="Anteprima del primo step del modulo contatti Ronchiverdi." />
<style>*,*::before,*::after{box-sizing:border-box}body{margin:0}</style>
</head>
<body>
${corpo}
</body>
</html>
`;

fs.mkdirSync(path.dirname(USCITA), { recursive: true });
fs.writeFileSync(USCITA, documento);

console.log(`Scritto ${path.relative(ROOT, USCITA)}`);
console.log(`  fogli di stile: ${fogli.length} · font incorporati: ${inclusi} · peso: ${(documento.length / 1024).toFixed(0)} KB`);
if (/url\(\/[^)]*\)/.test(css)) console.warn("  attenzione: restano riferimenti a file esterni nel CSS");
