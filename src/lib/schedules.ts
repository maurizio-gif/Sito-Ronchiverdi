import { getEntry } from "astro:content";

/**
 * Planning settimanali gestiti da Tina CMS.
 *
 * Sorgente unica: src/content/schedules/<id>.json. Modificando quel file —
 * a mano o da Tina — si aggiornano tutte le pagine che mostrano il planning
 * (pagina Planning, pagina dell'attività, ...).
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

export async function getSchedule(id: string) {
	const entry = await getEntry("schedules", id);
	if (!entry) throw new Error(`Manca src/content/schedules/${id}.json`);

	const lessons: Record<string, ScheduleLesson> = {};
	for (const lesson of entry.data.lessons) {
		lessons[lesson.id] = { name: lesson.name, description: lesson.description };
	}

	const schedule: Record<string, ScheduleSlot[]> = {
		lunedi: [],
		martedi: [],
		mercoledi: [],
		giovedi: [],
		venerdi: [],
		sabato: [],
		domenica: [],
	};
	for (const day of entry.data.days) {
		schedule[day.day] = day.slots.map((slot) => {
			if (!lessons[slot.lesson]) {
				throw new Error(`Planning ${id}: la lezione "${slot.lesson}" non esiste tra quelle definite.`);
			}
			return { time: slot.time, id: slot.lesson, trainer: slot.trainer, note: slot.note };
		});
	}

	return {
		title: entry.data.title,
		intro: entry.data.intro,
		note: entry.data.note,
		lessonList: entry.data.lessons,
		lessons,
		schedule,
	};
}
