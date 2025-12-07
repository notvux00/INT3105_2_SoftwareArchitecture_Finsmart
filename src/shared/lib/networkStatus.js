/**
 * Network Status Utility
 * Simple wrapper to check online status and listeners
 */

export const networkStatus = {
    // Check current status
    isOnline: () => {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    },

    // Listen for Online event (Network restored)
    addOnOnlineListener: (callback) => {
        window.addEventListener('online', callback);
    },

    // Listen for Offline event (Network lost)
    addOnOfflineListener: (callback) => {
        window.addEventListener('offline', callback);
    },

    // Cleanup
    removeListeners: (callback) => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
    }
};
