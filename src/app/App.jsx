/**
 * App layer - Main Application Component
 * Root component that provides global configuration and routing
 */
import React from 'react';
import { QueryClientProvider, ErrorBoundary } from './providers';
import AppRouter from './AppRouter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider>
        <AppRouter />
        <ToastContainer />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
