/** Same-origin backend calls. Scanning remains local unless a user explicitly chooses server analysis. */
export interface SecurityEngineStatus {
  rulesVersion?: string;
  lastSuccessfulUpdate?: string | null;
  verificationStatus: string;
  updateAvailable: boolean;
}

export interface BackendScanResult {
  id: string;
  timestamp: string;
  scan_type: string;
  message_text: string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNASSESSED';
  risk_score: number;
  threats: Array<{ category: string; title: string; phrase: string; explanation: string; why_suspicious: string }>;
  reasons: string[];
  recommendations: string[];
  unicode_findings: Array<{ kind: string; text: string; explanation: string; code_points?: string[]; scripts?: string[] }>;
  normalized_for_analysis: string;
  rule_version: string;
  ai_status: string;
  extracted_text?: string;
  assessed?: boolean;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json() as Promise<T>;
}

async function errorMessage(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null) as { detail?: string; message?: string } | null;
  return payload?.detail ?? payload?.message ?? `Backend request failed (${response.status})`;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json() as Promise<T>;
}

async function upload<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(path, { method: 'POST', credentials: 'same-origin', body: form });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json() as Promise<T>;
}

export const api = {
  getSecurityStatus: () => getJson<SecurityEngineStatus>('/api/security/status'),
  scanText: (text: string, language = 'English') => postJson<BackendScanResult>('/api/scan/text', { text, language }),
  scanUrl: (url: string) => postJson<{ url: string; risk_level: string; risk_score: number; reasons: string[] }>('/api/scan/url', { url }),
  scanImage: (file: File) => upload<BackendScanResult>('/api/scan/image', file),
  getHistory: () => getJson<{ items: Array<{ id: string; scan_type: string; risk_level: string; risk_score: number; timestamp: string; rule_version: string }> }>('/api/history'),
  clearHistory: () => fetch('/api/history', { method: 'DELETE', credentials: 'same-origin' }).then(async (response) => {
    if (!response.ok) throw new Error(`Backend request failed (${response.status})`);
    return response.json() as Promise<{ deleted: number }>;
  }),
};
