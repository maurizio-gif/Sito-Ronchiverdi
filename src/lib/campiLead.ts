// I campi di una richiesta dal sito, in coppie etichetta/valore.
//
// Li leggono due email diverse — l'avviso alla segreteria (notificaLead.ts) e
// quello al responsabile dell'attività (notificaResponsabile.ts) — e prima
// stavano scritti dentro il primo dei due. Tenerli qui significa che un campo
// nuovo nel form compare in entrambe senza che nessuno se lo ricordi.
//
// L'ordine è quello di chi deve telefonare: prima la persona e come si
// raggiunge, poi cosa ha chiesto, e alla fine da dove arriva. La provenienza
// è l'ultima perché è la cosa che si guarda meno spesso e quasi mai prima di
// alzare il telefono.

export type CampiLead = Record<string, unknown>;

function testo(v: unknown): string | null {
	return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * Una data in giorno/mese/anno.
 *
 * Dal form arriva come la scrive un `<input type="date">`, cioè 2017-04-12:
 * in un elenco di dati che qualcuno legge al telefono è l'unica riga che
 * costringe a fermarsi e ricomporla. Se il valore non ha quella forma resta
 * com'è: meglio un formato inatteso che una data inventata.
 */
function giorno(v: unknown): string | null {
	const iso = testo(v);
	if (!iso) return null;
	const pezzi = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
	return pezzi ? `${pezzi[3]}/${pezzi[2]}/${pezzi[1]}` : iso;
}

/** Cosa ha chiesto la persona, in una riga da mettere nell'oggetto dell'email. */
export function tipoRichiesta(body: CampiLead): string {
	const azione = testo(body.azione);
	// Chi arriva dal banco (guest register) va distinto in oggetto: la
	// segreteria deve vedere subito che quella persona era in sede, non che
	// ha scritto dal sito.
	if (testo(body.origine) === "walk-in") {
		return azione === "appuntamento" ? "Walk-in · tour prenotato" : "Walk-in · registrazione";
	}
	if (azione === "appuntamento") return "Appuntamento in sede";
	if (azione === "telefonata") return "Richiesta di telefonata";
	if (azione === "messaggio") return "Messaggio";
	if (testo(body.origine) === "chinesis-inline") return "Richiesta Chinesis";
	if (testo(body.origine) === "fitness-manager-inline") return "Consulenza Fitness Manager";
	return "Richiesta informazioni";
}

/** Nome e cognome di chi ha compilato, o null se il form non li ha mandati. */
export function nomeCompleto(body: CampiLead): string | null {
	return [testo(body.nome), testo(body.cognome)].filter(Boolean).join(" ") || null;
}

/**
 * Tutti i campi della richiesta che hanno un valore, in ordine di lettura.
 *
 * Le coppie vuote non compaiono: un elenco con dieci righe «—» si legge
 * peggio di uno con sei righe piene, e chi riceve l'avviso non deve
 * distinguere «non lo ha scritto» da «non gliel'abbiamo chiesto».
 */
export function campiLead(body: CampiLead): [string, string][] {
	const minore = [testo(body.minoreNome), testo(body.minoreCognome)].filter(Boolean).join(" ");
	const dettagli = Array.isArray(body.dettagli)
		? body.dettagli.filter((d) => typeof d === "string").join(", ")
		: null;
	const azione = testo(body.azione);
	const conAppuntamento = azione === "appuntamento" || azione === "telefonata";
	const audience = testo(body.audience);

	const voci: [string, string | null][] = [
		["Nome", nomeCompleto(body)],
		["Email", testo(body.email)],
		["Cellulare", testo(body.cellulare)],
		["Data di nascita", giorno(body.dataNascita)],
		["Bambino/a", minore || null],
		["Nato/a il", giorno(body.minoreDataNascita)],
		["Attività", testo(body.attivitaLabel)],
		["Settore", testo(body.settore)],
		["Per chi", audience === "junior" ? "Young School (junior)" : audience],
		["Quando", [giorno(body.dataScelta), testo(body.oraScelta)].filter(Boolean).join(" alle ") || null],
		["Interessi", dettagli || null],
		// Per un appuntamento o una telefonata l'etichetta dice "Oggetto": è
		// quello che serve sapere prima di presentarsi o di chiamare, e
		// chiamarlo "Messaggio" lo farebbe sembrare un commento accessorio.
		[
			conAppuntamento ? "Oggetto" : "Messaggio",
			testo(body.messaggioTesto) ?? testo(body.oggetto) ?? testo(body.messaggio),
		],
		["Marketing", body.marketing === true ? "acconsente" : "no"],
		["Operatore al banco", testo(body.operatore)],
		["Pagina", testo(body.pagina)],
		["Pulsante", testo(body.cta)],
		["Provenienza", [testo(body.utm_source), testo(body.utm_campaign)].filter(Boolean).join(" · ") || null],
	];

	return voci.filter((v): v is [string, string] => !!v[1]);
}

/** Gli stessi campi in righe di testo, per la parte in chiaro dell'email. */
export function campiLeadTesto(body: CampiLead): string {
	return campiLead(body)
		.map(([k, v]) => `${k}: ${v}`)
		.join("\n");
}
