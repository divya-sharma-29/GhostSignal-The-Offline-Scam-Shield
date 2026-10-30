import React from 'react';
import { RedFlag, RedFlagCategory } from '../types';
import { getFlagLabel, useLanguage } from '../i18n';

interface HighlightedMessageProps {
  messageText: string;
  redFlags: RedFlag[];
}

export const HighlightedMessage: React.FC<HighlightedMessageProps> = ({ messageText, redFlags }) => {
  const { language, t } = useLanguage();
  // Color and style map for each red flag category
  const categoryStyles: Record<RedFlagCategory, { bg: string; text: string; border: string; label: string }> = {
    urgency: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-200',
      border: 'border-b-2 border-amber-400',
      label: 'Fake Urgency'
    },
    link: {
      bg: 'bg-cyan-500/20',
      text: 'text-cyan-200',
      border: 'border-b-2 border-cyan-400',
      label: 'Suspicious Link'
    },
    otp: {
      bg: 'bg-red-500/25',
      text: 'text-red-200',
      border: 'border-b-2 border-red-500 font-semibold',
      label: 'OTP Request'
    },
    upi: {
      bg: 'bg-purple-500/25',
      text: 'text-purple-200',
      border: 'border-b-2 border-purple-400',
      label: 'UPI Request'
    },
    payment_pressure: {
      bg: 'bg-rose-500/20',
      text: 'text-rose-200',
      border: 'border-b-2 border-rose-400',
      label: 'Payment Pressure'
    },
    impersonation: {
      bg: 'bg-orange-500/20',
      text: 'text-orange-200',
      border: 'border-b-2 border-orange-400',
      label: 'Bank Impersonation'
    }
  };

  // Find exact highlight matches within messageText
  interface Segment {
    start: number;
    end: number;
    category: RedFlagCategory;
    title: string;
  }

  const segments: Segment[] = [];
  const lowerMessage = messageText.toLowerCase();

  redFlags.forEach(flag => {
    // Find phrase or parts of phrase
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
        // Fallback: match sub-phrases or keywords
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

  // Sort and remove overlaps
  segments.sort((a, b) => a.start - b.start);
  const nonOverlapping: Segment[] = [];
  let currentPos = 0;

  segments.forEach(seg => {
    if (seg.start >= currentPos) {
      nonOverlapping.push(seg);
      currentPos = seg.end;
    }
  });

  // Render parts
  const renderedParts: React.ReactNode[] = [];
  let lastIndex = 0;

  nonOverlapping.forEach((seg, i) => {
    if (seg.start > lastIndex) {
      renderedParts.push(
        <span key={`text-${lastIndex}`}>{messageText.substring(lastIndex, seg.start)}</span>
      );
    }

    const style = categoryStyles[seg.category] || categoryStyles.urgency;
    renderedParts.push(
      <mark
        key={`mark-${i}`}
        title={`${seg.title} (${getFlagLabel(language, seg.category)})`}
        className={`px-1.5 py-0.5 rounded ${style.bg} ${style.text} ${style.border} inline-block mx-0.5 transition-all`}
      >
        {messageText.substring(seg.start, seg.end)}
        <span className="sr-only">[{getFlagLabel(language, seg.category)}]</span>
      </mark>
    );

    lastIndex = seg.end;
  });

  if (lastIndex < messageText.length) {
    renderedParts.push(
      <span key={`text-${lastIndex}`}>{messageText.substring(lastIndex)}</span>
    );
  }

  return (
    <div className="space-y-4">
      {/* Content box */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-sans text-base leading-relaxed tracking-normal">
        {redFlags.length > 0 ? (
          renderedParts
        ) : (
          <span className="text-slate-300">{messageText}</span>
        )}
      </div>

      {/* Legend */}
      {redFlags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium">{t('redFlags')}:</span>
          {(Object.keys(categoryStyles) as RedFlagCategory[]).map(catKey => {
            const hasCat = redFlags.some(f => f.category === catKey);
            if (!hasCat) return null;
            const style = categoryStyles[catKey];
            return (
              <span
                key={catKey}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] ${style.bg} ${style.text} border border-slate-700/60`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${style.border.split(' ')[1] || 'bg-cyan-400'}`} />
                {getFlagLabel(language, catKey)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
