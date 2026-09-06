import type { APIRoute } from "astro";

// robots.txt generato in build invece che messo in public/, per due motivi:
//   1. l'indirizzo della sitemap dev'essere assoluto e cambia con l'ambiente;
//   2. finché il sito non gira sul dominio definitivo esistono più copie
//      pubbliche identiche (GitHub Pages, preview Vercel). Lasciarle indicizzare
//      significa far scegliere a Google quale sia "il" sito. Finché SITE_URL non
//      è impostata (vedi astro.config.mjs) chiudiamo tutto; quando lo sarà, il
//      robots si apre da solo.
const inProduzione = !!process.env.SITE_URL;

export const GET: APIRoute = ({ site }) => {
	const sitemap = site ? new URL("sitemap-index.xml", site).href : null;

	const righe = inProduzione
		? [
				"User-agent: *",
				"Allow: /",
				"",
				"# L'anteprima del modulo è un file di lavoro, non una pagina del sito.",
				"Disallow: /anteprima-modulo-contatti.html",
				...(sitemap ? ["", `Sitemap: ${sitemap}`] : []),
			]
		: [
				"# Ambiente di prova (SITE_URL non impostata): niente indicizzazione.",
				"User-agent: *",
				"Disallow: /",
			];

	return new Response(righe.join("\n") + "\n", {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
