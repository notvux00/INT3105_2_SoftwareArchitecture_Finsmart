/**
 * OfflineQueue Utility
 * Manages persisting transactions to LocalStorage when offline
 */

const STORAGE_KEY = "offline_transactions";

export const offlineQueue = {
  // 1. Save item to "Pocket"
  add: (transaction) => {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      // Add 'temp_id' for UI tracking if not present
      const item = { ...transaction, temp_id: Date.now(), status: "offline_pending" };
      current.push(item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      console.log("📦 Saved to Offline Queue:", item);
      return item;
    } catch (e) {
      console.error("Failed to save offline:", e);
      return null;
    }
  },

  // 2. Get all items
  getAll: () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  },

  // 3. Clear stored items (after sync)
  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // 4. Count items
  size: () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").length;
  }
};
