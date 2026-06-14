import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import lupercusLogoUrl from './assets/lupercus-logo.svg';
import './styles.css';
import './logo-fix.css';

document.documentElement.style.setProperty('--logo-url', `url("${lupercusLogoUrl}")`);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
