import CONFIG from '../config';
import StoryApi from '../data/api';

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

export function isNotificationAvailable() {
  return 'Notification' in window;
}

export function isNotificationGranted() {
  return Notification.permission === 'granted';
}

export async function requestNotificationPermission() {
  if (!isNotificationAvailable()) {
    console.error('Notification API unsupported.');
    return false;
  }

  if (isNotificationGranted()) {
    return true;
  }

  const status = await Notification.requestPermission();

  if (status === 'denied') {
    alert('Izin notifikasi ditolak.');
    return false;
  }

  if (status === 'default') {
    alert('Izin notifikasi ditutup atau diabaikan.');
    return false;
  }

  return true;
}

export async function getPushSubscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    console.warn('Service Worker registration not found.');
    return null;
  }
  return await registration.pushManager.getSubscription();
}

export async function isCurrentPushSubscriptionAvailable() {
  return !!(await getPushSubscription());
}

export function generateSubscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
  };
}

export async function subscribe(storyApiInstance) {
  const failureSubscribeMessage = 'Langganan push notification gagal diaktifkan.';
  const successSubscribeMessage = 'Langganan push notification berhasil diaktifkan.';

  if (!isNotificationAvailable()) {
    alert('Browser Anda tidak mendukung Notifikasi Push.');
    return;
  }

  if (!isNotificationGranted()) {
    if (!(await requestNotificationPermission())) {
      return;
    }
  }

  if (await isCurrentPushSubscriptionAvailable()) {
    alert('Sudah berlangganan push notification.');
    return;
  }

  console.log('Mulai berlangganan push notification...');

  let pushSubscription;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      alert('Service Worker belum terdaftar. Notifikasi tidak dapat diaktifkan.');
      console.error('No service worker registration found for push subscription.');
      return;
    }

    pushSubscription = await registration.pushManager.subscribe(generateSubscribeOptions());

    const { endpoint, keys } = pushSubscription.toJSON();

    const response = await storyApiInstance.subscribeNotification({
      endpoint,
      keys: { p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(keys.p256dh))), auth: btoa(String.fromCharCode.apply(null, new Uint8Array(keys.auth))) },
    });

    if (response.error) {
      console.error('subscribe: API response error:', response);
      alert(failureSubscribeMessage);
      await pushSubscription.unsubscribe();
      return;
    }

    alert(successSubscribeMessage);
  } catch (error) {
    console.error('subscribe: error:', error);
    alert(`${failureSubscribeMessage} (${error.message})`);
    if (pushSubscription) {
        await pushSubscription.unsubscribe();
    }
  }
}

export async function unsubscribe(storyApiInstance) {
  const failureUnsubscribeMessage = 'Langganan push notification gagal dinonaktifkan.';
  const successUnsubscribeMessage = 'Langganan push notification berhasil dinonaktifkan.';

  if (!isNotificationAvailable()) {
    alert('Browser Anda tidak mendukung Notifikasi Push.');
    return;
  }

  try {
    const pushSubscription = await getPushSubscription();

    if (!pushSubscription) {
      alert('Tidak bisa memutus langganan push notification karena belum berlangganan sebelumnya.');
      return;
    }

    const { endpoint } = pushSubscription.toJSON();

    const response = await storyApiInstance.unsubscribeNotification(endpoint);

    if (response.error) {
      alert(failureUnsubscribeMessage);
      console.error('unsubscribe: API response error:', response);
      return;
    }

    const unsubscribed = await pushSubscription.unsubscribe();

    if (!unsubscribed) {
      alert(failureUnsubscribeMessage);
      return;
    }

    alert(successUnsubscribeMessage);
  } catch (error) {
    alert(`${failureUnsubscribeMessage} (${error.message})`);
    console.error('unsubscribe: error:', error);
  }
}