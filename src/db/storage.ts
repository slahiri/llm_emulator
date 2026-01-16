// Storage abstraction layer
// Currently uses LocalStorage, can be swapped to Supabase/PouchDB later

export interface Storage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

// LocalStorage implementation
export const storage: Storage = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove: async (key: string): Promise<void> => {
    localStorage.removeItem(key);
  },
};
