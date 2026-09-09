# Ronchiverdi Sport — sito

Nuovo sito della sola area **Sport** di Ronchiverdi (Business ed Elements/ristorante
sono esclusi da questo progetto). Stack: [Astro](https://astro.build) +
[Tina CMS](https://tina.io), content collection basate su file Markdown gestiti
via git.

> Questa è la base tecnica del progetto. La struttura definitiva delle pagine
> (verticali sport, young school, corsi, ecc.) è ancora da definire —
> vedi la sezione "Stato attuale" più sotto.

## Struttura del progetto

```text
/
├── public/                  asset statici (immagini, favicon)
├── src/
│   ├── content.config.ts    definizione delle content collection Astro
│   ├── content/
│   │   ├── pages/            pagine gestite da Tina (collection "page")
│   │   └── events/            eventi del club gestiti da Tina (collection "event")
│   └── pages/
│       └── index.astro       homepage (provvisoria)
├── tina/
│   └── config.ts             schema Tina CMS (collection, campi)
├── astro.config.mjs
└── package.json
```

## Comandi

| Comando              | Azione                                                         |
| -------------------- | --------------------------------------------------------------- |
| `npm install`         | Installa le dipendenze                                          |
| `npm run dev`         | Avvia Astro + Tina in locale (`localhost:4321`, admin su `/admin`) |
| `npm run build`       | Build di produzione in modalità self-hosted (`./dist/`)         |
| `npm run build:cloud` | Build di produzione usando Tina Cloud (richiede `TINA_CLIENT_ID`/`TINA_TOKEN`) |
| `npm run preview`     | Serve la build in locale prima del deploy                       |

## Tina CMS: locale vs Tina Cloud

Il progetto è configurato per funzionare **subito, senza account esterni**:
`npm run dev` e `npm run build` girano in modalità self-hosted (editing diretto
sui file del repo). Quando si vorrà dare accesso all'editor visuale a persone
non tecniche in produzione, servirà creare un progetto su
[tina.io](https://tina.io) (piano gratuito disponibile) e impostare le
variabili d'ambiente `TINA_CLIENT_ID` e `TINA_TOKEN`, poi usare
`npm run build:cloud` in deploy.

## Content collection

Le collection gestite da Tina:

- **`pages`** (`src/content/pages/*.md`) — pagine generiche
- **`events`** (`src/content/events/*.md`) — eventi del club: restano online
  fino alla loro data (o alla data di fine), poi spariscono da soli. Il filtro
  è calcolato in build, quindi il workflow di deploy include un **rebuild
  giornaliero** (cron alle 03:15 UTC); nel frattempo `EventExpiryGuard`
  rimuove nel browser gli eventi già passati, così un evento scaduto non
  resta a video nemmeno se la build è vecchia
- **`memberships`** (`src/content/memberships/tabella.json`) — tabella
  abbonamenti, sorgente unica per tutte le pagine che la mostrano
- **`activities`** / **`services`** — card di attività e servizi

Lo schema è definito in due punti che devono restare allineati:
`tina/config.ts` (editor) e `src/content.config.ts` (validazione Astro).

## Domande frequenti

Le FAQ del club vivono tutte in **`src/data/faq.ts`**, non più dentro le singole
pagine. Ogni voce dichiara la `pagina` a cui appartiene (e con `anche` le altre
pagine su cui va mostrata); da lì:

- la pagina di attività le prende con `faqDiPagina("tennis")`;
- **`/faq`** le raccoglie tutte, raggruppate per area, con ricerca e ancore
  stabili (`/faq#tennis-e-necessario-il-tesseramento`);
- `Faq.astro` pubblica da solo lo structured data **FAQPage** delle domande che
  sta mostrando — quindi una FAQ nuova entra nei rich results senza altri passi.

## Area riservata

L'omino nella barra apre **`AccountModal.astro`**, montato nel Layout come il
modulo contatti: dietro ci sono i link che servono a chi è già socio. Prima non
esistevano da nessuna parte come insieme — l'App del Club era citata dentro due
f.a.q. del fitness, Wansport dentro la pagina del padel, il portale InforYou
sotto ai prezzi dei listini, gli orari nel menu — e dal sito non si arrivava al
proprio account.

Le voci stanno in **`src/data/areaRiservata.ts`** e non nel markup del pannello,
perché sono le stesse che vivono già nelle pagine: gli indirizzi si leggono da
dove il sito li tiene già (`APP_URL` e `WANSPORT_URL` da `data/faq.ts`, la base
del portale da `lib/portale.ts`). Un indirizzo che cambia cambia in un posto
solo, e il pannello non può raccontare una cosa diversa dalla pagina.

Tre blocchi, nell'ordine della frequenza con cui si usano: **prenota** (le due
app e il planning), **il tuo account** (il portale, e il telefono della
segreteria per le credenziali smarrite), **iscrizioni online** (le quattro
pagine di iscrizione, che sono anche quelle del footer — la lista è la stessa
costante `ISCRIZIONI`).

Tre cose da sapere prima di toccarlo.

- **Un indirizzo che non abbiamo non si indovina.** Il portale punta al catalogo
  del club, che è l'unico indirizzo InforYou che il sito conosce e che il login
  attraversa: un percorso di login scritto a intuito non darebbe errore, porterebbe
  una persona su una pagina che non c'è. Se il club dà il link diretto
  all'accesso, si aggiunge in quel blocco. Per la stessa ragione le credenziali
  smarrite sono un numero di telefono e non una pagina di reset: è quello che
  dicono già la f.a.q. dell'iscrizione al nuoto e la nota della pagina del padel.
- **Nella barra è un'icona, nel menu del telefono è una voce scritta.** Accanto a
  "Contattaci" due comandi pieni si farebbero concorrenza, e quello che vende è
  l'altro; nel drawer, invece, non c'è una barra su cui un'icona si riconosca per
  posizione, e un'icona muta la trova solo chi la sta cercando. **Sotto i 360px
  l'omino esce dalla barra**: i tre comandi non ci stanno (misurato: sforava di
  19px), e l'area riservata ha il suo ripiego nel menu mentre "Contattaci" no.
- **Il pannello non deve scorrere.** Nove voci su una scrivania da 900px stavano
  appena fuori, e un pannello che si scorre è un pannello in cui uno dei tre
  blocchi non si vede: da qui le iscrizioni su due colonne (etichette di una
  parola, nessuna nota) e l'assenza di un paragrafo di apertura, che ripeteva i
  nomi dei tre blocchi sottostanti.

Per verificare: la spazzata del totem (1080×1920) e dei formati telefono e
scrivania sul pannello aperto — nessun overflow, nessun comando sotto i 44px,
niente sotto i 19px sul totem, nessuna nota che va a capo. In un browser: il
comando apre il pannello **senza navigare** (`location.pathname` non cambia),
con `body.ar-locked`; X, Esc e backdrop lo chiudono e riportano il focus
sull'omino; a pannello chiuso nessuno dei nove link è raggiungibile col tab; e
dal menu del telefono l'apertura chiude prima il drawer, o il pannello resterebbe
dietro all'overlay.

## Pagine legali

`/privacy` e `/termini-e-condizioni` usano lo stesso impianto:
**`src/layouts/Legale.astro`** (intestazione, data di aggiornamento, indice ad
ancore) più **`src/styles/legale.css`**, che viaggia solo con quelle pagine. Una
pagina legale nuova si scrive quindi come solo contenuto, senza ricopiare stili.

I termini e condizioni sono il documento unico che sostituisce i regolamenti
consegnati in reception, scritto come **articolato**: la pagina genera articoli
e punti numerati (`#art-6-9`, citabili e linkabili) dall'elenco `articoli`, con
i rimandi interni espressi come segnaposto `{{art:id}}` e una ricerca per parole
chiave sopra il testo. `docs/armonizzazione-regolamenti.md` tiene traccia di
quali fonti sono confluite dove, delle contraddizioni sciolte e dei punti ancora
da confermare con il club. Va letto prima di modificare una regola della pagina.

La regola che tiene insieme tutto: i dati che vivono altrove — prezzi e
contenuti degli abbonamenti in `/abbonamenti`, orari in `/planning`, risposte
operative in `/faq` — si linkano, non si ricopiano.

## Lavora con noi

`/lavora-con-noi` raccoglie candidature spontanee: il club non pubblica
posizioni aperte, quindi la pagina elenca le **aree** in cui cerca persone
(`src/data/lavoraConNoi.ts`) e apre un modulo con due campi lunghi e il
curriculum allegato.

Il file **non passa dal nostro server**: una function Vercel accetta 4,5 MB nel
corpo della richiesta e il modulo ne promette 5, quindi l'invio è in tre passi.

1. `POST /api/candidatura/upload` firma il caricamento con la service_role key
   e restituisce percorso, URL firmata e content-type;
2. il browser fa `PUT` di quel file direttamente sul bucket privato
   `candidature-cv`;
3. `POST /api/candidatura` salva il testo del modulo e il percorso — dopo aver
   verificato che l'oggetto esista davvero e pesi quanto dichiara: il percorso
   arriva dal client, e "difficile da indovinare" non è un controllo d'accesso.

Formati e limiti stanno in `src/lib/candidature.ts` e sono ripetuti nel bucket
(vedi la migration): se cambiano in un posto vanno cambiati anche nell'altro, o
il modulo accetta un file che poi lo storage rifiuta.

Tabella e bucket: **`scripts/sql/2026-09-08-candidature.sql`**, da eseguire dal
SQL Editor di Supabase. Le candidature le legge il pannello
(APP-RONCHIVERDI, sezione *Curriculum*), che scarica il CV con una URL firmata:
il bucket resta privato e non è raggiungibile da un indirizzo pubblico.

A differenza delle richieste dai moduli, **una candidatura non manda nessuna
email**: vive solo nel pannello. I dati di chi si candida e il rimando al suo
curriculum non hanno ragione di finire anche in una casella di posta, dove
restano per sempre e nessuno li cancella. Il rovescio è che nessuno viene
avvisato: la sezione Curriculum va aperta.

## Immagini per le anteprime social

`public/og/` contiene le immagini 1200x630 usate da Open Graph (WhatsApp,
Facebook, Instagram). Si rigenerano dalle foto del sito con:

```sh
node scripts/genera-og-image.mjs
```

Quando si aggiunge una pagina con un hero nuovo, va aggiunta la riga
corrispondente nella mappa dentro lo script e rilanciato il comando.

## Totem verticale

Oltre a desktop e mobile il sito è tarato su un **totem da 27" in verticale**
(9:16 — 1080×1920, o 1440×2560 sui pannelli 2K), pensato per stare all'ingresso
del club: si guarda in piedi da circa un metro e si usa col dito.

Non c'è una versione separata delle pagine. Il totem è gestito in due punti:

- i breakpoint dei componenti valgono anche `(orientation: portrait)`, così su
  1080 px di larghezza si usa il layout a colonna singola invece di quello
  desktop (che con la barra di navigazione completa usciva dallo schermo);
- `src/styles/totem.css` alza la scala — tipografia, misura di lettura, aree
  toccabili — sotto una condizione che individua il totem senza dipendere dalla
  risoluzione esatta (`portrait` + larghezza ≥ 900px + altezza ≥ 1400px, quindi
  fuori telefoni, tablet e monitor in orizzontale). La stessa condizione è
  ripetuta nei componenti che hanno un ritocco proprio (`Nav`,
  `WeeklySchedule`, `index`): se cambia, va cambiata anche là.

## Stato attuale / prossimi passi

- [x] Scaffold Astro + Tina CMS funzionante (dev, build, admin)
- [ ] Definire l'architettura definitiva delle pagine (verticali sport: padel,
      tennis, nuoto, fitness, young school, ecc. — vedi audit)
- [ ] Migrare i contenuti sport dallo scraping del vecchio sito
      (`scripts/scrape_output/pages/`) — ~73 pagine identificate come
      pertinenti, esclusi Business ed Elements
- [ ] Layout/componenti (header, footer, navigazione)
- [ ] Form di lead generation per verticale con attribuzione fonte (vedi audit)
- [x] SEO tecnico di base: canonical, Open Graph/Twitter, sitemap, robots,
      structured data `SportsActivityLocation` e `FAQPage`
- [ ] Pagine legali — fatte la **privacy** (`/privacy`, informativa artt. 13-14
      GDPR allineata ai trattamenti reali del sito: moduli, `/api/track`,
      CookieYes) e i **termini e condizioni** (`/termini-e-condizioni`, documento
      unico che armonizza i quattro regolamenti in circolazione — vedi
      `docs/armonizzazione-regolamenti.md`); mancano ancora nomina safeguarding
      e codice di condotta, oggi linkati dal footer ma non ancora esistenti
- [x] **Lavora con noi** (`/lavora-con-noi`): aree e ruoli, modulo con CV su
      bucket privato, candidature lette dal pannello nella sezione Curriculum
- [ ] Redirect 301 dal vecchio sito Wix (~110 URL, vedi
      `scripts/scrape_output/inventario.csv`)
- [ ] GA4 / GTM e tag di conversione
- [ ] Impostare `SITE_URL` al go-live: senza, robots.txt blocca i motori

## Contenuti scrapati dal vecchio sito

Il vecchio sito (Wix) è stato scrapato integralmente in
`scripts/scrape_output/`: 110 pagine in Markdown più un inventario CSV. Sono
già stati classificati in Sport (da migrare), Business ed Elements (esclusi),
e bozze/pagine vuote (da scartare) — vedi la conversazione di analisi per il
dettaglio pagina per pagina.
