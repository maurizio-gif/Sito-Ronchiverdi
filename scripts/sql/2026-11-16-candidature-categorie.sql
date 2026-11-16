-- Categoria sportiva delle candidature, per instradarle al responsabile.
--
-- Chi si candida per l'area "Tecnici e istruttori sportivi" sceglie nel
-- modulo anche lo sport (uno o più). Il pannello (CRM, sezioni
-- "Curriculum · Nuoto", "Curriculum · Tennis e padel", ...) mostra a ogni
-- responsabile solo le candidature del suo sport; la segreteria, con la
-- sezione Curriculum completa, le vede tutte.
--
-- Chiavi valide (ripetute in src/data/lavoraConNoi.ts, SPORT, e nel CRM in
-- lib/candidature.ts, CATEGORIE): tennis-padel, nuoto, fitness, triathlon.
-- Array vuoto = nessuno sport: solo la segreteria la vede.
--
-- Eseguire PRIMA del deploy del sito e del CRM.

alter table public.candidature
	add column if not exists categorie text[] not null default '{}';

comment on column public.candidature.categorie is
	'Sport per cui ci si candida (chiavi di SPORT in src/data/lavoraConNoi.ts). Vuoto per le aree non sportive. Instrada la candidatura al responsabile nel pannello.';

-- Le candidature già arrivate non hanno scelto uno sport: lo si ricava, una
-- volta sola, dalle parole che hanno scritto. Solo per l'area sportiva e solo
-- dove la colonna è ancora vuota, così rieseguire lo script non sovrascrive
-- niente. Quelle che non si riconoscono restano vuote, alla segreteria.
update public.candidature c
set categorie = array_remove(array[
	case when t ~* '(tennis|padel|racchett)' then 'tennis-padel' end,
	case when t ~* '(nuoto|nuotator|piscina|bagnin|salvament|bagnanti|acquagym|acqua gym)' then 'nuoto' end,
	case when t ~* '(palestra|fitness|personal|sala pesi|pesistica|crossfit|spinning|pilates|body ?building)' then 'fitness' end,
	case when t ~* '(triathlon|triatlet|preparazione atletica|ironman)' then 'triathlon' end
], null)
from (
	select id,
		lower(coalesce(presentazione, '') || ' ' || coalesce(esperienza, '') || ' ' || coalesce(cv_nome, '')) as t
	from public.candidature
) x
where c.id = x.id
	and c.area = 'tecnici-sportivi'
	and c.categorie = '{}';

create index if not exists candidature_categorie_idx
	on public.candidature using gin (categorie);
