import React from 'react';
import { RiskLevel } from '../types';
import { useLanguage } from '../i18n';

interface RiskScoreProps {
  score: number;
  level: RiskLevel;
}

export const RiskScore: React.FC<RiskScoreProps> = ({ score, level }) => {
  const { t } = useLanguage();

  const strokeColor = 
    level === 'HIGH' ? 'var(--app-danger)' : 
    level === 'MEDIUM' ? 'var(--app-warning)' : 
    level === 'LOW' ? 'var(--app-success)' : 'var(--app-text-muted)';

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const displayScore = level === 'UNASSESSED' ? 0 : score;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex items-center gap-4 p-4 bg-(--app-card) border border-(--app-border) rounded-2xl shadow-xs">
      <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
        <svg className="w-18 h-18 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="var(--app-border)"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={strokeColor}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold font-mono tabular-nums text-(--app-text)">
            {level === 'UNASSESSED' ? '—' : score}
          </span>
          <span className="text-[10px] text-(--app-text-muted) font-mono">
            {level === 'UNASSESSED' ? 'score' : '/ 100'}
          </span>
        </div>
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-xs text-(--app-text-muted) font-semibold uppercase tracking-wider">
          {level === 'UNASSESSED' ? t('unassessed') : t('result')}
        </span>
        <span className="text-sm font-bold text-(--app-text) mt-0.5">
          {level === 'UNASSESSED' 
            ? t('screenshotNotAssessed') 
            : level === 'HIGH' 
            ? t('riskSummaryHigh') 
            : level === 'MEDIUM' 
            ? t('riskSummaryMedium') 
            : t('riskSummaryLow')}
        </span>
        <span className="text-[11px] text-(--app-text-muted) mt-1 leading-snug">
          {level === 'UNASSESSED' ? t('pasteMessage') : t('riskNote')}
        </span>
      </div>
    </div>
  );
};
