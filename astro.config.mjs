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

// ─────────────────────────────────────────────────────────────────────────────
// Redirect.
//
// Due gruppi con la stessa forma ma origini diverse: gli indirizzi interni
// riorganizzati, e gli 83 indirizzi del vecchio sito Wix che questo progetto
// non serve più con lo stesso nome.
//
// Quelli del vecchio sito sono la parte che vale: l'inventario dello scraping
// (scripts/scrape_output/inventario.csv) elenca 110 righe, cioè 105 indirizzi
// pubblici distinti, e solo 22 hanno un equivalente diretto qui — i 18
// articoli del blog, che hanno lo stesso slug di prima, più le pagine che si
// chiamano ancora così (/blog, /abbonamenti, /faq, /hyrox). Gli altri 83
// diventerebbero 404 il giorno del cambio DNS, e con loro il posizionamento
// che hanno accumulato: sono link vivi su Google, nelle newsletter e sui QR
// già stampati.
//
// La regola seguita dove il vecchio indirizzo non ha un vero corrispondente:
// si punta alla pagina che serve la stessa intenzione, non alla home. Chi
// cercava gli orari vuole il planning, chi cercava un evento vuole l'elenco
// eventi, chi cercava il modulo contatti vuole una pagina da cui si possa
// ancora scrivere al club. La home è il ripiego solo per le pagine che non
// avevano un contenuto proprio.
//
// Ogni voce è dichiarata in una forma sola, senza slash finale, perché è
// quella che il vecchio sito pubblicava e che i motori hanno indicizzato
// (nell'inventario non c'è un solo indirizzo con lo slash). Va saputo però
// che Astro compila questi redirect in una regex esatta — `^/tennis$`, non
// `^/tennis/?$` come fa per le rotte a richiesta — e che dichiarare anche
// `/tennis/` non è la soluzione: per Astro è la stessa rotta due volte, e la
// build lo segnala come collisione. Se serve coprire anche la forma con lo
// slash, si attiva l'impostazione "Trailing Slash" del progetto Vercel, che
// normalizza a monte per tutto il sito.
// ─────────────────────────────────────────────────────────────────────────────

// Il footer ha linkato a lungo /regolamento, indirizzo che non ha mai avuto
// una pagina: le regole del club stanno nel documento unico dei termini e
// condizioni. Il redirect serve a chi ha salvato o citato il vecchio
// indirizzo, e a non lasciare un 404 in giro per i motori di ricerca.
const redirectInterni = {
	'/regolamento': '/termini-e-condizioni',
};

// Le verticali sportive del vecchio sito. Sono gli indirizzi più visitati del
// gruppo e quelli con più link in ingresso: qui una destinazione precisa
// (anche l'ancora della sezione giusta) vale più che altrove.
const redirectSport = {
	'/tennis': '/attivita/tennis',
	'/tennis-young': '/attivita/tennis#young',
	'/padel': '/attivita/padel',
	'/padel-young': '/attivita/padel#young',
	'/fitness': '/attivita/corsi-fitness',
	'/piscine': '/attivita/nuoto-libero',
	'/nuoto-young': '/attivita/scuola-nuoto',
	'/triathlon': '/attivita/triathlon',
	'/triathlon-young': '/attivita/triathlon#young',
	// Il gruppo di corsa del club non ha una pagina propria: la sua attività
	// vive dentro il triathlon, sezione Master, che è quella degli adulti che
	// gareggiano — comprese le gare di corsa del calendario stagionale.
	'/running': '/attivita/triathlon#master',
	'/pt': '/attivita/personal-training',
	'/chinesis': '/servizi/chinesis',
	// La Relax Zone è una parte della Spa, non un servizio a sé.
	'/relax-zone': '/servizi/spa',
	// "Area kids" era l'indice della Young School: qui la Young School è il
	// carosello junior della sezione attività, non una pagina.
	'/area-kids': '/#attivita',
	'/youngschool-soci': '/#attivita',
	'/youngschool-non-soci': '/#attivita',
	// Sul vecchio sito /kids era il Summer Sport Camp, e /coming-soon-02 la
	// sua landing.
	'/kids': '/attivita/summer-camp',
	'/copia-di-kids': '/attivita/summer-camp',
	'/coming-soon-02': '/attivita/summer-camp',
	'/service-page/summer-experience': '/attivita/summer-camp',
	// Le tre schede del "portfolio" Wix erano di fatto pagine di attività.
	'/portfolio-collections/my-portfolio/gym-floor': '/attivita/gym-floor',
	'/portfolio-collections/my-portfolio/lacertosus': '/attivita/gym-floor#lacertosus',
	'/portfolio-collections/my-portfolio/group-class': '/attivita/corsi-fitness',
	// Orari e prenotazioni: il planning è la pagina che risponde a entrambe.
	'/orari': '/planning',
	'/orari-club': '/planning',
	'/reservations': '/planning',
	'/book-online': '/planning',
	// Indici e doppioni della home Wix, senza contenuto proprio.
	'/sport': '/',
	'/home-sport': '/',
	'/portfolio': '/',
	'/portfolio-collections/my-portfolio': '/',
	'/video': '/',
	// Pagina di lavoro: raccoglieva le icone per l'ecommerce Wix.
	'/icone': '/',
};

// Eventi. Sul vecchio sito ogni evento aveva la sua pagina sotto
// /event-details/, e sono tutti passati: non esiste una pagina di destinazione
// per ognuno, ma l'elenco eventi è quello che chi arriva sta cercando.
// L'elenco è chiuso e scritto per esteso — Astro non reindirizza una rotta
// dinamica verso una statica, e comunque tenere i nomi qui documenta cosa
// c'era prima.
const redirectEventi = {
	'/event-list': '/eventi',
	'/event-details/4-elements': '/eventi',
	'/event-details/4-elements-2': '/eventi',
	'/event-details/4-elements-15-luglio': '/eventi',
	'/event-details/4-elements-ospiti': '/eventi',
	'/event-details/4-elements-prevendita': '/eventi',
	'/event-details/four-elements-private-preview': '/eventi',
	'/event-details/business-match-2025': '/eventi',
	'/event-details/gala-sotto-le-stelle': '/eventi',
	'/event-details/mom-wellness-experience': '/eventi',
	'/event-details/open-day-summer-sport-camp': '/eventi',
	'/event-details/oronero-alchemy': '/eventi',
	'/event-details/oronero-alchemy-partner': '/eventi',
	'/event-details/oronero-arte-in-passerella': '/eventi',
	'/event-details/papa-power-day': '/eventi',
	'/event-details/papa-power-day-soci': '/eventi',
	'/event-details/pasqua-2026': '/eventi',
	'/event-details/pasqua-ronchiverdi-elements': '/eventi',
	'/event-details/ronchiverdi-christmas-event': '/eventi',
	'/event-details/san-valentino-2026': '/eventi',
	'/event-details/tennis-vibes-spritz-iscriviti-entro-giovedi-6-giugno': '/eventi',
	// Oronero è un format di eventi del club, non un servizio: sta con gli
	// eventi e non sul sito Business.
	'/oronero': '/eventi',
	// Bozza vuota, si chiamava "Ronchiverdi Summer".
	'/copia-di-event': '/eventi',
	// "Experiences" erano i servizi prenotabili di Wix, mai compilati.
	'/experiences': '/eventi',
	'/experience-details': '/eventi',
	// Landing di raccolta contatti legate a singoli eventi.
	'/lead-eventi': '/eventi',
	'/lead-eventi-elements': '/eventi',
	'/copia-di-lead-eventi': '/eventi',
};

// Moduli di contatto e informative. /faq è la pagina che risponde a chi ha
// domande e che porta il modulo con sé, quindi è la destinazione giusta per i
// vecchi "Contattaci"; "Prenota un tour" invece è una richiesta di visita, e
// chi la fa deve prima vedere il club.
const redirectContatti = {
	'/general-1': '/faq',
	'/copia-di-orari-club': '/faq',
	'/service-page/prenota-un-tour': '/',
	'/privacy-lead-eventi': '/privacy',
};

// Business ed Elements: fuori dal perimetro di questo progetto, vivono sul
// sito Business. Gli unici indirizzi di destinazione usati sono quelli che il
// sito già conosce (vedi Nav, Footer e src/content/services/): le pagine più
// profonde del vecchio sito — carta dei vini, martini lounge, i vari menu —
// vengono raccolte sulla pagina del ristorante invece di indovinare un
// percorso che su quel sito potrebbe non esistere.
//
// ATTENZIONE: business.ronchiverdi.it oggi non risolve. Questi redirect
// funzionano solo dal momento in cui il sottodominio esiste, che è comunque
// un prerequisito del cambio DNS — finché il dominio del club sta su Wix
// nessuno arriva a questi indirizzi passando da qui.
const BUSINESS = 'https://www.business.ronchiverdi.it';

const redirectBusiness = {
	'/business': BUSINESS,
	'/home-business': BUSINESS,
	'/copia-di-business': BUSINESS,
	'/eventi-business': BUSINESS,
	'/upcoming-eventi-business': BUSINESS,
	'/business-lounge': `${BUSINESS}/business-lounge`,
	'/elements': `${BUSINESS}/elements`,
	'/caffetteria': `${BUSINESS}/elements`,
	'/carta-dei-vini': `${BUSINESS}/elements`,
	'/menu': `${BUSINESS}/elements`,
	'/menu-serale': `${BUSINESS}/elements`,
	'/menu-caffetteria': `${BUSINESS}/elements`,
	'/menu-provvisorio': `${BUSINESS}/elements`,
	'/martini-lounge': `${BUSINESS}/elements`,
	'/martini-lounge-pool': `${BUSINESS}/elements`,
};

// Servizi chiusi o mai partiti, senza un corrispondente nel club di oggi:
// l'agenzia viaggi e il campus riservato agli studenti SAA. Chi li cerca
// merita almeno la pagina che dice cos'è il club adesso.
const redirectDismessi = {
	'/ronchi-viaggi': '/',
	'/saa-flex': '/abbonamenti',
	'/saauniversitywellness': '/abbonamenti',
};

// https://astro.build/config
export default defineConfig({
	site,
	base: isVercel ? '/' : '/Sito-Ronchiverdi',
	redirects: {
		...redirectInterni,
		...redirectSport,
		...redirectEventi,
		...redirectContatti,
		...redirectBusiness,
		...redirectDismessi,
	},
	integrations: [
		sitemap({
			// Le pagine marcate noindex nel Layout non devono comparire in sitemap:
			// dichiararle e poi negarle è un segnale contraddittorio per Google.
			filter: (pagina) => !/\/(anteprima|admin|appuntamento|guest-register)(\/|$)/.test(pagina),
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
