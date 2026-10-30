import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n';

interface OfflineStatusBannerProps {
  compact?: boolean;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({ compact = false }) => {
  const { t } = useLanguage();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [simulatedOffline, setSimulatedOffline] = useState(false);

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

  const effectiveOffline = !isOnline || simulatedOffline;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        {effectiveOffline ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-mono">
            <WifiOff className="w-3 h-3 text-cyan-400" />
            <span>{t('offlineStatus')}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700 font-mono">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>{t('onlineStatus')}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-xl border transition-all duration-300 ${
      effectiveOffline 
        ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
        : 'bg-slate-900/60 border-slate-800 text-slate-300'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${effectiveOffline ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
            {effectiveOffline ? <WifiOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
                {effectiveOffline ? t('offlineStatus') : t('onlineStatus')}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/90 text-cyan-300 border border-slate-700/60 font-mono">
                Prototype status only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {effectiveOffline
                ? t('offlineUnverified')
                : t('offlineUnverified')}
            </p>
          </div>
        </div>

        <button
          onClick={() => setSimulatedOffline(!simulatedOffline)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors whitespace-nowrap shrink-0"
          title="Change the displayed browser connectivity status"
        >
          {simulatedOffline ? 'Use browser status' : 'Preview offline status'}
        </button>
      </div>
    </div>
  );
};
