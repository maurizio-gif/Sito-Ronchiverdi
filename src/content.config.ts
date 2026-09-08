import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const activities = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/activities" }),
  schema: z.object({
    title: z.string(),
    image: z.string(),
    summary: z.string().optional(),
    audience: z.enum(["adulti", "junior"]),
    order: z.number().optional(),
    href: z.string().optional(),
    visible: z.boolean().optional(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
  schema: z.object({
    title: z.string(),
    image: z.string(),
    summary: z.string().optional(),
    order: z.number().optional(),
    href: z.string(),
    external: z.boolean().optional(),
  }),
});

// Eventi del club. Il corpo del file è HTML (o markdown) e viene renderizzato
// così com'è; il pulsante compare solo se è valorizzato ctaHref.
const events = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/events" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    orario: z.string().optional(),
    luogo: z.string().optional(),
    image: z.string().optional(),
    summary: z.string(),
    ctaLabel: z.string().optional(),
    ctaHref: z.string().optional(),
  }),
});

// Articoli del blog, migrati dal vecchio sito Wix. Lo `slug` è quello che il
// vecchio sito aveva su /post/<slug> e va lasciato identico, accenti compresi:
// sono indirizzi già indicizzati da Google, e cambiarli significherebbe
// buttare via il posizionamento che hanno.
//
// `date` è volutamente opzionale: le date di pubblicazione originali non sono
// state recuperate dal vecchio sito. Finché manca, l'articolo si ordina con
// `ordine` e non dichiara nessuna data — meglio nessuna data che una
// inventata. Appena la data reale viene inserita da Tina, compare in pagina e
// nello structured data.
const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    categoria: z.string(),
    date: z.coerce.date().optional(),
    ordine: z.number(),
    /** Pagina del sito a cui l'articolo rimanda. */
    correlata: z.string(),
    correlataLabel: z.string(),
  }),
});

const trainers = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/trainers" }),
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    photo: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
    instagram: z.string().optional(),
    website: z.string().optional(),
    formazione: z.array(z.string()).optional(),
    competenze: z.array(z.string()).optional(),
    order: z.number().optional(),
  }),
});

// Tabella abbonamenti: sorgente unica usata da tutte le pagine che la
// mostrano (abbonamenti, gym floor, ...). Modificarla qui — o da Tina —
// la aggiorna ovunque.
// "seasonal" e' l'accesso compreso solo in una parte dell'anno: il tennis e'
// nel Gold quando i campi sono scoperti, mentre d'inverno, coperti e
// riscaldati, le ore si pagano a tariffa agevolata. Tenerlo distinto da
// "rate" e' il punto: col pallino di "rate" il listino diceva che il tennis
// non e' compreso, che e' falso per meta' dell'anno.
const accessLevel = z.enum(["full", "seasonal", "rate", "none"]);

const memberships = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/memberships" }),
  schema: z.object({
    plans: z.array(
      z.object({
        key: z.enum(["gold", "silver", "gym", "swim"]),
        name: z.string(),
        price: z.string(),
        duration: z.string().optional(),
        featured: z.boolean().optional(),
      })
    ),
    features: z.array(
      z.object({
        label: z.string(),
        note: z.string().optional(),
        access: z.object({
          gold: accessLevel,
          silver: accessLevel,
          gym: accessLevel,
          swim: accessLevel,
        }),
      })
    ),
  }),
});

// Planning del club: sorgente unica (src/content/schedules/planning.json)
// editabile da Tina. Contiene gli orari di apertura e tutti i palinsesti
// settimanali; ogni pagina pesca da qui la sezione che le serve, quindi si
// modifica in un punto solo e si aggiorna ovunque.
const scheduleDay = z.enum(["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato", "domenica"]);

const schedules = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/schedules" }),
  schema: z.object({
    title: z.string(),
    hours: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          note: z.string().optional(),
          rows: z.array(z.object({ label: z.string(), hours: z.string() })),
        })
      )
      .default([]),
    sections: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        intro: z.string().optional(),
        note: z.string().optional(),
        lessons: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
          })
        ),
        days: z.array(
          z.object({
            day: scheduleDay,
            slots: z.array(
              z.object({
                time: z.string(),
                lesson: z.string(),
                trainer: z.string().optional(),
                note: z.string().optional(),
              })
            ),
          })
        ),
      })
    ),
  }),
});

// Listino dei corsi della scuola nuoto: sorgente unica
// (src/content/listini/scuola-nuoto.json) editabile da Tina. I prezzi
// cambiano ogni stagione e li aggiorna la segreteria, quindi non stanno nel
// codice. Gli id sono quelli dei prodotti sul portale InforYou: servono a
// mandare ogni prezzo alla sua scheda.
const listini = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/listini" }),
  schema: z.object({
    aggiornatoAl: z.string(),
    corsi: z.array(
      z.object({
        slug: z.string(),
        title: z.string(),
        titleLungo: z.string().optional(),
        ageLabel: z.string(),
        percorso: z.string(),
        obiettivi: z.array(z.string()),
        durata: z.string(),
        vasca: z.string(),
        image: z.string(),
        imageAlt: z.string(),
        listino: z.array(
          z.object({
            formula: z.string(),
            periodo: z.string(),
            dettaglio: z.string().optional(),
            prezzoNonSoci: z.number(),
            prezzoSoci: z.number(),
            idNonSoci: z.number(),
            idSoci: z.number(),
          })
        ),
      })
    ),
  }),
});

export const collections = { pages, activities, services, memberships, events, posts, trainers, schedules, listini };
