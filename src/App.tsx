/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Scanner = lazy(() => import('./pages/Scanner').then((module) => ({ default: module.Scanner })));
const Analysis = lazy(() => import('./pages/Analysis').then((module) => ({ default: module.Analysis })));
const Results = lazy(() => import('./pages/Results').then((module) => ({ default: module.Results })));
const History = lazy(() => import('./pages/History').then((module) => ({ default: module.History })));
const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const Privacy = lazy(() => import('./pages/Privacy').then((module) => ({ default: module.Privacy })));
const Help = lazy(() => import('./pages/Help').then((module) => ({ default: module.Help })));
import { AuthProvider } from './hooks/useAuth';
import { LanguageProvider } from './i18n';
import { VoiceSettingsProvider } from './hooks/useVoiceSettings';
import { ThemeProvider } from './hooks/useTheme';
const AIGuide = lazy(() => import('./pages/AIGuide').then((module) => ({ default: module.AIGuide })));

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
      <ThemeProvider>
        <LanguageProvider>
          <VoiceSettingsProvider>
            <AuthProvider>
              <ScrollToTop />
              <Suspense fallback={<div role="status" className="mx-auto max-w-3xl px-5 py-12 text-sm text-(--app-text-muted)">Loading GhostSignal…</div>}><Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/scanner" element={<Scanner />} />
                  <Route path="/analysis" element={<Analysis />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/guide" element={<AIGuide />} />
                  <Route path="*" element={<AIGuide />} />
                </Route>
              </Routes></Suspense>
            </AuthProvider>
          </VoiceSettingsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function ProtectedLayout() {
  // Scanning and safety guidance remain available without creating an account.

  return (
    <div className="app-canvas min-h-screen text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-200 md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <Navbar />
      <div className="workspace-window flex min-h-screen min-w-0 flex-col">
        <main className="flex-1"><Outlet /></main>
        <Footer />
      </div>
    </div>
  );
}
