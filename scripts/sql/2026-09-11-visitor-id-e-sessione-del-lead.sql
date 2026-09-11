-- Il visitatore sul lead, e la funzione di sessione che mancava.
--
-- Da eseguire nel SQL Editor di Supabase **prima** del deploy: /api/lead
-- scrive la colonna visitor_id a ogni invio di form. L'endpoint sa cavarsela
-- anche se questa migration non è ancora passata — riprova l'insert senza
-- quella colonna, così nessuna richiesta va persa — ma finché non gira, il
-- collegamento fra una persona e le sue altre visite non viene salvato.
--
-- Tre cose, tutte dentro il tracciamento delle visite:
--
--   1. form_contatti.visitor_id — chi ha compilato, non solo quale visita;
--   2. lead_attribuzione — la vista di export se lo porta dietro;
--   3. aggiorna_sessione() — la funzione che /api/track chiama dal giorno in
--      cui esiste, e che nel repository non c'era.

-- ------------------------------------------------ 1. il visitatore sul lead

-- Il session_id vale per una visita sola: lega il lead alla navigazione di
-- quel momento e a nient'altro. Il visitor_id invece dura nel tempo (è in
-- localStorage, e nasce solo con consenso analytics o advertisement), quindi è
-- la chiave che permette di mettere accanto a una persona riconosciuta anche
-- le visite dei giorni prima e dopo. Nullable, e nullo resta per chi il
-- consenso non l'ha dato: la richiesta vale lo stesso.
alter table public.form_contatti
	add column if not exists visitor_id text;

create index if not exists form_contatti_visitor_id_idx
	on public.form_contatti (visitor_id);

comment on column public.form_contatti.visitor_id is
	'Id persistente del visitatore (src/lib/tracking.client.js, chiave rv_visitor): unisce alla persona le sessioni di giorni diversi. Solo con consenso analytics/advertisement.';

-- ------------------------------------------------------- 2. vista di export

-- Stessa vista di 2026-09-02-tracking-utm.sql con visitor_id in fondo: in
-- coda e non in mezzo perché `create or replace view` sa aggiungere colonne
-- solo alla fine, e riscrivere l'ordine vorrebbe dire cancellarla e rifarla.
create or replace view public.lead_attribuzione as
select
	id,
	created_at,
	origine,
	pagina,
	cta,
	attivita_label,
	nome,
	cognome,
	email,
	cellulare,
	session_id,
	ga_session_id,
	ga_client_id,
	coalesce(utm_source, case when referrer is null then '(direct)' else '(referral)' end) as sorgente,
	utm_medium,
	utm_campaign,
	utm_term,
	utm_content,
	first_utm_source,
	first_utm_campaign,
	gclid,
	fbclid,
	landing_page,
	referrer,
	first_touch_at,
	consent_analytics,
	consent_advertisement,
	visitor_id
from public.form_contatti;

-- I grant e security_invoker sopravvivono a `create or replace`, ma
-- riaffermarli costa niente e rende questo file leggibile da solo.
alter view public.lead_attribuzione set (security_invoker = on);
revoke all on public.lead_attribuzione from anon, authenticated;
grant select on public.lead_attribuzione to service_role;

-- --------------------------------------------- 3. aggiorna_sessione mancante

-- /api/track la chiama dal giorno in cui esiste il tracciamento, ma nel
-- repository non è mai stata scritta: 2026-09-02-sessioni.sql definisce
-- registra_pagina e marca_sessione_convertita, non questa. Se in produzione
-- non c'è, la chiamata risponde 500 e il consenso dato a metà visita non
-- aggiorna mai la sessione — è il motivo per cui i «visitatori riconosciuti»
-- della pagina Visite del CRM possono restare a zero.
--
-- Fa quello che l'endpoint si aspetta: porta identificativi e consenso senza
-- contare una pagina vista. E se la sessione non c'è ancora la crea, perché
-- questa chiamata può arrivare prima della prima pagina registrata.
create or replace function public.aggiorna_sessione(p_sessione jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_session_id text := p_sessione ->> 'session_id';
begin
	if v_session_id is null or v_session_id = '' then
		raise exception 'session_id mancante';
	end if;

	insert into public.sessioni as s (
		session_id, visitor_id, ga_session_id, ga_client_id,
		utm_source, utm_medium, utm_campaign, utm_term, utm_content, utm_id,
		gclid, gbraid, wbraid, fbclid, ttclid, msclkid, li_fat_id,
		landing_page, referrer,
		user_agent, dispositivo, paese, regione, citta, lingua, schermo,
		consent_analytics, consent_advertisement,
		pagine_viste, ultimo_contatto
	) values (
		v_session_id,
		p_sessione ->> 'visitor_id',
		p_sessione ->> 'ga_session_id',
		p_sessione ->> 'ga_client_id',
		p_sessione ->> 'utm_source',
		p_sessione ->> 'utm_medium',
		p_sessione ->> 'utm_campaign',
		p_sessione ->> 'utm_term',
		p_sessione ->> 'utm_content',
		p_sessione ->> 'utm_id',
		p_sessione ->> 'gclid',
		p_sessione ->> 'gbraid',
		p_sessione ->> 'wbraid',
		p_sessione ->> 'fbclid',
		p_sessione ->> 'ttclid',
		p_sessione ->> 'msclkid',
		p_sessione ->> 'li_fat_id',
		p_sessione ->> 'landing_page',
		p_sessione ->> 'referrer',
		p_sessione ->> 'user_agent',
		p_sessione ->> 'dispositivo',
		p_sessione ->> 'paese',
		p_sessione ->> 'regione',
		p_sessione ->> 'citta',
		p_sessione ->> 'lingua',
		p_sessione ->> 'schermo',
		coalesce((p_sessione ->> 'consent_analytics')::boolean, false),
		coalesce((p_sessione ->> 'consent_advertisement')::boolean, false),
		-- Zero e non uno: questa chiamata non è una pagina vista, ed è la
		-- differenza con registra_pagina.
		0,
		now()
	)
	on conflict (session_id) do update set
		ultimo_contatto = now(),
		-- Gli identificativi arrivano anche a visita iniziata, quando il
		-- consenso viene dato dopo l'atterraggio: è tutto il senso di questa
		-- funzione.
		visitor_id = coalesce(excluded.visitor_id, s.visitor_id),
		ga_session_id = coalesce(excluded.ga_session_id, s.ga_session_id),
		ga_client_id = coalesce(excluded.ga_client_id, s.ga_client_id),
		consent_analytics = excluded.consent_analytics,
		consent_advertisement = excluded.consent_advertisement,
		-- La provenienza resta quella di ingresso, come in registra_pagina.
		utm_source = coalesce(s.utm_source, excluded.utm_source),
		utm_medium = coalesce(s.utm_medium, excluded.utm_medium),
		utm_campaign = coalesce(s.utm_campaign, excluded.utm_campaign),
		utm_term = coalesce(s.utm_term, excluded.utm_term),
		utm_content = coalesce(s.utm_content, excluded.utm_content),
		utm_id = coalesce(s.utm_id, excluded.utm_id),
		gclid = coalesce(s.gclid, excluded.gclid),
		fbclid = coalesce(s.fbclid, excluded.fbclid),
		landing_page = coalesce(s.landing_page, excluded.landing_page),
		referrer = coalesce(s.referrer, excluded.referrer);
end;
$$;

revoke all on function public.aggiorna_sessione(jsonb) from public, anon, authenticated;
grant execute on function public.aggiorna_sessione(jsonb) to service_role;
