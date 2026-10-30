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
    level === 'HIGH' ? '#EF4444' : 
    level === 'MEDIUM' ? '#F59E0B' : 
    level === 'LOW' ? '#10B981' : '#64748B';

  // SVG circular progress calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const displayScore = level === 'UNASSESSED' ? 0 : score;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#1E293B"
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
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-mono tabular-nums text-slate-100">
            {level === 'UNASSESSED' ? '—' : score}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{level === 'UNASSESSED' ? 'score' : '/ 100'}</span>
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
          {level === 'UNASSESSED' ? t('unassessed') : t('result')}
        </span>
        <span className="text-sm font-semibold text-slate-200 mt-0.5">
          {level === 'UNASSESSED' ? t('screenshotNotAssessed') : level === 'HIGH' ? t('riskSummaryHigh') : level === 'MEDIUM' ? t('riskSummaryMedium') : t('riskSummaryLow')}
        </span>
        <span className="text-[11px] text-slate-500 mt-1 leading-snug">
          {level === 'UNASSESSED' ? t('pasteMessage') : t('riskNote')}
        </span>
      </div>
    </div>
  );
};
