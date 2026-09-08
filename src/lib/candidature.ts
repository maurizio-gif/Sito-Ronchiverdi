// Regole del curriculum allegato alla candidatura, in un posto solo.
//
// Le usano tre parti che non si parlano: il modulo nel browser (per dire
// "questo file non va bene" prima di caricare), l'endpoint che firma il
// caricamento e quello che salva la candidatura. Sono anche ripetute nel
// bucket Supabase — vedi scripts/sql/2026-09-08-candidature.sql: se cambiano
// qui, vanno cambiate anche là, o il file passa i controlli del sito e viene
// poi rifiutato dallo storage.
//
// Niente import server-only in questo file: viene incluso anche nel bundle
// del browser.

/** Bucket privato dei curriculum. */
export const CV_BUCKET = "candidature-cv";

/** 5 MB, come dichiarato nel modulo. */
export const CV_MAX_BYTE = 5 * 1024 * 1024;

/**
 * Formati accettati. Il tipo lo decidiamo noi dall'estensione e non dal
 * browser: su .doc alcuni browser mandano un content-type vuoto o generico, e
 * lo storage — che filtra per MIME — rifiuterebbe un file valido.
 */
export const CV_FORMATI: { estensione: string; mime: string }[] = [
	{ estensione: ".pdf", mime: "application/pdf" },
	{ estensione: ".doc", mime: "application/msword" },
	{
		estensione: ".docx",
		mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	},
	{ estensione: ".jpg", mime: "image/jpeg" },
	{ estensione: ".jpeg", mime: "image/jpeg" },
];

/** Valore dell'attributo accept dell'input file. */
export const CV_ACCEPT = CV_FORMATI.map((f) => f.estensione).join(",");

/** Etichetta dei formati per il testo del modulo: "PDF, Word o JPG". */
export const CV_FORMATI_TESTO = "PDF, Word o JPG";

/** Megabyte, per i messaggi: evita di scrivere "5242880 byte" a chi carica. */
export const CV_MAX_MB = CV_MAX_BYTE / 1024 / 1024;

/** Content-type da usare per il file, ricavato dall'estensione. Null se non ammesso. */
export function tipoDaNomeFile(nomeFile: string): string | null {
	const nome = nomeFile.toLowerCase();
	const formato = CV_FORMATI.find((f) => nome.endsWith(f.estensione));
	return formato ? formato.mime : null;
}

/**
 * Il messaggio da mostrare se il file non va bene, o null se va bene. Stessa
 * funzione nel browser e sul server: quello che il modulo accetta è esattamente
 * quello che l'endpoint accetta.
 */
export function erroreFile(file: { nome: string; dimensione: number }): string | null {
	if (!file.nome.trim()) return "Allega il tuo curriculum.";
	if (!tipoDaNomeFile(file.nome)) {
		return `Il curriculum deve essere in formato ${CV_FORMATI_TESTO}.`;
	}
	if (file.dimensione <= 0) return "Il file allegato è vuoto.";
	if (file.dimensione > CV_MAX_BYTE) {
		return `Il curriculum non può superare ${CV_MAX_MB} MB.`;
	}
	return null;
}

/**
 * Nome del file ripulito per lo storage: niente accenti, spazi o slash, che
 * nel percorso di un oggetto diventerebbero cartelle o caratteri da sfuggire.
 * Il nome originale viene comunque salvato in chiaro sulla candidatura, ed è
 * quello che il pannello mostra e riusa al download.
 */
export function nomeFileSicuro(nomeFile: string): string {
	const pulito = nomeFile
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^A-Za-z0-9._-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^[-.]+|[-.]+$/g, "")
		.slice(-80);
	return pulito || "curriculum";
}

/**
 * Percorso dell'oggetto nel bucket: anno/uuid/nome-file. L'uuid isola ogni
 * candidatura, così due "cv.pdf" non si sovrascrivono e conoscere un percorso
 * non aiuta a indovinarne un altro.
 */
export function percorsoCv(id: string, nomeFile: string): string {
	const anno = new Date().getFullYear();
	return `${anno}/${id}/${nomeFileSicuro(nomeFile)}`;
}

/** Vero se il percorso ha la forma che generiamo noi: usato per non fidarsi del client. */
export function percorsoValido(percorso: string): boolean {
	return /^\d{4}\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,80}$/i.test(percorso);
}
