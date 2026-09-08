# Email di conferma, promemoria e gestione degli appuntamenti

Cosa riceve chi compila un form sul sito, e cosa serve perché funzioni.

## Le email

| Quando | Cosa arriva | Da dove parte |
| --- | --- | --- |
| Form inviato, percorso "Messaggio" | "Abbiamo ricevuto il tuo messaggio" | `POST /api/lead` |
| Form inviato, visita in sede o telefonata | Conferma con data, ora, luogo e il pulsante **Sposta o annulla** | `POST /api/lead` |
| Un'ora prima dell'appuntamento | Promemoria con gli stessi dati e lo stesso pulsante | `GET /api/promemoria`, chiamato dal cron |
| Il cliente sposta l'appuntamento | Conferma del nuovo orario | `POST /api/appuntamento` |
| Il cliente annulla | Conferma dell'annullamento | `POST /api/appuntamento` |

A ogni spostamento e a ogni annullamento parte anche l'avviso alla segreteria,
sulla stessa casella degli avvisi di nuova richiesta: uno slot che si libera
all'ultimo momento la riguarda.

Mittente `digital@ronchiverdi.it`, risposte a `info@ronchiverdi.it`: gli stessi
del pannello, così chi riceve vede sempre lo stesso nome.

## Il link "sposta o annulla"

Porta a `/appuntamento?t=<token>`. Il token è un uuid casuale in
`form_contatti.token_gestione`, generato dal database alla creazione della
riga: è l'unica credenziale, quindi la pagina è `noindex`, non è linkata da
nessuna parte del sito e non compare in sitemap.

Dalla pagina si può:

- **spostare** — stesso calendario della prenotazione, stesse regole
  (`src/lib/agendaSlot.js`), con gli orari già occupati esclusi. Il proprio
  orario attuale resta scegliibile, altrimenti risulterebbe occupato da sé
  stesso;
- **annullare** — scrive `appuntamento_annullato_il`.

La validazione dell'orario nuovo è rifatta per intero lato server: il
controllo del browser serve a non far scegliere un orario impossibile, quello
del server a non accettarlo comunque da una richiesta costruita a mano.

Un appuntamento già passato, già annullato o con un token inesistente non si
gestisce: la pagina lo dice e rimanda al telefono.

## Allineamento con l'agenda

L'agenda del pannello legge `form_contatti` (vedi `lib/agenda.ts`,
`voceDaContatto`). Un appuntamento annullato dal cliente:

- risulta **annullato** in agenda, non "da fare" — la segreteria vede che il
  posto si è liberato, e quando;
- **libera lo slot**: `slotOccupati` salta le voci annullate, quindi
  `/api/disponibilita` torna a offrire quell'orario sul sito.

Uno spostamento aggiorna `data_scelta`/`ora_scelta`, quindi la voce si muove
in agenda da sé e azzera `promemoria_inviato_il`: il promemoria riparte sul
nuovo orario.

## Configurazione

Variabili del progetto Vercel del **sito** (`sito-ronchiverdi`):

| Variabile | A cosa serve |
| --- | --- |
| `SENDGRID_API_KEY` | Già presente per gli avvisi alla segreteria. |
| `SENDGRID_FROM_EMAIL` | Mittente. Default `digital@ronchiverdi.it`. **Dev'essere verificato su SendGrid**, altrimenti l'invio viene rifiutato con 403. |
| `SENDGRID_FROM_NAME`, `EMAIL_REPLY_TO` | Nome del mittente e casella delle risposte. Hanno un default sensato. |
| `CRON_SECRET` | Protegge `/api/promemoria`. Lo imposta il progetto e Vercel lo manda da sé nell'header `Authorization`. **Senza, il promemoria non parte.** |
| `SITE_URL` | Indirizzo nei link delle email. Finché non c'è si usa il dominio di produzione Vercel; al go-live va impostata insieme al dominio. |

`PROMEMORIA_TOKEN` è alternativo a `CRON_SECRET` e serve solo a chiamare
l'endpoint da fuori Vercel (uno scheduler esterno, o una prova a mano).

## Il promemoria

Il cron è dichiarato in `vercel.json` e gira ogni cinque minuti. A ogni giro
cerca gli appuntamenti di oggi che cominciano fra 40 e 60 minuti, non
annullati e non ancora avvisati.

La finestra è più larga dell'intervallo del cron di proposito: se un giro
salta, il successivo recupera invece di perdere l'invio. Non manda doppioni
perché segna `promemoria_inviato_il`, e lo segna **solo se l'invio è andato**:
se SendGrid rifiuta, il giro dopo riprova.

Gli orari sono calcolati nel fuso del club (`Europe/Rome`) e non in quello del
server, che su Vercel è UTC: altrimenti d'estate i promemoria partirebbero con
due ore di scarto.

### Prova manuale

Con `PROMEMORIA_TOKEN` impostato:

```bash
curl -s -H "x-promemoria-token: IL_TOKEN" https://IL_SITO/api/promemoria
```

Risponde `{"ok":true,"candidati":N,"inviati":N}`. Senza segreto configurato
risponde `503 non_configurato`; con segreto sbagliato `401`.

## Cosa non fa (ancora)

- Se è **la segreteria** a spostare o annullare dal pannello, al cliente non
  arriva niente: l'email parte solo per le modifiche fatte dal cliente.
- Le candidature di "Lavora con noi" (`/api/candidatura`) non mandano una
  conferma a chi si candida.
