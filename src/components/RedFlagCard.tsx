import React from 'react';
import { RedFlag, RedFlagCategory } from '../types';
import { Clock, ExternalLink, KeyRound, Smartphone, AlertOctagon, Landmark, Sparkles } from 'lucide-react';
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
      color: 'text-(--app-warning) bg-(--app-warning)/15 border border-(--app-warning)/30',
      tag: getFlagLabel(language, 'urgency')
    },
    link: {
      icon: ExternalLink,
      color: 'text-(--app-primary) bg-(--app-primary)/15 border border-(--app-primary)/30',
      tag: getFlagLabel(language, 'link')
    },
    otp: {
      icon: KeyRound,
      color: 'text-(--app-danger) bg-(--app-danger)/15 border border-(--app-danger)/30',
      tag: getFlagLabel(language, 'otp')
    },
    upi: {
      icon: Smartphone,
      color: 'text-(--app-secondary) bg-(--app-secondary)/15 border border-(--app-secondary)/30',
      tag: getFlagLabel(language, 'upi')
    },
    payment_pressure: {
      icon: AlertOctagon,
      color: 'text-(--app-danger) bg-(--app-danger)/15 border border-(--app-danger)/30',
      tag: getFlagLabel(language, 'payment_pressure')
    },
    impersonation: {
      icon: Landmark,
      color: 'text-(--app-secondary) bg-(--app-secondary)/15 border border-(--app-secondary)/30',
      tag: getFlagLabel(language, 'impersonation')
    }
  };

  const config = categoryConfig[flag.category] || {
    icon: AlertOctagon,
    color: 'text-(--app-danger) bg-(--app-danger)/15 border border-(--app-danger)/30',
    tag: 'Red Flag'
  };
  const Icon = config.icon;

  const handleAskGuide = () => {
    const topic = flag.category === 'link' 
      ? 'link_danger' 
      : (flag.category === 'upi' || flag.category === 'payment_pressure')
      ? 'payment_advice'
      : 'suspicious_reason';

    window.dispatchEvent(new CustomEvent('ghostsignal:open-ai-guide', { 
      detail: { topic } 
    }));
  };

  return (
    <div className="rounded-2xl border border-(--app-border) bg-(--app-card) p-5 shadow-xs transition hover:border-(--app-primary)">
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${config.color} shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono text-(--app-text-muted) uppercase tracking-wider block font-semibold">
              Warning Sign 0{index + 1}
            </span>
            <h4 className="text-sm sm:text-base font-bold text-(--app-text) mt-0.5">
              {flag.title || config.tag}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAskGuide}
          className="rounded-lg border border-(--app-border) bg-(--app-surface-secondary) p-2 text-(--app-primary) hover:border-(--app-primary) transition cursor-pointer"
          title="Ask AI Guide"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Flagged phrase */}
      <div className="mb-3.5 p-3 rounded-xl bg-(--app-surface-secondary) border border-(--app-border)">
        <span className="text-[11px] font-semibold text-(--app-text-muted) block mb-1">Detected phrase:</span>
        <span className="text-xs sm:text-sm font-semibold text-(--app-text) font-mono italic">
          "{flag.phrase}"
        </span>
      </div>

      {/* Explanation & Why Suspicious */}
      <div className="space-y-2.5 text-xs sm:text-sm">
        <div>
          <span className="text-[11px] font-bold text-(--app-text-muted) uppercase tracking-wider">Analysis</span>
          <p className="text-(--app-text) mt-0.5 leading-relaxed">
            {flag.explanation}
          </p>
        </div>

        <div className="pt-2 border-t border-(--app-border)">
          <span className="text-[11px] font-bold text-(--app-secondary) uppercase tracking-wider">Why Threat Actors Use This</span>
          <p className="text-(--app-text-muted) mt-0.5 leading-relaxed text-xs">
            {flag.whySuspicious || t(adviceKeys[flag.category])}
          </p>
        </div>
      </div>
    </div>
  );
};
