// @ts-check
import { existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Quando node_modules è un collegamento simbolico fuori dalla cartella del
// progetto, il dev server di Vite rifiuta di servire quei file (403) e i font
// @fontsource non si caricano: i titoli ripiegano su Georgia/Arial. Riguarda
// solo lo sviluppo in locale — in build i font vengono impacchettati — quindi
// qui ci limitiamo ad autorizzare il percorso reale, e solo se è davvero un
// link a un'altra posizione.
const nodeModules = fileURLToPath(new URL('./node_modules', import.meta.url));
const nodeModulesReale = existsSync(nodeModules) ? realpathSync(nodeModules) : nodeModules;
const nodeModulesFuoriProgetto = nodeModulesReale !== nodeModules ? [nodeModulesReale] : [];

// In locale e su GitHub Pages il sito vive sotto /Sito-Ronchiverdi/, ma su
// Vercel viene servito dalla root del dominio: la base va quindi adattata
// all'ambiente di build, altrimenti CSS/JS/immagini puntano a un percorso
// che su Vercel non esiste.
const isVercel = !!process.env.VERCEL;

const senzaSlashFinale = (v) => v.replace(/\/+$/, '');

// ─────────────────────────────────────────────────────────────────────────────
// Indirizzo pubblico del sito.
//
// Serve a canonical, Open Graph, JSON-LD e sitemap: sono tutti URL assoluti,
// e se puntano all'indirizzo sbagliato Google indicizza l'indirizzo sbagliato.
//
// L'ordine di scelta:
//   1. SITE_URL — da impostare a mano quando il dominio definitivo è pronto
//      (es. https://www.ronchiverdi.it). È anche l'interruttore che dichiara
//      "questa è la produzione": vedi src/pages/robots.txt.ts.
//   2. VERCEL_PROJECT_PRODUCTION_URL — l'indirizzo *stabile* di produzione del
//      progetto Vercel. Da preferire sempre a VERCEL_URL, che invece cambia a
//      ogni deployment (sito-ronchiverdi-7g3vthec1-r2d.vercel.app): usarlo
//      significherebbe dichiarare a Google un indirizzo diverso a ogni build.
//   3. VERCEL_URL — ultima spiaggia sulle preview, meglio di niente.
//   4. GitHub Pages, dove oggi gira la copia di test.
// ─────────────────────────────────────────────────────────────────────────────
const sitoProduzione = process.env.SITE_URL ? senzaSlashFinale(process.env.SITE_URL) : null;
const sitoVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const site =
	sitoProduzione ?? (isVercel && sitoVercel ? `https://${sitoVercel}` : 'https://maurizio-gif.github.io');

if (!sitoProduzione) {
	// Senza SITE_URL il sito si considera un ambiente di prova e robots.txt
	// chiede ai motori di non indicizzare nulla. È voluto finché si testa —
	// ma al go-live va impostata, altrimenti il sito resta invisibile.
	console.warn(
		`[ronchiverdi] SITE_URL non impostata: build di prova su ${site}, robots.txt bloccherà l'indicizzazione.`
	);
}

// https://astro.build/config
export default defineConfig({
	site,
	base: isVercel ? '/' : '/Sito-Ronchiverdi',
	// Il footer ha linkato a lungo /regolamento, indirizzo che non ha mai avuto
	// una pagina: le regole del club stanno nel documento unico dei termini e
	// condizioni. Il redirect serve a chi ha salvato o citato il vecchio
	// indirizzo, e a non lasciare un 404 in giro per i motori di ricerca.
	redirects: {
		'/regolamento': '/termini-e-condizioni',
	},
	integrations: [
		sitemap({
			// Le pagine marcate noindex nel Layout non devono comparire in sitemap:
			// dichiararle e poi negarle è un segnale contraddittorio per Google.
			filter: (pagina) => !/\/(anteprima|admin|appuntamento)(\/|$)/.test(pagina),
		}),
	],
	// Serve sempre, anche nella build per GitHub Pages: senza adapter, l'unica
	// route non prerenderizzata (src/pages/api/lead.ts) farebbe fallire la
	// build. Con l'adapter presente Astro scrive l'output statico sotto
	// dist/client/ invece che dist/ (vedi deploy.yml), e in più genera la
	// function per /api/lead — che però gira solo su Vercel: su GitHub Pages
	// resta un file statico inerte, dato che quel sito non ha un runtime.
	adapter: vercel(),
	// Nel caso normale non tocchiamo affatto la configurazione di Vite: elencare
	// i percorsi consentiti quando non serve restringerebbe il suo default.
	...(nodeModulesFuoriProgetto.length
		? { vite: { server: { fs: { allow: ['.', ...nodeModulesFuoriProgetto] } } } }
		: {}),
});
