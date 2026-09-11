// Endpoint condiviso dai form di contatto del sito: il modal generico
// (LeadModal/leadForm.client.js) e i form inline specifici per pagina (es.
// Chinesis). Gira solo su Vercel — vedi astro.config.mjs — e scrive su
// Supabase con la service_role key, mai esposta al client.
import { createClient } from "@supabase/supabase-js";
import { notificaLead } from "../../lib/notificaLead";
import { notificaResponsabile } from "../../lib/notificaResponsabile";
import { confermaAlCliente } from "../../lib/emailCliente";
import { risolviOperatore } from "../../lib/operatori";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(v: unknown): string | null {
	return typeof v === "string" && v.trim() ? v.trim() : null;
}

function json(data: unknown, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export async function POST({ request }: { request: Request }) {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: "invalid_json" }, 400);
	}

	const nome = str(body.nome);
	const cognome = str(body.cognome);
	const email = str(body.email);
	const cellulare = str(body.cellulare);

	if (!nome || !cognome || !email || !cellulare) {
		return json({ ok: false, error: "missing_fields" }, 400);
	}
	if (!EMAIL_RE.test(email)) {
		return json({ ok: false, error: "invalid_email" }, 400);
	}

	const supabaseUrl = import.meta.env.SUPABASE_URL;
	const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !serviceRoleKey) {
		console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY non configurate su Vercel");
		return json({ ok: false, error: "server_not_configured" }, 500);
	}

	const supabase = createClient(supabaseUrl, serviceRoleKey);
	const dettagli = Array.isArray(body.dettagli) ? body.dettagli.filter((d) => typeof d === "string") : null;

	// Operatore di segreteria che ha raccolto un walk-in al banco. La pagina
	// guest register manda uno slug, non l'email: le email dello staff non
	// stanno nel sorgente di una pagina pubblica. Qui lo slug torna a essere
	// l'email, che è il modo in cui il CRM identifica le persone dello staff
	// (vedi opportunita.assegnato_a). Uno slug che non corrisponde a nessun
	// operatore abilitato viene ignorato: la richiesta resta valida, senza firma.
	const operatore = await risolviOperatore(str(body.operatore));

	// Provenienza: campi calcolati dal client (src/lib/tracking.client.js) e
	// spediti insieme al form. Tutti opzionali — un lead resta valido anche se
	// arriva senza UTM, e i campi restano semplicemente nulli.
	const tracking = {
		session_id: str(body.session_id),
		// Identificativo persistente del visitatore, quando il consenso lo
		// permette: è la chiave con cui il CRM può mettere accanto alla persona
		// anche le visite di altri giorni, che con il solo session_id — che vale
		// per una visita sola — resterebbero slegate.
		visitor_id: str(body.visitor_id),
		ga_session_id: str(body.ga_session_id),
		ga_client_id: str(body.ga_client_id),
		utm_source: str(body.utm_source),
		utm_medium: str(body.utm_medium),
		utm_campaign: str(body.utm_campaign),
		utm_term: str(body.utm_term),
		utm_content: str(body.utm_content),
		utm_id: str(body.utm_id),
		first_utm_source: str(body.first_utm_source),
		first_utm_medium: str(body.first_utm_medium),
		first_utm_campaign: str(body.first_utm_campaign),
		first_utm_term: str(body.first_utm_term),
		first_utm_content: str(body.first_utm_content),
		gclid: str(body.gclid),
		gbraid: str(body.gbraid),
		wbraid: str(body.wbraid),
		fbclid: str(body.fbclid),
		ttclid: str(body.ttclid),
		msclkid: str(body.msclkid),
		li_fat_id: str(body.li_fat_id),
		landing_page: str(body.landing_page),
		referrer: str(body.referrer),
		first_touch_at: str(body.first_touch_at),
		consent_analytics: body.consent_analytics === true,
		consent_advertisement: body.consent_advertisement === true,
	};

	const datiLead = {
		origine: str(body.origine) ?? "lead-modal",
		pagina: str(body.pagina),
		cta: str(body.cta),
		attivita: str(body.attivita),
		attivita_label: str(body.attivitaLabel),
		audience: str(body.audience),
		dettagli: dettagli && dettagli.length ? dettagli : null,
		azione: str(body.azione),
		data_scelta: str(body.dataScelta),
		ora_scelta: str(body.oraScelta),
		// Una colonna sola per "il testo che ha scritto la persona": il
		// messaggio del percorso libero e l'oggetto di un appuntamento o di una
		// telefonata sono la stessa cosa per chi lavora la richiesta, e `azione`
		// dice già in quale dei due modi è arrivato. Con due colonne il CRM
		// dovrebbe leggerle entrambe ovunque, e prima o poi ne dimenticherebbe una.
		messaggio: str(body.messaggioTesto) ?? str(body.oggetto) ?? str(body.messaggio),
		nome,
		cognome,
		email,
		cellulare,
		privacy: body.privacy === true,
		marketing: body.marketing === true,
		operatore,
		settore: str(body.settore),
		// Data di nascita di chi compila: la chiede il form della consulenza
		// col Fitness Manager. Resta nulla per tutti gli altri percorsi.
		data_nascita: str(body.dataNascita),
		minore_nome: str(body.minoreNome),
		minore_cognome: str(body.minoreCognome),
		minore_data_nascita: str(body.minoreDataNascita),
		...tracking,
	};

	let { data: inserito, error } = await supabase
		.from("form_contatti")
		.insert(datiLead)
		.select("id, token_gestione")
		.single();

	// La colonna visitor_id arriva con una migration (vedi
	// scripts/sql/2026-09-11-visitor-id-e-sessione-del-lead.sql). Se il deploy
	// la precede, l'insert fallisce e la richiesta andrebbe persa: per un dato
	// statistico non si butta via un contatto. Si riprova senza, e l'errore in
	// console dice cosa manca.
	if (error && /visitor_id/.test(error.message)) {
		console.error(
			"form_contatti.visitor_id non esiste ancora: eseguire scripts/sql/2026-09-11-visitor-id-e-sessione-del-lead.sql. Il lead viene salvato senza."
		);
		const { visitor_id: _senzaColonna, ...senzaVisitor } = datiLead;
		({ data: inserito, error } = await supabase
			.from("form_contatti")
			.insert(senzaVisitor)
			.select("id, token_gestione")
			.single());
	}

	if (error) {
		console.error("Errore inserimento form_contatti:", error.message);
		return json({ ok: false, error: "db_error" }, 500);
	}

	// Avviso alla segreteria. Dopo l'insert e con l'errore ingoiato dentro
	// notificaLead: la richiesta è già salvata, e un problema col servizio di
	// posta non deve diventare un errore in faccia a chi ha compilato il form.
	await notificaLead(body);

	// Avviso al responsabile dell'attività, dove quel percorso ne ha uno (la
	// Young School, i corsi di tennis, il Summer Camp): stessi dati, più il
	// pulsante per aprire il CRM. Chi lavora la richiesta la vede arrivare
	// senza passare dalla segreteria. Anche qui l'errore resta dentro.
	// Con l'id della riga appena scritta il pulsante dell'email apre quella
	// richiesta, non la dashboard.
	await notificaResponsabile(body, inserito?.id ? String(inserito.id) : null);

	// Conferma a chi ha compilato. Per un appuntamento porta il link che
	// permette di spostarlo o annullarlo da solo: senza, l'unico modo per
	// disdire è telefonare, e chi non telefona non si presenta e basta.
	// Stesso trattamento degli errori: la richiesta è già salva.
	if (inserito?.token_gestione) {
		await confermaAlCliente({
			nome,
			email,
			cellulare,
			azione: str(body.azione),
			data: str(body.dataScelta),
			ora: str(body.oraScelta),
			attivita: str(body.attivitaLabel),
			token: String(inserito.token_gestione),
			// Id, settore e origine servono a risolvere il referente da citare
			// nell'email: l'etichetta qui sopra è per chi legge, non per
			// cercare in src/data/referenti.ts.
			attivitaId: str(body.attivita),
			settore: str(body.settore),
			origine: str(body.origine),
		});
	}

	// Marca la sessione come convertita, così il tasso di conversione per
	// campagna si legge direttamente da campagne_rendimento. Non è bloccante:
	// qualunque cosa vada storta qui, il lead è già salvato.
	if (tracking.session_id) {
		// Prima però la sessione deve esistere, e non è scontato: /api/track può
		// non essere mai arrivato (JS parziale, blocco pubblicità, richiesta
		// annullata al cambio pagina). Senza questa riga il lead porterebbe un
		// session_id che non corrisponde a niente, e nel CRM la richiesta
		// risulterebbe senza nessuna visita alle spalle.
		//
		// La riga ricostruita qui ha zero pagine viste — le pagine non le
		// sappiamo — ma tiene la provenienza che il form ci ha portato, che è
		// quello che serve all'attribuzione. `ignoreDuplicates` perché nel caso
		// normale la sessione c'è già, e va lasciata com'è: quella vera, con le
		// sue pagine, l'ha scritta /api/track.
		const { error: errCreazione } = await supabase.from("sessioni").upsert(
			{
				session_id: tracking.session_id,
				visitor_id: tracking.visitor_id,
				ga_session_id: tracking.ga_session_id,
				ga_client_id: tracking.ga_client_id,
				utm_source: tracking.utm_source,
				utm_medium: tracking.utm_medium,
				utm_campaign: tracking.utm_campaign,
				utm_term: tracking.utm_term,
				utm_content: tracking.utm_content,
				utm_id: tracking.utm_id,
				gclid: tracking.gclid,
				gbraid: tracking.gbraid,
				wbraid: tracking.wbraid,
				fbclid: tracking.fbclid,
				ttclid: tracking.ttclid,
				msclkid: tracking.msclkid,
				li_fat_id: tracking.li_fat_id,
				landing_page: tracking.landing_page ?? str(body.pagina),
				referrer: tracking.referrer,
				consent_analytics: tracking.consent_analytics,
				consent_advertisement: tracking.consent_advertisement,
			},
			{ onConflict: "session_id", ignoreDuplicates: true }
		);
		if (errCreazione) {
			console.error("Sessione del lead non ricostruita:", errCreazione.message);
		}

		const { error: errSessione } = await supabase.rpc("marca_sessione_convertita", {
			p_session_id: tracking.session_id,
		});
		if (errSessione) {
			console.error("Sessione non marcata come convertita:", errSessione.message);
		}
	}

	return json({ ok: true }, 200);
}
