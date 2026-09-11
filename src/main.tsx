import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './styles/index.css';
import { router } from './app/router';
import { StoreProvider } from './app/store-context';
import { ErrorBoundary } from './app/ErrorBoundary';

const container = document.getElementById('root');
if (!container) throw new Error('Root element is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </ErrorBoundary>
  </StrictMode>,
);
