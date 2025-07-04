import 'regenerator-runtime';
import '../styles/styles.css';
import App from './pages/app';
import { getActiveRoute, parseActivePathname } from './routes/url-parser';
import routes from './routes/routes';

const app = new App({
  navigationDrawer: document.getElementById('navigation-drawer'),
  drawerButton: document.getElementById('drawer-button'),
  content: document.getElementById('main-content'),
});

window.addEventListener('DOMContentLoaded', () => {
  app.renderPage();
});

window.addEventListener('hashchange', () => {
  app.renderPage();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

export async function subscribePushNotification(storyApiInstance) {
  if (!('serviceWorker' in navigator && 'PushManager' in window)) {
    console.warn('Push messaging is not supported.');
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    console.log('Existing subscription found:', existingSubscription);
    return existingSubscription;
  }

  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  };

  try {
    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    console.log('New push subscription:', subscription);

    await storyApiInstance.subscribeNotification({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))),
      },
    });
    alert('Berhasil subscribe notifikasi!');
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe the user: ', error);
    alert(`Gagal subscribe notifikasi: ${error.message}. Pastikan Anda login.`);
  }
}

export async function unsubscribePushNotification(storyApiInstance) {
  if (!('serviceWorker' in navigator && 'PushManager' in window)) {
    console.warn('Push messaging is not supported.');
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    console.log('No existing subscription to unsubscribe.');
    return;
  }

  try {
    await storyApiInstance.unsubscribeNotification(subscription.endpoint);
    await subscription.unsubscribe();
    console.log('User unsubscribed.');
    alert('Berhasil unsubscribe notifikasi!');
  } catch (error) {
    console.error('Error unsubscribing', error);
    alert(`Gagal unsubscribe notifikasi: ${error.message}`);
  }
}

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