import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldLogo } from './ShieldLogo';
import { ShieldCheck, Lock, Binary } from 'lucide-react';
import { useLanguage } from '../i18n';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-(--app-border) bg-(--app-card) text-(--app-text-muted)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <ShieldLogo size="sm" />
              <span className="text-base font-bold text-(--app-text)">
                Ghost<span className="text-(--app-primary)">Signal</span>
              </span>
            </div>
            <p className="text-xs font-medium text-(--app-secondary)">
              "Your messages. Your privacy. Your protection."
            </p>
            <p className="text-xs text-(--app-text-muted) max-w-md leading-relaxed">
              Lightweight cybersecurity shield detecting scam indicators, invisible Unicode characters, and homoglyphs with transparent local rules.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-(--app-text-muted) pt-1">
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3 h-3 text-(--app-primary)" />
                Local Storage Vault
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-(--app-primary)" />
                Unicode Shield
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5 text-xs">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-(--app-text) font-bold">
              Navigation
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/" className="text-(--app-text-muted) hover:text-(--app-primary) transition-colors">
                  {t('dashboard')}
                </Link>
              </li>
              <li>
                <Link to="/scanner" className="text-(--app-text-muted) hover:text-(--app-primary) transition-colors">
                  {t('scanner')}
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-(--app-text-muted) hover:text-(--app-primary) transition-colors">
                  {t('history')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-(--app-text-muted) hover:text-(--app-primary) transition-colors">
                  Privacy & Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-(--app-border) flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-(--app-text-muted)">
          <p>
            GhostSignal Security Engine · Not an AI prediction. A low-risk result is not proof of safety.
          </p>
          <p className="font-mono">
            Rules v2.4.0-offline
          </p>
        </div>
      </div>
    </footer>
  );
};
