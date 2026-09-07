# Armonizzazione dei regolamenti nei Termini e Condizioni

Nota di lavoro su come è stata costruita la pagina `/termini-e-condizioni`
(`src/pages/termini-e-condizioni.astro`): da quali documenti viene ogni regola,
quali duplicazioni sono state eliminate, quali contraddizioni sono state
sciolte e in che modo, e cosa resta da confermare con il club.

Serve a due cose: capire, fra sei mesi, perché una regola è scritta così; e
dare al club l'elenco puntuale delle decisioni prese al posto suo, da validare.

## Le fonti

| # | Documento | Data | Cosa contiene |
| --- | --- | --- | --- |
| 1 | `20260729_regolamento.pdf` — modulistica MOD019 | 29 luglio 2026 | Domanda di iscrizione + regolamento completo (7 pagine) |
| 2 | `2026_Regolamento_iscrizioni.pdf` — MOD019 | 7 settembre 2026 | Stesso testo della fonte 1, con l'ordine di due blocchi invertito |
| 3 | `2026_regolamento_per_flex.pdf` — MOD019 variante Flex | 7 settembre 2026 | Come sopra, ma con una pagina campi diversa e alcune omissioni |
| 4 | `Regolamento_Ronchiverdi_nuva_versione.docx` | senza data | Riscrittura sintetica e più recente nei contenuti |

Le fonti 2 e 3 sono state fornite come stampe di una pratica reale e
**contengono i dati personali di un socio** (nome, codice fiscale, contatti,
indirizzo). Quei dati non sono stati riportati da nessuna parte: non sono nel
repository, non sono nella pagina pubblicata, non sono in questa nota. I PDF
originali non vanno committati.

## Come sono state trattate le fonti

Le fonti 1, 2 e 3 sono lo stesso regolamento in tre stampe diverse: il testo
coincide parola per parola, tranne nei punti elencati più sotto. La fonte 4 è
una riscrittura successiva, più vicina a come il club funziona oggi (lo si vede
dal confronto con le FAQ del sito: palestra, braccialetto, certificato medico).

Criterio adottato: **la regola operativa più recente e coerente con il sito
vince**, la formulazione contrattuale più precisa dei PDF resta. Dove le due
cose si scontravano, la scelta è annotata qui sotto.

## Duplicazioni eliminate

1. **Il paragrafo su In4You e certificato medico compariva due volte di fila**
   nella fonte 4, in due formulazioni diverse (una ereditata dai PDF, una
   riscritta). Ora è una regola sola, divisa fra "Braccialetto e tessera di
   accesso" e la sezione "Certificato medico".
2. **La clausola sull'assenza di copertura assicurativa** compariva tre volte:
   fra le regole degli spogliatoi, fra le norme generali e — nella fonte 4 —
   come se fosse una condizione specifica dell'abbonamento Exclusive. È una
   regola generale del club: sta solo in "Responsabilità e oggetti personali",
   e le altre sezioni ci rimandano.
3. **Il divieto di oggetti in vetro** era ripetuto per spogliatoi e per zona
   piscina in due punti distanti. Ora è una voce sola nell'elenco dei divieti.
4. **Turpiloquio e schiamazzi** comparivano solo nella sezione tennis benché
   valgano ovunque: la regola è nei divieti generali, e la sezione campi la
   richiama senza riscriverla.
5. **Il divieto di parcheggio fuori dagli spazi demarcati** era stampato due
   volte nella stessa pagina della fonte 1. Ora è una volta sola.
6. **Le regole di prenotazione dei campi** erano spezzate su due pagine non
   contigue (l'intestazione "Prenotazione e cancellazione campi Tennis" a
   pagina 3, il contenuto a pagina 4, in mezzo il parcheggio). Sono raccolte in
   una tabella unica.
7. **Contenuti e prezzi degli abbonamenti** non sono ricopiati: vivono in
   `/abbonamenti` (`src/content/memberships/tabella.json`), e la pagina ci
   rimanda. Nei termini restano solo le condizioni contrattuali specifiche
   (durata, fasce orarie, esclusioni). Stesso criterio per orari (`/planning`),
   risposte operative (`/faq`) e dati personali (`/privacy`).

## Incongruenze risolte

| # | Punto | Cosa dicevano le fonti | Scelta adottata |
| --- | --- | --- | --- |
| 1 | Uso della palestra | Fonti 1-3: «l'utilizzo dei macchinari può avvenire **solo sotto la supervisione di un istruttore**». Fonte 4 e FAQ del sito: uso autonomo, con scarpe pulite e asciugamano; solo le bike da spinning richiedono l'istruttore | Vince la fonte 4: uso autonomo, bike da spinning solo con istruttore, istruttori in sala per assistenza. La versione dei PDF contraddiceva la pagina Gym Floor e la FAQ già pubblicate |
| 2 | Relax Zone e idromassaggio | «Relax Zone vietata ai minori di 16 anni **e** idromassaggio vietato ai minori di 12», scritto come se le due soglie convivessero nello stesso spazio | Le soglie sono state separate per area: Relax Zone (sauna, bagno di vapore) dai 16 anni; idromassaggio in zona piscina dai 12. Così la soglia dei 12 anni ha un senso applicativo |
| 3 | Tesseramento FITP | Fonti 1-3: «non incluso nell'abbonamento». FAQ del sito: «nell'iscrizione è incluso il tesseramento FITP non agonistico» | Disambiguato: il tesseramento **non** è compreso nell'abbonamento al Club, **è** compreso nella quota dei corsi di tennis. Le due affermazioni parlavano di contratti diversi |
| 4 | Prenotazione campi, stagione estiva | Fonti 1-2: una prenotazione al giorno, 1h singolo / 1h30 doppio. Fonte 3: prenotazione fino a 48h prima, di persona nella mezz'ora precedente, conferma con presenza 15 minuti prima | Unite: sono regole complementari, non alternative. Frequenza e durata in tabella, finestre e conferma nella sezione "Stagione estiva" |
| 5 | Ospiti | Fonti 1-2: limitazioni generiche nei periodi di alta affluenza. Fonte 3: divieto secco di invitare ospiti dal lunedì al venerdì dalle 12 e nei weekend | Il divieto secco compare nella fonte 3 dentro il blocco dei campi estivi: è stato mantenuto come regola **specifica dei campi in stagione estiva**, sotto la regola generale sull'alta affluenza |
| 6 | Abbonamento Swim | Fonti 1-2: esclude outdoor, solarium, tennis e padel; 11 mesi. Fonte 3: senza esclusioni. Fonte 4: aggiunge acquafitness in vasca indoor, Relax Zone e rateizzazione in 12 mensilità. FAQ del sito: 11 mesi, nuoto libero e acqua fitness, no piscina estiva | Versione unica che tiene tutto: vasca indoor per nuoto libero e acqua fitness + Relax Zone, esclusioni esplicite, 11 mesi (agosto escluso) rateizzabili in 12 |
| 7 | Abbonamento Gym | Fonti 1-3 escludono «aree outdoor, piscine, solarium, padel, tennis»; la fonte 4 aggiunge la palestra esterna | Tenuta la lista più completa, palestra esterna inclusa fra le esclusioni |
| 8 | Modifica di tariffe e servizi | Presente nelle fonti 1-2, assente nella 3, presente in forma sintetica nella 4, sempre senza indicare da quando le nuove condizioni valgono | Mantenuta, ma con l'effetto precisato: per gli abbonamenti in corso le modifiche valgono **dal rinnovo**; per Flex vale il preavviso di 30 giorni già previsto |
| 9 | Quota di 100 € | Fonti 1-3: è la quota di **attivazione Flex**. Fonte 4: è la quota di iscrizione da riversare in caso di mancato rinnovo | Separate: quota associativa annuale (importo a listino) per l'iscrizione al Club, quota di attivazione di 100 € per Flex. Il caso "mancato rinnovo → si riversa la quota di iscrizione" è mantenuto senza cifra. **Da confermare** (punto 1 sotto) |
| 10 | Braccialetto vs tessera magnetica | I documenti usano ora "tessera magnetica" (accessi In4You) ora "braccialetto" (consegnato all'iscrizione), come se fossero due cose | Unificati in "dispositivo personale di accesso — braccialetto o tessera". Il sito, nelle FAQ, dice braccialetto |
| 11 | Iscrizione dei minori | Fonti 1-3: tre regole (maggiorenni; under 18 col consenso di un genitore; under 14 subordinata all'iscrizione di un genitore). Fonte 4: solo le prime due | Tenuta la versione completa: la regola sugli under 14 ha effetti pratici e non risulta abrogata |
| 12 | Recapito privacy | I moduli indicano `privacy@ronchiverdi.it`; l'informativa del vecchio sito indicava `info@ronchiverdi.it` | La pagina `/privacy` è stata allineata ai documenti ufficiali: `privacy@ronchiverdi.it` per i diritti dell'interessato, `info@` come recapito generale |
| 13 | Orari del ristorante | Presenti in tutte le fonti PDF (pranzo 12.30-14.30, cena 19.30-22.00, chiusura domenica e lunedì sera) | **Non riportati**: sono dati operativi che cambiano, gestiti fuori da questo sito (area Elements). Restano il dress code della Club House e la Business Lounge, con rimando alla reception per orari e prenotazioni |
| 14 | Spogliatoi e bambini | I PDF descrivono la regola per genere («i maschietti con la mamma… le femminucce con il papà»); le FAQ della Scuola Nuoto dicono che i genitori non entrano negli spogliatoi | Riscritta in forma neutra («i bambini fino ai 5 anni possono accedere allo spogliatoio del genitore che li accompagna, dai 6 anni Kids Village») e aggiunto il rimando al servizio di assistenza durante le lezioni, che è il caso in cui i genitori non entrano |

## Vuoti colmati

Cose che nessuna delle quattro fonti diceva, e che in un documento pubblicato
sul sito servono:

- **Gerarchia fra i documenti.** La pagina dichiara di essere la versione
  ufficiale e aggiornata, e che prevale sulle copie precedenti; restano
  eccettuate le condizioni economiche del modulo firmato. È la clausola che
  evita che i regolamenti in circolazione tornino a divergere.
- **Diritto di recesso di 14 giorni** per i contratti conclusi a distanza o
  fuori dai locali del club (artt. 52 e seguenti del Codice del consumo), con
  l'addebito della parte di servizio già fruita. Nessuna fonte lo prevedeva.
- **Congelamento dell'abbonamento**: le fonti lo escludono solo per Flex e
  tacciono sulle altre formule. La pagina dice che per le altre è possibile
  solo nei casi concordati per iscritto con la Direzione.
- **Limiti alle clausole di esonero.** La fonte 4 conteneva «il Club non è
  responsabile per danni o lesioni, salvo dolo o colpa grave»: una clausola che
  esclude la responsabilità per danni alla persona è nulla (art. 1229 c.c.) e
  vessatoria verso il consumatore (art. 33 Codice del consumo). È stata
  sostituita da: nessun esonero per dolo o colpa grave né per danni alla
  persona, restano fermi i diritti inderogabili. Il declino di responsabilità
  su oggetti non presi in custodia resta, perché è legittimo.
- **Rimborsi**: «nessun rimborso» in caso di risoluzione per fatto del socio è
  mantenuto, ma con la riserva dei diritti inderogabili del consumatore.
- **Legge applicabile e foro**: legge italiana, foro del consumatore.

## Da confermare con il club

1. **Quota di iscrizione.** I 100 € sono solo la quota di attivazione Flex, o
   sono anche la quota associativa annuale del Club? La fonte 4 lascia intendere
   la seconda. Oggi la pagina rinvia al listino per la quota associativa e
   indica 100 € solo per Flex.
2. **Morning ed Exclusive.** Compaiono nei regolamenti ma non nella tabella
   abbonamenti del sito (Gym, Swim, Silver, Gold). Morning è rimasto con le sue
   fasce orarie; di Exclusive non resta nulla di specifico, perché l'unica
   clausola dedicata era la copertura assicurativa, che è generale. Vanno
   ancora venduti? Se sì, vanno aggiunti a `/abbonamenti`; se no, va tolta la
   card Morning.
3. **Flex nel listino.** L'abbonamento Flex ha un regolamento dedicato ma non
   compare fra le formule del sito: va aggiunto alla tabella o resta una
   modalità di pagamento proposta in reception?
4. **Trimestrali.** La regola «niente sabato e domenica da maggio ad agosto»
   compare solo nella fonte 3, subito dopo il paragrafo Morning: vale per tutti
   i trimestrali (come è stato scritto) o solo per il Morning trimestrale?
5. **Palestra.** Confermare che l'uso autonomo dei macchinari è corretto e che
   la formula «solo sotto supervisione di un istruttore» dei PDF è superata.
6. **Uso dei campi e ospiti in estate.** Confermare il divieto di ospiti sui
   campi dal lunedì al venerdì dalle 12:00 e nei weekend, e le finestre di
   cancellazione (4 ore tennis, 6 ore padel).
7. **Recesso a distanza.** Se il club attiverà la vendita di abbonamenti
   online dal sito, la sezione va riletta con il legale insieme alle
   informazioni precontrattuali obbligatorie.
8. **Validazione legale complessiva.** Il testo è un'armonizzazione redazionale
   dei documenti esistenti, non un parere legale: prima della pubblicazione
   definitiva va letto dal consulente del club, in particolare per le clausole
   su responsabilità, rimborsi, risoluzione e recesso.

## Com'è fatta la pagina

Il documento è un **articolato**: `src/pages/termini-e-condizioni.astro` definisce
l'elenco `articoli`, e da quello la pagina genera tutto il resto.

- Ogni voce diventa un articolo numerato **in ordine di apparizione** (Art. 1,
  Art. 2…), ogni sua clausola un punto `articolo.punto` con un id proprio
  (`#art-6-9`). I numeri non si scrivono mai a mano: spostare un articolo li
  rinumera tutti, indice compreso.
- Il numero di ogni punto è un link: serve a citare una regola precisa —
  «vale il punto 19.5» — e ad arrivarci direttamente. Il punto raggiunto resta
  segnato per un paio di secondi, così chi atterra a metà documento capisce
  dov'è.
- I **rimandi interni** si scrivono col segnaposto `{{art:id}}` (per esempio
  `{{art:flex}}`), risolto in fase di build nel numero e nel link giusti. Un
  «vedi art. 12» scritto a mano diventerebbe falso al primo riordino; il
  segnaposto verso un id inesistente fa invece fallire la build.
- Sopra il testo c'è una **ricerca per parole chiave** che filtra i punti,
  nasconde gli articoli rimasti vuoti, sfoltisce l'indice di conseguenza ed
  evidenzia le parole trovate. Ignora accenti e apostrofi tipografici, quindi
  "eta" trova "età". L'indice dei risultati non promette mai una sezione che
  la ricerca ha appena nascosto.

## Come mantenerlo

- Una regola nuova si scrive **solo** in `src/pages/termini-e-condizioni.astro`,
  come clausola dell'articolo di competenza. Se compare anche su un modulo
  cartaceo, il modulo deve rimandare alla pagina, non ricopiarla.
- Meglio un punto in più che un punto lungo: la ricerca filtra per punto, e un
  punto che contiene tre regole ne mostra sempre tre anche a chi ne cercava una.
- Dati che vivono altrove (prezzi, orari, contenuti degli abbonamenti) si
  linkano, non si duplicano: è la regola che ha evitato metà delle
  incongruenze elencate sopra.
- A ogni modifica va aggiornata la data `aggiornamento` in cima alla pagina:
  è quella che rende opponibile la clausola di prevalenza sulle copie
  precedenti.
