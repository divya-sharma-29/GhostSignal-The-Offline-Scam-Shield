import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldLogo } from './ShieldLogo';
import { History, House, LogOut, Menu, ScanLine, ShieldCheck, X, Sparkles, Smartphone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  // 4 Primary destinations
  const links = [
    { to: '/', label: t('dashboard'), icon: House, end: true },
    { to: '/scanner', label: t('scanner'), icon: ScanLine },
    { to: '/history', label: t('history'), icon: History },
    { to: '/privacy', label: t('privacy'), icon: ShieldCheck }
  ];

  const navLink = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all ${
      isActive 
        ? 'bg-(--app-primary) text-(--app-on-primary) font-semibold shadow-2xs' 
        : 'text-(--app-text-muted) hover:bg-(--app-surface-secondary) hover:text-(--app-text)'
    }`;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="mobile-topbar sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4 backdrop-blur-md md:hidden">
        <NavLink to="/" className="flex items-center gap-2.5 text-base font-bold text-(--app-text)">
          <ShieldLogo size="sm" />
          <span>Ghost<span className="text-(--app-primary)">Signal</span></span>
        </NavLink>
        <div className="flex items-center gap-2">
          <LanguageSelector compact />
          <ThemeToggle compact />
          <button 
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="theme-control p-2 text-(--app-text)"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      {menuOpen && (
        <button 
          aria-label="Close navigation" 
          onClick={() => setMenuOpen(false)} 
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden" 
        />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside 
        className={`workspace-sidebar ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed left-0 top-16 bottom-16 z-40 flex w-72 flex-col border-r bg-(--app-card) p-4 transition-transform md:sticky md:top-3 md:col-start-1 md:row-start-1 md:my-0 md:ml-0 md:h-[calc(100vh-24px)] md:w-auto md:translate-x-0 md:border-r`}
      >
        {/* Brand */}
        <NavLink to="/" className="hidden items-center gap-3 border-b border-(--app-border) px-2 pb-5 md:flex">
          <ShieldLogo size="md" />
          <div>
            <span className="text-lg font-bold tracking-tight text-(--app-text)">
              Ghost<span className="text-(--app-primary)">Signal</span>
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wider text-(--app-text-muted)">
              The Offline Scam Shield
            </span>
          </div>
        </NavLink>

        {/* Navigation list */}
        <div className="mb-2 mt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-(--app-text-muted)">
          Navigation
        </div>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={navLink}>
              <Icon className="h-4 w-4" /> 
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Primary Scan Button */}
        <button 
          onClick={() => {
            setMenuOpen(false);
            navigate('/scanner');
          }} 
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-(--app-primary) px-4 py-3 text-sm font-semibold text-(--app-on-primary) shadow-xs transition hover:opacity-90 active:scale-[0.99] cursor-pointer"
        >
          <ScanLine className="h-4 w-4" /> 
          <span>{t('startScan')}</span>
        </button>

        {/* Contextual AI Guide Trigger */}
        <button
          onClick={() => {
            setMenuOpen(false);
            window.dispatchEvent(new CustomEvent('ghostsignal:open-ai-guide', { detail: { topic: 'suspicious_reason' } }));
          }}
          className="mt-2.5 flex items-center justify-center gap-2 rounded-xl border border-(--app-border) bg-(--app-surface-secondary) px-4 py-2.5 text-xs font-semibold text-(--app-text) transition hover:border-(--app-primary) cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-(--app-secondary)" />
          <span>AI Guide (Contextual)</span>
        </button>

        {/* Controls */}
        <div className="mt-4 border-t border-(--app-border) pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-(--app-text-muted)">{t('language')}</span>
            <LanguageSelector compact />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-(--app-text-muted)">Theme</span>
            <ThemeToggle compact />
          </div>
        </div>

        {/* User Account / Phone / Logout */}
        <div className="mt-auto border-t border-(--app-border) pt-4">
          <div className="mb-3 flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--app-surface-secondary) text-(--app-primary)">
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-(--app-text)">{t('phoneNumber')}</p>
              <p className="truncate text-xs text-(--app-text-muted)">
                {user?.countryCode} ••••••{user?.phoneNumber?.slice(-2) || '00'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-(--app-text-muted) transition hover:bg-(--app-surface-secondary) hover:text-(--app-danger) cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> 
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (4 clean items) */}
      <nav 
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t md:hidden" 
        aria-label="Mobile Navigation"
      >
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <House />
          <span>{t('dashboard')}</span>
        </NavLink>
        <NavLink to="/scanner" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <ScanLine />
          <span>{t('scanMessage')}</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <History />
          <span>{t('history')}</span>
        </NavLink>
        <NavLink to="/privacy" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <ShieldCheck />
          <span>{t('privacy')}</span>
        </NavLink>
      </nav>
    </>
  );
};
