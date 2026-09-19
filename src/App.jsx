import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import HeaderNav from './components/HeaderNav';
import BottomNav from './components/BottomNav';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { hasOnboarded } from './lib/storage';

import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import CameraScan from './screens/CameraScan';
import ReviewText from './screens/ReviewText';
import Results from './screens/Results';
import IngredientDetail from './screens/IngredientDetail';
import Settings from './screens/Settings';

function LayoutWrapper({ children }) {
  const location = useLocation();
  const showNav = ['/', '/settings'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-green-600 selection:text-white transition-colors duration-200">
      <HeaderNav />

      <main className="flex-1 w-full max-w-7xl mx-auto md:px-6 md:py-6">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      {showNav && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}

function ProtectedHome() {
  const onboarded = hasOnboarded();
  if (!onboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Home />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <LayoutWrapper>
              <Routes>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/" element={<ProtectedHome />} />
                <Route path="/camera-scan" element={<CameraScan />} />
                <Route path="/review-text" element={<ReviewText />} />
                <Route path="/results" element={<Results />} />
                <Route path="/ingredient/:slug" element={<IngredientDetail />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </LayoutWrapper>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
