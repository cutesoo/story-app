import { isCurrentPushSubscriptionAvailable, subscribe, unsubscribe, isNotificationAvailable } from '../../utils/notification-helper';
export default class AboutPage {
  async render() {
    return `
      <section class="container">
        <h1>About Page</h1>
        <p>Aplikasi berbagi cerita ini dibuat sebagai bagian dari submission kelas Web Developer Expert Dicoding.</p>
        <p>Nikmati berbagi momen dan kisah Anda dengan mudah!</p>
        <div class="notification-controls">
            <button id="subscribeButton">Aktifkan Notifikasi</button>
            <button id="unsubscribeButton" style="display:none;">Nonaktifkan Notifikasi</button>
        </div>
        <p id="notificationStatus"></p>
      </section>
    `;
  }

  async afterRender(storyApiInstance) {
    const subscribeButton = document.getElementById('subscribeButton');
    const unsubscribeButton = document.getElementById('unsubscribeButton');
    const notificationStatus = document.getElementById('notificationStatus');

    if (!isNotificationAvailable()) {
      notificationStatus.textContent = 'Browser Anda tidak mendukung Notifikasi Push.';
      subscribeButton.style.display = 'none';
      unsubscribeButton.style.display = 'none';
      return;
    }

    const updateButtonStatus = async () => {
      const isSubscribed = await isCurrentPushSubscriptionAvailable();
      if (isSubscribed) {
        subscribeButton.style.display = 'none';
        unsubscribeButton.style.display = 'block';
        notificationStatus.textContent = 'Notifikasi aktif.';
      } else {
        subscribeButton.style.display = 'block';
        unsubscribeButton.style.display = 'none';
        notificationStatus.textContent = 'Notifikasi tidak aktif.';
      }
    };

    await updateButtonStatus();

    subscribeButton.addEventListener('click', async () => {
      await subscribe(storyApiInstance);
      await updateButtonStatus();
    });

    unsubscribeButton.addEventListener('click', async () => {
      await unsubscribe(storyApiInstance);
      await updateButtonStatus();
    });
  }
}