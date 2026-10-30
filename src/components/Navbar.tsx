import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { History, House, Menu, ScanLine, ShieldCheck, X } from 'lucide-react';
import { ShieldLogo } from './ShieldLogo';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';
import { useLanguage } from '../i18n';

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();
  const links = [
    { to: '/', label: t('dashboard'), icon: House, end: true },
    { to: '/scanner', label: t('scanner'), icon: ScanLine },
    { to: '/history', label: t('history'), icon: History },
    { to: '/privacy', label: t('privacy'), icon: ShieldCheck },
  ];
  const itemClass = ({ isActive }: { isActive: boolean }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${isActive ? 'bg-(--app-tint) font-semibold text-(--app-primary)' : 'text-(--app-text-muted) hover:bg-(--app-card-muted)'}`;
  return <>
    <header className="mobile-topbar sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4 md:hidden">
      <NavLink to="/" className="flex items-center gap-2 text-lg font-bold"><ShieldLogo size="sm" /><span>GhostSignal</span></NavLink>
      <div className="flex items-center gap-2"><LanguageSelector compact /><ThemeToggle compact /><button aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)} className="theme-control rounded-md p-2">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
    </header>
    {menuOpen && <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-black/30 md:hidden" />}
    <aside className={`workspace-sidebar ${menuOpen ? 'translate-x-0' : '-translate-x-full'} fixed bottom-20 left-0 top-16 z-40 flex w-72 flex-col border-r p-4 transition-transform md:sticky md:top-3 md:col-start-1 md:row-start-1 md:my-0 md:h-[calc(100vh-28px)] md:w-auto md:translate-x-0 md:border md:rounded-2xl`}>
      <NavLink to="/" className="hidden items-center gap-3 border-b border-(--app-border) px-2 pb-5 md:flex"><ShieldLogo size="md" /><span className="text-lg font-bold">GhostSignal<span className="mt-0.5 block text-[11px] font-normal text-(--app-text-muted)">THE OFFLINE SCAM SHIELD</span></span></NavLink>
      <p className="mb-3 mt-4 px-3 text-[10px] font-semibold uppercase text-(--app-text-muted)">{t('workspace')}</p>
      <nav className="space-y-1">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={itemClass}><Icon className="h-4 w-4" />{label}</NavLink>)}</nav>
      <NavLink to="/scanner" onClick={() => setMenuOpen(false)} className="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-(--app-primary) px-3 py-3 text-sm font-semibold text-(--app-on-primary)"><ScanLine className="h-4 w-4" />{t('startScan')}</NavLink>
      <div className="mt-auto space-y-2 border-t border-(--app-border) pt-4"><p className="px-2 text-xs font-semibold text-(--app-text-muted)">Preferences</p><LanguageSelector /><ThemeToggle /></div>
      <NavLink to="/help" className="mt-3 rounded-lg px-3 py-2 text-sm text-(--app-text-muted) underline underline-offset-4">Cybercrime support · 1930</NavLink>
      <NavLink to="/login" className="mt-1 rounded-lg px-3 py-2 text-sm text-(--app-text-muted) underline underline-offset-4">Sign in with mobile</NavLink>
    </aside>
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t md:hidden" aria-label={t('workspace')}>
      {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}><Icon /><span>{label}</span></NavLink>)}
    </nav>
  </>;
};
