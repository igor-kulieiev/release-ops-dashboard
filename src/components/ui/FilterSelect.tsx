import { ChevronsUpDown, type LucideIcon } from 'lucide-react';
import { Select, SelectValue } from './Select';

export interface FilterSelectOption {
	value: string;
	label: string;
}

interface Props {
	value: string;
	onChange: (value: string) => void;
	options: FilterSelectOption[];
	icon?: LucideIcon;
	'data-el'?: string;
}

/** Filter-bar dropdown (owner filter, sort) — a controlled Radix Select instead of a native
 * `<select>`, so its popover is positioned relative to the trigger like every other dropdown in
 * the app instead of wherever the browser/OS decides to render a native picker. */
export function FilterSelect({
	value,
	onChange,
	options,
	icon: Icon,
	'data-el': dataEl,
}: Props) {
	return (
		<Select
			value={value}
			onChange={onChange}
			options={options}
			data-el={dataEl}
			triggerClassName="h-10 gap-2 rounded-(--radius-md) border border-(--border-strong) bg-(--surface-card) px-2.5 text-label text-(--content-primary)"
			contentClassName="min-w-[180px]"
			itemClassName="text-label text-(--content-primary)"
			renderTrigger={(selected) => (
				<>
					{Icon && (
						<Icon className="h-6 w-6 shrink-0 text-(--content-tertiary)" />
					)}
					<SelectValue>{selected?.label}</SelectValue>
					<ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-(--content-secondary)" />
				</>
			)}
		/>
	);
}
