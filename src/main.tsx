import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

// Self-hosted fonts (offline-friendly, no external requests).
// Inter carries the interface; JetBrains Mono carries the queries;
// Noto Sans Arabic covers the RTL locale.
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/noto-sans-arabic/400.css';
import '@fontsource/noto-sans-arabic/500.css';
import '@fontsource/noto-sans-arabic/700.css';

import './index.css';
import { App } from './App';
import { initStorage } from './storage/storage';

registerSW({ immediate: true });

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

// Pick the best available storage (IndexedDB → localStorage → memory) before
// the stores hydrate, so persisted state loads from the right place.
initStorage().finally(() => {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
