/**
 * Vercel Domains API.
 *
 * Attaching a domain to the project is what makes Vercel issue a certificate
 * and route the host to us. Without it a correct DNS record still lands on a
 * Vercel edge that has no idea which project the domain belongs to.
 *
 * Every call reports a typed result instead of throwing: a registrar problem
 * is something the customer has to fix, so it has to reach the UI as a
 * message rather than a 500.
 */

const API = 'https://api.vercel.com';

export type DomainOperation =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'taken' | 'invalid' | 'failed'; message: string };

export interface DomainStatus {
  /** Attached to the Vercel project at all. */
  attached: boolean;
  /** DNS resolves to Vercel and the certificate is issued. */
  verified: boolean;
  /** What Vercel says is still missing, for display. */
  pending: string[];
}

function credentials(): { token: string; projectId: string; teamId?: string } | null {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return null;
  return { token, projectId, teamId: process.env.VERCEL_TEAM_ID || undefined };
}

/** Whether the operator has wired up the API, so the UI can say so up front. */
export function isDomainApiConfigured(): boolean {
  return credentials() !== null;
}

function withTeam(path: string, teamId?: string): string {
  if (!teamId) return `${API}${path}`;
  const separator = path.includes('?') ? '&' : '?';
  return `${API}${path}${separator}teamId=${encodeURIComponent(teamId)}`;
}

interface ApiError {
  code?: string;
  message?: string;
}

type CallResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: ApiError };

async function call<T>(
  path: string,
  init: RequestInit & { teamId?: string; token: string }
): Promise<CallResult<T>> {
  const { token, teamId, ...rest } = init;

  const response = await fetch(withTeam(path, teamId), {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    // These calls sit in a request path the customer is waiting on.
    signal: AbortSignal.timeout(15_000),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: (body as { error?: ApiError }).error ?? {},
    };
  }

  return { ok: true, data: body as T };
}

export async function attachDomain(domain: string): Promise<DomainOperation> {
  const creds = credentials();
  if (!creds) {
    return {
      ok: false,
      reason: 'not-configured',
      message:
        'Integrasi domain belum diaktifkan. Hubungi dukungan untuk mengaktifkan domain kustom.',
    };
  }

  const result = await call<unknown>(`/v10/projects/${creds.projectId}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name: domain }),
    token: creds.token,
    teamId: creds.teamId,
  }).catch((error) => {
    console.error('[domain] attach failed:', error);
    return { ok: false as const, status: 0, error: {} as ApiError };
  });

  if (result.ok) return { ok: true };

  const code = result.error.code ?? '';

  // Already attached to this project is the state we wanted, not a failure.
  if (code === 'domain_already_in_use_by_this_project') return { ok: true };

  if (code === 'domain_already_in_use' || result.status === 409) {
    return {
      ok: false,
      reason: 'taken',
      message: 'Domain ini sudah dipakai di proyek lain. Lepaskan dulu dari proyek tersebut.',
    };
  }

  if (code === 'invalid_domain' || result.status === 400) {
    return { ok: false, reason: 'invalid', message: 'Format domain tidak valid.' };
  }

  console.error('[domain] attach failed:', result.status, result.error);
  return {
    ok: false,
    reason: 'failed',
    message: result.error.message ?? 'Gagal menghubungkan domain. Coba lagi nanti.',
  };
}

export async function removeDomain(domain: string): Promise<DomainOperation> {
  const creds = credentials();
  // Nothing was ever attached, so there is nothing to undo.
  if (!creds) return { ok: true };

  const result = await call<unknown>(
    `/v9/projects/${creds.projectId}/domains/${encodeURIComponent(domain)}`,
    { method: 'DELETE', token: creds.token, teamId: creds.teamId }
  ).catch((error) => {
    console.error('[domain] remove failed:', error);
    return { ok: false as const, status: 0, error: {} as ApiError };
  });

  // A domain that is not there is the outcome the caller wanted.
  if (result.ok || result.status === 404) return { ok: true };

  return {
    ok: false,
    reason: 'failed',
    message: result.error.message ?? 'Gagal melepas domain.',
  };
}

interface VercelDomainConfig {
  misconfigured?: boolean;
}

interface VercelProjectDomain {
  verified?: boolean;
  verification?: { type: string; domain: string; value: string; reason: string }[];
}

export async function getDomainStatus(domain: string): Promise<DomainStatus> {
  const creds = credentials();
  if (!creds) return { attached: false, verified: false, pending: [] };

  const [projectDomain, config] = await Promise.all([
    call<VercelProjectDomain>(
      `/v9/projects/${creds.projectId}/domains/${encodeURIComponent(domain)}`,
      { method: 'GET', token: creds.token, teamId: creds.teamId }
    ).catch(() => ({ ok: false as const, status: 0, error: {} })),
    call<VercelDomainConfig>(
      `/v6/domains/${encodeURIComponent(domain)}/config`,
      { method: 'GET', token: creds.token, teamId: creds.teamId }
    ).catch(() => ({ ok: false as const, status: 0, error: {} })),
  ]);

  if (!projectDomain.ok) return { attached: false, verified: false, pending: [] };

  const pending = (projectDomain.data.verification ?? []).map(
    (entry) => `${entry.type} ${entry.domain} → ${entry.value}`
  );

  // Vercel reports ownership (`verified`) and DNS (`misconfigured`) separately;
  // the domain only actually serves traffic when both are satisfied.
  const dnsOk = config.ok ? config.data.misconfigured !== true : false;

  return {
    attached: true,
    verified: projectDomain.data.verified !== false && dnsOk,
    pending,
  };
}
