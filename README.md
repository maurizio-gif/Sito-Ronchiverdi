# Ronchiverdi Sport — sito

Nuovo sito della sola area **Sport** di Ronchiverdi (Business ed Elements/ristorante
sono esclusi da questo progetto). Stack: [Astro](https://astro.build) +
[Tina CMS](https://tina.io), content collection basate su file Markdown gestiti
via git.

> Questa è la base tecnica del progetto. La struttura definitiva delle pagine
> (verticali sport, young school, corsi, blog, ecc.) è ancora da definire —
> vedi la sezione "Stato attuale" più sotto.

## Struttura del progetto

```text
/
├── public/                  asset statici (immagini, favicon)
├── src/
│   ├── content.config.ts    definizione delle content collection Astro
│   ├── content/
│   │   ├── pages/            pagine gestite da Tina (collection "page")
│   │   └── posts/             articoli blog gestiti da Tina (collection "post")
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

Due collection di base per validare la pipeline Astro + Tina:

- **`pages`** (`src/content/pages/*.md`) — pagine generiche
- **`posts`** (`src/content/posts/*.md`) — articoli blog

Lo schema è definito in due punti che devono restare allineati:
`tina/config.ts` (editor) e `src/content.config.ts` (validazione Astro).

## Stato attuale / prossimi passi

- [x] Scaffold Astro + Tina CMS funzionante (dev, build, admin)
- [ ] Definire l'architettura definitiva delle pagine (verticali sport: padel,
      tennis, nuoto, fitness, young school, ecc. — vedi audit)
- [ ] Migrare i contenuti sport dallo scraping del vecchio sito
      (`scripts/scrape_output/pages/`) — ~73 pagine identificate come
      pertinenti, esclusi Business ed Elements
- [ ] Layout/componenti (header, footer, navigazione)
- [ ] Form di lead generation per verticale con attribuzione fonte (vedi audit)
- [ ] SEO tecnico: schema LocalBusiness, slug propri, meta title/description

## Contenuti scrapati dal vecchio sito

Il vecchio sito (Wix) è stato scrapato integralmente in
`scripts/scrape_output/`: 110 pagine in Markdown più un inventario CSV. Sono
già stati classificati in Sport (da migrare), Business ed Elements (esclusi),
e bozze/pagine vuote (da scartare) — vedi la conversazione di analisi per il
dettaglio pagina per pagina.
