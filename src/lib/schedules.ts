import { getEntry } from "astro:content";

/**
 * Planning del club, gestito da Tina CMS.
 *
 * Sorgente unica: src/content/schedules/planning.json. Contiene gli orari di
 * apertura e tutti i palinsesti settimanali (corsi fitness, acqua fitness,
 * nuoto libero, ...). Ogni pagina prende da qui la sezione che le serve —
 * la pagina Planning le mostra tutte, quella di Acqua Fitness solo la sua —
 * quindi basta modificarlo in un punto perché si aggiorni ovunque.
 */
export interface ScheduleLesson {
	name: string;
	description: string;
}

export interface ScheduleSlot {
	time: string;
	id: string;
	trainer?: string;
	note?: string;
}

const EMPTY_WEEK = (): Record<string, ScheduleSlot[]> => ({
	lunedi: [],
	martedi: [],
	mercoledi: [],
	giovedi: [],
	venerdi: [],
	sabato: [],
	domenica: [],
});

async function getPlanning() {
	const entry = await getEntry("schedules", "planning");
	if (!entry) throw new Error("Manca src/content/schedules/planning.json");
	return entry.data;
}

/** Una sezione del planning (es. "acqua-fitness"), pronta per <WeeklySchedule />. */
export async function getSchedule(id: string) {
	const planning = await getPlanning();
	const section = planning.sections.find((s) => s.id === id);
	if (!section) throw new Error(`Planning: manca la sezione "${id}" in planning.json`);

	const lessons: Record<string, ScheduleLesson> = {};
	for (const lesson of section.lessons) {
		lessons[lesson.id] = { name: lesson.name, description: lesson.description };
	}

	const schedule = EMPTY_WEEK();
	for (const day of section.days) {
		schedule[day.day] = day.slots.map((slot) => {
			if (!lessons[slot.lesson]) {
				throw new Error(`Planning ${id}: la lezione "${slot.lesson}" non esiste tra quelle definite.`);
			}
			return { time: slot.time, id: slot.lesson, trainer: slot.trainer, note: slot.note };
		});
	}

	return {
		id: section.id,
		title: section.title,
		intro: section.intro,
		note: section.note,
		lessonList: section.lessons,
		lessons,
		schedule,
	};
}

/** Tutte le sezioni del planning, nell'ordine in cui sono su Tina. */
export async function getAllSchedules() {
	const planning = await getPlanning();
	return Promise.all(planning.sections.map((s) => getSchedule(s.id)));
}

/** Una tabella di orari di apertura (es. "gym-floor"). */
export async function getHours(id: string) {
	const planning = await getPlanning();
	const table = planning.hours.find((h) => h.id === id);
	if (!table) throw new Error(`Planning: manca la tabella orari "${id}" in planning.json`);
	return table;
}
