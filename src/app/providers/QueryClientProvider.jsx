/**
 * App layer - Query Client Provider
 * Provides React Query client with localStorage persistence
 */
import React from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on client errors (4xx)
        if (error.response?.status < 500) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) =>
        Math.min(1000 * Math.pow(2, attemptIndex), 10000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Create persister for localStorage
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'FINSMART_QUERY_CACHE',
});

const QueryClientProvider = ({ children }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};

export default QueryClientProvider;

