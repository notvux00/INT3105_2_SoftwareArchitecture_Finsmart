/**
 * App layer - Main Application Component
 * Root component that provides global configuration and routing
 */
import React from 'react';
import { QueryClientProvider, ErrorBoundary } from './providers';
import AppRouter from './AppRouter';
import { useOfflineSync } from '../shared/hooks/useOfflineSync';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Component to initialize global hooks inside Provider
const GlobalHooks = () => {
  useOfflineSync();
  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider>
        <GlobalHooks />
        <AppRouter />
        <ToastContainer />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
