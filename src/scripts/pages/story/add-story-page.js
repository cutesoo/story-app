import StoryApi from '../../data/api';
import { sleep } from '../../index';

class AddStoryPageView {
  constructor() {
    this._addStoryForm = null;
    this._errorMessageElement = null;
    this._photoInput = null;
    this._photoPreview = null;
    this._videoElement = null;
    this._captureButton = null;
    this._canvasElement = null;
    this._locationInput = null;
    this._mapContainer = null;
    this._map = null;
    this._marker = null;
    this._currentLat = null;
    this._currentLon = null;
    this._stream = null;
  }

  getTemplate() {
    return `
      <section class="container add-story-section">
        <h1 class="add-story-title">Tambah Cerita Baru</h1>
        <form id="addStoryForm" class="add-story-form">
          <div class="form-group">
            <label for="description">Deskripsi</label>
            <textarea id="description" name="description" rows="5" required></textarea>
          </div>

          <div class="form-group">
            <label>Foto</label>
            <input type="file" id="photoInput" accept="image/*" style="display:none;">
            <button type="button" id="openCameraButton" class="camera-button">Buka Kamera</button>
            <video id="videoElement" autoplay playsinline style="display:none; width: 100%; max-width: 400px;"></video>
            <button type="button" id="captureButton" class="camera-button" style="display:none;">Ambil Foto</button>
            <canvas id="canvasElement" style="display:none; width: 100%; max-width: 400px;"></canvas>
            <img id="photoPreview" class="photo-preview" src="#" alt="Pratinjau Foto" style="display:none;">
          </div>

          <div class="form-group">
            <label>Lokasi (Opsional)</label>
            <input type="text" id="locationInput" placeholder="Klik peta untuk mendapatkan lokasi" readonly>
            <div id="mapContainer" class="map-container"></div>
            <p class="map-hint">Klik di peta untuk mendapatkan koordinat Latitude dan Longitude.</p>
          </div>

          <p id="addStoryErrorMessage" class="error-message"></p>
          <button type="submit" id="addStoryButton">Unggah Cerita</button>
        </form>
      </section>
    `;
  }

  async render() {
    return this.getTemplate();
  }

  async afterRender() {
    this._addStoryForm = document.getElementById('addStoryForm');
    this._errorMessageElement = document.getElementById('addStoryErrorMessage');
    this._photoInput = document.getElementById('photoInput');
    this._photoPreview = document.getElementById('photoPreview');
    this._videoElement = document.getElementById('videoElement');
    this._captureButton = document.getElementById('captureButton');
    this._canvasElement = document.getElementById('canvasElement');
    this._locationInput = document.getElementById('locationInput');
    this._mapContainer = document.getElementById('mapContainer');

    this._setupCamera();
    this._setupMap();
  }

  _setupCamera() {
    const openCameraButton = document.getElementById('openCameraButton');
    openCameraButton.addEventListener('click', async () => {
      if (this._stream) {
        this.stopCamera();
        openCameraButton.textContent = 'Buka Kamera';
        this._videoElement.style.display = 'none';
        this._captureButton.style.display = 'none';
        this._canvasElement.style.display = 'none';
        this._photoPreview.style.display = 'none';
        return;
      }

      try {
        this._stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        this._videoElement.srcObject = this._stream;
        this._videoElement.style.display = 'block';
        this._captureButton.style.display = 'block';
        openCameraButton.textContent = 'Tutup Kamera';
        this._photoPreview.style.display = 'none';
        this._canvasElement.style.display = 'none';
      } catch (err) {
        this.showError(`Tidak dapat mengakses kamera: ${err.message}`);
        console.error('Error accessing camera:', err);
      }
    });

    this._captureButton.addEventListener('click', () => {
      this._canvasElement.width = this._videoElement.videoWidth;
      this._canvasElement.height = this._videoElement.videoHeight;
      this._canvasElement.getContext('2d').drawImage(this._videoElement, 0, 0, this._canvasElement.width, this._canvasElement.height);
      const imgDataUrl = this._canvasElement.toDataURL('image/png');

      this._photoPreview.src = imgDataUrl;
      this._photoPreview.style.display = 'block';
      this._videoElement.style.display = 'none';
      this._captureButton.style.display = 'none';
      this._canvasElement.style.display = 'none';
      this.stopCamera();
    });
  }

  stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach(track => track.stop());
      this._stream = null;
      this._videoElement.srcObject = null;
    }
  }

  _setupMap() {
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
      leafletJs.onload = () => this._initializeMap();
      document.body.appendChild(leafletJs);
    } else {
      this._initializeMap();
    }
  }

  _initializeMap() {
    if (this._map) {
      this._map.remove();
    }

    const defaultLat = -6.2000;
    const defaultLon = 106.8167;

    this._map = L.map(this._mapContainer).setView([defaultLat, defaultLon], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this._map);

    this._map.on('click', (e) => {
      this._currentLat = e.latlng.lat;
      this._currentLon = e.latlng.lng;
      this._locationInput.value = `Lat: ${this._currentLat.toFixed(4)}, Lon: ${this._currentLon.toFixed(4)}`;

      if (this._marker) {
        this._map.removeLayer(this._marker);
      }
      this._marker = L.marker([this._currentLat, this._currentLon]).addTo(this._map)
        .bindPopup(`Lokasi terpilih: <br>Lat: ${this._currentLat.toFixed(4)}<br>Lon: ${this._currentLon.toFixed(4)}`)
        .openPopup();
    });
  }

  getAddStoryData() {
    const description = this._addStoryForm.querySelector('#description').value;
    const photoBlob = this._dataURLtoBlob(this._photoPreview.src);
    const lat = this._currentLat;
    const lon = this._currentLon;

    return { description, photo: photoBlob, lat, lon };
  }

  _dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  setAddStoryClickListener(callback) {
    this._addStoryForm.addEventListener('submit', callback);
  }

  showLoading() {
    this._errorMessageElement.textContent = 'Mengunggah cerita...';
    this._errorMessageElement.classList.remove('error', 'success');
    this._errorMessageElement.classList.add('loading');
    document.getElementById('addStoryButton').disabled = true;
  }

  hideLoading() {
    this._errorMessageElement.classList.remove('loading');
    document.getElementById('addStoryButton').disabled = false;
  }

  showAddStorySuccess(message) {
    this._errorMessageElement.textContent = message;
    this._errorMessageElement.classList.remove('error', 'loading');
    this._errorMessageElement.classList.add('success');
    this._addStoryForm.reset();
    this._photoPreview.style.display = 'none';
    if (this._marker) {
        this._map.removeLayer(this._marker);
        this._marker = null;
        this._locationInput.value = '';
        this._currentLat = null;
        this._currentLon = null;
    }
  }

  showAddStoryError(message) {
    this._errorMessageElement.textContent = message;
    this._errorMessageElement.classList.add('error');
    this._errorMessageElement.classList.remove('loading', 'success');
  }
}

class AddStoryPagePresenter {
  constructor(model, view) {
    this._model = model;
    this._view = view;

    this._view.setAddStoryClickListener(this._handleAddStorySubmit.bind(this));
  }

  async _handleAddStorySubmit(event) {
    event.preventDefault();
    this._view.showLoading();

    const { description, photo, lat, lon } = this._view.getAddStoryData();

    if (!photo || photo.size === 0) {
      this._view.showAddStoryError('Foto harus diunggah!');
      this._view.hideLoading();
      return;
    }

    if (photo.size > 1000000) {
        this._view.showAddStoryError('Ukuran foto maksimal 1MB!');
        this._view.hideLoading();
        return;
    }

    try {
      await this._model.addNewStory({ description, photo, lat, lon });
      this._view.showAddStorySuccess('Cerita berhasil diunggah!');
      await sleep(1500);
      window.location.hash = '#/';
    } catch (error) {
      this._view.showAddStoryError(`Gagal mengunggah cerita: ${error.message}`);
      if (error.message.includes('Authentication is required') || error.message.includes('Unauthorized')) {
        localStorage.removeItem('authToken');
        this._model.setAuthToken(null);
        window.location.hash = '#/login';
      }
    } finally {
      this._view.hideLoading();
      this._view.stopCamera();
    }
  }
}

export default class AddStoryPage {
  async render() {
    const view = new AddStoryPageView();
    return await view.render();
  }

  async afterRender(storyApiInstance) {
    const view = new AddStoryPageView();
    await view.afterRender();
    new AddStoryPagePresenter(storyApiInstance, view);
  }
}