// Annullamento e spostamento di un appuntamento da parte di chi l'ha
// prenotato, dal link ricevuto via email. Gira solo su Vercel — vedi
// astro.config.mjs — e scrive su Supabase con la service_role key.
//
// L'autorizzazione è il token e basta: chi ha il link agisce su quell'unica
// riga. Per questo qui non si accetta mai un id, e ogni update filtra per
// token: un parametro sbagliato non può toccare l'appuntamento di un altro.
//
// La validazione dell'orario nuovo è rifatta per intero lato server con le
// stesse regole del calendario (src/lib/agendaSlot.js). Il controllo del
// browser serve a non far scegliere un orario impossibile; questo serve a non
// accettarlo comunque da una richiesta costruita a mano.

import { caricaOccupati, regoleDi, slotsDisponibili } from "../../lib/agendaSlot.js";
import {
	creaClient,
	eGestibile,
	eGiaPassato,
	leggiAppuntamento,
	tokenValido,
	type Appuntamento,
} from "../../lib/appuntamento";
import { esitoModificaAlCliente } from "../../lib/emailCliente";
import { notificaLead } from "../../lib/notificaLead";

export const prerender = false;

function json(data: unknown, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function str(v: unknown): string | null {
	return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Avvisa la segreteria: uno slot che si libera o si sposta la riguarda. */
async function avvisaSegreteria(a: Appuntamento, cosa: "annullato" | "spostato", primaData: string, primaOra: string) {
	await notificaLead({
		azione: a.azione,
		origine: "gestione-appuntamento",
		nome: a.nome,
		cognome: a.cognome,
		email: a.email,
		cellulare: a.cellulare,
		attivitaLabel: a.attivita,
		dataScelta: a.data,
		oraScelta: a.ora,
		messaggio:
			cosa === "annullato"
				? `Appuntamento ANNULLATO dal cliente. Era il ${primaData}${primaOra ? ` alle ${primaOra}` : ""}.`
				: `Appuntamento SPOSTATO dal cliente. Era il ${primaData}${primaOra ? ` alle ${primaOra}` : ""}, ora è il ${a.data}${a.ora ? ` alle ${a.ora}` : ""}.`,
	});
}

export async function POST({ request }: { request: Request }) {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, errore: "richiesta_non_valida" }, 400);
	}

	const token = str(body.token);
	const azione = str(body.azione); // "annulla" | "sposta"
	if (!tokenValido(token) || (azione !== "annulla" && azione !== "sposta")) {
		return json({ ok: false, errore: "parametri_non_validi" }, 400);
	}

	const supabase = creaClient();
	if (!supabase) return json({ ok: false, errore: "server_non_configurato" }, 500);

	const appuntamento = await leggiAppuntamento(supabase, token);
	// Stesso messaggio per "token inesistente" e "token che non è un
	// appuntamento": chi prova a indovinare non impara nulla dalla differenza.
	if (!appuntamento || !eGestibile(appuntamento)) {
		return json({ ok: false, errore: "non_trovato" }, 404);
	}
	if (appuntamento.annullatoIl) {
		return json({ ok: false, errore: "gia_annullato" }, 409);
	}
	if (eGiaPassato(appuntamento)) {
		return json({ ok: false, errore: "gia_passato" }, 409);
	}

	const primaData = appuntamento.data ?? "";
	const primaOra = appuntamento.ora ?? "";

	if (azione === "annulla") {
		const { error } = await supabase
			.from("form_contatti")
			.update({ appuntamento_annullato_il: new Date().toISOString() })
			.eq("token_gestione", token);

		if (error) {
			console.error("Annullamento non riuscito:", error.message);
			return json({ ok: false, errore: "errore_salvataggio" }, 500);
		}

		await esitoModificaAlCliente(
			{
				nome: appuntamento.nome,
				email: appuntamento.email ?? "",
				cellulare: appuntamento.cellulare,
				azione: appuntamento.azione,
				data: appuntamento.data,
				ora: appuntamento.ora,
				attivita: appuntamento.attivita,
				token,
			},
			"annullato"
		);
		await avvisaSegreteria(appuntamento, "annullato", primaData, primaOra);
		return json({ ok: true, stato: "annullato" }, 200);
	}

	// ── Spostamento ─────────────────────────────────────────────────────
	const data = str(body.data);
	const ora = str(body.ora);
	if (!data || !ora || !/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(ora)) {
		return json({ ok: false, errore: "orario_non_valido" }, 400);
	}

	const tipo = appuntamento.azione === "telefonata" ? "telefonata" : "appuntamento";
	const regole = regoleDi(tipo);

	// Dentro l'orizzonte che il sito offre davvero: senza questo controllo si
	// potrebbe spostare un appuntamento a fra sei mesi.
	const oggi = new Date();
	oggi.setHours(0, 0, 0, 0);
	const [aa, mm, gg] = data.split("-").map(Number);
	const scelto = new Date(aa, mm - 1, gg);
	const giorniDiDistanza = Math.round((scelto.getTime() - oggi.getTime()) / 86_400_000);
	if (giorniDiDistanza < 0 || giorniDiDistanza >= regole.giorniAvanti) {
		return json({ ok: false, errore: "fuori_periodo" }, 400);
	}

	// L'orario dev'essere fra quelli davvero disponibili: fascia del giorno,
	// preavviso minimo e agenda già occupata. Il proprio orario attuale viene
	// escluso dagli impegni, altrimenti risulterebbe occupato da sé stesso.
	const occupati = await caricaOccupati(regole.giorniAvanti);
	const liberi = slotsDisponibili(scelto, tipo, occupati, {
		data: appuntamento.data,
		ora: appuntamento.ora,
	});
	if (!liberi.includes(ora)) {
		return json({ ok: false, errore: "orario_non_disponibile" }, 409);
	}

	const { error } = await supabase
		.from("form_contatti")
		.update({
			data_scelta: data,
			ora_scelta: ora,
			// Il promemoria riparte da zero: quello dell'orario vecchio non
			// deve più valere, e il nuovo va mandato un'ora prima del nuovo.
			promemoria_inviato_il: null,
		})
		.eq("token_gestione", token);

	if (error) {
		console.error("Spostamento non riuscito:", error.message);
		return json({ ok: false, errore: "errore_salvataggio" }, 500);
	}

	const aggiornato: Appuntamento = { ...appuntamento, data, ora };
	await esitoModificaAlCliente(
		{
			nome: aggiornato.nome,
			email: aggiornato.email ?? "",
			cellulare: aggiornato.cellulare,
			azione: aggiornato.azione,
			data: aggiornato.data,
			ora: aggiornato.ora,
			attivita: aggiornato.attivita,
			token,
		},
		"spostato"
	);
	await avvisaSegreteria(aggiornato, "spostato", primaData, primaOra);

	return json({ ok: true, stato: "spostato", data, ora }, 200);
}
