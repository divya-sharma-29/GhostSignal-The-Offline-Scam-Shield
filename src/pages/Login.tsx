import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck, Smartphone } from 'lucide-react';
import { ShieldLogo } from '../components/ShieldLogo';
import { LanguageSelector } from '../components/LanguageSelector';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n';
import type { AuthUser } from '../hooks/useAuth';

type OtpResponse = { challengeId: string; expiresInSeconds?: number; destination?: string };
type VerifyResponse = { user: AuthUser };

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string; detail?: string } | null;
    if (response.status === 404) throw new Error('SMS sign-in is not configured on this server yet.');
    throw new Error(payload?.message ?? payload?.detail ?? 'Unable to verify your number right now. Please try again.');
  }
  return response.json() as Promise<T>;
}

export const Login = () => {
  const navigate = useNavigate();
  const { authenticate } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const maskedPhone = `${countryCode} ${'*'.repeat(Math.max(phoneNumber.length - 2, 0))}${phoneNumber.slice(-2)}`;

  const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) { setError(t('invalidPhone')); return; }
    setBusy(true); setError('');
    try {
      const result = await postJson<OtpResponse>('/api/auth/otp/request', { phoneNumber: `${countryCode}${digits}` });
      if (!result.challengeId) throw new Error('The sign-in service returned an invalid challenge.');
      setChallengeId(result.challengeId);
      setPhoneNumber(digits);
      setOtp('');
      setStep('otp');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send a verification code.');
    } finally { setBusy(false); }
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{4,8}$/.test(otp)) { setError('Enter the verification code from your text message.'); return; }
    setBusy(true); setError('');
    try {
      const result = await postJson<VerifyResponse>('/api/auth/otp/verify', { challengeId, code: otp });
      if (!result.user?.id) throw new Error('The sign-in service returned an invalid response.');
      authenticate(result.user);
      navigate('/', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'That code could not be verified.');
    } finally { setBusy(false); }
  };

  return (
    <main className="login-stage flex min-h-screen items-center justify-center px-4 py-10">
      <section className="login-window w-full max-w-md rounded-2xl border p-6 sm:p-8" aria-labelledby="login-heading">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" aria-label="GhostSignal home">
            <ShieldLogo size="md" />
            <span><strong className="block text-lg">GhostSignal</strong><span className="text-xs text-(--app-text-muted)">The Offline Scam Shield</span></span>
          </Link>
          <div className="flex gap-2"><LanguageSelector compact /><ThemeToggle compact /></div>
        </div>
        <div className="mb-6">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase text-(--app-primary)"><ShieldCheck className="h-4 w-4" /> {t('phonePrivacy')}</p>
          <h1 id="login-heading" className="text-2xl font-semibold">{step === 'phone' ? t('loginHeading') : t('otpHeading')}</h1>
          <p className="mt-2 text-sm leading-6 text-(--app-text-muted)">{step === 'phone' ? t('loginDescription') : t('otpFor', { phone: maskedPhone })}</p>
        </div>
        {step === 'phone' ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <label className="block text-sm font-medium" htmlFor="phone-number">{t('phoneNumber')}</label>
            <div className="flex gap-2">
              <select aria-label="Country calling code" value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="w-24 rounded-lg border border-(--app-border) bg-(--app-card) px-3 py-3 text-sm">
                <option value="+91">🇮🇳 +91</option><option value="+1">🇺🇸 +1</option><option value="+44">🇬🇧 +44</option><option value="+61">🇦🇺 +61</option>
              </select>
              <input id="phone-number" type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={15} required value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, ''))} placeholder={t('phoneNumber')} className="min-w-0 flex-1 rounded-lg border border-(--app-border) bg-(--app-card) px-4 py-3 text-sm" />
            </div>
            <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-(--app-primary) px-4 py-3 text-sm font-semibold text-(--app-on-primary) disabled:opacity-60">
              <Smartphone className="h-4 w-4" />{busy ? 'Sending code…' : t('continue')}<ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <label htmlFor="otp-code" className="block text-sm font-medium">{t('otpFor', { phone: maskedPhone })}</label>
            <input id="otp-code" autoFocus autoComplete="one-time-code" inputMode="numeric" maxLength={8} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="••••••" className="w-full rounded-lg border border-(--app-border) bg-(--app-card) px-4 py-4 text-center font-mono text-2xl tracking-[0.3em]" />
            <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-(--app-primary) px-4 py-3 text-sm font-semibold text-(--app-on-primary) disabled:opacity-60">
              <LockKeyhole className="h-4 w-4" />{busy ? 'Verifying…' : t('verifyOtp')}
            </button>
            <button type="button" disabled={busy} onClick={() => { setStep('phone'); setError(''); setOtp(''); setChallengeId(''); }} className="inline-flex min-h-11 items-center gap-2 text-sm text-(--app-primary) underline underline-offset-4"><ArrowLeft className="h-4 w-4" />{t('editPhone')}</button>
          </form>
        )}
        {error && <p role="alert" className="mt-4 rounded-lg border border-(--app-danger) p-3 text-sm">{error}</p>}
        <p className="mt-4 text-xs leading-5 text-(--app-text-muted)">A verification code is sent by the server. Scanning is still available without signing in if text-message verification is not set up.</p>
        <Link to="/" className="mt-3 flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-(--app-primary) underline underline-offset-4">Continue without signing in</Link>
        <p className="mt-4 text-center text-xs text-(--app-text-muted)">{t('tagline')}</p>
      </section>
    </main>
  );
};
