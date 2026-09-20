import { Check, Loader2, type LucideIcon, Minus, X } from 'lucide-react';
import type {
	AndroidBuildTypeLabel,
	IosBuildTypeLabel,
} from './api/release-types';
// Display config is allowed to depend on domain.ts's pure logic/constants — keep that
// dependency one-directional; domain.ts must never import back from here.
import {
	FAILURE_BUILD_STATUSES,
	SUCCESS_BUILD_STATUSES,
	TASK_STATUS,
} from './domain';

export interface StatusOption {
	value: string;
	label: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
	{ value: TASK_STATUS.NONE, label: 'N/A' },
	{ value: TASK_STATUS.IN_PROGRESS, label: 'In Progress' },
	{ value: TASK_STATUS.BUILD_UPDATED, label: 'Success' },
	{ value: TASK_STATUS.BUILD_FAILED, label: 'Failed' },
];

export interface StatusConfigEntry {
	label: string;
	icon: LucideIcon;
	classes: string;
	bandClasses: string;
	bandIcon: LucideIcon;
	bandSpin?: boolean;
	priority: number;
}

export const STATUS_CONFIG: Record<string, StatusConfigEntry> = {
	[TASK_STATUS.BUILD_UPDATED]: {
		label: 'Success',
		icon: Check,
		classes:
			'bg-(--status-badge-success-fill) text-(--status-badge-success-content) border border-(--status-badge-success-border)',
		bandClasses:
			'bg-(--status-badge-success-fill) text-(--status-badge-success-content)',
		bandIcon: Check,
		priority: 1,
	},
	[TASK_STATUS.IN_PROGRESS]: {
		label: 'In Progress',
		icon: Loader2,
		classes:
			'bg-(--status-badge-in-progress-fill) text-(--status-badge-in-progress-content) border border-(--status-badge-in-progress-border)',
		bandClasses:
			'bg-(--status-badge-in-progress-fill) text-(--status-badge-in-progress-content)',
		bandIcon: Loader2,
		bandSpin: true,
		priority: 2,
	},
	[TASK_STATUS.BUILD_FAILED]: {
		label: 'Failed',
		icon: X,
		classes:
			'bg-(--status-badge-failed-fill) text-(--status-badge-failed-content) border border-(--status-badge-failed-border)',
		bandClasses:
			'bg-(--status-badge-failed-fill) text-(--status-badge-failed-content)',
		bandIcon: X,
		priority: 3,
	},
};

export const NULL_STATUS: StatusConfigEntry = {
	label: 'N/A',
	icon: Minus,
	classes:
		'bg-(--status-badge-no-status-fill) text-(--status-badge-no-status-content) border border-(--status-badge-no-status-border)',
	bandClasses:
		'bg-(--status-badge-no-status-fill) text-(--status-badge-no-status-content)',
	bandIcon: Minus,
	priority: 4,
};

/** `androidBuildType`/`iosBuildType`'s accepted wire values — also what `PlatformCell` shows in its Select. */
export const IOS_BUILD_TYPES: IosBuildTypeLabel[] = [
	'Regular Build',
	'Local Build',
	'Screenshot Upload Build',
];
export const ANDROID_BUILD_TYPES: AndroidBuildTypeLabel[] = [
	'AAB Build',
	'APK Build',
];

export interface BuildStatusDisplay {
	label: string;
	cls: string;
}

/** Display classification for PlatformCell's own build-status readout — shares
 * SUCCESS_BUILD_STATUSES/FAILURE_BUILD_STATUSES with `isTerminalBuildStatus` so the two can
 * never disagree about whether a build is actually done. */
export const buildStatusDisplay = (
	buildStatus: string | null,
): BuildStatusDisplay => {
	if (!buildStatus) return { label: 'N/A', cls: 'text-(--content-tertiary)' };
	if (SUCCESS_BUILD_STATUSES.has(buildStatus)) {
		return {
			label: 'Success',
			cls: 'text-(--status-badge-success-content)',
		};
	}
	if (FAILURE_BUILD_STATUSES.has(buildStatus)) {
		return {
			label: 'Failed',
			cls: 'text-(--status-badge-failed-content)',
		};
	}
	return {
		label: 'In progress',
		cls: 'text-(--status-badge-in-progress-content)',
	};
};
