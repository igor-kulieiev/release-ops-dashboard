import { CircleCheck, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { ToastData } from '@/lib/useToast';

interface Props {
	toast: ToastData;
	onClose: () => void;
}

export function Toast({ toast, onClose }: Props) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 14, scale: 0.97 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 8, scale: 0.97 }}
			transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
			className="fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-xl"
		>
			<div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
				<CircleCheck
					className="h-4 w-4 text-primary-foreground"
					strokeWidth={2.5}
				/>
			</div>
			<div className="flex-1 text-sm">
				<div className="font-medium">{toast.title}</div>
				<div className="text-muted-foreground">{toast.message}</div>
			</div>
			<button
				type="button"
				onClick={onClose}
				className="text-muted-foreground hover:text-foreground"
			>
				<X className="h-4 w-4" />
			</button>
		</motion.div>
	);
}
