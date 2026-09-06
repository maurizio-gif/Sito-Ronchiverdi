// Genera le immagini per l'anteprima social (Open Graph) in public/og/.
//
// WhatsApp, Facebook e Instagram ritagliano l'anteprima a 1200x630: dare loro
// direttamente quel formato evita che una foto verticale venga tagliata a metà,
// e alleggerisce l'anteprima (le foto originali arrivano a 600 kB).
//
// Uso:  node scripts/genera-og-image.mjs
// Le sorgenti sono le stesse immagini usate come hero delle pagine: quando si
// aggiunge una pagina con un hero nuovo, basta rilanciare lo script.

import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

/** Sorgente (dentro public/) → nome del file generato in public/og/. */
const IMMAGINI = {
	"images/hero-poster.jpg": "ronchiverdi", // default per le pagine senza hero proprio
	"images/club/lacertosus.jpg": "abbonamenti",
	"images/club/notturna.jpg": "eventi",
	"images/club/gym-specchio.jpg": "planning",
	"images/club/reception.jpg": "faq",
	"images/club/lounge-alt.jpg": "blog",
	"images/activities/acqua-fitness.jpg": "acqua-fitness",
	"images/activities/fitness.jpg": "corsi-fitness",
	"images/activities/gym-floor.jpg": "gym-floor",
	"images/activities/nuoto.jpg": "nuoto-libero",
	"images/activities/padel.jpg": "padel",
	"images/activities/personal-training.jpg": "personal-training",
	"images/activities/scuola-nuoto-adulti.jpg": "scuola-nuoto-iscrizione",
	"images/activities/triathlon.jpg": "triathlon",
	"images/attivita/scuola-nuoto-hero.jpg": "scuola-nuoto",
	"images/attivita/tennis-hero.jpg": "tennis",
	"images/young-school-teaser.jpg": "summer-camp",
	"images/hyrox/functional-area.jpg": "hyrox",
	"images/services/chinesis-hero.jpg": "chinesis",
	"images/services/piscina-esterna-hero.jpg": "piscina-esterna",
	"images/services/spa-hero.jpg": "spa",
};

const DESTINAZIONE = "public/og";
mkdirSync(DESTINAZIONE, { recursive: true });

let generate = 0;
for (const [sorgente, nome] of Object.entries(IMMAGINI)) {
	const input = path.join("public", sorgente);
	if (!existsSync(input)) {
		console.warn(`  ! sorgente mancante, saltata: ${input}`);
		continue;
	}
	const output = path.join(DESTINAZIONE, `${nome}.jpg`);
	// `position: "attention"` sceglie il ritaglio sulla zona più "densa" della
	// foto invece che sul centro geometrico: su una foto di campo o piscina
	// tiene dentro il soggetto anziché una fascia di cielo.
	await sharp(input)
		.resize(1200, 630, { fit: "cover", position: "attention" })
		.jpeg({ quality: 82, mozjpeg: true })
		.toFile(output);
	generate++;
	console.log(`  → ${output}`);
}
console.log(`\n${generate} immagini OG generate in ${DESTINAZIONE}/`);
