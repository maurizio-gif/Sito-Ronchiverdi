import { defineConfig } from "tinacms";

// Struttura provvisoria: due collection di base (pagine e blog) per validare
// la pipeline Astro + Tina. L'architettura definitiva delle pagine (verticali
// sport, young school, corsi, ecc.) verrà definita in un secondo momento.

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
        name: "post",
        label: "Blog",
        path: "src/content/posts",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Titolo", isTitle: true, required: true },
          {
            type: "string",
            name: "description",
            label: "Descrizione (SEO)",
            ui: { component: "textarea" },
          },
          { type: "datetime", name: "date", label: "Data pubblicazione" },
          { type: "rich-text", name: "body", label: "Contenuto", isBody: true },
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
