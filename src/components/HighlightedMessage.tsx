import React from 'react';
import { RedFlag, RedFlagCategory, UnicodeShieldReport } from '../types';
import { getFlagLabel, useLanguage } from '../i18n';

interface HighlightedMessageProps {
  messageText: string;
  redFlags: RedFlag[];
  unicodeReport?: UnicodeShieldReport;
}

export const HighlightedMessage: React.FC<HighlightedMessageProps> = ({ 
  messageText, 
  redFlags,
  unicodeReport 
}) => {
  const { language } = useLanguage();

  const categoryStyles: Record<RedFlagCategory | 'unicode_anomaly', { bg: string; text: string; border: string; label: string }> = {
    urgency: {
      bg: 'bg-amber-500/15 dark:bg-amber-500/20',
      text: 'text-amber-800 dark:text-amber-200',
      border: 'border-b-2 border-amber-500 font-medium',
      label: 'Fake Urgency'
    },
    link: {
      bg: 'bg-(--app-primary)/15',
      text: 'text-(--app-primary)',
      border: 'border-b-2 border-(--app-primary) font-medium',
      label: 'Suspicious Link'
    },
    otp: {
      bg: 'bg-(--app-danger)/15',
      text: 'text-(--app-danger)',
      border: 'border-b-2 border-(--app-danger) font-bold',
      label: 'OTP Request'
    },
    upi: {
      bg: 'bg-(--app-secondary)/15',
      text: 'text-(--app-secondary)',
      border: 'border-b-2 border-(--app-secondary) font-semibold',
      label: 'UPI Request'
    },
    payment_pressure: {
      bg: 'bg-rose-500/15',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-b-2 border-rose-500',
      label: 'Payment Pressure'
    },
    impersonation: {
      bg: 'bg-(--app-secondary)/20',
      text: 'text-(--app-secondary)',
      border: 'border-b-2 border-(--app-secondary)',
      label: 'Impersonation'
    },
    unicode_anomaly: {
      bg: 'bg-(--app-danger)/20',
      text: 'text-(--app-danger)',
      border: 'border-b-2 border-(--app-danger) underline decoration-wavy',
      label: 'Unicode Anomaly'
    }
  };

  interface Segment {
    start: number;
    end: number;
    category: RedFlagCategory | 'unicode_anomaly';
    title: string;
  }

  const segments: Segment[] = [];
  const lowerMessage = messageText.toLowerCase();

  // 1. Red flag keyword segments
  redFlags.forEach(flag => {
    const phraseLower = flag.phrase.toLowerCase().replace(/^\.\.\.|\.\.\.$/g, '').trim();
    if (phraseLower.length > 2) {
      const idx = lowerMessage.indexOf(phraseLower);
      if (idx !== -1) {
        segments.push({
          start: idx,
          end: idx + phraseLower.length,
          category: flag.category,
          title: flag.title
        });
      } else {
        const keywords = phraseLower.split(/\s+/).filter(w => w.length > 3);
        keywords.forEach(word => {
          let wordIdx = lowerMessage.indexOf(word);
          while (wordIdx !== -1) {
            segments.push({
              start: wordIdx,
              end: wordIdx + word.length,
              category: flag.category,
              title: flag.title
            });
            wordIdx = lowerMessage.indexOf(word, wordIdx + word.length);
          }
        });
      }
    }
  });

  // 2. Unicode anomaly segments
  if (unicodeReport?.findings) {
    unicodeReport.findings.forEach(finding => {
      if (finding.index >= 0 && finding.index < messageText.length) {
        const charLen = finding.char.length || 1;
        segments.push({
          start: finding.index,
          end: finding.index + charLen,
          category: 'unicode_anomaly',
          title: finding.explanation
        });
      }
    });
  }

  // Sort and deduplicate overlaps
  segments.sort((a, b) => a.start - b.start);
  const nonOverlapping: Segment[] = [];
  let currentPos = 0;

  segments.forEach(seg => {
    if (seg.start >= currentPos) {
      nonOverlapping.push(seg);
      currentPos = seg.end;
    }
  });

  // Render fragments
  const fragments: React.ReactNode[] = [];
  let lastIndex = 0;

  nonOverlapping.forEach((seg, idx) => {
    if (seg.start > lastIndex) {
      fragments.push(
        <span key={`text-${idx}`}>{messageText.substring(lastIndex, seg.start)}</span>
      );
    }

    const matchedText = messageText.substring(seg.start, seg.end);
    const style = categoryStyles[seg.category] || categoryStyles.urgency;
    const isUnicode = seg.category === 'unicode_anomaly';

    fragments.push(
      <mark
        key={`mark-${idx}`}
        title={`${seg.title} (${style.label})`}
        className={`group relative inline-block rounded-xs px-1 py-0.5 transition-all cursor-help ${style.bg} ${style.text} ${style.border}`}
      >
        <span>{matchedText || (isUnicode ? '␣[hidden]' : '')}</span>
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center gap-1 rounded-md bg-(--app-card) text-(--app-text) border border-(--app-border) px-2 py-1 text-[11px] shadow-lg whitespace-nowrap z-30">
          <span className="font-semibold">{isUnicode ? 'Unicode Anomaly' : getFlagLabel(language, seg.category as RedFlagCategory)}</span>
        </span>
      </mark>
    );

    lastIndex = seg.end;
  });

  if (lastIndex < messageText.length) {
    fragments.push(
      <span key="text-end">{messageText.substring(lastIndex)}</span>
    );
  }

  return (
    <div className="font-mono text-sm leading-relaxed text-(--app-text) select-text whitespace-pre-wrap break-words">
      {fragments.length > 0 ? fragments : messageText}
    </div>
  );
};
