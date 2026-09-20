import { ChevronDown } from 'lucide-react';
import {
	Select,
	SelectItemText,
	type SelectOption,
} from '@/components/ui/Select';
import { cn } from '@/components/ui/utils';
import { useOwners } from './useOwners';

/** The colored chip inside each dropdown item — same shape for "Unassigned" and every real
 * owner, differing only in color and label. */
function OwnerPill({
	colorClass,
	label,
}: {
	colorClass: string;
	label: string;
}) {
	return (
		<span
			className={cn(
				'text-label inline-flex items-center rounded-(--radius-full) px-2.5 py-0.5 border',
				colorClass,
			)}
		>
			<SelectItemText>{label}</SelectItemText>
		</span>
	);
}

interface Props {
	value: number | null;
	onChange: (ownerId: number | null) => void;
	disabled?: boolean;
}

export function OwnerSelect({ value, onChange, disabled }: Props) {
	const { owners, ownerName, ownerColor } = useOwners();

	const options: SelectOption<number | null>[] = [
		{ value: null, label: 'Unassigned' },
		...owners.map((o) => ({ value: o.id, label: o.name })),
	];

	return (
		<Select
			value={value}
			onChange={onChange}
			options={options}
			disabled={disabled}
			data-el="global.owner-pill"
			triggerClassName={cn(
				'h-8 gap-1 rounded-(--radius-xl) border px-4 py-2 text-label hover:opacity-90',
				ownerColor(value),
			)}
			contentClassName="min-w-[160px]"
			renderTrigger={() => (
				<>
					<span data-role="text">
						{ownerName(value) ?? 'Unassigned'}
					</span>
					<ChevronDown
						data-role="icon"
						className="h-3 w-3 opacity-50 transition group-hover:opacity-100 shrink-0"
					/>
				</>
			)}
			renderItem={(option) => (
				<OwnerPill
					colorClass={ownerColor(option.value)}
					label={option.label}
				/>
			)}
		/>
	);
}
