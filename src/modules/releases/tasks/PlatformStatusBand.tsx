import type { LucideIcon } from 'lucide-react';
import { NULL_STATUS, STATUS_CONFIG } from '../statusConfig';

interface Props {
	platformName: string;
	platformIcon: LucideIcon;
	statusKey: string | null;
	className?: string;
}

/** One footer band on a TaskCard — iOS and Android render two of these, identical apart from
 * name/icon/status/side-padding, so the duplication doesn't have to be re-read twice per card. */
export function PlatformStatusBand({
	platformName,
	platformIcon: PlatformIcon,
	statusKey,
	className = '',
}: Props) {
	const config = statusKey
		? (STATUS_CONFIG[statusKey] ?? NULL_STATUS)
		: NULL_STATUS;
	const StatusIcon = config.bandIcon;

	return (
		<div
			data-el="dashboard.card.status-band"
			data-role="container"
			title={`${platformName}: ${config.label}`}
			className={`flex flex-1 items-center ${className} ${config.bandClasses}`}
		>
			<div className="flex items-center gap-1 flex-1 min-w-0">
				<PlatformIcon className="size-3 shrink-0" />
				<span className="text-[12px] font-light leading-[18px]">
					{platformName}
				</span>
			</div>
			<StatusIcon
				className={`size-4 shrink-0 ${config.bandSpin ? 'animate-spin' : ''}`}
				strokeWidth={2}
			/>
		</div>
	);
}
