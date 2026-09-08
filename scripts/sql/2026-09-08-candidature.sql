-- Candidature spontanee dalla pagina /lavora-con-noi del sito.
--
-- Il club non pubblica posizioni aperte: la pagina elenca le aree in cui
-- normalmente cerca persone e raccoglie candidature spontanee. Per questo non
-- c'è una tabella "posizioni" con una chiave esterna: l'area di interesse è
-- copiata qui come chiave più etichetta, così una candidatura resta leggibile
-- anche quando l'elenco delle aree sul sito cambia.
--
-- Perché una tabella separata da form_contatti: una richiesta dal sito è un
-- lead commerciale — entra in anagrafica, apre una trattativa, finisce in
-- agenda. Una candidatura non è niente di tutto questo, e chi lavora le
-- richieste non deve trovarsi i curriculum in mezzo ai contatti dei soci.
-- Nessun trigger la collega a `persone`.
--
-- Il CV non sta nel database: sta nel bucket privato `candidature-cv`, e qui
-- resta solo il percorso. Il file viene caricato dal browser con una URL
-- firmata generata da /api/candidatura/upload — il limite di 5 MB non
-- passerebbe dal corpo di una function Vercel, che si ferma a 4,5 MB.

create table if not exists public.candidature (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),

	-- Chi si candida.
	nome text not null,
	cognome text not null,
	email text not null,
	cellulare text not null,
	citta text,

	-- Cosa cerca. `area` è la chiave dell'elenco in src/data/lavoraConNoi.ts,
	-- `area_label` l'etichetta al momento dell'invio.
	area text,
	area_label text,
	disponibilita text,

	-- Il racconto: sono i due campi lunghi del modulo.
	presentazione text not null,
	esperienza text,

	-- Il curriculum nel bucket privato. cv_path è null solo per una
	-- candidatura arrivata senza allegato: il modulo lo chiede, ma il vincolo
	-- sta nel modulo e non qui, per non perdere una candidatura buona il
	-- giorno in cui il caricamento del file fallisce.
	cv_path text,
	cv_nome text,
	cv_tipo text,
	cv_dimensione integer,

	-- Consenso al trattamento dei dati per la selezione: obbligatorio nel
	-- modulo, registrato qui come prova.
	privacy boolean not null default false,

	-- Provenienza, come per le richieste dal sito: da dove è arrivata la
	-- persona prima di candidarsi.
	session_id text,
	pagina text,
	landing_page text,
	referrer text,
	utm_source text,
	utm_medium text,
	utm_campaign text,

	-- Lavorazione dal pannello (sezione Curriculum).
	stato text not null default 'nuova',
	note text,
	gestita_da text,
	gestita_il timestamptz
);

alter table public.candidature
	drop constraint if exists candidature_stato_check;
alter table public.candidature
	add constraint candidature_stato_check
	check (stato in ('nuova', 'in_valutazione', 'archiviata'));

comment on table public.candidature is
	'Candidature spontanee raccolte da /lavora-con-noi sul sito. Scritte solo via service_role (endpoint /api/candidatura su Vercel), lette dal pannello nella sezione Curriculum. Il CV sta nel bucket privato candidature-cv, qui resta il percorso.';

-- L''elenco del pannello è ordinato dalla più recente e filtrato per stato.
create index if not exists candidature_created_at_idx
	on public.candidature (created_at desc);
create index if not exists candidature_stato_idx
	on public.candidature (stato);

-- Nessuna policy: come le altre tabelle di questo progetto, la scrittura
-- passa dalle function del sito e la lettura dal pannello, entrambe con la
-- service_role key. Con RLS attiva e nessuna policy, anon e authenticated non
-- vedono nulla — che è esattamente quello che serve per dei curriculum.
alter table public.candidature enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- Bucket dei curriculum: privato, 5 MB, solo i formati che il modulo accetta.
-- I limiti sono ripetuti in src/lib/candidature.ts (il modulo li usa per il
-- messaggio d'errore prima di caricare) — se cambiano qui vanno cambiati là.
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'candidature-cv',
	'candidature-cv',
	false,
	5242880,
	array[
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'image/jpeg'
	]
)
on conflict (id) do update set
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;
