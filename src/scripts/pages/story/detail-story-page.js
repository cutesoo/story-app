import StoryApi from '../../data/api';
import { showFormattedDate } from '../../index';
import { parseActivePathname } from '../../routes/url-parser';
import CONFIG from '../../config';

class DetailStoryPageView {
  constructor() {
    this._storyDetailContainer = null;
    this._loadingIndicator = null;
    this._errorMessageElement = null;
    this._mapContainer = null;
    this._map = null;
    this._marker = null;
  }

  getTemplate() {
    return `
      <section class="container detail-story-section">
        <div id="storyDetail" class="story-detail">
          <p id="detailLoading" class="loading-indicator">Memuat detail cerita...</p>
          <p id="detailErrorMessage" class="error-message"></p>
        </div>
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
      leafletCss.integrity = 'sha256-p4NxAo9TchQih4IgBtkGAz3LHBXbgAsHvOqNyUPQo8="';
      leafletCss.crossOrigin = '';
      document.head.appendChild(leafletCss);

      const leafletJs = document.createElement('script');
      leafletJs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletJs.integrity = 'sha256-20nEFh3ZzV8K3J3jFmGz+I7T6k/gA1L2/62m6D9W3YQ="';
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
}

class DetailStoryPagePresenter {
  constructor(model, view) {
    this._model = model;
    this._view = view;
  }

  async loadStoryDetail(storyId) {
    this._view.showLoading();
    try {
      const story = await this._model.getDetailStory(storyId);
      this._view.showStoryDetail(story);
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
    const presenter = new DetailStoryPagePresenter(storyApiInstance, view);
    await presenter.loadStoryDetail(storyId);
  }
}