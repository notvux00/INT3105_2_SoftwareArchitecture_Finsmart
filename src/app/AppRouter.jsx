/**
 * App layer - Application Router
 * Main routing configuration for the application
 */
import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../shared/ui/ProtectedRoute";

// Import Pages (FSD Architecture)
import HomePage from "../pages/HomePage";
import TransactionsPage from "../pages/TransactionsPage";
import ProfilePage from "../pages/ProfilePage";
import StatisticPage from "../pages/StatisticPage";
import PeriodicPage from "../pages/PeriodicPage";
import EconomicalPage from "../pages/EconomicalPage";
import HistoryPage from "../pages/HistoryPage";

// Import Auth Pages (New)
import LandingPage from "../pages/auth/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";

import AI from "../frontend/pages/AI";
import UpdateProfile from "../frontend/pages/UpdateProfile";

function AppRouter() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transaction"
        element={
          <ProtectedRoute>
            <TransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/preodic"
        element={
          <ProtectedRoute>
            <PeriodicPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/statistic"
        element={
          <ProtectedRoute>
            <StatisticPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/economical"
        element={
          <ProtectedRoute>
            <EconomicalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Legacy Routes (Vẫn dùng code cũ) */}
      <Route
        path="/ai"
        element={
          <ProtectedRoute>
            <AI />
          </ProtectedRoute>
        }
      />
      <Route
        path="/update-profile"
        element={
          <ProtectedRoute>
            <UpdateProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRouter;
