import type { ReleaseTaskListResponse } from './api/release-types';

/** `appName` is frequently empty for events not yet fully set up in the store listing. */
export const appDisplayName = (row: ReleaseTaskListResponse): string =>
	row.appName || row.eventName || `Event ${row.eventId}`;

/** Hand-rolled `yyyy-MM-dd` <-> local-midnight Date conversions, colocated so the two directions
 * of the round-trip can't drift apart. `new Date(dateStr)`/`date.toISOString().slice(0, 10)`
 * aren't safe substitutes -- a date-only string (no `T`) is spec'd to parse as UTC midnight,
 * which can display as the wrong day once rendered in a timezone behind UTC, and
 * `toISOString()` has the same UTC-vs-local mismatch in reverse. The real native fix is
 * `Temporal.PlainDate`, not yet baseline in browsers -- swap to it here once it ships. */
export const parseLocalDate = (
	dateStr: string | null | undefined,
): Date | null => {
	if (!dateStr) return null;
	const [y, m, d] = dateStr.split('-').map(Number);
	const date = new Date(y, m - 1, d);
	// A malformed string (e.g. a hand-edited ?from= URL param) produces NaN components, which
	// the Date constructor turns into a truthy "Invalid Date" object rather than throwing --
	// callers checking `if (!parsed)` wouldn't catch that, so surface it as null here instead.
	return Number.isNaN(date.getTime()) ? null : date;
};

/** The inverse of parseLocalDate — formats a local Date back to the `yyyy-MM-dd` wire format. */
export const toISODate = (d: Date | null | undefined): string =>
	d
		? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
		: '';

// setDate(), not getTime() + N * 86400000 — adding raw milliseconds crosses a DST transition
// incorrectly (a day is occasionally 23 or 25 hours, not always 24).
export const addDays = (base: Date, days: number): Date => {
	const d = new Date(base);
	d.setDate(d.getDate() + days);
	return d;
};

/** The Monday that starts `date`'s calendar week (Monday-Sunday, not a rolling 7 days).
 * `getDay()` is 0=Sunday..6=Saturday; Sunday needs -6 (back to the Monday that started its own
 * week), every other day needs 1 - day. */
export const startOfWeek = (date: Date): Date => {
	const day = date.getDay();
	return addDays(date, day === 0 ? -6 : 1 - day);
};

export const formatDateRange = (
	start: string | null,
	end: string | null,
): string => {
	const s = parseLocalDate(start);
	const e = parseLocalDate(end);
	if (!s && !e) return 'Date TBD';
	if (!s || !e) {
		// non-null: the `!s && !e` check above already excluded both being null.
		const only = (s ?? e) as Date;
		return only.toLocaleString('en-US', { month: 'short', day: 'numeric' });
	}
	const sMonth = s.toLocaleString('en-US', { month: 'short' });
	const eMonth = e.toLocaleString('en-US', { month: 'short' });
	if (start === end) return `${sMonth} ${s.getDate()}`;
	if (sMonth === eMonth) return `${sMonth} ${s.getDate()}–${e.getDate()}`;
	return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}`;
};
