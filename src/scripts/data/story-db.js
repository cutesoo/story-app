import { openDB } from 'idb';

const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'stories';

const storyDb = {
  async database() {
    return openDB(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(db) {
        db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
      },
    });
  },

  async getStory(id) {
    const db = await this.database();
    return db.get(OBJECT_STORE_NAME, id);
  },

  async getAllStories() {
    const db = await this.database();
    return db.getAll(OBJECT_STORE_NAME);
  },

  async putStory(story) {
    const db = await this.database();
    return db.put(OBJECT_STORE_NAME, story);
  },

  async putAllStories(stories) {
    const db = await this.database();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    stories.forEach((story) => {
      tx.store.put(story);
    });
    return tx.done;
  },

  async deleteStory(id) {
    const db = await this.database();
    return db.delete(OBJECT_STORE_NAME, id);
  },

  async deleteAllStories() {
    const db = await this.database();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    tx.store.clear();
    return tx.done;
  },
};

export default storyDb;