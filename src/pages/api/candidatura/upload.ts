// Primo passo dell'invio di una candidatura: firma il caricamento del CV.
//
// Il file NON passa da qui. Una function Vercel accetta al massimo 4,5 MB nel
// corpo della richiesta, e il modulo ne promette 5: il browser carica quindi
// il curriculum direttamente su Supabase Storage, con una URL firmata che
// questo endpoint genera con la service_role key. Il bucket resta privato e
// nessuna chiave arriva al browser.
//
// L'endpoint restituisce anche il percorso, che il browser rimanda a
// /api/candidatura insieme al resto del modulo. Quel percorso non è creduto
// sulla parola: /api/candidatura verifica che l'oggetto esista davvero e che
// sia grande quanto dichiarato.
import { createClient } from "@supabase/supabase-js";
import {
	CV_BUCKET,
	erroreFile,
	percorsoCv,
	tipoDaNomeFile,
} from "../../../lib/candidature";

export const prerender = false;

function json(data: unknown, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export async function POST({ request }: { request: Request }) {
	// Come /api/track: le chiamate che dichiarano un'origine diversa dalla
	// nostra le scartiamo. Non è una difesa forte — l'endpoint è pubblico per
	// forza — ma tiene fuori l'uso casuale da altri siti.
	const origin = request.headers.get("origin");
	if (origin) {
		try {
			if (new URL(origin).host !== new URL(request.url).host) {
				return json({ ok: false, error: "origine_non_valida" }, 403);
			}
		} catch {
			return json({ ok: false, error: "origine_non_valida" }, 403);
		}
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: "invalid_json" }, 400);
	}

	const nomeFile = typeof body.nomeFile === "string" ? body.nomeFile.trim() : "";
	const dimensione = typeof body.dimensione === "number" ? body.dimensione : 0;

	const errore = erroreFile({ nome: nomeFile, dimensione });
	if (errore) return json({ ok: false, error: "file_non_valido", messaggio: errore }, 400);

	const supabaseUrl = import.meta.env.SUPABASE_URL;
	const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !serviceRoleKey) {
		console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY non configurate su Vercel");
		return json({ ok: false, error: "server_not_configured" }, 500);
	}

	const supabase = createClient(supabaseUrl, serviceRoleKey);
	const percorso = percorsoCv(crypto.randomUUID(), nomeFile);

	const { data, error } = await supabase.storage
		.from(CV_BUCKET)
		.createSignedUploadUrl(percorso);

	if (error || !data) {
		console.error("Firma del caricamento CV fallita:", error?.message);
		return json({ ok: false, error: "firma_fallita" }, 500);
	}

	// `tipo` torna al browser perché sia lui a mandarlo come Content-Type del
	// PUT: lo storage filtra per MIME, e il tipo dedotto dall'estensione è più
	// affidabile di quello che dichiara il browser sui .doc.
	return json(
		{
			ok: true,
			percorso,
			urlFirmata: data.signedUrl,
			tipo: tipoDaNomeFile(nomeFile),
		},
		200
	);
}
