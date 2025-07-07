import { openDB } from 'idb';
import CONFIG from '../config';

const DATABASE_NAME = CONFIG.DATABASE_NAME;
const DATABASE_VERSION = CONFIG.DATABASE_VERSION;
const OBJECT_STORE_NAMES = CONFIG.OBJECT_STORE_NAMES;

const storyDb = {
  async database() {
    return openDB(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(OBJECT_STORE_NAMES.SAVED_STORIES)) {
          db.createObjectStore(OBJECT_STORE_NAMES.SAVED_STORIES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(OBJECT_STORE_NAMES.FETCHED_STORIES)) {
          db.createObjectStore(OBJECT_STORE_NAMES.FETCHED_STORIES, { keyPath: 'id' });
        }
      },
    });
  },

  async getAllSavedStories() {
    const db = await this.database();
    return db.getAll(OBJECT_STORE_NAMES.SAVED_STORIES);
  },
  async getSavedStory(id) {
    const db = await this.database();
    return db.get(OBJECT_STORE_NAMES.SAVED_STORIES, id);
  },
  async putSavedStory(story) {
    const db = await this.database();
    return db.put(OBJECT_STORE_NAMES.SAVED_STORIES, story);
  },
  async deleteSavedStory(id) {
    const db = await this.database();
    return db.delete(OBJECT_STORE_NAMES.SAVED_STORIES, id);
  },

  async getAllFetchedStories() {
    const db = await this.database();
    return db.getAll(OBJECT_STORE_NAMES.FETCHED_STORIES);
  },
  async getFetchedStory(id) {
    const db = await this.database();
    return db.get(OBJECT_STORE_NAMES.FETCHED_STORIES, id);
  },
  async putAllFetchedStories(stories) {
    const db = await this.database();
    const tx = db.transaction(OBJECT_STORE_NAMES.FETCHED_STORIES, 'readwrite');
    stories.forEach(story => tx.store.put(story));
    return tx.done;
  },
  async deleteAllFetchedStories() {
    const db = await this.database();
    return db.clear(OBJECT_STORE_NAMES.FETCHED_STORIES);
  },
};

export default storyDb;