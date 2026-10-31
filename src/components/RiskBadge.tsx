import React from 'react';
import { RiskLevel } from '../types';
import { ShieldAlert, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
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
      colorClasses: 'text-(--app-danger) bg-(--app-danger)/15 border border-(--app-danger)/30',
      icon: ShieldAlert
    },
    MEDIUM: {
      label: t('riskMedium'),
      colorClasses: 'text-(--app-warning) bg-(--app-warning)/15 border border-(--app-warning)/30',
      icon: AlertTriangle
    },
    LOW: {
      label: t('riskLow'),
      colorClasses: 'text-(--app-success) bg-(--app-success)/15 border border-(--app-success)/30',
      icon: ShieldCheck
    },
    UNASSESSED: {
      label: t('unassessed'),
      colorClasses: 'text-(--app-text-muted) bg-(--app-surface-secondary) border border-(--app-border)',
      icon: HelpCircle
    }
  };

  const current = configs[level] || configs.LOW;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5 font-medium rounded-md',
    md: 'text-xs sm:text-sm px-3.5 py-1.5 gap-2 font-semibold rounded-lg',
    lg: 'text-sm sm:text-base px-4 py-2 gap-2.5 font-bold tracking-wide rounded-xl'
  };

  return (
    <div className={`inline-flex items-center shadow-2xs ${current.colorClasses} ${sizeClasses[size]}`}>
      {showIcon && (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : size === 'lg' ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'} />
      )}
      <span>{current.label}</span>
    </div>
  );
};
