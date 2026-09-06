import { defineConfig } from "tinacms";

// Collection editabili da Tina: pagine, eventi, tabella abbonamenti e le
// card attività della home.

export default defineConfig({
  branch: process.env.TINA_BRANCH || process.env.HEAD || "main",
  clientId: process.env.TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      {
        name: "page",
        label: "Pagine",
        path: "src/content/pages",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Titolo", isTitle: true, required: true },
          {
            type: "string",
            name: "description",
            label: "Descrizione (SEO)",
            ui: { component: "textarea" },
          },
          { type: "rich-text", name: "body", label: "Contenuto", isBody: true },
        ],
      },
      {
        // Gli eventi passati non vanno cancellati: spariscono da soli dal
        // sito il giorno dopo la data (o dopo la data di fine).
        name: "event",
        label: "Eventi",
        path: "src/content/events",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Titolo", isTitle: true, required: true },
          { type: "datetime", name: "date", label: "Data", required: true },
          { type: "datetime", name: "endDate", label: "Data di fine (se su più giorni)" },
          { type: "string", name: "orario", label: "Orario" },
          { type: "string", name: "luogo", label: "Luogo" },
          { type: "image", name: "image", label: "Foto" },
          {
            type: "string",
            name: "summary",
            label: "Descrizione breve",
            required: true,
            ui: { component: "textarea" },
          },
          { type: "string", name: "ctaLabel", label: "Testo del pulsante" },
          {
            type: "string",
            name: "ctaHref",
            label: "Link del pulsante",
            description: "Il pulsante compare solo se questo campo è compilato.",
          },
          { type: "rich-text", name: "body", label: "Testo dell'evento", isBody: true },
        ],
      },
      {
        // Sorgente unica della tabella abbonamenti: modificandola qui si
        // aggiornano tutte le pagine che la mostrano (abbonamenti, gym
        // floor, ...). Documento singolo, non se ne creano altri.
        name: "membership",
        label: "Tabella abbonamenti",
        path: "src/content/memberships",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          {
            type: "object",
            name: "plans",
            label: "Piani",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.name }) },
            fields: [
              {
                type: "string",
                name: "key",
                label: "Codice",
                required: true,
                options: ["gold", "silver", "gym", "swim"],
              },
              { type: "string", name: "name", label: "Nome", required: true },
              { type: "string", name: "price", label: "Prezzo mensile", required: true },
              { type: "string", name: "duration", label: "Durata (nota)" },
              { type: "boolean", name: "featured", label: "In evidenza" },
            ],
          },
          {
            type: "object",
            name: "features",
            label: "Attività incluse",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.label }) },
            fields: [
              { type: "string", name: "label", label: "Attività", required: true },
              { type: "string", name: "note", label: "Nota (tooltip)" },
              {
                type: "object",
                name: "access",
                label: "Accesso per piano",
                fields: ["gold", "silver", "gym", "swim"].map((k) => ({
                  type: "string" as const,
                  name: k,
                  label: k.charAt(0).toUpperCase() + k.slice(1),
                  required: true,
                  options: [
                    { value: "full", label: "Incluso" },
                    { value: "rate", label: "Tariffa agevolata" },
                    { value: "none", label: "Non incluso" },
                  ],
                })),
              },
            ],
          },
        ],
      },
      {
        // Planning del club: un unico documento con gli orari di apertura e
        // tutti i palinsesti settimanali. È la sorgente usata da ogni pagina
        // (Planning, Acqua Fitness, Corsi Fitness, Nuoto Libero, Gym Floor,
        // Padel, Hyrox): si modifica qui e si aggiorna ovunque.
        name: "schedule",
        label: "Planning e orari",
        path: "src/content/schedules",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { type: "string", name: "title", label: "Titolo", isTitle: true, required: true },
          {
            type: "object",
            name: "hours",
            label: "Tabelle orari",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.title }) },
            fields: [
              {
                type: "string",
                name: "id",
                label: "Codice",
                required: true,
                description: "Identificativo usato dalle pagine (es. gym-floor). Non modificarlo.",
              },
              { type: "string", name: "title", label: "Titolo", required: true },
              { type: "string", name: "note", label: "Nota" },
              {
                type: "object",
                name: "rows",
                label: "Righe",
                list: true,
                ui: { itemProps: (item) => ({ label: [item?.label, item?.hours].filter(Boolean).join(" · ") }) },
                fields: [
                  { type: "string", name: "label", label: "Giorni", required: true },
                  { type: "string", name: "hours", label: "Orario", required: true },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "sections",
            label: "Palinsesti settimanali",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.title }) },
            fields: [
              {
                type: "string",
                name: "id",
                label: "Codice",
                required: true,
                description:
                  "Identificativo usato dalle pagine (es. acqua-fitness). Non modificarlo: è il collegamento con la pagina dell'attività.",
              },
              { type: "string", name: "title", label: "Titolo", required: true },
              {
                type: "string",
                name: "intro",
                label: "Introduzione",
                ui: { component: "textarea" },
              },
              {
                type: "string",
                name: "note",
                label: "Nota sul palinsesto",
                description: "Compare sotto al titolo, in tutte le pagine che mostrano questo palinsesto.",
              },
              {
                type: "object",
                name: "lessons",
                label: "Tipologie di lezione",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.name }) },
                fields: [
                  {
                    type: "string",
                    name: "id",
                    label: "Codice",
                    required: true,
                    description: "Identificativo usato negli orari (es. hydrobike). Senza spazi.",
                  },
                  { type: "string", name: "name", label: "Nome", required: true },
                  {
                    type: "string",
                    name: "description",
                    label: "Descrizione",
                    required: true,
                    ui: { component: "textarea" },
                  },
                ],
              },
              {
                type: "object",
                name: "days",
                label: "Giorni",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.day }) },
                fields: [
                  {
                    type: "string",
                    name: "day",
                    label: "Giorno",
                    required: true,
                    options: [
                      { value: "lunedi", label: "Lunedì" },
                      { value: "martedi", label: "Martedì" },
                      { value: "mercoledi", label: "Mercoledì" },
                      { value: "giovedi", label: "Giovedì" },
                      { value: "venerdi", label: "Venerdì" },
                      { value: "sabato", label: "Sabato" },
                      { value: "domenica", label: "Domenica" },
                    ],
                  },
                  {
                    type: "object",
                    name: "slots",
                    label: "Lezioni in programma",
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: [item?.time, item?.lesson].filter(Boolean).join(" · ") }),
                    },
                    fields: [
                      {
                        type: "string",
                        name: "time",
                        label: "Orario",
                        required: true,
                        description: "Es. 11.00 – 11.45",
                      },
                      {
                        type: "string",
                        name: "lesson",
                        label: "Lezione (codice)",
                        required: true,
                        description: "Deve corrispondere al codice di una delle tipologie di lezione sopra.",
                      },
                      { type: "string", name: "trainer", label: "Trainer" },
                      { type: "string", name: "note", label: "Nota (es. dal 16/9/26)" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "trainer",
        label: "Personal Trainer",
        path: "src/content/trainers",
        format: "md",
        fields: [
          { type: "string", name: "name", label: "Nome e cognome", isTitle: true, required: true },
          { type: "string", name: "role", label: "Ruolo (es. Fitness Manager)" },
          { type: "image", name: "photo", label: "Foto", required: true },
          { type: "string", name: "phone", label: "Telefono" },
          { type: "string", name: "email", label: "Email" },
          { type: "string", name: "instagram", label: "Instagram (handle, senza @)" },
          { type: "string", name: "website", label: "Sito web" },
          {
            type: "string",
            name: "formazione",
            label: "Formazione",
            list: true,
            ui: { component: "list" },
          },
          {
            type: "string",
            name: "competenze",
            label: "Competenze",
            list: true,
            ui: { component: "list" },
          },
          { type: "number", name: "order", label: "Ordine" },
        ],
      },
      {
        name: "activity",
        label: "Attività (card home)",
        path: "src/content/activities",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Titolo", isTitle: true, required: true },
          { type: "image", name: "image", label: "Foto", required: true },
          {
            type: "string",
            name: "summary",
            label: "Descrizione breve",
            ui: { component: "textarea" },
          },
          {
            type: "string",
            name: "audience",
            label: "Pubblico",
            options: [
              { value: "adulti", label: "Adulti" },
              { value: "junior", label: "Junior / Young School" },
            ],
            required: true,
          },
          { type: "number", name: "order", label: "Ordine" },
        ],
      },
    ],
  },
});
