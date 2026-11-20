import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { wakeBackend } from './lib/backend-wake';
import './index.css';

// If the backend is hibernating, start waking it from this visitor's own IP
// right away — long before the first real API call needs it.
void wakeBackend();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
