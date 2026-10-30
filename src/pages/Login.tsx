import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck, Smartphone } from 'lucide-react';
import { ShieldLogo } from '../components/ShieldLogo';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n';
import { LanguageSelector } from '../components/LanguageSelector';

const LOCAL_SIGN_IN_CODE = '123456';
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft, step]);

  if (user) return <Navigate to="/" replace />;

  const maskedPhone = `${countryCode} ${'*'.repeat(Math.max(phoneNumber.length - 2, 0))}${phoneNumber.slice(-2)}`;

  const requestOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      setError(t('invalidPhone'));
      return;
    }
    setPhoneNumber(digits);
    setError('');
    setMessage(t('noSms'));
    setSecondsLeft(RESEND_SECONDS);
    setStep('otp');
  };

  const verifyOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (otp !== LOCAL_SIGN_IN_CODE) {
      setError(t('invalidOtp'));
      return;
    }
    login({ countryCode, phoneNumber });
    navigate('/', { replace: true });
  };

  const resendOtp = () => {
    setOtp('');
    setError('');
    setSecondsLeft(RESEND_SECONDS);
    setMessage(t('noSms'));
  };

  return (
    <main className="login-stage relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_at_center,black,transparent_78%)]" />
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <ShieldLogo size="md" />
          <div>
            <p className="text-xl font-bold text-white">GhostSignal</p>
            <p className="text-xs text-slate-400">The Offline Scam Shield</p>
          </div>
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6"><LanguageSelector compact /></div>
        </div>

        <div className="login-window px-6 py-8 sm:px-8 sm:py-9">
          <div className="mb-7">
            <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-cyan-300">
              <ShieldCheck className="h-4 w-4" /> {t('phonePrivacy')}
            </p>
            <h1 className="text-2xl font-semibold text-white">
              {step === 'phone' ? t('loginHeading') : t('otpHeading')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {step === 'phone'
                ? t('loginDescription')
                : t('otpFor', { phone: maskedPhone })}
            </p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={requestOtp} className="space-y-5">
              <label className="block text-sm font-medium text-slate-200" htmlFor="phone-number">{t('phoneNumber')}</label>
              <div className="flex gap-2">
                <select
                  aria-label={t('phoneNumber')}
                  value={countryCode}
                  onChange={(event) => setCountryCode(event.target.value)}
                  className="w-24 rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+61">🇦🇺 +61</option>
                </select>
                <input
                  id="phone-number"
                  autoComplete="tel-national"
                  inputMode="numeric"
                  maxLength={15}
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, ''))}
                  placeholder={t('phoneNumber')}
                  className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                />
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                {t('continue')} <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-center text-xs text-slate-400">{t('phonePrivacy')}</p>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-5">
              <label className="block text-sm font-medium text-slate-200" htmlFor="otp-code">{t('testCode')}</label>
              <input
                id="otp-code"
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-4 text-center font-mono text-2xl tracking-[0.3em] text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
              <div className="rounded-md border border-cyan-900 bg-cyan-950/40 px-4 py-3 text-sm text-cyan-100" role="status">
                <div className="flex items-center gap-2 font-medium"><LockKeyhole className="h-4 w-4" /> {t('testCode')}</div>
                <p className="mt-1 text-xs text-cyan-200/75">{t('noSms')}</p>
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                <Smartphone className="h-4 w-4" /> {t('verifyOtp')}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => { setStep('phone'); setError(''); setMessage(''); }} className="inline-flex items-center gap-1 text-slate-300 hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> {t('editPhone')}
                </button>
                <button type="button" disabled={secondsLeft > 0} onClick={resendOtp} className="text-cyan-300 hover:text-cyan-200 disabled:cursor-not-allowed disabled:text-slate-500">
                  {secondsLeft > 0 ? t('resendIn', { seconds: `0:${String(secondsLeft).padStart(2, '0')}` }) : t('resendOtp')}
                </button>
              </div>
            </form>
          )}

          {(error || message) && <p role={error ? 'alert' : 'status'} className={`mt-4 text-sm ${error ? 'text-rose-300' : 'text-slate-400'}`}>{error || message}</p>}
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">{t('tagline')}</p>
      </motion.section>
    </main>
  );
};