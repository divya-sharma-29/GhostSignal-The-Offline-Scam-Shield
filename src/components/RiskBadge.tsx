import React from 'react';
import { RiskLevel } from '../types';
import { ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ 
  level, 
  size = 'md', 
  showIcon = true 
}) => {
  const { t } = useLanguage();
  const configs = {
    HIGH: {
      label: t('riskHigh'),
      sub: 'Critical Threat Detected',
      colorClasses: 'text-red-400 bg-red-950/40 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]',
      icon: ShieldAlert
    },
    MEDIUM: {
      label: t('riskMedium'),
      sub: 'Suspicious Indicators',
      colorClasses: 'text-amber-300 bg-amber-950/40 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      icon: AlertTriangle
    },
    LOW: {
      label: t('riskLow'),
      sub: 'No Major Threats Found',
      colorClasses: 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      icon: ShieldCheck
    },
    UNASSESSED: {
      label: t('unassessed'),
      sub: 'Text extraction unavailable',
      colorClasses: 'text-slate-300 bg-slate-800 border border-slate-600',
      icon: AlertTriangle
    }
  };

  const current = configs[level] || configs.LOW;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    md: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
    lg: 'text-base px-4 py-2.5 gap-2.5 font-bold tracking-wide'
  };

  return (
    <div className={`inline-flex items-center rounded-lg ${current.colorClasses} ${sizeClasses[size]}`}>
      {showIcon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : size === 'lg' ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'} />}
      <span>{current.label}</span>
    </div>
  );
};
