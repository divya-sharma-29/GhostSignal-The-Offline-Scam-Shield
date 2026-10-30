import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldLogo } from './ShieldLogo';
import { Bot, CircleHelp, History, House, LogOut, Menu, ScanLine, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/', label: t('dashboard'), icon: House, end: true },
    { to: '/scanner', label: t('scanner'), icon: ScanLine },
    { to: '/history', label: t('history'), icon: History },
    { to: '/privacy', label: t('privacy'), icon: ShieldCheck },
    { to: '/help', label: t('help'), icon: ShieldAlert }
  ];

  const navLink = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${isActive ? 'bg-cyan-400/10 font-medium text-cyan-200' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'}`;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="mobile-topbar sticky top-0 z-40 flex h-16 items-center justify-between border px-4 backdrop-blur-xl md:hidden">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-white">
          <ShieldLogo size="sm" /> Ghost<span className="-ml-2 text-cyan-400">Signal</span>
        </NavLink>
        <div className="flex items-center gap-1.5">
          <LanguageSelector compact />
          <ThemeToggle compact />
          <button aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)} className="theme-control rounded-md p-2">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>
      {menuOpen && <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-black/50 md:hidden" />}
      <aside className={`workspace-sidebar ${menuOpen ? 'translate-x-0' : '-translate-x-full'} fixed left-0 top-16 bottom-20 z-40 flex w-72 flex-col border-r border-slate-800 bg-[#0B111E] p-4 transition-transform md:sticky md:top-3 md:col-start-1 md:row-start-1 md:my-0 md:ml-0 md:h-[calc(100vh-28px)] md:w-auto md:translate-x-0 md:border-r`}>
        <NavLink to="/" className="hidden items-center gap-3 border-b border-slate-800 px-2 pb-5 md:flex">
          <ShieldLogo size="md" />
          <span className="text-lg font-bold text-white">Ghost<span className="text-cyan-400">Signal</span><span className="mt-0.5 block text-[11px] font-normal text-slate-500">THE OFFLINE SCAM SHIELD</span></span>
        </NavLink>
        <div className="mb-3 mt-2 px-3 text-[10px] font-semibold uppercase text-slate-500">{t('workspace')}</div>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={navLink}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
          <button onClick={() => window.dispatchEvent(new Event('ghostsignal:open-assistant'))} className={navLink({ isActive: false })}>
            <Bot className="h-4 w-4" /> {t('assistantName')}
          </button>
        </nav>
        <button onClick={() => navigate('/scanner')} className="mt-6 flex items-center justify-center gap-2 rounded-md bg-cyan-400 px-3 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
          <ShieldAlert className="h-4 w-4" /> {t('startScan')}
        </button>
        <div className="mt-4 border-t border-slate-800 pt-4"><LanguageSelector compact /></div>
        <div className="mt-2 hidden md:block"><ThemeToggle /></div>
        <div className="mt-auto border-t border-slate-800 pt-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-cyan-300"><ShieldCheck className="h-4 w-4" /></div>
            <div className="min-w-0"><p className="text-xs font-medium text-slate-200">{t('phoneNumber')}</p><p className="truncate text-xs text-slate-500">{user?.countryCode} ••••••{user?.phoneNumber.slice(-2)}</p></div>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800/70 hover:text-white">
            <LogOut className="h-4 w-4" /> {t('logout')}
          </button>
        </div>
      </aside>
      <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t md:hidden" aria-label={t('workspace')}>
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}><House /><span>{t('dashboard')}</span></NavLink>
        <NavLink to="/scanner" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}><ScanLine /><span>{t('scanMessage')}</span></NavLink>
        <button onClick={() => window.dispatchEvent(new Event('ghostsignal:open-assistant'))} className="mobile-nav-item"><Bot /><span>{t('assistant')}</span></button>
        <NavLink to="/history" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}><History /><span>{t('history')}</span></NavLink>
        <NavLink to="/help" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}><CircleHelp /><span>{t('help')}</span></NavLink>
        <NavLink to="/privacy" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}><ShieldCheck /><span>{t('privacy')}</span></NavLink>
      </nav>
    </>
  );
};
