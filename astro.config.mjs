// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// In locale e su GitHub Pages il sito vive sotto /Sito-Ronchiverdi/, ma su
// Vercel viene servito dalla root del dominio: la base va quindi adattata
// all'ambiente di build, altrimenti CSS/JS/immagini puntano a un percorso
// che su Vercel non esiste.
const isVercel = !!process.env.VERCEL;

// https://astro.build/config
export default defineConfig({
	site: isVercel && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://maurizio-gif.github.io',
	base: isVercel ? '/' : '/Sito-Ronchiverdi',
	// Serve sempre, anche nella build per GitHub Pages: senza adapter, l'unica
	// route non prerenderizzata (src/pages/api/lead.ts) farebbe fallire la
	// build. Con l'adapter presente Astro scrive l'output statico sotto
	// dist/client/ invece che dist/ (vedi deploy.yml), e in più genera la
	// function per /api/lead — che però gira solo su Vercel: su GitHub Pages
	// resta un file statico inerte, dato che quel sito non ha un runtime.
	adapter: vercel(),
});
