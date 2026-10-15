// «Richiamami» del modulo Club e Family: le fasce in cui la persona può
// chiedere di essere chiamata, tutti i giorni.
//
// Ha preso il posto del «Messaggio» (ottobre 2026). La persona sceglie solo la
// fascia, non il giorno: la consulente non è legata a una data, ma se la
// persona ha scelto «sera» la chiama di sera.
//
// Le chiavi sono le stesse del CRM (FASCE_RICHIAMO in lib/agenda.ts del
// pannello) e del vincolo sulla colonna form_contatti.fascia_oraria: vanno
// cambiate nei tre posti insieme, più i bottoni di STEP 3-RICHIAMAMI in
// LeadFormBody.astro e FASCE_TESTO in leadForm.client.js.

export const AZIONE_RICHIAMO = "richiamami";

export const FASCE_RICHIAMO = {
	mattina: { etichetta: "Mattina", ore: "9 – 13" },
	pomeriggio: { etichetta: "Pomeriggio", ore: "13 – 17" },
	sera: { etichetta: "Sera", ore: "17 – 20" },
} as const;

export type FasciaRichiamo = keyof typeof FASCE_RICHIAMO;

export function eFasciaRichiamo(v: unknown): v is FasciaRichiamo {
	return typeof v === "string" && Object.prototype.hasOwnProperty.call(FASCE_RICHIAMO, v);
}

/** «Sera (17 – 20)»: come la si legge in un'email. */
export function testoFascia(fascia: FasciaRichiamo): string {
	const f = FASCE_RICHIAMO[fascia];
	return `${f.etichetta} (${f.ore})`;
}
