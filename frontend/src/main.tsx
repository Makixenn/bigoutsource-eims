import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle chunk load errors (e.g., when deploying a new version while a user has the app open)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected, reloading page...');
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
