import { useNavigate } from '@tanstack/react-router';
import { Apple, ExternalLink, Smartphone } from 'lucide-react';
import { CopyFieldOrEmpty } from '@/components/ui/CopyField';
import type { ReleaseTaskListResponse } from '../api/release-types';
import { appDisplayName, formatDateRange, parseLocalDate } from '../format';
import { OwnerSelect } from '../owners/OwnerSelect';
import { PlatformStatusBand } from './PlatformStatusBand';
import { useTaskMutations } from './useTaskMutations';

/** One label + copyable/empty value row in the fields section below — three near-identical rows
 * otherwise (Group ID, Apple Dev, Google Dev). Same shape as TaskDetailsModal's InfoRow — the two
 * stay separate components because their layouts differ (flex row vs. grid column), but both
 * delegate the actual value-or-empty rendering to CopyFieldOrEmpty so that part isn't duplicated. */
function FieldRow({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string | null;
	mono?: boolean;
}) {
	return (
		<div className="flex items-center h-8">
			<span className="flex-1 text-[14px] font-light leading-[20px] text-(--content-secondary)">
				{label}
			</span>
			<CopyFieldOrEmpty value={value} mono={mono} />
		</div>
	);
}

interface TaskCardProps {
	row: ReleaseTaskListResponse;
}

export function TaskCard({ row }: TaskCardProps) {
	const { handleOwnerChange } = useTaskMutations();

	// Opening a card navigates to ?task=<eventId> — TaskDetailsModal reads that param itself and
	// resolves the row from the cache, so the modal is a real, shareable URL rather than
	// component state.
	const navigate = useNavigate({ from: '/' });
	const onClick = () =>
		navigate({
			search: (prev) => ({ ...prev, task: row.eventId }),
		});

	const eventDate = parseLocalDate(row.eventStartDate);
	const month = eventDate
		? eventDate.toLocaleString('en-US', { month: 'short' })
		: '–';
	const day = eventDate ? eventDate.getDate() : '–';

	return (
		// biome-ignore lint/a11y/useSemanticElements: can't be a real <button> -- it contains a nested <a> (the app-name link) and OwnerSelect's own <button> trigger, neither valid inside another <button>.
		<div
			data-el="dashboard.card"
			data-role="container"
			role="button"
			tabIndex={0}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') onClick();
			}}
			className="bg-(--surface-card) border border-(--border-default) rounded-[10px] overflow-hidden cursor-pointer flex flex-col gap-4 pt-4 shadow-(--elevation-card) hover:shadow-[0px_6px_20px_-2px_rgba(0,0,0,0.13)] transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
		>
			{/* Header: date badge + event name + date range */}
			<div className="flex items-start gap-2 px-5">
				<div className="size-14 bg-(--surface-subtle) border border-(--border-default) rounded-[10px] flex flex-col items-center justify-center shrink-0 gap-0">
					<span className="text-[12px] font-light leading-[18px] text-(--content-secondary)">
						{month}
					</span>
					<span className="text-[16px] font-medium leading-[24px] text-(--content-primary)">
						{day}
					</span>
				</div>
				<div className="min-w-0 flex-1 flex flex-col justify-center h-14 overflow-hidden">
					<h3 className="min-w-0">
						<button
							type="button"
							data-el="dashboard.card.link"
							data-role="link"
							onClick={(e) => e.stopPropagation()}
							className="group inline-flex max-w-full items-center gap-1 text-[18px] font-medium leading-[24px] text-(--content-primary)"
						>
							<span className="min-w-0 truncate">
								{appDisplayName(row)}
							</span>
							<ExternalLink className="h-4 w-4 shrink-0 opacity-40 group-hover:opacity-90" />
						</button>
					</h3>
					<p className="text-[12px] font-light leading-[18px] text-(--content-secondary) whitespace-nowrap truncate">
						{formatDateRange(row.eventStartDate, row.eventEndDate)}
					</p>
				</div>
			</div>

			{/* Owner row */}
			<div className="flex items-center h-10 px-5">
				<span className="flex-1 text-[14px] font-light leading-[20px] text-(--content-secondary)">
					Owner
				</span>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: only stops the click from bubbling to the card's onClick above -- OwnerSelect inside is the real interactive element. */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: same reason -- this div isn't itself interactive, it just guards a click from reaching the card underneath. */}
				<div
					data-el="dashboard.card.owner"
					data-role="container"
					onClick={(e) => e.stopPropagation()}
				>
					<OwnerSelect
						value={row.ownerId}
						onChange={(ownerId) => handleOwnerChange(row, ownerId)}
						disabled={row.groupId == null}
					/>
				</div>
			</div>

			{/* Fields */}
			<div className="px-5">
				<FieldRow
					label="Group ID"
					value={row.groupId != null ? String(row.groupId) : null}
					mono
				/>
				<FieldRow label="Apple Dev" value={row.appleDevAccount} />
				<FieldRow label="Google Dev" value={row.googleDevAccount} />
			</div>

			{/* Build status bands — flush to card edges */}
			<div className="flex h-10 mt-auto">
				<PlatformStatusBand
					platformName="iOS"
					platformIcon={Apple}
					statusKey={row.iosTaskStatus}
					className="pl-5 pr-2.5 border-r border-(--border-default)"
				/>
				<PlatformStatusBand
					platformName="Android"
					platformIcon={Smartphone}
					statusKey={row.androidTaskStatus}
					className="pl-2.5 pr-5"
				/>
			</div>
		</div>
	);
}
