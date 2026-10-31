import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n';

interface OfflineStatusBannerProps {
  compact?: boolean;
  ruleVersion?: string;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({ 
  compact = false,
  ruleVersion = 'v2.4.0-offline'
}) => {
  const { t } = useLanguage();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const effectiveOffline = !isOnline;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--app-surface-secondary) text-(--app-text) border border-(--app-border) font-mono">
          {effectiveOffline ? (
            <>
              <WifiOff className="w-3 h-3 text-(--app-primary)" />
              <span>Offline Mode</span>
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3 text-(--app-success)" />
              <span>Online Mode</span>
            </>
          )}
        </span>
        <span className="font-mono text-[11px] text-(--app-text-muted)">
          Rules: {ruleVersion}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-(--app-border) bg-(--app-card) p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-(--app-surface-secondary) text-(--app-primary) shrink-0">
            {effectiveOffline ? <WifiOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-(--app-text)">
                {effectiveOffline ? 'Offline Protection Active' : 'Offline Protection Standby'}
              </span>
              <span className="rounded-full bg-(--app-surface-secondary) px-2 py-0.5 text-[10px] font-mono font-semibold text-(--app-primary)">
                Rules: {ruleVersion}
              </span>
            </div>
            <p className="text-xs text-(--app-text-muted) mt-0.5 leading-snug">
              Message text and Unicode analysis evaluate entirely on-device using local rule engine signatures.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-(--app-success) sm:self-center">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Local Engine Verified</span>
        </div>
      </div>
    </div>
  );
};
