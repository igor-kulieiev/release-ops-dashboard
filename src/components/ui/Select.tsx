import {
	Content,
	Item,
	ItemIndicator,
	ItemText,
	Portal,
	Root,
	Trigger,
	Value,
	Viewport,
} from '@radix-ui/react-select';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './utils';

export { ItemText as SelectItemText, Value as SelectValue };

export interface SelectOption<T> {
	value: T;
	label: string;
}

interface Props<T> {
	value: T;
	onChange: (value: T) => void;
	options: SelectOption<T>[];
	disabled?: boolean;
	'data-el'?: string;
	triggerClassName: string;
	contentClassName?: string;
	itemClassName?: string;
	/** No default — every current call site customizes at least the trailing chevron/icon, so a
	 * default here would just be unused scaffolding. */
	renderTrigger: (selected: SelectOption<T> | undefined) => ReactNode;
	/** Defaults to plain `<SelectItemText>{option.label}</SelectItemText>` — override for anything
	 * richer (an icon, a colored pill, ...). */
	renderItem?: (option: SelectOption<T>) => ReactNode;
}

const TRIGGER_BASE =
	'group inline-flex items-center cursor-pointer transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:opacity-60';
const CONTENT_BASE =
	'z-50 overflow-hidden rounded-(--radius-md) border border-(--border-default) bg-(--surface-card) shadow-xl data-[state=open]:animate-slide-down';
const ITEM_BASE =
	'flex cursor-pointer select-none items-center gap-2 rounded-(--radius-sm) px-2.5 py-1.5 outline-none data-[highlighted]:bg-(--surface-subtle)';

/** The Root/Trigger/Portal/Content/Viewport/Item/ItemIndicator wiring shared by every dropdown in
 * the app, so each call site only has to say what its trigger and items look like. Options are
 * matched by array index rather than by a caller-chosen string `value` (Radix Select can't
 * represent an empty-string item value), so nullable/non-string domain values — an owner id, a
 * status — never need an invented sentinel to round-trip through Radix. */
export function Select<T>({
	value,
	onChange,
	options,
	disabled,
	'data-el': dataEl,
	triggerClassName,
	contentClassName,
	itemClassName,
	renderTrigger,
	renderItem,
}: Props<T>) {
	const selectedIndex = options.findIndex((o) => o.value === value);
	const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

	return (
		<Root
			value={selectedIndex >= 0 ? String(selectedIndex) : ''}
			onValueChange={(key) => onChange(options[Number(key)].value)}
			disabled={disabled}
		>
			<Trigger
				data-el={dataEl}
				data-role="control"
				className={cn(TRIGGER_BASE, triggerClassName)}
			>
				{renderTrigger(selected)}
			</Trigger>
			<Portal>
				<Content
					position="popper"
					sideOffset={5}
					className={cn(CONTENT_BASE, contentClassName)}
				>
					<Viewport className="p-1">
						{options.map((option, index) => (
							<Item
								// React's key needs the option's own identity, not its position —
								// `value` below is deliberately the index (see the function doc
								// comment); the two serve different purposes and aren't meant to match.
								key={String(option.value)}
								value={String(index)}
								className={cn(ITEM_BASE, itemClassName)}
							>
								{renderItem ? (
									renderItem(option)
								) : (
									<ItemText>{option.label}</ItemText>
								)}
								<ItemIndicator className="ml-auto">
									<Check className="h-3.5 w-3.5 text-(--content-secondary)" />
								</ItemIndicator>
							</Item>
						))}
					</Viewport>
				</Content>
			</Portal>
		</Root>
	);
}
