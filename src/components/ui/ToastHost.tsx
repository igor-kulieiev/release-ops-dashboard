import { AnimatePresence } from 'motion/react';
import { useToast } from '@/lib/useToast';
import { Toast } from './Toast';

/** Always-mounted toast renderer — reads the app-wide toast state (see ToastProvider in
 * main.tsx), so nothing needs to pass toast state down to wherever this is rendered. */
export function ToastHost() {
	const { toast, dismissToast } = useToast();
	return (
		<AnimatePresence>
			{toast && (
				<Toast key="toast" toast={toast} onClose={dismissToast} />
			)}
		</AnimatePresence>
	);
}
