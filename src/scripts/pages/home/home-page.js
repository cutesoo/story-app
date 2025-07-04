import { showFormattedDate } from '../../index';

class HomePageView {
  constructor() {
    this._storyListContainer = null;
    this._loadingIndicator = null;
    this._errorMessageElement = null;
  }

  getTemplate() {
    return `
      <section class="container home-section">
        <h1 class="home-title">Cerita Terbaru</h1>
        <div id="storyList" class="story-list">
          <p id="homeLoading" class="loading-indicator">Memuat cerita...</p>
          <p id="homeErrorMessage" class="error-message"></p>
        </div>
      </section>
    `;
  }

  async render() {
    return this.getTemplate();
  }

  async afterRender() {
    this._storyListContainer = document.getElementById('storyList');
    this._loadingIndicator = document.getElementById('homeLoading');
    this._errorMessageElement = document.getElementById('homeErrorMessage');
  }

  showLoading() {
    this._loadingIndicator.style.display = 'block';
    this._errorMessageElement.style.display = 'none';
    this._storyListContainer.innerHTML = `<p id="homeLoading" class="loading-indicator">Memuat cerita...</p>`;
  }

  hideLoading() {
    this._loadingIndicator.style.display = 'none';
  }

  showStories(stories) {
    if (stories.length === 0) {
      this._storyListContainer.innerHTML = '<p class="no-data-message">Belum ada cerita. Ayo buat cerita pertamamu!</p>';
      return;
    }

    const storyItemsHtml = stories.map(story => `
      <article class="story-item">
        <img src="${story.photoUrl}" alt="Foto ${story.name}" class="story-image">
        <div class="story-content">
          <h2 class="story-name">${story.name}</h2>
          <p class="story-date">${showFormattedDate(story.createdAt)}</p>
          <p class="story-description">${story.description}</p>
          ${story.lat && story.lon ? `<p class="story-location">Lokasi: (${story.lat}, ${story.lon})</p>` : ''}
          <a href="#/stories/${story.id}" class="detail-link" aria-label="Lihat detail cerita dari ${story.name}">Lihat Detail</a>
        </div>
      </article>
    `).join('');

    this._storyListContainer.innerHTML = storyItemsHtml;
    this._errorMessageElement.style.display = 'none';
  }

  showError(message) {
    this._errorMessageElement.textContent = `Gagal memuat cerita: ${message}`;
    this._errorMessageElement.style.display = 'block';
    this._loadingIndicator.style.display = 'none';
    this._storyListContainer.innerHTML = '';
  }
}

class HomePagePresenter {
  constructor(model, view) {
    this._model = model;
    this._view = view;
  }

  async loadStories() {
    this._view.showLoading();
    try {
      const stories = await this._model.getAllStories();
      this._view.showStories(stories);
    } catch (error) {
      if (error.message.includes('Authentication is required') || error.message.includes('Unauthorized')) {
        localStorage.removeItem('authToken');
        this._model.setAuthToken(null);
        window.location.hash = '#/login';
      } else if (error.message.includes('Tidak ada koneksi internet') || !navigator.onLine) {
        this._view.showError(`Anda sedang offline. Menampilkan data yang tersimpan: ${error.message}`);
      } else {
        this._view.showError(error.message);
      }
    } finally {
      this._view.hideLoading();
    }
  }
}

export default class HomePage {
  async render() {
    const view = new HomePageView();
    return await view.render();
  }

  async afterRender(storyApiInstance) {
    const view = new HomePageView();
    await view.afterRender();
    const presenter = new HomePagePresenter(storyApiInstance, view);
    await presenter.loadStories();
  }
}