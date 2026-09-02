-- Tracciamento sessioni del sito, scritto da src/pages/api/track.ts (Vercel).
--
-- Da eseguire nel SQL Editor di Supabase DOPO 2026-09-02-tracking-utm.sql.
--
-- Struttura:
--   sessioni        → una riga per session_id, con la provenienza della visita
--   sessioni_pagine → una riga per pagina vista, per il percorso di navigazione
--   registra_pagina → la funzione che l'endpoint chiama a ogni pagina
--
-- Il legame col form è form_contatti.session_id (creato dalla migration
-- precedente). Non c'è vincolo di chiave esterna per scelta: un form deve
-- poter essere salvato anche se la riga di sessione non è ancora arrivata —
-- la conversione vale più del referto statistico.

-- ---------------------------------------------------------------- tabelle

create table if not exists public.sessioni (
	session_id text primary key,
	created_at timestamptz not null default now(),
	ultimo_contatto timestamptz not null default now(),

	-- Identità: visitor_id è persistente (localStorage) e arriva solo con
	-- consenso; gli id GA4 permettono di ritrovare la sessione in GA4/BigQuery.
	visitor_id text,
	ga_session_id text,
	ga_client_id text,

	-- Provenienza di ingresso della sessione, scritta una volta sola.
	utm_source text,
	utm_medium text,
	utm_campaign text,
	utm_term text,
	utm_content text,
	utm_id text,
	gclid text,
	gbraid text,
	wbraid text,
	fbclid text,
	ttclid text,
	msclkid text,
	li_fat_id text,
	landing_page text,
	referrer text,

	-- Contesto tecnico. L'indirizzo IP non viene mai salvato: paese, regione e
	-- città arrivano già derivati dagli header di Vercel.
	user_agent text,
	dispositivo text,
	paese text,
	regione text,
	citta text,
	lingua text,
	schermo text,

	consent_analytics boolean not null default false,
	consent_advertisement boolean not null default false,

	pagine_viste integer not null default 0,
	-- Marcata da /api/lead quando la sessione compila un form: permette di
	-- calcolare il tasso di conversione per campagna senza join.
	convertita boolean not null default false,
	convertita_at timestamptz
);

create table if not exists public.sessioni_pagine (
	id bigserial primary key,
	session_id text not null references public.sessioni (session_id) on delete cascade,
	visto_at timestamptz not null default now(),
	pagina text not null,
	titolo text,
	referrer text
);

create index if not exists sessioni_created_at_idx on public.sessioni (created_at desc);
create index if not exists sessioni_utm_campaign_idx on public.sessioni (utm_campaign);
create index if not exists sessioni_visitor_id_idx on public.sessioni (visitor_id);
create index if not exists sessioni_convertita_idx on public.sessioni (convertita) where convertita;
create index if not exists sessioni_pagine_session_idx on public.sessioni_pagine (session_id, visto_at);

-- ------------------------------------------------------------------- RLS

-- RLS attiva senza policy: nessun accesso con la anon key. Scrive solo
-- l'endpoint su Vercel, che usa la service_role key (che bypassa RLS), e
-- legge solo chi entra dalla dashboard Supabase.
alter table public.sessioni enable row level security;
alter table public.sessioni_pagine enable row level security;

-- ------------------------------------------------------- funzione di scrittura

-- Un solo round-trip per pagina vista: upsert della sessione + contatore +
-- riga di pageview. Sull'upsert i campi di provenienza NON vengono
-- sovrascritti (coalesce sul valore già presente): la prima pagina della
-- sessione porta le UTM, le successive non devono cancellarle.
create or replace function public.registra_pagina(
	p_sessione jsonb,
	p_pagina text,
	p_titolo text default null,
	p_referrer_pagina text default null
) returns void
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
		1,
		now()
	)
	on conflict (session_id) do update set
		ultimo_contatto = now(),
		pagine_viste = s.pagine_viste + 1,
		-- Gli id di identità e lo stato del consenso possono arrivare dopo
		-- (l'utente accetta il banner a metà visita): quelli li aggiorniamo.
		visitor_id = coalesce(excluded.visitor_id, s.visitor_id),
		ga_session_id = coalesce(excluded.ga_session_id, s.ga_session_id),
		ga_client_id = coalesce(excluded.ga_client_id, s.ga_client_id),
		consent_analytics = excluded.consent_analytics,
		consent_advertisement = excluded.consent_advertisement,
		-- La provenienza resta quella di ingresso.
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

	insert into public.sessioni_pagine (session_id, pagina, titolo, referrer)
	values (v_session_id, p_pagina, p_titolo, p_referrer_pagina);
end;
$$;

-- Solo il ruolo di servizio può chiamarla: l'endpoint su Vercel.
revoke all on function public.registra_pagina(jsonb, text, text, text) from public, anon, authenticated;
grant execute on function public.registra_pagina(jsonb, text, text, text) to service_role;

-- Marca la sessione come convertita. Chiamata da /api/lead dopo l'insert del
-- form: se la sessione non è (ancora) in tabella non fa nulla e non è un errore.
create or replace function public.marca_sessione_convertita(p_session_id text)
returns void
language sql
security definer
set search_path = public
as $$
	update public.sessioni
	set convertita = true,
		convertita_at = coalesce(convertita_at, now()),
		ultimo_contatto = now()
	where session_id = p_session_id;
$$;

revoke all on function public.marca_sessione_convertita(text) from public, anon, authenticated;
grant execute on function public.marca_sessione_convertita(text) to service_role;

-- ------------------------------------------------------------------ viste

-- Sessioni e lead affiancati: la vista da cui leggere "chi è arrivato da dove
-- e cosa ha compilato". Una riga per sessione; i campi lead sono nulli per le
-- sessioni che non hanno convertito.
create or replace view public.sessioni_con_lead as
select
	s.session_id,
	s.created_at as sessione_iniziata_at,
	s.ultimo_contatto,
	s.pagine_viste,
	s.convertita,
	coalesce(s.utm_source, case when s.referrer is null then '(direct)' else '(referral)' end) as sorgente,
	s.utm_medium,
	s.utm_campaign,
	s.utm_term,
	s.utm_content,
	s.gclid,
	s.fbclid,
	s.landing_page,
	s.referrer,
	s.dispositivo,
	s.paese,
	s.citta,
	s.ga_session_id,
	s.ga_client_id,
	s.consent_analytics,
	s.consent_advertisement,
	l.id as lead_id,
	l.created_at as lead_at,
	l.origine as lead_origine,
	l.pagina as lead_pagina,
	l.cta as lead_cta,
	l.attivita_label as lead_attivita,
	l.nome,
	l.cognome,
	l.email,
	l.cellulare
from public.sessioni s
left join public.form_contatti l on l.session_id = s.session_id;

-- Rendimento per campagna: sessioni, lead e tasso di conversione. È la query
-- che di solito si vuole guardare per prima.
create or replace view public.campagne_rendimento as
select
	coalesce(utm_source, case when referrer is null then '(direct)' else '(referral)' end) as sorgente,
	coalesce(utm_medium, '(none)') as mezzo,
	coalesce(utm_campaign, '(none)') as campagna,
	count(*) as sessioni,
	count(*) filter (where convertita) as lead,
	round(100.0 * count(*) filter (where convertita) / nullif(count(*), 0), 2) as conversione_pct,
	round(avg(pagine_viste), 1) as pagine_medie,
	min(created_at) as prima_sessione,
	max(created_at) as ultima_sessione
from public.sessioni
group by 1, 2, 3
order by sessioni desc;

-- ------------------------------------------------------- sicurezza viste

-- IMPORTANTE. Una vista creata dal proprietario dello schema gira con i suoi
-- privilegi e AGGIRA la RLS delle tabelle sottostanti; con i grant di default
-- di Supabase il ruolo anon (la chiave pubblica del sito) potrebbe leggere
-- nome, email e cellulare dei lead passando dalla vista, anche se la tabella
-- form_contatti è protetta. Doppia protezione: security_invoker fa valutare la
-- RLS con i privilegi di chi interroga, e i grant a anon/authenticated vengono
-- revocati. Le viste restano leggibili dalla dashboard e dalla service_role.
alter view public.sessioni_con_lead set (security_invoker = on);
alter view public.campagne_rendimento set (security_invoker = on);

revoke all on public.sessioni_con_lead from anon, authenticated;
revoke all on public.campagne_rendimento from anon, authenticated;
grant select on public.sessioni_con_lead to service_role;
grant select on public.campagne_rendimento to service_role;

-- Anche le tabelle: la RLS senza policy già blocca tutto, ma i grant di
-- default a anon/authenticated non servono a nessuno e vanno via.
revoke all on public.sessioni from anon, authenticated;
revoke all on public.sessioni_pagine from anon, authenticated;
