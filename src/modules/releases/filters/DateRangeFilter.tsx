import { CalendarDays, ChevronDown, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DayPicker } from 'react-day-picker';
import { addDays, parseLocalDate, startOfWeek, toISODate } from '../format';
import type { DateRangeState } from '../types';

interface Props {
	from: string;
	to: string;
	onChange: (range: DateRangeState) => void;
}

// react-day-picker's own API uses `undefined` (not `null`) for "no date", hence the return type.
const toDate = (s: string): Date | undefined => parseLocalDate(s) ?? undefined;
const toISO = toISODate;

export function DateRangeFilter({ from, to, onChange }: Props) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: PointerEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node))
				setOpen(false);
		};
		// pointerdown, not mousedown: Radix Select's trigger (owner filter, sort, ...) calls
		// preventDefault() on its own pointerdown for mouse input, which per spec suppresses the
		// browser's synthesized *compatibility* mousedown event entirely — a 'mousedown' listener
		// would just never fire for those clicks. Capture phase so it also can't be short-circuited
		// by a later stopPropagation() at the target.
		document.addEventListener('pointerdown', handler, true);
		return () => document.removeEventListener('pointerdown', handler, true);
	}, []);

	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	}, [open]);

	const formatShort = (s: string): string =>
		toDate(s)?.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		}) ?? '…';

	// "This week" isn't just a display fallback -- it's what GET /apps itself defaults to when
	// from/to are omitted (see useTasks.ts), so this must describe what's actually being shown,
	// not "no filter" (there's no unfiltered view to fall back to anymore).
	const hasFilter = from || to;
	const label = !hasFilter
		? 'This week'
		: `${formatShort(from)} → ${formatShort(to)}`;

	const handleSelect = (range: DateRange | undefined) => {
		onChange({ from: toISO(range?.from), to: toISO(range?.to) });
	};

	const thisWeek = () => {
		const monday = startOfWeek(new Date());
		onChange({ from: toISO(monday), to: toISO(addDays(monday, 6)) });
		setOpen(false);
	};

	const nextWeek = () => {
		const nextMonday = addDays(startOfWeek(new Date()), 7);
		onChange({
			from: toISO(nextMonday),
			to: toISO(addDays(nextMonday, 6)),
		});
		setOpen(false);
	};

	return (
		<div className="relative" ref={ref}>
			{/* biome-ignore lint/a11y/useSemanticElements: can't be a real <button> -- it contains a nested <button> (the clear-filter "x" below), which isn't valid HTML inside another <button>. */}
			<div
				role="button"
				tabIndex={0}
				onClick={() => setOpen((v) => !v)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') setOpen((v) => !v);
				}}
				className="inline-flex h-10 w-[200px] cursor-pointer select-none items-center gap-2 rounded-(--radius-md) border border-(--border-strong) bg-(--surface-card) px-2.5 text-label text-(--content-primary) transition"
			>
				<CalendarDays className="h-6 w-6 shrink-0 text-(--content-tertiary)" />
				<span className="flex-1 truncate text-left">{label}</span>
				{hasFilter && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onChange({ from: '', to: '' });
						}}
						className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-(--surface-subtle) text-(--content-tertiary) hover:bg-(--surface-subtle)/80"
						aria-label="Clear date filter"
					>
						<X className="h-3 w-3" />
					</button>
				)}
				<ChevronDown
					className={`h-3.5 w-3.5 shrink-0 text-(--content-tertiary) opacity-60 transition ${open ? 'rotate-180' : ''}`}
				/>
			</div>

			{open && (
				<div className="absolute left-0 top-full z-30 mt-[5px] rounded-(--radius-md) border border-(--border-default) bg-(--surface-card) p-4 shadow-2xl">
					<DayPicker
						mode="range"
						selected={{ from: toDate(from), to: toDate(to) }}
						onSelect={handleSelect}
						defaultMonth={toDate(from) ?? new Date()}
						navLayout="around"
					/>
					<div className="mt-1 flex flex-wrap gap-2 border-t border-(--border-default) pt-3">
						<button
							type="button"
							onClick={thisWeek}
							className="rounded-(--radius-sm) bg-(--surface-subtle) px-2.5 py-1 text-caption text-(--content-secondary) hover:bg-primary hover:text-white transition"
						>
							This week
						</button>
						<button
							type="button"
							onClick={nextWeek}
							className="rounded-(--radius-sm) bg-(--surface-subtle) px-2.5 py-1 text-caption text-(--content-secondary) hover:bg-primary hover:text-white transition"
						>
							Next week
						</button>
						<button
							type="button"
							onClick={() => {
								onChange({ from: '', to: '' });
								setOpen(false);
							}}
							className="ml-auto rounded-(--radius-sm) px-2.5 py-1 text-caption text-(--content-tertiary) hover:text-(--content-primary) transition"
						>
							Clear
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
