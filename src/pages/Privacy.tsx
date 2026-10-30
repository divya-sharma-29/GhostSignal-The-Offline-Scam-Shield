import { ArrowRight, Check, Cpu, EyeOff, LockKeyhole, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';

const principles = [
  { title: 'Private by design', description: 'Messages are intended to remain on the device. This version evaluates text with local keyword rules; scan history is saved in browser local storage.', icon: LockKeyhole },
  { title: 'Instant', description: 'A future local engine can avoid server round trips. AI model analysis is not available in this version.', icon: Cpu },
  { title: 'Reliable', description: 'GhostSignal is designed to work without an internet connection. Offline behavior and network isolation have not been independently verified.', icon: WifiOff }
];

export const Privacy = () => (
  <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-7 lg:px-10">
    <header className="mb-9 border-b border-slate-800 pb-6">
      <p className="text-xs font-medium uppercase text-cyan-300">GhostSignal · Checkpoint 1</p>
      <h1 className="mt-2 text-3xl font-semibold text-white">Privacy & offline design</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Our intended principles and the capabilities currently available.</p>
    </header>

    <div className="divide-y divide-slate-800 border-y border-slate-800">
      {principles.map(({ title, description, icon: Icon }, index) => (
        <section key={title} className="grid gap-3 py-5 sm:grid-cols-[42px_180px_1fr] sm:items-start">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-cyan-300"><Icon className="h-4 w-4" /></div>
          <h2 className="pt-1 text-sm font-semibold text-white">0{index + 1} · {title}</h2>
          <p className="text-sm leading-6 text-slate-400">{description}</p>
        </section>
      ))}
    </div>

    <section className="mt-10">
      <h2 className="text-lg font-semibold text-white">Analysis flow</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {['Input', 'Local risk engine', 'Risk assessment', 'Explanation'].map((step, index) => (
          <div key={step} className="flex min-h-20 items-center gap-3 border-l-2 border-cyan-500 bg-slate-900/60 px-4 py-3">
            <span className="font-mono text-xs text-cyan-300">0{index + 1}</span>
            <span className="text-sm font-medium text-slate-200">{step}</span>
            {index < 3 && <ArrowRight className="ml-auto hidden h-4 w-4 text-slate-600 sm:block" />}
          </div>
        ))}
      </div>
    </section>

    <section className="mt-10 grid gap-5 sm:grid-cols-2">
      <div className="border-t-2 border-emerald-500 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Check className="h-4 w-4 text-emerald-300" />Available now</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>Local keyword checks with explanations</li>
          <li>Scan history stored in browser local storage</li>
          <li>Phone and test-code sign-in stored in this browser</li>
        </ul>
      </div>
      <div className="border-t-2 border-amber-400 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><EyeOff className="h-4 w-4 text-amber-300" />Not available yet</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>On-device AI model and language detection</li>
          <li>OCR text extraction from uploaded screenshots</li>
          <li>Technically verified network isolation or PWA offline caching</li>
        </ul>
      </div>
    </section>

    <p className="mt-8 border-l-2 border-slate-600 bg-slate-900/50 px-4 py-3 text-sm leading-6 text-slate-300">Your messages stay on your device. GhostSignal is designed for offline analysis. Current results use local keyword rules; no AI model or OCR engine is running.</p>
    <section className="mt-10 border-t border-slate-800 pt-6" aria-labelledby="cyber-help-heading">
      <p className="text-xs font-medium uppercase text-cyan-300">India · official reporting</p>
      <h2 id="cyber-help-heading" className="mt-1 text-lg font-semibold text-white">Cybercrime help</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">For financial cyber fraud, call the national helpline as soon as possible. We could not verify an official SMS reporting number; use the helpline or report online.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href="tel:1930" className="inline-flex items-center gap-2 rounded-md bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-400">Call 1930</a>
        <a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800">Open cybercrime.gov.in <ArrowRight className="h-4 w-4" /></a>
        <span className="text-xs text-slate-500">SMS number: not verified</span>
      </div>
    </section>
    <div className="mt-8"><Link to="/scanner" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-cyan-200">Open message scanner <ArrowRight className="h-4 w-4" /></Link></div>
  </div>
);