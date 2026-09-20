import type { LucideIcon } from 'lucide-react';
import { PlatformCell, type PlatformCellProps } from './PlatformCell';

interface Props extends PlatformCellProps {
	icon: LucideIcon;
	label: string;
}

/** One platform's card in the modal — iOS and Android render two of these, identical apart from
 * the header icon/label; everything else is PlatformCell's own job. */
export function PlatformPanel({ icon: Icon, label, ...cellProps }: Props) {
	return (
		<div
			data-el="modal.panel"
			data-role="container"
			className="rounded-[8px] border border-(--border-default) bg-(--surface-card) p-5 flex flex-col gap-4"
		>
			<div className="flex items-center gap-2">
				<Icon
					data-role="icon"
					className="h-5 w-5 text-(--content-secondary)"
				/>
				<span
					data-role="text"
					className="text-[16px] font-medium leading-[24px] text-(--content-primary)"
				>
					{label}
				</span>
			</div>
			<PlatformCell {...cellProps} />
		</div>
	);
}
