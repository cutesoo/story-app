import { openDB } from 'idb';

const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'saved-stories';

const storyDb = {
  async database() {
    return openDB(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(db) {
        db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
        db.createObjectStore('fetched-stories', { keyPath: 'id' });
      },
    });
  },

  async getSavedStory(id) {
    const db = await this.database();
    return db.get(OBJECT_STORE_NAME, id);
  },

  async getAllSavedStories() {
    const db = await this.database();
    return db.getAll(OBJECT_STORE_NAME);
  },

  async putSavedStory(story) {
    if (!Object.hasOwn(story, 'id')) {
      throw new Error('`id` is required to save a story.');
    }
    const db = await this.database();
    return db.put(OBJECT_STORE_NAME, story);
  },

  async deleteSavedStory(id) {
    const db = await this.database();
    return db.delete(OBJECT_STORE_NAME, id);
  },

  async getFetchedStory(id) {
    const db = await this.database();
    return db.get('fetched-stories', id);
  },

  async putAllFetchedStories(stories) {
    const db = await this.database();
    const tx = db.transaction('fetched-stories', 'readwrite');
    stories.forEach((story) => {
      tx.store.put(story);
    });
    return tx.done;
  },

  async deleteAllFetchedStories() {
    const db = await this.database();
    const tx = db.transaction('fetched-stories', 'readwrite');
    tx.store.clear();
    return tx.done;
  },

  async getAllFetchedStories() {
    const db = await this.database();
    return db.getAll('fetched-stories');
  },
};

export default storyDb;