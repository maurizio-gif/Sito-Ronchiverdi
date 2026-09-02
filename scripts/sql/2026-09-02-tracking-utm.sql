-- Correlazione UTM ↔ Session ID sui lead del sito.
--
-- Da eseguire una volta sola nel SQL Editor di Supabase, prima del deploy:
-- l'endpoint /api/lead scrive queste colonne a ogni invio di form e senza di
-- esse l'insert va in errore (db_error).
--
-- Tutte le colonne sono nullable: un lead diretto, senza campagna, resta
-- valido e si limita ad avere le UTM vuote.

alter table public.form_contatti
	-- Sessione: session_id è il nostro id first-party (sempre presente),
	-- ga_session_id / ga_client_id arrivano da GA4 solo con consenso analytics
	-- e permettono di ritrovare lo stesso lead in GA4 / BigQuery.
	add column if not exists session_id text,
	add column if not exists ga_session_id text,
	add column if not exists ga_client_id text,

	-- Last touch: la campagna che ha generato la conversione.
	add column if not exists utm_source text,
	add column if not exists utm_medium text,
	add column if not exists utm_campaign text,
	add column if not exists utm_term text,
	add column if not exists utm_content text,
	add column if not exists utm_id text,

	-- First touch: la campagna che ha portato l'utente sul sito la prima volta
	-- (conservata fino a 90 giorni, solo con consenso analytics/advertisement).
	add column if not exists first_utm_source text,
	add column if not exists first_utm_medium text,
	add column if not exists first_utm_campaign text,
	add column if not exists first_utm_term text,
	add column if not exists first_utm_content text,

	-- Click id delle piattaforme pubblicitarie.
	add column if not exists gclid text,
	add column if not exists gbraid text,
	add column if not exists wbraid text,
	add column if not exists fbclid text,
	add column if not exists ttclid text,
	add column if not exists msclkid text,
	add column if not exists li_fat_id text,

	-- Contesto di ingresso.
	add column if not exists landing_page text,
	add column if not exists referrer text,
	add column if not exists first_touch_at timestamptz,

	-- Stato del consenso CookieYes al momento dell'invio: spiega perché un
	-- lead ha o non ha il session id di GA4.
	add column if not exists consent_analytics boolean default false,
	add column if not exists consent_advertisement boolean default false;

-- Indici per le due interrogazioni ricorrenti: "tutti i lead di questa
-- campagna" e "il lead di questa sessione".
create index if not exists form_contatti_utm_campaign_idx
	on public.form_contatti (utm_campaign);

create index if not exists form_contatti_session_id_idx
	on public.form_contatti (session_id);

comment on column public.form_contatti.session_id is 'Session id first-party generato dal sito (src/lib/tracking.client.js): chiave di collegamento con la tabella sessioni.';
comment on column public.form_contatti.ga_session_id is 'Session id di GA4 letto dal cookie _ga_*: presente solo con consenso analytics.';
comment on column public.form_contatti.first_utm_source is 'First touch: prima campagna che ha portato il visitatore sul sito (fino a 90 giorni, solo con consenso).';
comment on column public.form_contatti.consent_analytics is 'Stato del consenso CookieYes al momento dell invio: spiega perche un lead ha o non ha ga_session_id.';

-- Vista di comodo per l'export: un lead per riga con la sua provenienza,
-- pronta da scaricare in CSV dalla dashboard Supabase.
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
	consent_advertisement
from public.form_contatti;

-- ------------------------------------------------------- sicurezza viste

-- IMPORTANTE. Una vista creata dal proprietario dello schema gira con i suoi
-- privilegi e AGGIRA la RLS delle tabelle sottostanti; con i grant di default
-- di Supabase il ruolo anon (la chiave pubblica del sito) potrebbe leggere
-- nome, email e cellulare dei lead passando dalla vista, anche se la tabella
-- form_contatti è protetta. Doppia protezione: security_invoker fa valutare la
-- RLS con i privilegi di chi interroga, e i grant a anon/authenticated vengono
-- revocati. Le viste restano leggibili dalla dashboard e dalla service_role.
alter view public.lead_attribuzione set (security_invoker = on);
revoke all on public.lead_attribuzione from anon, authenticated;
grant select on public.lead_attribuzione to service_role;
