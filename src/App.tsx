/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { Scanner } from './pages/Scanner';
import { Analysis } from './pages/Analysis';
import { Results } from './pages/Results';
import { History } from './pages/History';
import { Login } from './pages/Login';
import { Privacy } from './pages/Privacy';
import { Help } from './pages/Help';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { QuickAssistant } from './components/QuickAssistant';
import { LanguageProvider } from './i18n';
import { VoiceSettingsProvider } from './hooks/useVoiceSettings';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <VoiceSettingsProvider>
          <AuthProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/results" element={<Results />} />
                <Route path="/history" element={<History />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/help" element={<Help />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </AuthProvider>
        </VoiceSettingsProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-canvas min-h-screen text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-200 md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <Navbar />
      <div className="workspace-window flex min-h-screen min-w-0 flex-col">
        <main className="flex-1"><Outlet /></main>
        <Footer />
      </div>
      <QuickAssistant />
    </div>
  );
}
