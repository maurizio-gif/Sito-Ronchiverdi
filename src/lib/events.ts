import { getCollection } from "astro:content";

/**
 * Eventi in programma, dal più vicino al più lontano.
 *
 * Un evento resta visibile per tutta la sua giornata (o fino a `endDate`, se
 * indicata) e sparisce da solo il giorno dopo: gli eventi passati non vanno
 * cancellati a mano. Il filtro è calcolato in fase di build, quindi il sito
 * va ricompilato perché un evento scaduto sparisca online.
 */
export async function getUpcomingEvents(limit?: number) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const events = (await getCollection("events"))
		.filter((e) => {
			const fine = e.data.endDate ?? e.data.date;
			return fine.getTime() >= today.getTime();
		})
		.sort((a, b) => a.data.date.getTime() - b.data.date.getTime());

	return limit ? events.slice(0, limit) : events;
}

const giorno = new Intl.DateTimeFormat("it-IT", { day: "numeric" });
const meseCorto = new Intl.DateTimeFormat("it-IT", { month: "short" });
const dataEstesa = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" });

/**
 * Ultimo giorno dell'evento in formato YYYY-MM-DD, per l'attributo
 * `data-event-until` letto da EventExpiryGuard nel browser.
 */
export function untilAttr(date: Date, endDate?: Date) {
	const fine = endDate ?? date;
	const mese = String(fine.getMonth() + 1).padStart(2, "0");
	const giorno = String(fine.getDate()).padStart(2, "0");
	return `${fine.getFullYear()}-${mese}-${giorno}`;
}

/** Etichetta compatta per il badge: "12" + "set". */
export function badgeDate(date: Date) {
	return { giorno: giorno.format(date), mese: meseCorto.format(date).replace(".", "") };
}

/** "12 settembre 2026", oppure "3 – 11 ottobre 2026" per gli eventi su più giorni. */
export function formatRange(date: Date, endDate?: Date) {
	if (!endDate || endDate.getTime() === date.getTime()) return dataEstesa.format(date);
	const stessoMese = date.getMonth() === endDate.getMonth() && date.getFullYear() === endDate.getFullYear();
	return stessoMese
		? `${giorno.format(date)} – ${dataEstesa.format(endDate)}`
		: `${dataEstesa.format(date)} – ${dataEstesa.format(endDate)}`;
}
