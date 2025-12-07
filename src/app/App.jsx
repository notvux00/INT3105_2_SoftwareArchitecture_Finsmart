/**
 * App layer - Main Application Component
 * Root component that provides global configuration and routing
 */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider, ErrorBoundary } from './providers';
import AppRouter from './AppRouter';
import { useAuth } from '../shared/hooks';
import { useOfflineSync } from '../shared/hooks/useOfflineSync';
import { useTransactionRealtime } from '../entities/transaction';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Component to initialize global hooks inside Provider
const GlobalHooks = () => {
  const { userId } = useAuth();
  useOfflineSync();
  useTransactionRealtime(userId);
  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider>
        <Router>
          <GlobalHooks />
          <AppRouter />
          <ToastContainer />
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
