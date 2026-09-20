import { ChevronDown, ExternalLink, Play } from 'lucide-react';
import { useState } from 'react';
import { Select, SelectValue } from '@/components/ui/Select';
import type {
	AndroidBuildTypeLabel,
	IosBuildTypeLabel,
	ReleasePlatform,
} from '../api/release-types';
import { isTerminalBuildStatus } from '../domain';
import { buildStatusDisplay } from '../statusConfig';
import { StatusSelect } from './StatusSelect';

interface RunBuildButtonProps {
	selectedType: string;
	isSelectedBuildRunning: boolean;
	triggering: boolean;
	disabled?: boolean;
	onRun: () => void;
}

/** Named mainly so its disabled/title logic ("nothing picked yet" vs. "this exact build is
 * already running" vs. "ready to go") reads as a single named thing, not inline JSX props. */
function RunBuildButton({
	selectedType,
	isSelectedBuildRunning,
	triggering,
	disabled,
	onRun,
}: RunBuildButtonProps) {
	return (
		<button
			type="button"
			data-el="modal.panel.action"
			data-role="control"
			onClick={onRun}
			disabled={
				disabled ||
				!selectedType ||
				triggering ||
				isSelectedBuildRunning
			}
			title={
				isSelectedBuildRunning
					? 'Build in progress…'
					: !selectedType
						? 'Select a build type first'
						: `Start ${selectedType}`
			}
			className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-(--radius-md) bg-primary px-2.5 text-body font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
		>
			<Play className="h-5 w-5 fill-current" />
			{triggering ? 'Starting…' : 'Run Circle CI Build'}
		</button>
	);
}

interface BuildStatusRowProps {
	buildUrl: string | null;
	buildType: string | null;
	isNA: boolean;
	label: string;
	colorClass: string;
}

/** The CircleCI link (or plain label, if there's no build yet) plus the current status text.
 * "Latest {buildType}" (e.g. "Latest Regular Build", "Latest AAB Build") rather than a generic
 * "Latest CircleCI Build" -- buildType's labels already end in "Build" themselves (see
 * IOS_BUILD_TYPES/ANDROID_BUILD_TYPES), so this is a straight substitution, not string surgery.
 * Falls back to the generic label on the (shouldn't-happen) case where a build exists but its
 * type doesn't. */
function BuildStatusRow({
	buildUrl,
	buildType,
	isNA,
	label,
	colorClass,
}: BuildStatusRowProps) {
	const latestLabel = buildType
		? `Latest ${buildType}`
		: 'Latest CircleCI Build';
	return (
		<div
			data-el="modal.panel.build-status"
			data-role="container"
			className="flex items-center justify-between gap-2 pt-5"
		>
			{!isNA && buildUrl ? (
				<button
					type="button"
					data-el="modal.panel.build-status.label"
					data-role="link"
					className="group inline-flex items-center gap-1 text-label-regular text-(--content-secondary)"
				>
					{latestLabel}
					<ExternalLink className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-90" />
				</button>
			) : (
				<span
					data-role="text"
					className="text-label-regular text-(--content-secondary)"
				>
					{isNA ? 'No build yet' : latestLabel}
				</span>
			)}
			<span
				data-el="modal.panel.build-status.value"
				data-role="text"
				className={`text-label-regular ${colorClass}`}
			>
				{label}
			</span>
		</div>
	);
}

export interface PlatformCellProps {
	status: string | null;
	onStatusChange: (status: string | null) => void;
	buildTypes: readonly (IosBuildTypeLabel | AndroidBuildTypeLabel)[];
	buildUrl: string | null;
	buildStatus: string | null;
	buildType: string | null;
	platform: ReleasePlatform;
	onTriggerBuild: (
		platform: ReleasePlatform,
		buildType: IosBuildTypeLabel | AndroidBuildTypeLabel,
	) => void;
	triggering: boolean;
	disabled?: boolean;
}

export function PlatformCell({
	status,
	onStatusChange,
	buildTypes,
	buildUrl,
	buildStatus,
	buildType,
	platform,
	onTriggerBuild,
	triggering,
	disabled,
}: PlatformCellProps) {
	const [selectedType, setSelectedType] = useState('');

	// Freshness for buildStatus/buildUrl comes from the backend, which keeps `release_tasks` current
	// via its own CircleCI webhook — a fresh GET /apps (page load, refresh, or the future "Sync
	// status" button) already carries the truth. This component just renders whatever's in the
	// cache; it doesn't need to fetch anything itself.
	const { label: bsLabel, cls: bsCls } = buildStatusDisplay(buildStatus);
	const isNA = !buildStatus;
	const isBuilding = !!buildStatus && !isTerminalBuildStatus(buildStatus);
	const isSelectedBuildRunning = isBuilding && selectedType === buildType;

	return (
		<div className="flex flex-col gap-4">
			{/* Status — horizontal: label left, chip right */}
			<div
				data-el="modal.panel.status-row"
				data-role="container"
				className="flex items-center gap-2"
			>
				<span
					data-role="text"
					className="text-label flex-1 text-(--content-secondary)"
				>
					Status
				</span>
				<StatusSelect
					status={status}
					onChange={onStatusChange}
					disabled={disabled}
				/>
			</div>

			{/* Build — vertical: label, select, button stacked */}
			<div
				data-el="modal.panel.build-row"
				data-role="container"
				className="flex flex-col gap-2"
			>
				<span
					data-role="text"
					className="text-label text-(--content-secondary)"
				>
					Build
				</span>
				<Select
					value={selectedType}
					onChange={setSelectedType}
					options={buildTypes.map((label) => ({
						value: label,
						label,
					}))}
					disabled={disabled}
					data-el="global.select"
					triggerClassName={`h-8 w-full gap-1.5 rounded-(--radius-md) border border-(--border-default) px-2.5 text-label focus:ring-1 focus:ring-primary/30 ${selectedType ? 'text-(--content-primary)' : 'text-(--content-disabled) hover:border-primary/30'}`}
					contentClassName="min-w-[180px]"
					itemClassName="text-label text-(--content-primary)"
					renderTrigger={() => (
						<>
							<SelectValue placeholder="Select Build Type" />
							<ChevronDown className="ml-auto h-3 w-3 shrink-0 opacity-50 transition group-hover:opacity-100" />
						</>
					)}
				/>
				<RunBuildButton
					selectedType={selectedType}
					isSelectedBuildRunning={isSelectedBuildRunning}
					triggering={triggering}
					disabled={disabled}
					onRun={() =>
						onTriggerBuild(
							platform,
							selectedType as
								| IosBuildTypeLabel
								| AndroidBuildTypeLabel,
						)
					}
				/>
				<BuildStatusRow
					buildUrl={buildUrl}
					buildType={buildType}
					isNA={isNA}
					label={bsLabel}
					colorClass={bsCls}
				/>
			</div>
		</div>
	);
}
