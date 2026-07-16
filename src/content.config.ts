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

export const collections = { pages, posts, activities, services };
