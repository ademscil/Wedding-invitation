/**
 * Custom domain handling.
 *
 * The host header decides which invitation a request resolves to, so the rules
 * here are security-relevant: a value that slips through becomes a tenant
 * lookup key, and a domain accepted twice would let one customer's invitation
 * answer on another's address.
 */

/** Hosts that belong to the platform itself and can never be a customer's. */
function platformHosts(): string[] {
  const hosts = new Set<string>(['localhost', '127.0.0.1', '0.0.0.0']);

  for (const value of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  ]) {
    if (!value) continue;
    try {
      hosts.add(new URL(value).hostname.toLowerCase());
    } catch {
      // A malformed URL in the environment must not take the site down; the
      // remaining entries still identify the platform.
      hosts.add(value.replace(/^https?:\/\//, '').split('/')[0].toLowerCase());
    }
  }

  return [...hosts];
}

/**
 * Strips the port and lowercases, which is all a Host header needs before it
 * can be compared. IPv6 literals keep their brackets and are rejected later.
 */
export function normalizeHost(host: string | null | undefined): string {
  if (!host) return '';
  const trimmed = host.trim().toLowerCase();
  if (trimmed.startsWith('[')) return trimmed.split(']')[0] + ']';
  return trimmed.split(':')[0];
}

/**
 * Whether a request on this host should be resolved as a customer's domain
 * rather than served by the app's own routes.
 */
export function isCustomHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;

  // Preview deployments are the platform, not a customer.
  if (normalized.endsWith('.vercel.app')) return false;

  return !platformHosts().includes(normalized);
}

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Normalises what a customer typed into the bare hostname we store, or null
 * when it is not a domain we can serve.
 *
 * Accepts a pasted URL, because "copy the address bar" is what people do.
 */
export function normalizeCustomDomain(input: string | null | undefined): string | null {
  if (!input) return null;

  let value = input.trim().toLowerCase();
  if (value === '') return null;

  // Tolerate a pasted URL or a trailing path.
  value = value.replace(/^https?:\/\//, '');
  value = value.split('/')[0];
  value = value.split('?')[0];
  value = value.split('@').pop() ?? value;
  value = value.split(':')[0];
  // A trailing dot is a valid FQDN but not what Vercel stores.
  value = value.replace(/\.$/, '');

  if (value === '') return null;
  if (value.length > 253) return null;

  const labels = value.split('.');
  // A bare label is a hostname, not a domain anyone can point at us.
  if (labels.length < 2) return null;
  if (!labels.every((label) => LABEL.test(label))) return null;

  // The last label is the TLD; an all-numeric one means this is an IP address.
  if (/^\d+$/.test(labels[labels.length - 1])) return null;

  return value;
}

/** Reserved suffixes a customer must not be able to claim. */
const RESERVED_SUFFIXES = ['vercel.app', 'vercel.sh', 'now.sh'];

export function isReservedDomain(domain: string): boolean {
  const platform = platformHosts();
  if (platform.includes(domain)) return true;
  if (platform.some((host) => host !== '' && domain.endsWith(`.${host}`))) {
    return true;
  }
  return RESERVED_SUFFIXES.some(
    (suffix) => domain === suffix || domain.endsWith(`.${suffix}`)
  );
}

/** True for `wedding.example.com`, false for `example.com`. */
export function isSubdomain(domain: string): boolean {
  return domain.split('.').length > 2;
}

export interface DnsRecord {
  type: 'A' | 'CNAME';
  name: string;
  value: string;
}

/**
 * The record the customer has to create at their registrar.
 *
 * An apex domain cannot hold a CNAME, so it gets Vercel's A record; anything
 * deeper gets the CNAME, which survives Vercel changing its IP.
 */
export function requiredDnsRecord(domain: string): DnsRecord {
  if (isSubdomain(domain)) {
    return {
      type: 'CNAME',
      name: domain.split('.')[0],
      value: 'cname.vercel-dns.com',
    };
  }

  return { type: 'A', name: '@', value: '76.76.21.21' };
}
