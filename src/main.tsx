import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initTheme } from './services/theme';
import { migrateLocalStorageToDexie } from './services/db';
initTheme();
migrateLocalStorageToDexie();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
