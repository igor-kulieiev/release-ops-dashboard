import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { router } from '@/app/router';
import { ToastHost } from '@/components/ui/ToastHost';
import { ToastProvider } from '@/lib/useToast';
import './styles/index.css';

const queryClient = new QueryClient();

async function enableMocking() {
	const { worker } = await import('./mocks/browser');
	// onUnhandledRequest: 'bypass' — anything this demo doesn't explicitly mock (fonts, source
	// maps, ...) just falls through to the network instead of failing loudly.
	return worker.start({ onUnhandledRequest: 'bypass' });
}

const rootElement = document.getElementById('root');
if (!rootElement)
	throw new Error('index.html is missing the #root mount point');

// This demo has no backend — every /api call is intercepted by the Mock Service Worker handlers
// in src/mocks/. Rendering waits on the worker so the first fetch never races its registration.
void enableMocking().then(() => {
	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<QueryClientProvider client={queryClient}>
				<ToastProvider>
					<RouterProvider router={router} />
					<ToastHost />
				</ToastProvider>
			</QueryClientProvider>
		</React.StrictMode>,
	);
});
