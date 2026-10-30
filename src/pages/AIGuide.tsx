import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Volume2 } from 'lucide-react';
import { useScanHistory } from '../hooks/useScanHistory';
import { useVoiceSettings } from '../hooks/useVoiceSettings';
import { RiskBadge } from '../components/RiskBadge';

const topics = [
  ['OTP', 'A one-time password confirms an action. Never read it to a caller or enter it after following a message link.'],
  ['UPI', 'A UPI PIN authorizes money leaving your account. You do not need a PIN to receive money.'],
  ['Links', 'A link can imitate a bank or delivery site. Open the official app or type the known website address yourself.'],
  ['Impersonation', 'Scammers may pretend to be bank staff, police, or a delivery company. Contact the organization using a verified number.'],
];

export const AIGuide = () => {
  const { history } = useScanHistory();
  const { speak } = useVoiceSettings();
  const latest = history[0];
  const explanation = latest?.redFlags.length
    ? latest.redFlags.map((flag) => `${flag.title}: ${flag.whySuspicious}`).join(' ')
    : latest?.plainLanguageExplanation ?? 'Paste a message into the scanner to see the warning signs its local rules match.';
  const nextStep = latest?.safetyRecommendations.join(' ') ?? 'Do not share an OTP, UPI PIN, or banking password. Check requests through an official channel.';
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-7 lg:px-10">
      <header className="mb-7 border-b border-(--app-border) pb-6">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-(--app-primary)"><BookOpen className="h-4 w-4" /> Contextual safety help</p>
        <h1 className="text-3xl font-semibold">AI Guide</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-(--app-text-muted)">Understand scan results and learn safer next steps. This guide uses GhostSignal’s existing rule results and short safety explanations; it is not a generative AI service.</p>
      </header>
      <section className="rounded-xl border border-(--app-border) bg-(--app-card) p-5 sm:p-6" aria-labelledby="result-guide">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="result-guide" className="text-lg font-semibold">{latest ? 'Your latest scan' : 'Start with a message scan'}</h2>
          {latest && <RiskBadge level={latest.riskLevel} />}
        </div>
        {latest ? <>
          <p className="mt-4 line-clamp-3 rounded-lg bg-(--app-card-muted) p-3 text-sm text-(--app-text-muted)">{latest.messageText || 'Screenshot text was not assessed.'}</p>
          <h3 className="mt-5 font-semibold">Why these signs matter</h3>
          <p className="mt-2 text-sm leading-6 text-(--app-text-muted)">{explanation}</p>
          <h3 className="mt-5 font-semibold">What you can do next</h3>
          <p className="mt-2 text-sm leading-6 text-(--app-text-muted)">{nextStep}</p>
          <Link to={`/results?id=${latest.id}`} state={{ result: latest }} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-(--app-primary)">Open full explanation <ArrowRight className="h-4 w-4" /></Link>
          <button type="button" onClick={() => speak(`${latest.riskLevel} risk. ${explanation} ${nextStep}`, true)} className="ml-4 mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-(--app-border) px-3 text-sm"><Volume2 className="h-4 w-4" /> Read aloud</button>
        </> : <p className="mt-3 text-sm leading-6 text-(--app-text-muted)">The guide explains results from your local scans. It does not perform another analysis.</p>}
        <Link to="/scanner" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-(--app-primary) px-4 py-2 text-sm font-semibold text-(--app-on-primary)">Scan a message</Link>
      </section>
      <section className="mt-8" aria-labelledby="guide-topics">
        <h2 id="guide-topics" className="text-xl font-semibold">Common warning signs</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{topics.map(([title, body]) => <article key={title} className="rounded-xl border border-(--app-border) bg-(--app-card) p-4"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-(--app-text-muted)">{body}</p></article>)}</div>
      </section>
    </div>
  );
};
