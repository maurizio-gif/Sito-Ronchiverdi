// L'impaginazione delle email del sito, in un posto solo.
//
// Stava dentro emailCliente.ts, che è nato prima ed era l'unico a mandare
// email in HTML. Ora le manda anche notificaResponsabile.ts, e due copie
// dello stesso <table> avrebbero preso strade diverse alla prima modifica —
// con il risultato che le email del club si somigliano solo un po'.
//
// Tabelle e stili in linea, non per gusto: Outlook e Gmail scartano i fogli
// di stile e buona parte del CSS moderno, e un layout a flexbox arriva a
// destinazione come una colonna di testo sfasata.

/** Indirizzo e telefono del club: nel piede di ogni email, e nel testo di alcune. */
export const INDIRIZZO_CLUB = "Corso Moncalieri 466, Torino";
export const TELEFONO_CLUB = "011 6612146";

/** Nel corpo di un'email finiscono nomi e messaggi scritti da altri: vanno scappati sempre. */
export function esc(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/** La cornice: intestazione del club, corpo, piede con indirizzo e telefono. */
export function impagina(titolo: string, corpo: string): string {
	return `<!doctype html>
<html lang="it">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /><title>${esc(titolo)}</title></head>
<body style="margin:0;padding:0;background:#f8f2e5;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f2e5;padding:32px 16px;">
		<tr><td align="center">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf6;border:1px solid rgba(28,28,24,0.12);border-radius:12px;">
				<tr><td style="padding:32px 32px 8px;">
					<p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8b6c14;">Ronchiverdi Sport Club</p>
					<h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#1c1c18;font-weight:normal;">${esc(titolo)}</h1>
				</td></tr>
				<tr><td style="padding:8px 32px 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#4a4a42;">
					${corpo}
				</td></tr>
			</table>
			<p style="max-width:560px;margin:16px auto 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#4a4a42;text-align:center;">
				Ronchiverdi Sport Club · ${esc(INDIRIZZO_CLUB)} · ${esc(TELEFONO_CLUB)}
			</p>
		</td></tr>
	</table>
</body>
</html>`;
}

export function bottone(href: string, etichetta: string): string {
	return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;"><tr><td style="background:#8b6c14;border-radius:8px;">
		<a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;color:#f6efde;text-decoration:none;">${esc(etichetta)}</a>
	</td></tr></table>`;
}

/** Riquadro a due colonne: etichetta a sinistra, valore in evidenza a destra. */
export function riquadro(righe: [string, string][]): string {
	const celle = righe
		.map(
			([k, v]) =>
				`<tr><td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#4a4a42;width:110px;vertical-align:top;">${esc(k)}</td>
				 <td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#1c1c18;font-weight:bold;">${esc(v)}</td></tr>`
		)
		.join("");
	return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;padding:16px 18px;background:#f8f2e5;border-radius:8px;">${celle}</table>`;
}
