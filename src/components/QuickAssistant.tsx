import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  X, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
} from 'lucide-react';
import { useLanguage } from '../i18n';
import { useVoiceSettings } from '../hooks/useVoiceSettings';
import { useScanHistory } from '../hooks/useScanHistory';
import { ScanResult } from '../types';

type GuideTopicId = 'suspicious_reason' | 'unicode_warning' | 'link_danger' | 'payment_advice';

export const QuickAssistant = () => {
  const { t } = useLanguage();
  const { speak, stop, isSpeaking, isMuted, toggleMute } = useVoiceSettings();
  const { history } = useScanHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<GuideTopicId>('suspicious_reason');
  const [customScan, setCustomScan] = useState<ScanResult | null>(null);

  // Latest scan context from local history or event
  const latestScan = customScan || (history.length > 0 ? history[0] : null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ topic?: GuideTopicId; scan?: ScanResult }>;
      if (customEvent.detail?.topic) {
        setActiveTopic(customEvent.detail.topic);
      }
      if (customEvent.detail?.scan) {
        setCustomScan(customEvent.detail.scan);
      }
      setIsOpen(true);
    };

    window.addEventListener('ghostsignal:open-assistant', handleOpen);
    window.addEventListener('ghostsignal:open-ai-guide', handleOpen);

    return () => {
      window.removeEventListener('ghostsignal:open-assistant', handleOpen);
      window.removeEventListener('ghostsignal:open-ai-guide', handleOpen);
      stop();
    };
  }, [stop]);

  const getTopicContent = (topic: GuideTopicId) => {
    switch (topic) {
      case 'suspicious_reason':
        if (latestScan && latestScan.redFlags.length > 0) {
          return {
            title: 'Why this message was flagged',
            summary: latestScan.plainLanguageExplanation,
            points: latestScan.redFlags.map(rf => `${rf.title}: ${rf.whySuspicious}`),
            action: 'Legitimate institutions never demand immediate OTPs or panic deadlines through SMS/chat.'
          };
        }
        return {
          title: 'How to recognize scam warning signs',
          summary: 'Scam messages rely on manufactured panic, false authority, artificial urgency, and payment manipulation.',
          points: [
            'Urgency: Threats that your account, SIM card, or utility will be blocked within hours.',
            'Credential requests: Asking you to reply with or enter an OTP, password, or security code.',
            'Reverse-payment tricks: Claiming you won a prize or asking for your UPI PIN to "receive" funds.'
          ],
          action: 'Always pause and verify independently through official telephone numbers or mobile apps.'
        };

      case 'unicode_warning':
        if (latestScan?.unicodeShield?.hasAnomalies) {
          const u = latestScan.unicodeShield;
          return {
            title: 'What the Unicode warning means in your scan',
            summary: `Unicode Shield detected ${u.summary}`,
            points: [
              u.confusableCount > 0 ? `Confusable characters: Cyrillic or Greek letters were swapped for Latin letters to deceive filters.` : '',
              u.invisibleCount > 0 ? `Invisible characters: Hidden non-printing Unicode characters (such as zero-width spaces) were inserted between characters.` : '',
              u.suspiciousSeparatorCount > 0 ? `Suspicious separators: Deceptive punctuation (e.g. one-dot leader) was substituted for standard periods or slashes.` : '',
              u.obfuscatedKeywords.length > 0 ? `Obfuscated keywords: High-risk words (${u.obfuscatedKeywords.join(', ')}) were deliberately broken up.` : ''
            ].filter(Boolean),
            action: 'These techniques are hallmark signs of calculated cyber fraud designed to evade security filters.'
          };
        }
        return {
          title: 'What is Unicode Homoglyph & Obfuscation Spoofing?',
          summary: 'Unicode characters from other alphabets (like Cyrillic "а" or Greek "ο") look identical to English letters but have different computer code points.',
          points: [
            'Lookalike domains: Scammers register domains using lookalike letters (e.g. sbi.cоm where "о" is Cyrillic) to deceive users.',
            'Zero-width characters: Hidden invisible characters are placed inside words like "p​a​y​t​m" to conceal brands from automated spam filters.',
            'Indic script safety: Legitimate Indian languages (Hindi, Tamil, Bengali, etc.) naturally use conjuncts and vowel marks (matras); GhostSignal ensures genuine Indic characters are never flagged as malicious.'
          ],
          action: 'GhostSignal normalizes and strips deceptive Unicode to expose what is really in the message.'
        };

      case 'link_danger':
        return {
          title: 'Why links in unknown messages are dangerous',
          summary: 'Clicking unverified links exposes your phone to credential harvesting phishing pages or malicious APK downloads.',
          points: [
            'Credential Phishing: Fake websites that mirror legitimate net banking or utility login pages to steal passwords and OTPs.',
            'Sideloaded Malware: Malicious Android APK packages disguised as "bank customer support" or "e-challan viewers" that intercept SMS messages and banking apps.',
            'Shortened URLs: Services like bit.ly or tinyurl conceal the true destination of the address.'
          ],
          action: 'Never click links in unexpected messages. Open your browser and navigate to the official website manually.'
        };

      case 'payment_advice':
        return {
          title: 'What to do after a suspicious payment request',
          summary: 'If someone asks you to approve a payment, enter a PIN, or share an OTP, follow these immediate security steps.',
          points: [
            'The Golden Rule of UPI: You NEVER need to enter a UPI PIN to receive money. Entering your PIN authorizes money to LEAVE your account.',
            'If money was lost: Immediately dial 1930 (India National Cybercrime Helpline) and file a complaint at cybercrime.gov.in.',
            'Freeze affected accounts: Contact your bank branch or card customer care immediately to lock your card, net banking, or UPI ID.'
          ],
          action: 'Block the sender number and take screenshots of the chat for cybercrime reporting.'
        };
    }
  };

  const content = getTopicContent(activeTopic);

  const handleReadAloud = () => {
    if (isMuted) {
      toggleMute();
    }
    const textToSpeak = `${content.title}. ${content.summary}. ${content.points.join('. ')}. ${content.action}`;
    speak(textToSpeak, true);
  };

  const handleSoundOff = () => {
    stop();
    if (!isMuted) {
      toggleMute();
    }
  };

  const handleClose = () => {
    stop();
    setIsOpen(false);
  };

  const handleTopicSelect = (topic: GuideTopicId) => {
    stop();
    setActiveTopic(topic);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="assistant-window relative z-10 flex h-full w-full max-w-md flex-col border-l border-(--app-border) bg-(--app-card) shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-(--app-border) px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--app-surface-secondary) text-(--app-primary)">
                  <Sparkles className="h-4 w-4 text-(--app-secondary)" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-(--app-text)">AI Guide</h2>
                  <p className="text-[11px] text-(--app-text-muted)">Contextual Security Intelligence</p>
                </div>
              </div>

              {/* Sound Controls in Header */}
              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <button
                    type="button"
                    onClick={handleSoundOff}
                    title="Stop audio & turn sound off"
                    aria-label="Turn sound off"
                    className="flex items-center gap-1.5 rounded-xl border border-(--app-danger)/60 bg-(--app-danger)/15 px-3 py-1.5 text-xs font-bold text-(--app-danger) hover:bg-(--app-danger)/25 cursor-pointer transition animate-pulse shadow-xs"
                  >
                    <VolumeX className="h-4 w-4" />
                    <span>Sound Off</span>
                  </button>
                ) : isMuted ? (
                  <button
                    type="button"
                    onClick={toggleMute}
                    title="Sound is off. Click to enable sound"
                    aria-label="Sound is off. Click to enable sound"
                    className="flex items-center gap-1.5 rounded-xl border border-(--app-border) bg-(--app-surface-secondary) px-2.5 py-1.5 text-xs font-semibold text-(--app-text-muted) hover:text-(--app-primary) hover:border-(--app-primary) cursor-pointer transition"
                  >
                    <VolumeX className="h-4 w-4 text-(--app-danger)" />
                    <span>Muted</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReadAloud}
                    title="Listen to explanation"
                    aria-label="Listen to explanation"
                    className="flex items-center gap-1.5 rounded-xl border border-(--app-border) bg-(--app-surface-secondary) px-2.5 py-1.5 text-xs font-semibold text-(--app-text) hover:border-(--app-primary) hover:text-(--app-primary) cursor-pointer transition"
                  >
                    <Volume2 className="h-4 w-4 text-(--app-primary)" />
                    <span className="hidden sm:inline">Listen</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close AI Guide"
                  className="rounded-xl p-2 text-(--app-text-muted) hover:bg-(--app-surface-secondary) hover:text-(--app-text) cursor-pointer transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Context Notice */}
            {latestScan && (
              <div className="border-b border-(--app-border) bg-(--app-surface-secondary) px-5 py-2.5 flex items-center justify-between text-xs">
                <span className="font-medium text-(--app-text-muted)">Context:</span>
                <span className="font-semibold text-(--app-primary)">
                  {latestScan.riskLevel} Risk Scan ({latestScan.redFlags.length} flags)
                </span>
              </div>
            )}

            {/* Topic Switcher Pills */}
            <div className="flex gap-2 overflow-x-auto border-b border-(--app-border) p-3 scrollbar-none">
              <button
                type="button"
                onClick={() => handleTopicSelect('suspicious_reason')}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTopic === 'suspicious_reason'
                    ? 'bg-(--app-primary) text-(--app-on-primary)'
                    : 'bg-(--app-surface-secondary) text-(--app-text-muted) hover:text-(--app-text)'
                }`}
              >
                Why Suspicious
              </button>
              <button
                type="button"
                onClick={() => handleTopicSelect('unicode_warning')}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTopic === 'unicode_warning'
                    ? 'bg-(--app-primary) text-(--app-on-primary)'
                    : 'bg-(--app-surface-secondary) text-(--app-text-muted) hover:text-(--app-text)'
                }`}
              >
                Unicode Shield
              </button>
              <button
                type="button"
                onClick={() => handleTopicSelect('link_danger')}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTopic === 'link_danger'
                    ? 'bg-(--app-primary) text-(--app-on-primary)'
                    : 'bg-(--app-surface-secondary) text-(--app-text-muted) hover:text-(--app-text)'
                }`}
              >
                Link Dangers
              </button>
              <button
                type="button"
                onClick={() => handleTopicSelect('payment_advice')}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTopic === 'payment_advice'
                    ? 'bg-(--app-primary) text-(--app-on-primary)'
                    : 'bg-(--app-surface-secondary) text-(--app-text-muted) hover:text-(--app-text)'
                }`}
              >
                Payment Advice
              </button>
            </div>

            {/* Topic Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Prominent Audio Status & Sound-off Banner */}
              {isSpeaking ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-(--app-danger)/50 bg-(--app-danger)/10 p-3.5 text-xs shadow-xs">
                  <div className="flex items-center gap-2.5 font-bold text-(--app-danger)">
                    <Volume2 className="h-4 w-4 animate-bounce shrink-0" />
                    <span>Speaking explanation...</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSoundOff}
                    className="flex items-center gap-1.5 rounded-xl bg-(--app-danger) px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 cursor-pointer transition"
                  >
                    <VolumeX className="h-3.5 w-3.5" />
                    <span>Sound Off</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-(--app-border) bg-(--app-surface-secondary) p-3 text-xs">
                  <div className="flex items-center gap-2">
                    {isMuted ? (
                      <VolumeX className="h-4 w-4 text-(--app-danger) shrink-0" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-(--app-primary) shrink-0" />
                    )}
                    <span className="font-semibold text-(--app-text)">
                      {isMuted ? 'Sound is turned off' : 'Audio Guide Voice'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMuted ? (
                      <button
                        type="button"
                        onClick={handleReadAloud}
                        className="flex items-center gap-1.5 rounded-xl bg-(--app-primary) px-3 py-1 font-semibold text-(--app-on-primary) shadow-xs hover:opacity-95 active:scale-95 cursor-pointer transition"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>Turn On & Play</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleReadAloud}
                          className="flex items-center gap-1.5 rounded-xl bg-(--app-primary) px-2.5 py-1 font-semibold text-(--app-on-primary) shadow-xs hover:opacity-95 active:scale-95 cursor-pointer transition"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>Play Audio</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSoundOff}
                          title="Turn sound off"
                          className="flex items-center gap-1 rounded-xl border border-(--app-border) bg-(--app-card) px-2 py-1 text-xs font-medium text-(--app-text-muted) hover:text-(--app-danger) hover:border-(--app-danger)/40 cursor-pointer transition"
                        >
                          <VolumeX className="h-3.5 w-3.5" />
                          <span>Sound Off</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-base font-bold text-(--app-text)">{content.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-(--app-text-muted) leading-relaxed">
                  {content.summary}
                </p>
              </div>

              {/* Explanatory Points */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-(--app-primary)">Key Findings & Facts</p>
                {content.points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3 text-xs leading-relaxed text-(--app-text)">
                    <CheckCircle2 className="h-4 w-4 text-(--app-primary) shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>

              {/* Recommended Action */}
              <div className="rounded-xl border border-(--app-secondary)/30 bg-(--app-secondary)/10 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-(--app-secondary)">
                  <HelpCircle className="h-4 w-4" />
                  <span>Actionable Guidance</span>
                </div>
                <p className="text-xs text-(--app-text) leading-relaxed">
                  {content.action}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-(--app-border) p-4 bg-(--app-card)">
              <div className="flex items-center justify-between text-[11px] text-(--app-text-muted)">
                <span>Source: GhostSignal Rule Engine</span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="font-semibold text-(--app-primary) hover:underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
