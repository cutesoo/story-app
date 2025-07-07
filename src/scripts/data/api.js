import CONFIG from '../config';
import storyDb from './story-db';

class StoryApi {
  #baseUrl = null;
  #token = null;

  constructor() {
    this.#baseUrl = CONFIG.BASE_URL;
  }

  setAuthToken(token) {
    this.#token = token;
  }

  getAuthToken() {
    return this.#token;
  }

  async register({ name, email, password }) {
    const response = await fetch(`${this.#baseUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    return responseJson;
  }

  async login({ email, password }) {
    const response = await fetch(`${this.#baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    this.setAuthToken(responseJson.loginResult.token);
    return responseJson;
  }

  async addNewStory({ description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);

    if (lat !== null && lat !== undefined) {
      formData.append('lat', lat);
    }
    if (lon !== null && lon !== undefined) {
      formData.append('lon', lon);
    }

    const response = await fetch(`${this.#baseUrl}/stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.#token}`,
      },
      body: formData,
    });
    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    return responseJson;
  }

  async getAllStories(page = 1, size = 10, location = 0) {
    const requestUrl = `${this.#baseUrl}/stories?page=${page}&size=${size}&location=${location}`;
    let stories = [];

    try {
      const response = await fetch(requestUrl, {
        headers: {
          'Authorization': `Bearer ${this.#token}`,
        },
      });
      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      stories = responseJson.listStory;
      await storyDb.deleteAllFetchedStories();
      await storyDb.putAllFetchedStories(stories);
      console.log('Stories fetched from network and cached in IndexedDB.');
      return stories;

    } catch (error) {
      console.error('Failed to fetch stories from network:', error);

      if (error.message.includes('Authentication is required') || error.message.includes('Unauthorized')) {
        throw error;
      }

      console.log('Attempting to retrieve stories from IndexedDB (fetched-stories)...');
      const cachedStories = await storyDb.getAllFetchedStories();
      if (cachedStories && cachedStories.length > 0) {
        console.log('Stories retrieved from IndexedDB.');
        return cachedStories;
      } else {
        throw new Error('Tidak ada koneksi internet dan tidak ada cerita yang tersimpan secara offline.');
      }
    }
  }

  async getDetailStory(id) {
    const requestUrl = `${this.#baseUrl}/stories/${id}`;

    try {
      const response = await fetch(requestUrl, {
        headers: {
          'Authorization': `Bearer ${this.#token}`,
        },
      });
      const responseJson = await response.json();
      if (responseJson.error) {
        throw new Error(responseJson.message);
      }
      await storyDb.putAllFetchedStories([responseJson.story]);
      return responseJson.story;

    } catch (error) {
      console.error(`Failed to fetch detail story ${id} from network:`, error);

      if (error.message.includes('Authentication is required') || error.message.includes('Unauthorized')) {
        throw error;
      }

      console.log(`Attempting to retrieve detail story ${id} from IndexedDB (fetched-stories)...`);
      const cachedStory = await storyDb.getFetchedStory(id);
      if (cachedStory) {
        console.log(`Detail story ${id} retrieved from IndexedDB.`);
        return cachedStory;
      } else {
        throw new Error('Tidak ada koneksi internet dan detail cerita tidak tersimpan secara offline.');
      }
    }
  }

  async subscribeNotification(subscription) {
    const response = await fetch(`${this.#baseUrl}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.#token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    return responseJson;
  }

  async unsubscribeNotification(endpoint) {
    const response = await fetch(`${this.#baseUrl}/notifications/subscribe`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.#token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint }),
    });
    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    return responseJson;
  }
}

export default StoryApi;