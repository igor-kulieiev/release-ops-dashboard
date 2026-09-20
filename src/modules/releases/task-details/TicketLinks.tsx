import { ExternalLink, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
	tickets: string[];
	onTicketsChange: (tickets: string[]) => void;
	disabled?: boolean;
}

/** Zendesk ticket links are plain URLs on the wire — derive a short display label from the id in the URL. */
function ticketLabel(url: string): string {
	const numMatch = url.match(/\/(\d+)\/?$/);
	return numMatch ? `#${numMatch[1]}` : url;
}

export function TicketLinks({ tickets, onTicketsChange, disabled }: Props) {
	const [inputVal, setInputVal] = useState('');
	const [editing, setEditing] = useState(false);

	const addTicket = () => {
		const raw = inputVal.trim();
		if (!raw) return;
		const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
		if (!tickets.includes(url)) onTicketsChange([...tickets, url]);
		setInputVal('');
		setEditing(false);
	};

	const removeTicket = (url: string) => {
		onTicketsChange(tickets.filter((t) => t !== url));
	};

	return (
		<div
			data-el="modal.tickets"
			data-role="container"
			className="flex flex-col gap-1.5"
		>
			{tickets.map((url) => (
				<div
					key={url}
					className="group inline-flex max-w-[360px] items-start gap-1.5"
				>
					<button
						type="button"
						data-el="modal.tickets.link"
						data-role="link"
						className="inline-flex min-w-0 items-start gap-1.5 rounded-md text-xs text-foreground hover:text-foreground/80"
						title={url}
					>
						<span className="mt-0.5 shrink-0 rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-destructive ring-1 ring-inset ring-destructive/20">
							{ticketLabel(url)}
						</span>
						<ExternalLink className="mt-0.5 h-3 w-3 shrink-0 opacity-40 group-hover:opacity-90" />
					</button>
					{!disabled && (
						<button
							type="button"
							data-el="modal.tickets.remove"
							data-role="control"
							onClick={() => removeTicket(url)}
							className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
							title="Remove"
						>
							<X className="h-3 w-3" />
						</button>
					)}
				</div>
			))}
			{!disabled &&
				(editing ? (
					<input
						type="text"
						data-el="modal.tickets.input"
						data-role="control"
						// biome-ignore lint/a11y/noAutofocus: user-triggered by the "+ Add link" click, not page load
						autoFocus
						value={inputVal}
						onChange={(e) => setInputVal(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') addTicket();
							if (e.key === 'Escape') {
								setEditing(false);
								setInputVal('');
							}
						}}
						onBlur={() => {
							if (!inputVal.trim()) setEditing(false);
						}}
						placeholder="Paste URL, Enter to add"
						className="w-full rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
					/>
				) : (
					<button
						type="button"
						data-el="modal.tickets.add"
						data-role="control"
						onClick={() => setEditing(true)}
						className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
					>
						<span className="text-base leading-none">+</span> Add
						link
					</button>
				))}
		</div>
	);
}
