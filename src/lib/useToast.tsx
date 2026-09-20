import {
	createContext,
	type ReactNode,
	useContext,
	useRef,
	useState,
} from 'react';

export interface ToastData {
	title: string;
	message: string;
}

interface ToastContextValue {
	toast: ToastData | null;
	showToast: (title: string, message: string) => void;
	dismissToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * App-wide toast state — not RELEASE-specific, so any feature can show one. Mounted once (see
 * main.tsx, alongside components/ui/ToastHost which renders it) so any component can call
 * useToast() to show a notification without needing showToast threaded down to it as a prop.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
	const [toast, setToast] = useState<ToastData | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showToast = (title: string, message: string) => {
		if (timerRef.current) clearTimeout(timerRef.current);
		setToast({ title, message });
		timerRef.current = setTimeout(() => {
			setToast(null);
			timerRef.current = null;
		}, 3500);
	};

	const dismissToast = () => setToast(null);

	return (
		<ToastContext.Provider value={{ toast, showToast, dismissToast }}>
			{children}
		</ToastContext.Provider>
	);
}

/** Reads the app-wide toast state — must be called under <ToastProvider> (see main.tsx). */
export function useToast(): ToastContextValue {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error('useToast must be used within a ToastProvider');
	return ctx;
}
