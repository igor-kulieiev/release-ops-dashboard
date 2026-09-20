export type SortDirection = 'asc' | 'desc';

export interface SortState {
	column: string | null;
	direction: SortDirection;
}

export interface DateRangeState {
	from: string;
	to: string;
}
