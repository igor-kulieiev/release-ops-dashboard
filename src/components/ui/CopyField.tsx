import { useAnimate } from 'motion/react';
import type React from 'react';
import { cn } from './utils';

interface CopyFieldProps {
	value: string;
	mono?: boolean;
	/** 'right' (default) matches TaskCard's compact flex rows — a label takes flex-1, this sits
	 * flush to the right edge after it. 'left' matches a grid layout where values already sit
	 * left-aligned in their own column (see TaskDetailsModal's info grid). */
	align?: 'left' | 'right';
}

/** Click-to-copy text — shows the value normally, flashes an opaque "Copied!" overlay on top for
 * ~1.8s after a successful clipboard write, then fades it back out. Text color never changes, on
 * copy or on hover: the button's width isn't fixed, so swapping in "Copied!" (a different length
 * than the value) can shrink it out from under the cursor mid-interaction — a hover color would
 * then drop right as it's most visible, reading as an unwanted flash rather than feedback.
 *
 * Truncation (`truncate`/`max-w-40`) lives on the inner value span, not the button itself — the
 * button must not clip overflow, since "Copied!" is often wider than a short truncated value
 * (e.g. a 2-digit id) and would otherwise get cut off by the value's own narrower box. */
export function CopyField({
	value,
	mono = false,
	align = 'right',
}: CopyFieldProps) {
	const [flashScope, animate] = useAnimate<HTMLSpanElement>();

	const handleClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			return; // clipboard denied/unavailable — no feedback to flash
		}
		animate(
			flashScope.current,
			{ opacity: [0, 1, 1, 0] },
			{ duration: 1.8, times: [0, 0.08, 0.92, 1] },
		);
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			title="Click to copy"
			className={cn(
				'relative text-[14px] font-light leading-5 text-(--content-primary)',
				align === 'right' ? 'text-right' : 'text-left',
				mono && 'font-mono',
			)}
		>
			<span className="block max-w-40 truncate">{value}</span>
			<span
				ref={flashScope}
				aria-hidden
				className="absolute inset-0 whitespace-nowrap bg-(--surface-card) font-sans opacity-0"
			>
				Copied!
			</span>
		</button>
	);
}

/** Placeholder for a field with no value — an em dash styled as muted/disabled text. */
export function EmptyValue() {
	return (
		<span className="text-[14px] font-light leading-[20px] text-(--content-disabled)">
			–
		</span>
	);
}

/** The `value != null ? <CopyField/> : <EmptyValue/>` branch shared by TaskCard's FieldRow and
 * TaskDetailsModal's InfoRow — those two stay separate components for their own layouts (flex row
 * vs. grid column), but both switch between the same two things here. */
export function CopyFieldOrEmpty({
	value,
	mono,
	align,
}: {
	value: string | null;
	mono?: boolean;
	align?: 'left' | 'right';
}) {
	return value != null ? (
		<CopyField value={value} mono={mono} align={align} />
	) : (
		<EmptyValue />
	);
}
