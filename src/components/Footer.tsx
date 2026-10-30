import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldLogo } from './ShieldLogo';
import { Shield, Lock, EyeOff } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-[#070B14] text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldLogo size="sm" />
              <span className="text-base font-bold text-slate-100 font-sans">
                Ghost<span className="text-cyan-400">Signal</span>
              </span>
              <span className="text-xs text-slate-500 font-mono">v0.1-cp1</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              An offline-first scam shield using local, explainable rules. AI analysis and OCR are not available yet.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Local account & history
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
                Privacy-focused design
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Explainable Rules
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-sm">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              App Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-slate-400 hover:text-cyan-300 transition-colors">
                  Overview & Principles
                </Link>
              </li>
              <li>
                <Link to="/scanner" className="text-slate-400 hover:text-cyan-300 transition-colors">
                  Message Scanner
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-slate-400 hover:text-cyan-300 transition-colors">
                  Scan History
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-cyan-300 transition-colors">
                  Privacy & Architecture
                </Link>
              </li>
            </ul>
          </div>

          {/* Hackathon Specs */}
          <div className="space-y-3 text-sm">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Hackathon Entry
            </h4>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="text-cyan-300 font-medium">Team The Vanguard</div>
              <div className="text-slate-400">AfterHours 1.0 · Offline Round</div>
              <div className="text-slate-500 text-[11px] pt-1">
                Local keyword checks; AI analysis is not available yet.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} GhostSignal · Team The Vanguard. Tagline: &ldquo;Your messages. Your privacy. Your protection.&rdquo;
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400">Local rules-based analysis</span>
            <span>·</span>
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">
              Offline Security Model
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
