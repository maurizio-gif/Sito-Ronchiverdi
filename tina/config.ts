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
        name: "post",
        label: "Blog",
        path: "src/content/posts",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Titolo", isTitle: true, required: true },
          {
            type: "string",
            name: "slug",
            label: "Indirizzo (slug)",
            required: true,
            description:
              "L'articolo vive su /post/<slug>. Per i 18 articoli migrati dal vecchio sito questo valore è identico all'originale: cambiarlo fa perdere il posizionamento su Google e crea un link rotto. Modificalo solo per articoli nuovi.",
          },
          {
            type: "string",
            name: "description",
            label: "Descrizione breve",
            required: true,
            description: "Compare nell'elenco del blog, nell'anteprima social e come meta description.",
            ui: { component: "textarea" },
          },
          { type: "image", name: "image", label: "Foto", required: true },
          { type: "string", name: "imageAlt", label: "Descrizione della foto", required: true },
          {
            type: "string",
            name: "categoria",
            label: "Categoria",
            required: true,
            options: ["Allenamento", "Nuoto e acqua", "Tennis e padel", "Hyrox", "Benessere"],
          },
          {
            type: "datetime",
            name: "date",
            label: "Data di pubblicazione",
            description:
              "Facoltativa. Gli articoli migrati dal vecchio sito non hanno la data originale: finché resta vuota, l'articolo non dichiara nessuna data e si ordina col campo qui sotto.",
          },
          {
            type: "number",
            name: "ordine",
            label: "Ordine nell'elenco",
            required: true,
            description: "Usato solo per gli articoli senza data. Numero più basso = più in alto.",
          },
          {
            type: "string",
            name: "correlata",
            label: "Pagina collegata",
            required: true,
            description: "Es. /attivita/padel — il pulsante in fondo all'articolo porta qui.",
          },
          { type: "string", name: "correlataLabel", label: "Testo del pulsante", required: true },
          { type: "rich-text", name: "body", label: "Testo dell'articolo", isBody: true },
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
            name: "suMisura",
            label: "Formule su misura",
            description:
              "Il riferimento di ingresso mostrato in fondo alla tabella. Le colonne non hanno un prezzo: le formule si costruiscono su fascia d'età, durata e modalità di pagamento.",
            fields: [
              {
                type: "string",
                name: "daPrezzo",
                label: "Si parte da",
                description: "Rata mensile su base annuale, es. \"79€\".",
                required: true,
              },
            ],
          },
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
                    { value: "seasonal", label: "Incluso in stagione (asterisco)" },
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
        // Listino della scuola nuoto: un documento solo, con i quattro corsi e
        // le loro quote. I prezzi cambiano ogni stagione e li aggiorna la
        // segreteria, quindi vivono qui e non nel codice.
        //
        // Gli "id prodotto" sono i numeri con cui il portale InforYou
        // identifica ogni riga di listino: sono quelli che mandano il prezzo
        // sul sito alla scheda giusta. Si leggono dall'indirizzo della scheda
        // sul portale (.../store/2/product/205 -> 205).
        name: "listinoNuoto",
        label: "Listino scuola nuoto",
        path: "src/content/listini",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          {
            type: "string",
            name: "aggiornatoAl",
            label: "Listino aggiornato a",
            description:
              "Compare sotto la tabella, per far vedere di quando sono i prezzi. Es. \"settembre 2026\".",
            required: true,
          },
          {
            type: "object",
            name: "corsi",
            label: "Corsi",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.title }) },
            fields: [
              {
                type: "string",
                name: "slug",
                label: "Codice (nell'indirizzo della pagina)",
                description:
                  "Da non cambiare: è l'indirizzo della pagina del corso. Cambiandolo, i link già in giro non funzionano più.",
                required: true,
              },
              { type: "string", name: "title", label: "Nome del corso", required: true },
              { type: "string", name: "titleLungo", label: "Nome esteso (per il titolo della pagina)" },
              { type: "string", name: "ageLabel", label: "Età", required: true },
              {
                type: "string",
                name: "percorso",
                label: "Descrizione",
                ui: { component: "textarea" },
                required: true,
              },
              { type: "string", name: "obiettivi", label: "Obiettivi", list: true },
              { type: "string", name: "durata", label: "Durata della lezione", required: true },
              {
                type: "string",
                name: "frequenza",
                label: "Frequenza",
                description:
                  "Quante volte a settimana, es. \"1 volta a settimana\". Lasciandolo vuoto la riga non compare.",
              },
              {
                type: "string",
                name: "giorni",
                label: "Giorni del corso",
                description:
                  "In quali giorni si tiene, es. \"mercoledì pomeriggio, giovedì pomeriggio e sabato mattina\". Compare nella card del corso e nella sua pagina di iscrizione.",
              },
              { type: "string", name: "vasca", label: "Vasca", required: true },
              { type: "image", name: "image", label: "Foto", required: true },
              { type: "string", name: "imageAlt", label: "Descrizione della foto", required: true },
              {
                type: "object",
                name: "dettagli",
                label: "Dettagli dalla scheda del portale",
                description:
                  "Le voci che compaiono sotto la tabella delle quote: età, frequenza, certificato medico, pagamento.",
                list: true,
                ui: { itemProps: (item) => ({ label: [item?.label, item?.valore].filter(Boolean).join(": ") }) },
                fields: [
                  { type: "string", name: "label", label: "Voce", required: true },
                  { type: "string", name: "valore", label: "Valore", required: true },
                ],
              },
              {
                type: "object",
                name: "listino",
                label: "Quote",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: [item?.formula, item?.dettaglio].filter(Boolean).join(" · "),
                  }),
                },
                fields: [
                  { type: "string", name: "formula", label: "Formula (es. Quadrimestrale)", required: true },
                  { type: "string", name: "periodo", label: "Periodo (es. 21 settembre – 31 gennaio)", required: true },
                  {
                    type: "string",
                    name: "dettaglio",
                    label: "Dettaglio",
                    description: "Serve a distinguere due quote altrimenti uguali, es. \"2 lezioni a settimana\".",
                  },
                  { type: "number", name: "prezzoNonSoci", label: "Prezzo non soci (€)", required: true },
                  { type: "number", name: "prezzoSoci", label: "Prezzo soci (€)", required: true },
                  {
                    type: "number",
                    name: "idNonSoci",
                    label: "Id prodotto InforYou · non soci",
                    description: "Il numero in fondo all'indirizzo della scheda sul portale.",
                    required: true,
                  },
                  {
                    type: "number",
                    name: "idSoci",
                    label: "Id prodotto InforYou · soci",
                    description: "Il numero in fondo all'indirizzo della scheda sul portale.",
                    required: true,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        // Listini dei corsi per sport: un documento per tennis, padel e
        // triathlon. Stessa logica del listino nuoto — gli "id prodotto" sono
        // i numeri che il portale InforYou usa per ogni riga, e si leggono in
        // fondo all'indirizzo della scheda (.../store/2/product/222 -> 222).
        name: "listinoSport",
        label: "Listini corsi (tennis, padel, triathlon)",
        path: "src/content/listini-sport",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          {
            type: "string",
            name: "aggiornatoAl",
            label: "Listino aggiornato a",
            description: "Compare sotto la tabella. Es. \"settembre 2026\".",
            required: true,
          },
          {
            type: "object",
            name: "percorsi",
            label: "Percorsi",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.title }) },
            fields: [
              {
                type: "string",
                name: "slug",
                label: "Codice (nell'indirizzo della pagina)",
                description:
                  "Da non cambiare: è l'indirizzo della pagina. Cambiandolo, i link già in giro non funzionano più.",
                required: true,
              },
              { type: "string", name: "title", label: "Nome del percorso", required: true },
              { type: "string", name: "eyebrow", label: "Sopratitolo (es. Young School · 6–16 anni)", required: true },
              {
                type: "string",
                name: "descrizione",
                label: "Descrizione",
                ui: { component: "textarea" },
                required: true,
              },
              { type: "string", name: "punti", label: "Punti chiave", list: true },
              { type: "image", name: "image", label: "Foto", required: true },
              { type: "string", name: "imageAlt", label: "Descrizione della foto", required: true },
              {
                type: "object",
                name: "dettagli",
                label: "Dettagli dalla scheda del portale",
                description:
                  "Le voci che compaiono sotto la tabella delle quote: età, frequenza, certificato medico, pagamento.",
                list: true,
                ui: { itemProps: (item) => ({ label: [item?.label, item?.valore].filter(Boolean).join(": ") }) },
                fields: [
                  { type: "string", name: "label", label: "Voce", required: true },
                  { type: "string", name: "valore", label: "Valore", required: true },
                ],
              },
              {
                type: "object",
                name: "listino",
                label: "Quote",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: [item?.voce, item?.dettaglio].filter(Boolean).join(" · "),
                  }),
                },
                fields: [
                  { type: "string", name: "voce", label: "Corso (es. RonchiRed)", required: true },
                  {
                    // Solo i livelli colore della scuola tennis lo usano: dove
                    // resta vuoto la riga del listino non ha barra colorata.
                    type: "string",
                    name: "colore",
                    label: "Colore del gruppo",
                    description:
                      "Colora la riga del listino, per riconoscere il livello a colpo d'occhio. Lasciare vuoto dove i corsi non hanno un colore.",
                    options: [
                      { value: "#b23a2e", label: "Rosso (Red)" },
                      { value: "#c8791f", label: "Arancione (Orange)" },
                      { value: "#4f7a4a", label: "Verde (Green)" },
                      { value: "#c9a227", label: "Giallo (Yellow)" },
                    ],
                  },
                  { type: "string", name: "dettaglio", label: "Frequenza (es. 2 volte a settimana)", required: true },
                  {
                    type: "string",
                    name: "nota",
                    label: "Nota",
                    description:
                      "Serve a distinguere due quote altrimenti uguali, es. \"60 minuti di tennis\".",
                  },
                  { type: "number", name: "prezzoNonSoci", label: "Prezzo non soci (€)", required: true },
                  { type: "number", name: "prezzoSoci", label: "Prezzo soci (€)", required: true },
                  {
                    type: "number",
                    name: "idNonSoci",
                    label: "Id prodotto InforYou · non soci",
                    description: "Il numero in fondo all'indirizzo della scheda sul portale.",
                    required: true,
                  },
                  {
                    type: "number",
                    name: "idSoci",
                    label: "Id prodotto InforYou · soci",
                    description: "Il numero in fondo all'indirizzo della scheda sul portale.",
                    required: true,
                  },
                ],
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
              {
                type: "string",
                name: "intro",
                label: "Cosa comprende",
                description:
                  "Riga di presentazione sotto il titolo, dove il titolo da solo non basta (es. le quattro zone della Gym Floor). Facoltativa.",
              },
              { type: "string", name: "note", label: "Nota" },
              {
                type: "string",
                name: "columns",
                label: "Colonne",
                list: true,
                description:
                  "Solo per le tabelle che hanno più di un orario al giorno (per esempio Accensione, In temperatura, Spegnimento). Lasciale vuote per la tabella semplice a due colonne, dove basta il campo Orario di ogni riga.",
              },
              {
                type: "object",
                name: "rows",
                label: "Righe",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: [item?.label, item?.hours ?? item?.values?.join(" · ")].filter(Boolean).join(" · "),
                  }),
                },
                fields: [
                  { type: "string", name: "label", label: "Giorni", required: true },
                  {
                    type: "string",
                    name: "hours",
                    label: "Orario",
                    description: "Per la tabella semplice, senza colonne.",
                  },
                  {
                    type: "string",
                    name: "values",
                    label: "Orari",
                    list: true,
                    description: "Per la tabella con le colonne: un valore per colonna, nello stesso ordine.",
                  },
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
