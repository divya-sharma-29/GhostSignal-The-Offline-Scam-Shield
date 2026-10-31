import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Terminal, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  FileCode, 
  Database, 
  Layers, 
  Sliders, 
  HardDrive, 
  ChevronRight,
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiService } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { RiskScore } from '../components/RiskScore';

const PRESET_TEST_CASES = [
  {
    id: 'dotted_kyc',
    label: 'Dotted KYC Trap',
    category: 'Obfuscation',
    text: 'URGENT: Your Northstar b.a.n.k account will be blocked today due to missing k.y.c. Verify immediately at https://parcel-fee.example.test/pay'
  },
  {
    id: 'upi_reverse',
    label: 'UPI Reverse Collect',
    category: 'Payment Fraud',
    text: 'Payment failed. To receive your refund of Rs 799, approve the collect request in your PhonePe / GPay app now.'
  },
  {
    id: 'homoglyph_bank',
    label: 'Cyrillic Homoglyph Bank',
    category: 'Unicode Spoof',
    text: 'Your b\u0430nk account has been locked due to suspicious activity. Verify credentials at https://secure-auth.test'
  },
  {
    id: 'zero_width',
    label: 'Zero-Width Hidden Space',
    category: 'Evasion',
    text: 'Urgent: Complete your k\u200Byc verification now to avoid deactivation: https://customer-verify.test/login'
  },
  {
    id: 'power_cutoff',
    label: 'Electricity Cutoff Panic',
    category: 'Urgency',
    text: 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Call officer immediately at 9876543210.'
  },
  {
    id: 'legitimate_bank',
    label: 'Legitimate Bank Alert',
    category: 'Benign',
    text: 'Your account balance for XX1234 is Rs 5,420 as of 30 Oct. This is an automated update. Thank you for banking with Northstar.'
  }
];

export const ModelStudio: React.FC = () => {
  const [inputText, setInputText] = useState(PRESET_TEST_CASES[0].text);
  const [selectedPreset, setSelectedPreset] = useState<string>('dotted_kyc');
  const [isInferring, setIsInferring] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'verdict' | 'json' | 'specs'>('verdict');
  const [modelSpecs, setModelSpecs] = useState<any>(null);
  const [pipelineSpecs, setPipelineSpecs] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Run initial inference on load
    handleRunInference(PRESET_TEST_CASES[0].text);

    // Fetch model and pipeline specs
    apiService.getModelStatus().then(data => setModelSpecs(data)).catch(() => {});
    apiService.getColabPipeline().then(data => setPipelineSpecs(data)).catch(() => {});
  }, []);

  const handleRunInference = async (textToRun = inputText) => {
    if (!textToRun.trim()) return;
    setIsInferring(true);
    try {
      const res = await apiService.inferModel(textToRun);
      setInferenceResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInferring(false);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_TEST_CASES[0]) => {
    setSelectedPreset(preset.id);
    setInputText(preset.text);
    handleRunInference(preset.text);
  };

  const handleCopyJson = () => {
    if (!inferenceResult) return;
    navigator.clipboard.writeText(JSON.stringify(inferenceResult.verdict, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verdict = inferenceResult?.verdict;

  return (
    <div className={`mx-auto w-full transition-all duration-300 ${isExpanded ? 'max-w-7xl' : 'max-w-5xl'} px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-(--app-text)`}>
      {/* Window Titlebar Header (Desktop OS Application Window Appearance) */}
      <div className="rounded-2xl border border-(--app-border) bg-(--app-card) shadow-md overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-(--app-border) bg-(--app-surface-secondary) px-4 py-3">
          <div className="flex items-center gap-3">
            {/* macOS / Window dots */}
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="h-4 w-px bg-(--app-border)" />
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-(--app-primary)" />
              <span className="text-xs font-mono font-bold text-(--app-text)">
                GhostSignal AI Model Studio — SmolLM3-3B (Quantized Q4_K_M)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% On-Device Offline
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg text-(--app-text-muted) hover:text-(--app-text) hover:bg-(--app-card) transition cursor-pointer"
              title={isExpanded ? 'Collapse Window' : 'Expand Window'}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Runtime Diagnostics Status Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-(--app-border) border-b border-(--app-border) bg-(--app-card) text-[11px] font-mono">
          <div className="p-3">
            <span className="text-(--app-text-muted) block text-[10px] uppercase">Model Weights</span>
            <span className="font-bold text-(--app-text)">SmolLM3-3B</span>
            <span className="text-[10px] text-(--app-text-muted) block">HuggingFaceTB</span>
          </div>
          <div className="p-3">
            <span className="text-(--app-text-muted) block text-[10px] uppercase">Quantization</span>
            <span className="font-bold text-(--app-primary)">GGUF Q4_K_M</span>
            <span className="text-[10px] text-(--app-text-muted) block">1.82 GB (3.3x)</span>
          </div>
          <div className="p-3">
            <span className="text-(--app-text-muted) block text-[10px] uppercase">RAM Footprint</span>
            <span className="font-bold text-(--app-text)">~2.1 GB RAM</span>
            <span className="text-[10px] text-(--app-text-muted) block">Zero GPU Required</span>
          </div>
          <div className="p-3">
            <span className="text-(--app-text-muted) block text-[10px] uppercase">Inference Speed</span>
            <span className="font-bold text-(--app-secondary) flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              {verdict?.inference_time_ms ? `${verdict.inference_time_ms.toFixed(1)} ms` : '< 15 ms'}
            </span>
            <span className="text-[10px] text-(--app-text-muted) block">Multi-Threaded CPU</span>
          </div>
        </div>

        {/* Studio Workspace: Split Input & Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-(--app-border)">
          {/* Left Pane: Prompt Input & Presets (7 cols) */}
          <div className="lg:col-span-6 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-(--app-text) flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-(--app-primary)" />
                Input Test Prompt / Scam Payload
              </label>
              <span className="text-[11px] font-mono text-(--app-text-muted)">
                {inputText.length} chars
              </span>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste any scam message, SMS, or test text here to run live local inference..."
              rows={5}
              className="w-full rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3.5 text-xs sm:text-sm font-mono text-(--app-text) focus:border-(--app-primary) focus:ring-1 focus:ring-(--app-primary) focus:outline-hidden transition resize-y"
            />

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-(--app-text-muted) block">
                Load Preset Scam Scenarios & Evasions:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {PRESET_TEST_CASES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-left p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      selectedPreset === preset.id
                        ? 'border-(--app-primary) bg-(--app-primary)/10 text-(--app-text)'
                        : 'border-(--app-border) bg-(--app-surface-secondary) text-(--app-text-muted) hover:border-(--app-primary)/50 hover:text-(--app-text)'
                    }`}
                  >
                    <span className="font-semibold text-[11px] text-(--app-text) block">{preset.label}</span>
                    <span className="text-[10px] font-mono opacity-80">{preset.category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inference Execution Controls */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleRunInference()}
                disabled={isInferring || !inputText.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-(--app-primary) px-5 py-2.5 text-xs font-bold text-(--app-on-primary) transition hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isInferring ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Running Inference...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Execute Model Inference</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInputText('')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-(--app-border) bg-(--app-surface-secondary) px-3 py-2 text-xs font-semibold text-(--app-text-muted) hover:text-(--app-text) transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Right Pane: Live Model Verdict & Diagnostic Inspector (6 cols) */}
          <div className="lg:col-span-6 p-5 sm:p-6 space-y-4 bg-gradient-to-br from-(--app-card) via-(--app-card) to-(--app-surface-secondary)">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-(--app-border) pb-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('verdict')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'verdict'
                      ? 'bg-(--app-primary) text-(--app-on-primary)'
                      : 'text-(--app-text-muted) hover:text-(--app-text)'
                  }`}
                >
                  Model Verdict
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'json'
                      ? 'bg-(--app-primary) text-(--app-on-primary)'
                      : 'text-(--app-text-muted) hover:text-(--app-text)'
                  }`}
                >
                  Raw JSON Payload
                </button>
              </div>

              {activeTab === 'json' && (
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-(--app-primary) hover:underline cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
                </button>
              )}
            </div>

            {/* Tab 1: Structured Verdict */}
            {activeTab === 'verdict' && (
              <div className="space-y-4">
                {isInferring ? (
                  <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-8 text-center space-y-3">
                    <RefreshCw className="h-8 w-8 text-(--app-primary) animate-spin mx-auto" />
                    <p className="text-xs font-mono font-semibold text-(--app-text)">
                      Evaluating attention layers & unmasking Unicode patterns...
                    </p>
                  </div>
                ) : verdict ? (
                  <div className="space-y-3.5">
                    {/* Header Score & Level */}
                    <div className="flex items-center justify-between rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3.5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-(--app-text-muted)">
                          Classification Verdict
                        </span>
                        <div className="flex items-center gap-2">
                          <RiskBadge level={verdict.risk_level || 'LOW'} size="md" />
                          <span className="text-xs font-mono font-bold text-(--app-text)">
                            Score: {verdict.risk_score ?? 0}/100
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-(--app-text-muted) block">
                          Threat Vector
                        </span>
                        <span className="text-xs font-bold uppercase text-(--app-primary)">
                          {(verdict.scam_type || 'Benign').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Obfuscation Badge if any */}
                    {verdict.obfuscation_type && verdict.obfuscation_type !== 'none' && (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 flex items-center justify-between text-xs text-red-600 dark:text-red-400">
                        <span className="font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Evasion Unmasked: <strong>{verdict.obfuscation_type.toUpperCase()}</strong>
                        </span>
                        <span className="text-[10px] font-mono">Unicode Shield Active</span>
                      </div>
                    )}

                    {/* AI Reasoning */}
                    <div className="rounded-xl border border-(--app-border) bg-(--app-card) p-3.5 space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-(--app-primary) flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-(--app-secondary)" />
                        SmolLM3-3B Contextual Explanation
                      </span>
                      <p className="text-xs text-(--app-text) leading-relaxed">
                        {verdict.explanation || 'No malicious patterns detected. Message aligns with standard notification.'}
                      </p>
                    </div>

                    {/* Safe Action */}
                    <div className="rounded-xl border border-(--app-primary)/30 bg-(--app-primary)/5 p-3.5 space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-(--app-primary) flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-(--app-primary)" />
                        Recommended Next Step
                      </span>
                      <p className="text-xs text-(--app-text) leading-relaxed">
                        {verdict.recommended_action || 'Routine notification; verify details in official app.'}
                      </p>
                    </div>

                    {/* Notice */}
                    <div className="text-[11px] text-(--app-text-muted) italic">
                      * Note: A LOW assessment indicates no known scam patterns were matched. Always verify unexpected payment demands.
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-(--app-border) bg-(--app-surface-secondary) p-8 text-center text-xs text-(--app-text-muted)">
                    Click "Execute Model Inference" to evaluate the input message.
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Raw JSON Output */}
            {activeTab === 'json' && (
              <pre className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-4 text-[11px] font-mono text-(--app-text) overflow-x-auto max-h-[350px]">
                {JSON.stringify(verdict || inferenceResult, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Footer Hub: Colab Pipeline, Quantized Download & Dataset Access */}
        <div className="border-t border-(--app-border) bg-(--app-surface-secondary) p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-(--app-text)">Model Hub Actions:</span>
            <span className="text-[11px] font-mono text-(--app-text-muted)">
              Fine-Tuned on 508 Synthetic Scam Pairs
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="https://colab.research.google.com/notebook#fileId=https%3A//huggingface.co/HuggingFaceTB/SmolLM3-3B.ipynb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-(--app-primary) px-3.5 py-2 text-xs font-bold text-(--app-on-primary) hover:opacity-90 transition"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Launch in Google Colab</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <a
              href={apiService.getColabNotebookUrl()}
              download="train_smollm3_3b.ipynb"
              className="inline-flex items-center gap-1.5 rounded-xl border border-(--app-border) bg-(--app-card) px-3 py-2 text-xs font-semibold text-(--app-text) hover:border-(--app-primary) transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-(--app-primary)" />
              <span>Notebook (.ipynb)</span>
            </a>

            <a
              href={apiService.getColabDatasetUrl()}
              download="synthetic_scam_dataset.csv"
              className="inline-flex items-center gap-1.5 rounded-xl border border-(--app-border) bg-(--app-card) px-3 py-2 text-xs font-semibold text-(--app-text) hover:border-(--app-primary) transition cursor-pointer"
            >
              <Database className="h-3.5 w-3.5 text-(--app-secondary)" />
              <span>Dataset (508 CSV)</span>
            </a>

            <a
              href="https://huggingface.co/HuggingFaceTB/SmolLM3-3B-GGUF/resolve/main/smollm3-3b-instruct-q4_k_m.gguf"
              download="smollm3-3b-q4.gguf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-(--app-border) bg-(--app-card) px-3 py-2 text-xs font-semibold text-(--app-text) hover:border-(--app-primary) transition cursor-pointer"
            >
              <HardDrive className="h-3.5 w-3.5 text-(--app-primary)" />
              <span>GGUF Weights (1.82 GB)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
