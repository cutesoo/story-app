import 'regenerator-runtime/runtime';
import '../styles/styles.css';
import App from './pages/app';
import { getActiveRoute } from './routes/url-parser';
import routes from './routes/routes';

const app = new App({
  navigationDrawer: document.getElementById('navigation-drawer'),
  drawerButton: document.getElementById('drawer-button'),
  content: document.getElementById('main-content'),
});

window.addEventListener('DOMContentLoaded', () => {
  app.renderPage();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.bundle.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
});

window.addEventListener('hashchange', () => {
  app.renderPage();
});

export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}