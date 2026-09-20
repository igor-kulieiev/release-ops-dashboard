import { ChevronDown } from 'lucide-react';
import {
	Select,
	SelectItemText,
	type SelectOption,
} from '@/components/ui/Select';
import { cn } from '@/components/ui/utils';
import { NULL_STATUS, STATUS_CONFIG, STATUS_OPTIONS } from '../statusConfig';

interface Props {
	status: string | null;
	onChange: (status: string | null) => void;
	disabled?: boolean;
}

export function StatusSelect({ status, onChange, disabled }: Props) {
	const cfg = status ? (STATUS_CONFIG[status] ?? NULL_STATUS) : NULL_STATUS;
	const Icon = cfg.icon;

	const options: SelectOption<string | null>[] = STATUS_OPTIONS.map(
		(opt) => ({
			value: opt.value || null,
			label: opt.label,
		}),
	);

	return (
		<Select
			value={status}
			onChange={onChange}
			options={options}
			disabled={disabled}
			data-el="modal.panel.status-select"
			triggerClassName={cn(
				'h-8 gap-1 rounded-(--radius-md) px-3 py-1.5 text-label hover:opacity-90',
				cfg.classes,
			)}
			contentClassName="min-w-[190px]"
			renderTrigger={() => (
				<>
					<Icon
						data-role="icon"
						className={`h-4 w-4 shrink-0 ${cfg.bandSpin ? 'animate-spin' : ''}`}
						strokeWidth={2}
					/>
					<span data-role="text" className="text-label">
						{cfg.label}
					</span>
					<ChevronDown
						data-role="icon"
						className="h-4 w-4 shrink-0 opacity-50 transition group-hover:opacity-100"
					/>
				</>
			)}
			renderItem={(option) => {
				const optCfg = option.value
					? (STATUS_CONFIG[option.value] ?? NULL_STATUS)
					: NULL_STATUS;
				const OptIcon = optCfg.icon;
				return (
					<span
						className={cn(
							'inline-flex items-center gap-1.5 rounded-(--radius-sm) px-2 py-1 text-label',
							optCfg.classes,
						)}
					>
						<OptIcon className="h-3 w-3" strokeWidth={2.25} />
						<SelectItemText>{option.label}</SelectItemText>
					</span>
				);
			}}
		/>
	);
}
