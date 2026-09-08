-- Lead dei moduli istantanei di Meta: l'identificativo del lead su Meta.
--
-- Serve a una cosa sola, ed è il motivo per cui è una colonna e non una voce
-- in `dettagli`: Meta rimanda lo stesso webhook più volte quando la risposta
-- non arriva entro pochi secondi, e senza un vincolo di unicità ogni ritentativo
-- diventerebbe una richiesta doppia — e, peggio, una persona doppia
-- nell'anagrafica, perché il trigger su form_contatti chiama
-- trova_o_crea_persona a ogni riga inserita.
--
-- L'indice è UNIQUE ma parziale: le righe che non vengono da Meta hanno il
-- campo nullo, e devono poter restare tante quante sono.

alter table public.form_contatti
	add column if not exists meta_leadgen_id text;

comment on column public.form_contatti.meta_leadgen_id is
	'Id del lead sul modulo istantaneo di Meta. Popolato solo dalle righe con origine "meta-lead-ads", serve a scartare i webhook ripetuti. Nullo per le richieste dal sito.';

create unique index if not exists form_contatti_meta_leadgen_id_key
	on public.form_contatti (meta_leadgen_id)
	where meta_leadgen_id is not null;
