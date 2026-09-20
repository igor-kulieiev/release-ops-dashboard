import * as Dialog from '@radix-ui/react-dialog';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Apple, ExternalLink, Smartphone, X } from 'lucide-react';
import { CopyFieldOrEmpty } from '@/components/ui/CopyField';
import { useTriggerBuild } from '../builds/useTriggerBuild';
import { appDisplayName, formatDateRange } from '../format';
import { OwnerSelect } from '../owners/OwnerSelect';
import { ANDROID_BUILD_TYPES, IOS_BUILD_TYPES } from '../statusConfig';
import { useTaskMutations } from '../tasks/useTaskMutations';
import { useTasks } from '../tasks/useTasks';
import { PlatformPanel } from './PlatformPanel';
import { TicketLinks } from './TicketLinks';

/** One label + copyable/empty value pair in the info grid below — five near-identical rows
 * otherwise. Same shape as TaskCard's FieldRow (see its comment) — both delegate to
 * CopyFieldOrEmpty. */
function InfoRow({ label, value }: { label: string; value: string | null }) {
	return (
		<>
			<span className="text-(--content-secondary)">{label}</span>
			<CopyFieldOrEmpty value={value} align="left" />
		</>
	);
}

/**
 * The task detail modal — takes no props at all. Which row (if any) it shows is entirely a
 * function of the ?task= search param (see TaskCard's onClick), so a copied URL reopens the same
 * row's modal directly, and it fetches/mutates its own data rather than needing any of that
 * threaded down to it.
 */
export function TaskDetailsModal() {
	const { data } = useTasks();
	const { handleOwnerChange, handleStatusChange, handleTicketsChange } =
		useTaskMutations();
	const { handleTriggerBuild, isTriggering } = useTriggerBuild();
	const navigate = useNavigate({ from: '/' });
	const eventId = useSearch({ from: '/' }).task ?? null;
	const row =
		eventId != null ? data.find((r) => r.eventId === eventId) : null;
	const triggeringPlatform = row
		? isTriggering(row.eventId, 'ios')
			? 'ios'
			: isTriggering(row.eventId, 'android')
				? 'android'
				: null
		: null;

	// Closing removes ?task= from the URL — the modal has no "open" state of its own, only
	// whichever row (if any) that param currently names.
	const close = () =>
		navigate({ search: (prev) => ({ ...prev, task: undefined }) });

	if (!row) return null;

	// Upserting a `release_tasks` row requires a non-null groupId (its half of the unique key) — an
	// event that hasn't been assigned one in the events datastore yet simply can't be tracked here.
	const untrackable = row.groupId == null;

	return (
		<Dialog.Root
			open
			onOpenChange={(o) => {
				if (!o) close();
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-40 bg-(--overlay-scrim) backdrop-blur-(--elevation-backdrop-blur) data-[state=open]:animate-fade-in" />
				<Dialog.Content
					data-el="modal"
					data-role="container"
					className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-[740px] -translate-x-1/2 -translate-y-1/2 rounded-[10px] overflow-hidden bg-(--surface-card) shadow-2xl border border-(--border-default) focus:outline-none data-[state=open]:animate-modal-in"
					aria-describedby={undefined}
				>
					<div className="max-h-[90vh] overflow-y-auto">
						{/* Header */}
						<div
							data-el="modal.header"
							data-role="container"
							className="sticky top-0 z-10 bg-(--surface-card) flex items-start justify-between gap-4 border-b border-(--border-default) px-4 py-4 sm:px-5 sm:py-5"
						>
							<div>
								<Dialog.Title asChild>
									<button
										type="button"
										data-el="modal.header.link"
										data-role="link"
										className="group inline-flex items-center gap-1.5 text-[24px] font-medium leading-[32px] text-(--content-primary)"
										onClick={(e) => e.stopPropagation()}
									>
										{appDisplayName(row)}
										<ExternalLink className="h-5 w-5 shrink-0 opacity-40 group-hover:opacity-90" />
									</button>
								</Dialog.Title>
								<div className="text-[16px] font-medium leading-[24px] text-(--content-secondary)">
									{formatDateRange(
										row.eventStartDate,
										row.eventEndDate,
									)}
								</div>
							</div>
							<Dialog.Close
								data-el="modal.header.close"
								data-role="control"
								className="rounded-[6px] p-1.5 text-(--content-secondary) transition hover:bg-(--surface-subtle) hover:text-(--content-primary)"
							>
								<X className="h-4 w-4" />
							</Dialog.Close>
						</div>

						<div className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
							{untrackable && (
								<div
									data-el="modal.notice"
									data-role="text"
									className="rounded-[8px] border border-(--border-default) bg-(--surface-subtle) px-4 py-2 text-[14px] font-light leading-[20px] text-(--content-secondary)"
								>
									No group ID from the store listing yet —
									owner, status, and builds can't be tracked
									until this event has one.
								</div>
							)}

							{/* Owner */}
							<div
								data-el="modal.owner"
								data-role="container"
								className="flex h-10 items-center gap-4 sm:gap-12"
							>
								<span className="text-[14px] font-light leading-[20px] text-(--content-secondary) shrink-0">
									Owner
								</span>
								<OwnerSelect
									value={row.ownerId}
									onChange={(ownerId) =>
										handleOwnerChange(row, ownerId)
									}
									disabled={untrackable}
								/>
							</div>

							{/* Platform panels */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<PlatformPanel
									icon={Apple}
									label="iOS"
									status={row.iosTaskStatus}
									onStatusChange={(s) =>
										handleStatusChange(row, 'ios', s)
									}
									buildTypes={IOS_BUILD_TYPES}
									buildUrl={row.iosBuildLink}
									buildStatus={row.iosBuildStatus}
									buildType={row.iosBuildType}
									platform="ios"
									onTriggerBuild={(platform, buildType) =>
										handleTriggerBuild(
											row,
											platform,
											buildType,
										)
									}
									triggering={triggeringPlatform === 'ios'}
									disabled={untrackable}
								/>
								<PlatformPanel
									icon={Smartphone}
									label="Android"
									status={row.androidTaskStatus}
									onStatusChange={(s) =>
										handleStatusChange(row, 'android', s)
									}
									buildTypes={ANDROID_BUILD_TYPES}
									buildUrl={row.androidBuildLink}
									buildStatus={row.androidBuildStatus}
									buildType={row.androidBuildType}
									platform="android"
									onTriggerBuild={(platform, buildType) =>
										handleTriggerBuild(
											row,
											platform,
											buildType,
										)
									}
									triggering={
										triggeringPlatform === 'android'
									}
									disabled={untrackable}
								/>
							</div>

							{/* Tickets */}
							<div className="flex flex-col gap-2">
								<span className="text-[14px] font-light leading-[20px] text-(--content-secondary)">
									Tickets
								</span>
								<TicketLinks
									tickets={row.zendeskTicketsList}
									onTicketsChange={(tickets) =>
										handleTicketsChange(row, tickets)
									}
									disabled={untrackable}
								/>
							</div>

							{/* Info grid */}
							<div
								data-el="modal.info"
								data-role="container"
								className="rounded-[8px] border border-(--border-default) bg-(--surface-card) p-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[14px] font-light leading-[20px]"
							>
								<InfoRow
									label="Group ID"
									value={
										row.groupId != null
											? String(row.groupId)
											: null
									}
								/>
								<InfoRow
									label="Account ID"
									value={String(row.accountId)}
								/>
								<InfoRow
									label="Event ID"
									value={String(row.eventId)}
								/>
								<InfoRow
									label="Apple Dev"
									value={row.appleDevAccount}
								/>
								<InfoRow
									label="Google Dev"
									value={row.googleDevAccount}
								/>
							</div>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
