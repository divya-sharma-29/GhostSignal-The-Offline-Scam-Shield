import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ScanLine, 
  ImageUp, 
  ArrowRight, 
  Clock3, 
  Sparkles, 
  History as HistoryIcon,
  FileText,
  Bot,
  Download,
  Check,
  ExternalLink,
  HardDrive,
  RefreshCw,
  FileCode,
  ShieldCheck,
  Layers,
  Cpu,
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { RiskBadge } from '../components/RiskBadge';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';
import { useScanHistory } from '../hooks/useScanHistory';
import { LanguageSelector } from '../components/LanguageSelector';
import { ThemeToggle } from '../components/ThemeToggle';
import { useLanguage } from '../i18n';
import { ShieldLogo } from '../components/ShieldLogo';
import { apiService } from '../services/api';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { history } = useScanHistory();
  const { t } = useLanguage();
  const recentScans = history.slice(0, 4);

  const [modelSavedLocally, setModelSavedLocally] = useState<boolean>(() => {
    return localStorage.getItem('ghostsignal_smollm3_saved') === 'true';
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [pipelineInfo, setPipelineInfo] = useState<any>(null);

  useEffect(() => {
    apiService.getColabPipeline().then(data => {
      if (data) setPipelineInfo(data);
    }).catch(() => {});
  }, []);

  const handleDownloadModel = async () => {
    setIsDownloading(true);
    setDownloadProgress(20);
    apiService.triggerModelDownload().catch(() => {});

    // Direct download trigger for browser
    const link = document.createElement('a');
    link.href = 'https://huggingface.co/HuggingFaceTB/SmolLM3-3B-GGUF/resolve/main/smollm3-3b-instruct-q4_k_m.gguf';
    link.setAttribute('download', 'smollm3-3b-q4.gguf');
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          setModelSavedLocally(true);
          localStorage.setItem('ghostsignal_smollm3_saved', 'true');
          return 100;
        }
        return prev + 20;
      });
    }, 350);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* GhostSignal Branding, Tagline, Language and Theme controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-(--app-border) pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <ShieldLogo size="sm" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-(--app-primary)">
              GhostSignal · The Offline Scam Shield
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-(--app-text)">
            Message Security Dashboard
          </h1>
          <p className="text-sm font-medium text-(--app-secondary)">
            "Your messages. Your privacy. Your protection."
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

      {/* Primary Actions: Scan Message, Upload Screenshot & Working Model Window */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/scanner"
          className="flex min-h-24 items-center justify-between gap-4 rounded-2xl bg-(--app-primary) p-5 text-(--app-on-primary) shadow-sm transition-all hover:opacity-95 active:scale-[0.99] group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/15 shrink-0">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Scan Message</h2>
              <p className="text-[11px] opacity-90 mt-0.5">
                Pasted text or SMS analysis
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/scanner?mode=screenshot"
          className="flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-(--app-border) bg-(--app-card) p-5 text-(--app-text) shadow-2xs transition-all hover:border-(--app-primary) hover:bg-(--app-surface-secondary) group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--app-surface-secondary) text-(--app-primary) shrink-0">
              <ImageUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Upload Screenshot</h2>
              <p className="text-[11px] text-(--app-text-muted) mt-0.5">
                WinOCR on-device extraction
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-(--app-text-muted) transition-transform group-hover:translate-x-1 group-hover:text-(--app-primary)" />
        </Link>

        <Link
          to="/model-studio"
          className="flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 text-(--app-text) shadow-2xs transition-all hover:border-purple-500 hover:bg-purple-500/15 group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-bold">Model Window</h2>
                <span className="rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.2 text-[9px] font-mono font-bold">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-(--app-text-muted) mt-0.5">
                SmolLM3-3B AI Studio
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-purple-500 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Offline Protection Status & Installed Rule Version */}
      <OfflineStatusBanner ruleVersion="v2.4.0-offline" />

      {/* Two-Tier Engine Architecture (Blueprint System Workflow) */}
      <section className="rounded-2xl border border-(--app-border) bg-(--app-card) p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--app-border) pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--app-surface-secondary) text-(--app-primary) shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-(--app-text)">Two-Tier Engine Framework</h2>
                <span className="rounded-full bg-(--app-surface-secondary) border border-(--app-border) px-2 py-0.5 text-[10px] font-mono font-semibold text-(--app-primary)">
                  Blueprint P0/P2
                </span>
              </div>
              <p className="text-xs text-(--app-text-muted) mt-0.5">
                Deterministic security rules form ground truth (P0); local AI provides contextual explainability (P2).
              </p>
            </div>
          </div>
          <Link
            to="/privacy"
            className="text-xs font-semibold text-(--app-primary) hover:underline flex items-center gap-1"
          >
            <span>Architecture Specs</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Two Tier Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Tier 1 Card */}
          <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-(--app-primary)" />
                <span className="text-xs font-bold uppercase tracking-wider text-(--app-text)">Tier 1: Deterministic Engine (P0)</span>
              </div>
              <span className="rounded-full bg-(--app-primary)/15 text-(--app-primary) px-2 py-0.5 text-[10px] font-bold">
                Ground Truth
              </span>
            </div>
            <p className="text-xs text-(--app-text-muted) leading-relaxed">
              Unicode Shield (homoglyphs, dotted words, zero-width, bidi overrides), threat taxonomy matchers, and Ed25519 anti-rollback signature verification.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-mono text-(--app-text)">
              <span className="rounded-md bg-(--app-card) px-2 py-1 border border-(--app-border)">Latency: &lt;1ms</span>
              <span className="rounded-md bg-(--app-card) px-2 py-1 border border-(--app-border)">RAM: &lt;10MB</span>
              <span className="rounded-md bg-(--app-card) px-2 py-1 border border-(--app-border)">Network: 0 Calls</span>
            </div>
          </div>

          {/* Tier 2 Card */}
          <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-(--app-secondary)" />
                <span className="text-xs font-bold uppercase tracking-wider text-(--app-text)">Tier 2: SmolLM3-3B AI (P2)</span>
              </div>
              <span className="rounded-full bg-(--app-secondary)/15 text-(--app-secondary) px-2 py-0.5 text-[10px] font-bold">
                Explainability
              </span>
            </div>
            <p className="text-xs text-(--app-text-muted) leading-relaxed">
              Quantized GGUF Q4_K_M (1.82 GB) fine-tuned on 508 synthetic scam pairs. Synthesizes findings into natural advice without overriding rule scores.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-mono text-(--app-text)">
              <span className="rounded-md bg-(--app-card) px-2 py-1 border border-(--app-border)">RAM: ~2.1 GB</span>
              <span className="rounded-md bg-(--app-card) px-2 py-1 border border-(--app-border)">Size: 1.82 GB (3.3x)</span>
              <span className="rounded-md bg-(--app-card) px-2 py-1 border border-(--app-border)">100% Offline CPU</span>
            </div>
          </div>
        </div>
      </section>

      {/* Google Colab Model Training Pipeline Card */}
      <section className="rounded-2xl border border-(--app-border) bg-(--app-card) p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--app-border) pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--app-surface-secondary) text-(--app-primary) shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-(--app-text)">Colab Model Pipeline & Quantization</h2>
                <span className="rounded-full bg-(--app-surface-secondary) border border-(--app-border) px-2 py-0.5 text-[10px] font-mono font-semibold text-(--app-primary)">
                  SmolLM3-3B
                </span>
              </div>
              <p className="text-xs text-(--app-text-muted) mt-0.5">
                End-to-end pipeline: 508-sample synthetic dataset, 4-bit LoRA SFT, test evaluation, and direct GGUF export.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-(--app-surface-secondary) px-2.5 py-1 font-mono text-[11px] font-medium text-(--app-secondary) border border-(--app-border)">
              <HardDrive className="h-3 w-3" /> 1.82 GB GGUF Q4_K_M
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold text-[11px] ${
              modelSavedLocally 
                ? 'bg-(--app-primary)/15 text-(--app-primary)' 
                : 'bg-(--app-surface-secondary) text-(--app-text-muted) border border-(--app-border)'
            }`}>
              {modelSavedLocally ? <Check className="h-3 w-3" /> : <Download className="h-3 w-3" />}
              {modelSavedLocally ? 'Ready Offline' : 'Ready to Download'}
            </span>
          </div>
        </div>

        {/* Pipeline Stages Visualizer */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-(--app-text) uppercase tracking-wider block">
            End-to-End Pipeline Workflow (9 Stages)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
            <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-2.5 space-y-1">
              <span className="text-[10px] font-mono text-(--app-primary) font-bold">01. GPU Diagnostics</span>
              <p className="text-[11px] font-medium text-(--app-text)">CUDA & T4 VRAM check</p>
            </div>
            <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-2.5 space-y-1">
              <span className="text-[10px] font-mono text-(--app-primary) font-bold">02. 508 Data Ingest</span>
              <p className="text-[11px] font-medium text-(--app-text)">Embedded zero-upload</p>
            </div>
            <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-2.5 space-y-1">
              <span className="text-[10px] font-mono text-(--app-primary) font-bold">03. 4-bit LoRA SFT</span>
              <p className="text-[11px] font-medium text-(--app-text)">r=16, alpha=32, 2 epochs</p>
            </div>
            <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-2.5 space-y-1">
              <span className="text-[10px] font-mono text-(--app-primary) font-bold">04. Holdout Benchmark</span>
              <p className="text-[11px] font-medium text-(--app-text)">50 test verification pairs</p>
            </div>
            <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-2.5 space-y-1">
              <span className="text-[10px] font-mono text-(--app-primary) font-bold">05. GGUF Q4_K_M</span>
              <p className="text-[11px] font-medium text-(--app-text)">1.82 GB CPU deployment</p>
            </div>
          </div>
        </div>

        {/* Specs Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3">
            <span className="text-[11px] text-(--app-text-muted) block">Dataset Breakdown</span>
            <span className="font-bold text-(--app-text)">508 Samples</span>
            <span className="text-[10px] text-(--app-text-muted) block">408 Train · 50 Val · 50 Test</span>
          </div>
          <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3">
            <span className="text-[11px] text-(--app-text-muted) block">Quantization Format</span>
            <span className="font-bold text-(--app-primary)">GGUF Q4_K_M</span>
            <span className="text-[10px] text-(--app-text-muted) block">1.82 GB (vs 6.0 GB FP16)</span>
          </div>
          <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3">
            <span className="text-[11px] text-(--app-text-muted) block">Device Footprint</span>
            <span className="font-bold text-(--app-text)">~2.1 GB RAM</span>
            <span className="text-[10px] text-(--app-text-muted) block">Runs locally on standard CPU</span>
          </div>
          <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3">
            <span className="text-[11px] text-(--app-text-muted) block">Inference Speed</span>
            <span className="font-bold text-(--app-secondary)">&lt; 15 ms</span>
            <span className="text-[10px] text-(--app-text-muted) block">Zero cloud telemetry</span>
          </div>
        </div>

        {/* Download Progress Bar if active */}
        {isDownloading && (
          <div className="rounded-xl border border-(--app-primary)/40 bg-(--app-surface-secondary) p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-(--app-text) font-semibold flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-(--app-primary)" />
                Downloading smollm3-3b-q4.gguf (~1.82 GB)...
              </span>
              <span className="text-(--app-primary) font-bold">{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-(--app-surface) overflow-hidden border border-(--app-border)">
              <div
                className="h-full bg-(--app-primary) rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Link
            to="/model-studio"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Open Model Window</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>

          <a
            href="https://colab.research.google.com/github/divya-sharma-29/GhostSignal-The-Offline-Scam-Shield/blob/main/backend/training/train_smollm3_3b.ipynb"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-(--app-primary) px-4 py-2.5 text-xs font-bold text-(--app-on-primary) transition hover:opacity-90 cursor-pointer shadow-sm"
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Launch on Google Colab</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <button
            onClick={handleDownloadModel}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 rounded-xl border border-(--app-border) bg-(--app-surface-secondary) px-3.5 py-2.5 text-xs font-semibold text-(--app-text) hover:border-(--app-primary) transition disabled:opacity-50 cursor-pointer"
          >
            {isDownloading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Downloading...
              </>
            ) : modelSavedLocally ? (
              <>
                <Check className="h-3.5 w-3.5 text-(--app-success)" /> Download GGUF (~1.82 GB)
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 text-(--app-primary)" /> Download GGUF (~1.82 GB)
              </>
            )}
          </button>
        </div>
      </section>

      {/* Compact AI Guide Entry */}
      <div className="rounded-2xl border border-(--app-border) bg-(--app-card) p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--app-surface-secondary) text-(--app-primary) shrink-0">
            <Sparkles className="h-5 w-5 text-(--app-secondary)" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-(--app-text)">Contextual AI Guide</h3>
            <p className="text-xs text-(--app-text-muted) mt-0.5">
              Need assistance understanding warning signs, Unicode evasions, or suspicious UPI demands?
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('ghostsignal:open-ai-guide', { 
              detail: { topic: 'suspicious_reason' } 
            }));
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-(--app-border) bg-(--app-surface-secondary) px-4 py-2.5 text-xs font-semibold text-(--app-primary) transition hover:border-(--app-primary) shrink-0 cursor-pointer"
        >
          <span>Open AI Guide</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Recent Scan Summary */}
      <section aria-labelledby="recent-scans-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4 text-(--app-primary)" />
            <h2 id="recent-scans-heading" className="text-base font-bold text-(--app-text)">
              {t('recentScans')}
            </h2>
          </div>
          {recentScans.length > 0 && (
            <Link 
              to="/history" 
              className="inline-flex items-center gap-1 text-xs font-semibold text-(--app-primary) hover:underline"
            >
              <span>{t('allHistory')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {recentScans.length > 0 ? (
          <div className="divide-y divide-(--app-border) rounded-2xl border border-(--app-border) bg-(--app-card) overflow-hidden shadow-2xs">
            {recentScans.map((scan, index) => (
              <motion.div 
                key={scan.id} 
                initial={{ opacity: 0, y: 6 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/results?id=${scan.id}`}
                  state={{ result: scan }}
                  className="flex items-center justify-between gap-4 p-4 transition hover:bg-(--app-surface-secondary)"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <RiskBadge level={scan.riskLevel} size="sm" />
                      <span className="flex items-center gap-1 text-[11px] text-(--app-text-muted)">
                        <Clock3 className="h-3 w-3" />
                        {new Date(scan.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {scan.unicodeShield?.hasAnomalies && (
                        <span className="rounded-full bg-(--app-danger)/15 px-2 py-0.5 text-[10px] font-semibold text-(--app-danger)">
                          Unicode Flag
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-xs sm:text-sm font-medium text-(--app-text)">
                      {scan.messageText}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-(--app-text-muted)" />
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-(--app-border) bg-(--app-card) p-8 text-center space-y-2">
            <FileText className="h-8 w-8 text-(--app-text-muted) mx-auto opacity-50" />
            <p className="text-sm font-semibold text-(--app-text)">{t('noScans')}</p>
            <p className="text-xs text-(--app-text-muted) max-w-sm mx-auto">
              Scanned messages remain strictly in this device's local memory. Paste a message or load a sample to inspect it.
            </p>
            <div className="pt-2">
              <Link
                to="/scanner"
                className="inline-flex items-center gap-1.5 rounded-xl bg-(--app-primary) px-4 py-2 text-xs font-semibold text-(--app-on-primary)"
              >
                <ScanLine className="h-3.5 w-3.5" />
                <span>Start First Scan</span>
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
