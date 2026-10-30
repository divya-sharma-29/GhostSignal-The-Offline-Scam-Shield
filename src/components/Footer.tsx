import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldLogo } from './ShieldLogo';
import { Shield, Lock, EyeOff } from 'lucide-react';
import { useLanguage } from '../i18n';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="mt-auto border-t border-slate-800 bg-[#070B14] text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldLogo size="sm" />
              <span className="text-base font-bold text-slate-100 font-sans">
                Ghost<span className="text-cyan-400">Signal</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              {t('localRules')}. {t('aiUnavailable')} {t('ocrUnavailable')}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                {t('history')}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
                {t('privacy')}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                {t('explanation')}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-sm">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              {t('workspace')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-slate-400 hover:text-cyan-300 transition-colors">
                  {t('dashboard')}
                </Link>
              </li>
              <li>
                <Link to="/scanner" className="text-slate-400 hover:text-cyan-300 transition-colors">
                  {t('scanner')}
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-slate-400 hover:text-cyan-300 transition-colors">
                  {t('history')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-cyan-300 transition-colors">
                  {t('privacy')}
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} GhostSignal · {t('tagline')}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400">{t('riskNote')}</span>
            <span>·</span>
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">
              {t('privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
