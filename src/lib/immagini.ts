// Sceglie le versioni moderne (AVIF, WebP) di una foto di public/.
//
// I file li produce scripts/converti-immagini.mjs, che scrive anche l'elenco di
// quelli riusciti in src/data/immagini-ottimizzate.json. Qui ci si fida solo di
// quell'elenco, mai dell'esistenza presunta di un file: <picture> sceglie la
// prima sorgente di un tipo che il browser sa leggere e non torna indietro se
// poi quel file dà 404 — al visitatore resta un buco al posto della foto.
// Le immagini caricate da TinaCMS e non ancora convertite semplicemente non
// compaiono nel manifest, e continuano a essere servite nel formato originale.

import manifest from "../data/immagini-ottimizzate.json";
import { url } from "./paths";

/** Estensione → tipo MIME, nell'ordine in cui vanno proposti al browser. */
const MIME: Record<string, string> = {
	avif: "image/avif",
	webp: "image/webp",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
};

/** Per ogni originale: l'impronta da cui è stato convertito — che serve solo
 *  allo script, per sapere cosa rifare —, i formati disponibili, la
 *  larghezza in pixel della foto di partenza e, per formato, le larghezze
 *  intermedie generate oltre alla piena risoluzione (es. "foo-640.avif"). */
interface VoceManifest {
	origine: string;
	formati: string[];
	larghezzaOriginale?: number;
	varianti?: Record<string, number[]>;
}

const convertite = manifest as Record<string, VoceManifest>;

/** Normalizza alla forma usata come chiave nel manifest: "/images/foo.jpg". */
function chiave(percorso: string): string {
	return `/${percorso.replace(/^\//, "")}`;
}

export interface FonteImmagine {
	type: string;
	srcset: string;
}

/**
 * Le alternative moderne disponibili per `percorso`, dalla più leggera in giù.
 * Array vuoto se l'immagine non è stata convertita: in quel caso il chiamante
 * non emette alcun <source> e resta il solo <img> con l'originale.
 *
 * Quando il manifest conosce le larghezze intermedie di un formato, il
 * `srcset` le elenca tutte insieme al file a piena risoluzione, con il
 * descrittore "Nw" che dice al browser quanto misura ciascuna — così su uno
 * schermo piccolo, o su un'immagine mostrata a metà pagina, non scarica una
 * foto pensata per lo schermo intero. Se il manifest non ha ancora quella
 * larghezza (formato non ancora rigenerato) resta il comportamento di prima:
 * un solo file, senza descrittore.
 */
export function fontiModerne(percorso: string): FonteImmagine[] {
	const originale = chiave(percorso);
	const voce = convertite[originale];
	const formati = voce?.formati ?? [];

	return formati.map((formato) => {
		const fileFormato = originale.replace(/\.(jpe?g|png)$/i, `.${formato}`);
		const larghezze = voce?.varianti?.[formato] ?? [];

		if (!voce?.larghezzaOriginale || !larghezze.length) {
			return { type: MIME[formato], srcset: url(fileFormato) };
		}

		const candidati = [
			...larghezze.map((w) => ({ w, file: fileFormato.replace(`.${formato}`, `-${w}.${formato}`) })),
			{ w: voce.larghezzaOriginale, file: fileFormato },
		].sort((a, b) => a.w - b.w);

		return {
			type: MIME[formato],
			srcset: candidati.map((c) => `${url(c.file)} ${c.w}w`).join(", "),
		};
	});
}

/**
 * Il valore `style` per un elemento che porta la foto come sfondo CSS, dove
 * <picture> non si può usare.
 *
 * Escono due dichiarazioni `background-image`: la prima con il file originale,
 * la seconda con image-set(). I browser che image-set() non lo capiscono
 * scartano la seconda riga come sintassi sconosciuta e tengono la prima; gli
 * altri sovrascrivono e scaricano l'AVIF. È la stessa scala di <picture>, detta
 * in CSS.
 */
export function sfondoImmagine(percorso: string): string {
	const originale = chiave(percorso);
	const ripiego = `background-image:url(${url(originale)})`;
	const fonti = fontiModerne(originale);
	if (!fonti.length) return ripiego;

	const estensione = originale.split(".").pop()?.toLowerCase() ?? "";
	// Apici singoli: il valore finisce in un attributo `style`, che l'HTML
	// delimita con i doppi. Con i doppi anche qui uscirebbe un `&quot;` per
	// carattere — corretto, ma illeggibile nel sorgente della pagina.
	const alternative = [
		...fonti.map((f) => `url(${f.srcset}) type('${f.type}')`),
		`url(${url(originale)}) type('${MIME[estensione]}')`,
	];
	return `${ripiego};background-image:image-set(${alternative.join(",")})`;
}
