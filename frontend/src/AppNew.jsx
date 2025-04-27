import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import ATS from "./components/ATS";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import InterviewPrep from "./components/InterviewPrep";
import JobForm from "./components/JobForm";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Welcome from "./pages/Welcome";
import CalendarPage from "./pages/CalendarPage";

import LoadingSpinner from "./components/LoadingSpinner";

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/ats" element={<PrivateRoute><ATS /></PrivateRoute>} />
      <Route path="/interview-prep" element={<PrivateRoute><InterviewPrep /></PrivateRoute>} />
      <Route path="/job-form" element={<PrivateRoute><JobForm /></PrivateRoute>} />
      <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
