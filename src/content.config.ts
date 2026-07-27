import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
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

// Tabella abbonamenti: sorgente unica usata da tutte le pagine che la
// mostrano (abbonamenti, gym floor, ...). Modificarla qui — o da Tina —
// la aggiorna ovunque.
const accessLevel = z.enum(["full", "rate", "none"]);

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

export const collections = { pages, posts, activities, services, memberships };
