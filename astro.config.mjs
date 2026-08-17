// @ts-check
import { defineConfig } from 'astro/config';

// In locale e su GitHub Pages il sito vive sotto /Sito-Ronchiverdi/, ma su
// Vercel viene servito dalla root del dominio: la base va quindi adattata
// all'ambiente di build, altrimenti CSS/JS/immagini puntano a un percorso
// che su Vercel non esiste.
const isVercel = !!process.env.VERCEL;

// https://astro.build/config
export default defineConfig({
	site: isVercel && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://maurizio-gif.github.io',
	base: isVercel ? '/' : '/Sito-Ronchiverdi',
});
