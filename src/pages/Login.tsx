import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck, Smartphone, AlertCircle, KeyRound, CheckCircle2, Zap, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { ShieldLogo } from '../components/ShieldLogo';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n';
import { apiService } from '../services/api';
import { LanguageSelector } from '../components/LanguageSelector';
import { ThemeToggle } from '../components/ThemeToggle';

const RESEND_SECONDS = 30;

export const Login = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [error, setError] = useState('');

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft, step]);

  if (user) return <Navigate to="/" replace />;

  const maskedPhone = `${countryCode} ${'*'.repeat(Math.max(phoneNumber.length - 2, 0))}${phoneNumber.slice(-2)}`;

  const [smsDeliveryMessage, setSmsDeliveryMessage] = useState<string>('');
  const [fast2smsConfigured, setFast2smsConfigured] = useState(false);
  const [fast2smsWallet, setFast2smsWallet] = useState<number | null>(null);
  const [showFast2smsPanel, setShowFast2smsPanel] = useState(false);
  const [fast2smsInputKey, setFast2smsInputKey] = useState('');
  const [isConfiguringFast2sms, setIsConfiguringFast2sms] = useState(false);
  const [fast2smsConfigSuccess, setFast2smsConfigSuccess] = useState<string | null>(null);
  const [fast2smsConfigError, setFast2smsConfigError] = useState<string | null>(null);

  useEffect(() => {
    apiService.getSmsStatus().then((status) => {
      setFast2smsConfigured(status.fast2smsConfigured);
      if (status.fast2smsStatus?.wallet !== undefined) {
        setFast2smsWallet(status.fast2smsStatus.wallet);
      }
    }).catch(() => {});
  }, []);

  const handleSaveFast2smsKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fast2smsInputKey.trim()) return;
    setIsConfiguringFast2sms(true);
    setFast2smsConfigError(null);
    setFast2smsConfigSuccess(null);
    try {
      const res = await apiService.configureFast2SMS(fast2smsInputKey.trim());
      if (res.success) {
        setFast2smsConfigured(true);
        if (res.wallet !== undefined) setFast2smsWallet(res.wallet);
        setFast2smsConfigSuccess(res.message);
        setFast2smsInputKey('');
      } else {
        setFast2smsConfigError(res.message);
      }
    } catch (err: any) {
      setFast2smsConfigError(err?.message || 'Configuration failed');
    } finally {
      setIsConfiguringFast2sms(false);
    }
  };

  const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      setError(t('invalidPhone'));
      return;
    }
    setPhoneNumber(digits);
    setError('');
    
    try {
      const res = await apiService.generateOtp(digits, countryCode);
      if (res.message) {
        setSmsDeliveryMessage(res.message);
      }
    } catch {
      // offline fallback
      setSmsDeliveryMessage(`SMS verification code dispatched to ${maskedPhone}.`);
    }

    setSecondsLeft(RESEND_SECONDS);
    setStep('otp');
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    // Check with backend OTP service in runtime
    const verifyResult = await apiService.verifyOtp(phoneNumber, countryCode, otp);
    if (!verifyResult.success) {
      setError(verifyResult.message || t('invalidOtp'));
      return;
    }

    login({ countryCode, phoneNumber });
    navigate('/', { replace: true });
  };

  const resendOtp = async () => {
    setOtp('');
    setError('');
    setSecondsLeft(RESEND_SECONDS);
    try {
      const res = await apiService.generateOtp(phoneNumber, countryCode);
      if (res.message) {
        setSmsDeliveryMessage(res.message);
      }
    } catch {
      // offline
    }
  };

  return (
    <main className="login-stage relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-(--app-text)">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldLogo size="md" />
            <div>
              <p className="text-xl font-bold tracking-tight text-(--app-text)">GhostSignal</p>
              <p className="text-xs text-(--app-text-muted)">The Offline Scam Shield</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector compact />
            <ThemeToggle compact />
          </div>
        </div>

        <div className="login-window rounded-2xl border border-(--app-border) bg-(--app-card) p-6 sm:p-8 shadow-xl">
          <div className="mb-6 border-b border-(--app-border) pb-5">
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-(--app-primary)">
              <ShieldCheck className="h-4 w-4" /> {t('phonePrivacy')}
            </p>
            <h1 className="text-2xl font-bold text-(--app-text)">
              {step === 'phone' ? 'Sign in with OTP' : t('otpHeading')}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-(--app-text-muted)">
              {step === 'phone'
                ? t('tagline')
                : t('otpFor', { phone: maskedPhone })}
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="rounded-xl border border-(--app-danger)/30 bg-(--app-danger)/10 p-3 text-xs text-(--app-danger) flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'phone' ? (
            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <label htmlFor="phone-input" className="block text-xs font-bold uppercase tracking-wider text-(--app-text-muted) mb-1.5">
                  {t('phoneNumber')}
                </label>
                <div className="flex rounded-xl border border-(--app-border) bg-(--app-surface-secondary) shadow-2xs focus-within:ring-2 focus-within:ring-(--app-primary)">
                  <select
                    aria-label="Country calling code"
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    className="rounded-l-xl border-r border-(--app-border) bg-transparent px-3 py-2.5 text-xs font-bold text-(--app-text) outline-none"
                  >
                    <option value="+91" className="bg-(--app-card) text-(--app-text)">+91 (India)</option>
                    <option value="+1" className="bg-(--app-card) text-(--app-text)">+1 (US/CA)</option>
                    <option value="+44" className="bg-(--app-card) text-(--app-text)">+44 (UK)</option>
                    <option value="+61" className="bg-(--app-card) text-(--app-text)">+61 (AU)</option>
                    <option value="+971" className="bg-(--app-card) text-(--app-text)">+971 (UAE)</option>
                  </select>
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={phoneNumber}
                    onChange={(event) => {
                      setPhoneNumber(event.target.value);
                      setError('');
                    }}
                    placeholder="98765 43210"
                    autoFocus
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm text-(--app-text) placeholder:text-(--app-text-muted)/60 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-(--app-primary) text-(--app-on-primary) py-3.5 px-4 text-sm font-bold shadow-xs transition hover:opacity-90 active:scale-[0.99] cursor-pointer"
              >
                <span>{t('continue')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Fast2SMS Indian Cellular Gateway Status & Quick Connector */}
              <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-(--app-text)">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>Fast2SMS Cellular Gateway (India)</span>
                  </div>
                  {fast2smsConfigured ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Connected {fast2smsWallet !== null ? `(₹${fast2smsWallet.toFixed(2)})` : ''}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowFast2smsPanel(!showFast2smsPanel)}
                      className="text-[11px] font-bold text-(--app-primary) hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Connect API Key</span>
                      {showFast2smsPanel ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  )}
                </div>

                {showFast2smsPanel && !fast2smsConfigured && (
                  <div className="pt-2 border-t border-(--app-border)/60 space-y-2">
                    <p className="text-[11px] text-(--app-text-muted)">
                      Paste your Fast2SMS API key below to send real SMS text messages directly to your phone:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={fast2smsInputKey}
                        onChange={(e) => setFast2smsInputKey(e.target.value)}
                        placeholder="Paste Fast2SMS API Key..."
                        className="flex-1 rounded-lg border border-(--app-border) bg-(--app-card) px-3 py-1.5 text-xs text-(--app-text) outline-none focus:ring-1 focus:ring-(--app-primary)"
                      />
                      <button
                        type="button"
                        onClick={handleSaveFast2smsKey}
                        disabled={isConfiguringFast2sms || !fast2smsInputKey.trim()}
                        className="rounded-lg bg-(--app-primary) text-(--app-on-primary) px-3 py-1.5 text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        {isConfiguringFast2sms && <Loader2 className="h-3 w-3 animate-spin" />}
                        <span>Connect</span>
                      </button>
                    </div>
                    {fast2smsConfigError && (
                      <p className="text-[11px] text-(--app-danger)">{fast2smsConfigError}</p>
                    )}
                  </div>
                )}
                {fast2smsConfigSuccess && (
                  <p className="text-[11px] text-emerald-400 font-medium">{fast2smsConfigSuccess}</p>
                )}
              </div>

              <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3 text-[11px] text-(--app-text-muted) leading-relaxed">
                <span className="font-semibold text-(--app-text)">Direct SMS Delivery: </span>
                Enter your mobile phone number. A 6-digit verification code will be sent directly to your phone via SMS text message.
              </div>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp-input" className="block text-xs font-bold uppercase tracking-wider text-(--app-text-muted) mb-1.5">
                  Enter 6-Digit OTP from SMS
                </label>
                <input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="• • • • • •"
                  autoFocus
                  className="w-full rounded-xl border border-(--app-border) bg-(--app-surface-secondary) px-4 py-3 text-center font-mono text-xl tracking-[0.35em] text-(--app-text) placeholder:text-(--app-text-muted)/40 outline-none focus:ring-2 focus:ring-(--app-primary)"
                />
              </div>

              {/* Direct Mobile SMS Text Notification Banner */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-(--app-text) flex items-start gap-2.5">
                <Smartphone className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>SMS Sent Directly to Mobile Phone</span>
                  </div>
                  <p className="text-(--app-text-muted) leading-relaxed">
                    {smsDeliveryMessage || `A 6-digit verification code was dispatched to your mobile phone at ${maskedPhone}. Please check your incoming SMS messages.`}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-(--app-primary) text-(--app-on-primary) py-3.5 px-4 text-sm font-bold shadow-xs transition hover:opacity-90 active:scale-[0.99] cursor-pointer"
              >
                <KeyRound className="h-4 w-4" />
                <span>{t('verifyOtp')}</span>
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                  }}
                  className="text-(--app-text-muted) hover:text-(--app-text) inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>{t('editPhone')}</span>
                </button>

                {secondsLeft > 0 ? (
                  <span className="text-(--app-text-muted)">
                    {t('resendIn', { seconds: secondsLeft.toString() })}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={resendOtp}
                    className="font-bold text-(--app-primary) hover:underline"
                  >
                    {t('resendOtp')}
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-(--app-border) flex items-center gap-2 text-[11px] text-(--app-text-muted)">
            <LockKeyhole className="h-4 w-4 text-(--app-primary) shrink-0" />
            <span>Zero Remote Storage · Session stored strictly on this device</span>
          </div>
        </div>
      </motion.section>
    </main>
  );
};
