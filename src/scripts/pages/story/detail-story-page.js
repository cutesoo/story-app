import StoryApi from '../../data/api';
import storyDb from '../../data/story-db';
import { showFormattedDate } from '../../index';
import { parseActivePathname } from '../../routes/url-parser';
import CONFIG from '../../config';

function generateSaveButtonTemplate() {
  return `
    <button id="saveStoryButton" class="action-button save-button">Simpan Cerita</button>
  `;
}

function generateRemoveButtonTemplate() {
  return `
    <button id="removeStoryButton" class="action-button remove-button">Buang Cerita</button>
  `;
}

class DetailStoryPageView {
  constructor() {
    this._storyDetailContainer = null;
    this._loadingIndicator = null;
    this._errorMessageElement = null;
    this._mapContainer = null;
    this._map = null;
    this._marker = null;
    this._saveActionsContainer = null;
  }

  getTemplate() {
    return `
      <section class="container detail-story-section">
        <div id="storyDetail" class="story-detail">
          <p id="detailLoading" class="loading-indicator">Memuat detail cerita...</p>
          <p id="detailErrorMessage" class="error-message"></p>
        </div>
        <div id="saveActionsContainer" class="save-actions-container"></div>
      </section>
    `;
  }

  async render() {
    return this.getTemplate();
  }

  async afterRender() {
    this._storyDetailContainer = document.getElementById('storyDetail');
    this._loadingIndicator = document.getElementById('detailLoading');
    this._errorMessageElement = document.getElementById('detailErrorMessage');
    this._saveActionsContainer = document.getElementById('saveActionsContainer');
  }

  showLoading() {
    this._loadingIndicator.style.display = 'block';
    this._errorMessageElement.style.display = 'none';
    this._storyDetailContainer.innerHTML = `<p id="detailLoading" class="loading-indicator">Memuat detail cerita...</p>`;
  }

  hideLoading() {
    this._loadingIndicator.style.display = 'none';
  }

  showStoryDetail(story) {
    if (!story) {
      this._storyDetailContainer.innerHTML = '<p class="no-data-message">Detail cerita tidak ditemukan.</p>';
      return;
    }

    const storyHtml = `
      <h1 class="story-detail-title">${story.name}</h1>
      <img src="${story.photoUrl}" alt="Foto dari ${story.name}" class="story-detail-image">
      <p class="story-detail-date">Dipublikasikan pada: ${showFormattedDate(story.createdAt)}</p>
      <p class="story-detail-description">${story.description}</p>
      ${story.lat && story.lon ? `
        <h2 class="story-detail-subtitle">Lokasi Cerita</h2>
        <div id="detailMapContainer" class="map-container"></div>
      ` : '<p class="no-location-message">Lokasi cerita tidak tersedia.</p>'}
    `;

    this._storyDetailContainer.innerHTML = storyHtml;
    this._errorMessageElement.style.display = 'none';

    if (story.lat && story.lon) {
      this._mapContainer = document.getElementById('detailMapContainer');
      this._setupMap(story.lat, story.lon, story.name);
    }
  }

  showError(message) {
    this._errorMessageElement.textContent = `Gagal memuat detail cerita: ${message}`;
    this._errorMessageElement.style.display = 'block';
    this._loadingIndicator.style.display = 'none';
    this._storyDetailContainer.innerHTML = '';
  }

  _setupMap(lat, lon, name) {
    if (typeof L === 'undefined') {
      const leafletCss = document.createElement('link');
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      leafletCss.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      leafletCss.crossOrigin = '';
      document.head.appendChild(leafletCss);

      const leafletJs = document.createElement('script');
      leafletJs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletJs.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      leafletJs.crossOrigin = '';
      leafletJs.onload = () => this._initializeMap(lat, lon, name);
      document.body.appendChild(leafletJs);
    } else {
      this._initializeMap(lat, lon, name);
    }
  }

  _initializeMap(lat, lon, name) {
    if (this._map) {
      this._map.remove();
      this._map = null;
      this._marker = null;
    }

    this._map = L.map(this._mapContainer).setView([lat, lon], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this._map);

    this._marker = L.marker([lat, lon]).addTo(this._map)
      .bindPopup(`Lokasi cerita dari ${name}`)
      .openPopup();
  }

  renderSaveButton(callback) {
    this._saveActionsContainer.innerHTML = generateSaveButtonTemplate();
    document.getElementById('saveStoryButton').addEventListener('click', callback);
  }

  renderRemoveButton(callback) {
    this._saveActionsContainer.innerHTML = generateRemoveButtonTemplate();
    document.getElementById('removeStoryButton').addEventListener('click', callback);
  }

  showSaveSuccess(message) {
    alert(message);
    console.log(message);
  }

  showSaveFailed(message) {
    alert(message);
    console.error(message);
  }
}

class DetailStoryPagePresenter {
  #storyId = null;
  #currentStoryData = null;

  constructor(model, dbModel, view) {
    this._model = model;
    this._dbModel = dbModel;
    this._view = view;
  }

  async loadStoryDetail(storyId) {
    this.#storyId = storyId;
    this._view.showLoading();
    try {
      const story = await this._model.getDetailStory(storyId);
      this.#currentStoryData = story;
      this._view.showStoryDetail(story);
      await this.renderSaveRemoveButton();
    } catch (error) {
      this._view.showError(error.message);
      if (error.message.includes('Authentication is required') || error.message.includes('Unauthorized')) {
        localStorage.removeItem('authToken');
        this._model.setAuthToken(null);
        window.location.hash = '#/login';
      }
    } finally {
      this._view.hideLoading();
    }
  }

  async renderSaveRemoveButton() {
    const isSaved = await this.isStorySaved();
    if (isSaved) {
      this._view.renderRemoveButton(this.handleRemoveStory.bind(this));
    } else {
      this._view.renderSaveButton(this.handleSaveStory.bind(this));
    }
  }

  async isStorySaved() {
    return !!(await this._dbModel.getSavedStory(this.#storyId));
  }

  async handleSaveStory() {
    try {
      if (!this.#currentStoryData) {
        this._view.showSaveFailed('Gagal menyimpan: data cerita tidak tersedia.');
        return;
      }
      await this._dbModel.putSavedStory(this.#currentStoryData);
      this._view.showSaveSuccess('Cerita berhasil disimpan ke koleksi!');
      await this.renderSaveRemoveButton();
    } catch (error) {
      this._view.showSaveFailed(`Gagal menyimpan cerita: ${error.message}`);
    }
  }

  async handleRemoveStory() {
    try {
      await this._dbModel.deleteSavedStory(this.#storyId);
      this._view.showSaveSuccess('Cerita berhasil dihapus dari koleksi.');
      await this.renderSaveRemoveButton();
    } catch (error) {
      this._view.showSaveFailed(`Gagal menghapus cerita: ${error.message}`);
    }
  }
}

export default class DetailStoryPage {
  async render() {
    const view = new DetailStoryPageView();
    return await view.render();
  }

  async afterRender(storyApiInstance) {
    const view = new DetailStoryPageView();
    await view.afterRender();
    const { id: storyId } = parseActivePathname();
    if (!storyId) {
      view.showError('ID cerita tidak ditemukan di URL.');
      return;
    }
    const presenter = new DetailStoryPagePresenter(storyApiInstance, storyDb, view);
    await presenter.loadStoryDetail(storyId);
  }
}