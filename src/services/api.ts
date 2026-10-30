/** Same-origin backend calls. Scanning remains local unless a user explicitly chooses server analysis. */
export interface SecurityEngineStatus {
  rulesVersion?: string;
  lastSuccessfulUpdate?: string | null;
  verificationStatus: string;
  updateAvailable: boolean;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Backend request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export const api = {
  getSecurityStatus: () => getJson<SecurityEngineStatus>('/api/security/status'),
};
