import React from 'react';

interface ShieldLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  pulse?: boolean;
  className?: string;
}

export const ShieldLogo: React.FC<ShieldLogoProps> = ({ 
  size = 'md', 
  pulse = false, 
  className = '' 
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      {pulse && (
        <div className="absolute inset-0 rounded-xl bg-(--app-primary)/20 animate-ping opacity-50" />
      )}
      <svg
        viewBox="0 0 40 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer Shield Geometry */}
        <path
          d="M20 2L36 7.5V20.8C36 31.4 29.2 41 20 43.8C10.8 41 4 31.4 4 20.8V7.5L20 2Z"
          fill="var(--app-surface-secondary)"
          stroke="var(--app-primary)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Inner Shield Matrix / Signal Wave */}
        <path
          d="M20 7L31 11V20.5C31 28.5 26.2 35.8 20 38.5C13.8 35.8 9 28.5 9 20.5V11L20 7Z"
          fill="var(--app-card)"
          stroke="var(--app-secondary)"
          strokeWidth="1.2"
          strokeDasharray="2 2"
        />
        {/* Central GhostSignal Pulse / Waveform */}
        <path
          d="M14 22H17L18.5 16L21.5 28L23 22H26"
          stroke="var(--app-primary)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* On-device Dot Node */}
        <circle cx="20" cy="12" r="1.5" fill="var(--app-secondary)" />
      </svg>
    </div>
  );
};
