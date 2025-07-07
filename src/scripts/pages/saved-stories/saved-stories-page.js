import storyDb from '../../data/story-db';
import { showFormattedDate } from '../../index';

class SavedStoriesPageView {
  constructor() {
    this._savedStoryListContainer = null;
    this._loadingIndicator = null;
    this._errorMessageElement = null;
  }

  getTemplate() {
    return `
      <section class="container saved-stories-section">
        <h1 class="saved-stories-title">Cerita Tersimpan</h1>
        <div id="savedStoryList" class="story-list">
          <p id="savedStoriesLoading" class="loading-indicator">Memuat cerita tersimpan...</p>
          <p id="savedStoriesErrorMessage" class="error-message"></p>
        </div>
      </section>
    `;
  }

  async render() {
    return this.getTemplate();
  }

  async afterRender() {
    this._savedStoryListContainer = document.getElementById('savedStoryList');
    this._loadingIndicator = document.getElementById('savedStoriesLoading');
    this._errorMessageElement = document.getElementById('savedStoriesErrorMessage');
  }

  showLoading() {
    this._loadingIndicator.style.display = 'block';
    this._errorMessageElement.style.display = 'none';
    this._savedStoryListContainer.innerHTML = `<p id="savedStoriesLoading" class="loading-indicator">Memuat cerita tersimpan...</p>`;
  }

  hideLoading() {
    this._loadingIndicator.style.display = 'none';
  }

  showSavedStories(stories) {
    if (stories.length === 0) {
      this._savedStoryListContainer.innerHTML = '<p class="no-data-message">Belum ada cerita yang disimpan.</p>';
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
          <button class="remove-saved-story-button" data-id="${story.id}" aria-label="Hapus cerita ${story.name} dari tersimpan">Hapus dari Tersimpan</button>
        </div>
      </article>
    `).join('');

    this._savedStoryListContainer.innerHTML = storyItemsHtml;
    this._errorMessageElement.style.display = 'none';
  }

  showError(message) {
    this._errorMessageElement.textContent = `Gagal memuat cerita tersimpan: ${message}`;
    this._errorMessageElement.style.display = 'block';
    this._loadingIndicator.style.display = 'none';
    this._savedStoryListContainer.innerHTML = '';
  }

  setRemoveStoryClickListener(callback) {
    this._savedStoryListContainer.addEventListener('click', (event) => {
      if (event.target.classList.contains('remove-saved-story-button')) {
        const storyId = event.target.dataset.id;
        if (storyId) {
          callback(storyId);
        }
      }
    });
  }

  showRemoveSuccess(message) {
    alert(message);
    console.log(message);
  }

  showRemoveFailed(message) {
    alert(message);
    console.error(message);
  }
}

class SavedStoriesPagePresenter {
  constructor(model, view) {
    this._model = model;
    this._view = view;

    this._view.setRemoveStoryClickListener(this.handleRemoveStory.bind(this));
  }

  async loadSavedStories() {
    this._view.showLoading();
    try {
      const stories = await this._model.getAllSavedStories();
      this._view.showSavedStories(stories);
    } catch (error) {
      this._view.showError(error.message);
    } finally {
      this._view.hideLoading();
    }
  }

  async handleRemoveStory(storyId) {
    try {
      await this._model.deleteSavedStory(storyId);
      this._view.showRemoveSuccess('Cerita berhasil dihapus dari koleksi tersimpan.');
      await this.loadSavedStories();
    } catch (error) {
      this._view.showRemoveFailed(`Gagal menghapus cerita: ${error.message}`);
    }
  }
}

export default class SavedStoriesPage {
  async render() {
    const view = new SavedStoriesPageView();
    return await view.render();
  }

  async afterRender() {
    const view = new SavedStoriesPageView();
    await view.afterRender();
    const presenter = new SavedStoriesPagePresenter(storyDb, view);
    await presenter.loadSavedStories();
  }
}