import React from 'react';
import { RedFlag, RedFlagCategory } from '../types';
import { Clock, ExternalLink, KeyRound, Smartphone, AlertOctagon, Landmark } from 'lucide-react';
import { getFlagLabel, useLanguage, type TranslationKey } from '../i18n';

interface RedFlagCardProps {
  flag: RedFlag;
  index: number;
}

export const RedFlagCard: React.FC<RedFlagCardProps> = ({ flag, index }) => {
  const { language, t } = useLanguage();
  const adviceKeys: Record<RedFlagCategory, TranslationKey> = {
    urgency: 'safetyUrgency',
    link: 'safetyLink',
    otp: 'safetyOtp',
    upi: 'safetyUpi',
    payment_pressure: 'safetyPayment',
    impersonation: 'safetyBank'
  };
  const categoryConfig: Record<RedFlagCategory, { icon: React.ElementType; color: string; tag: string }> = {
    urgency: {
      icon: Clock,
      color: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      tag: getFlagLabel(language, 'urgency')
    },
    link: {
      icon: ExternalLink,
      color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
      tag: getFlagLabel(language, 'link')
    },
    otp: {
      icon: KeyRound,
      color: 'text-red-400 bg-red-950/40 border-red-500/30',
      tag: getFlagLabel(language, 'otp')
    },
    upi: {
      icon: Smartphone,
      color: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
      tag: getFlagLabel(language, 'upi')
    },
    payment_pressure: {
      icon: AlertOctagon,
      color: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
      tag: getFlagLabel(language, 'payment_pressure')
    },
    impersonation: {
      icon: Landmark,
      color: 'text-orange-400 bg-orange-950/40 border-orange-500/30',
      tag: getFlagLabel(language, 'impersonation')
    }
  };

  const config = categoryConfig[flag.category] || {
    icon: AlertOctagon,
    color: 'text-red-400 bg-red-950/40 border-red-500/30',
    tag: 'Red Flag'
  };
  const Icon = config.icon;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg border ${config.color} shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              {t('redFlags')} 0{index + 1}
            </span>
            <h4 className="text-base font-semibold text-slate-100 mt-0.5">
              {config.tag}
            </h4>
          </div>
        </div>
      </div>

      {/* Flagged phrase */}
      <div className="mb-3.5 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
        <span className="text-xs text-slate-400 block mb-1">{t('explanation')}:</span>
        <span className="text-sm font-medium text-cyan-300 font-mono italic">
          "{flag.phrase}"
        </span>
      </div>

      {/* Explanation */}
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('redFlags')}</span>
          <p className="text-slate-300 mt-0.5 leading-relaxed">
            {t(adviceKeys[flag.category])}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800/60">
          <span className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider">{t('recommendations')}</span>
          <p className="text-slate-300 mt-0.5 leading-relaxed">
            {t(adviceKeys[flag.category])}
          </p>
        </div>
      </div>
    </div>
  );
};
