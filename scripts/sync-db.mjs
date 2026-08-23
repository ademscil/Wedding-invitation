/**
 * Brings the database in line with prisma/schema.prisma during a deploy.
 *
 * Vercel only runs `prisma generate`, which regenerates the client but never
 * touches the database. A deploy that adds a column therefore ships code
 * querying a column the database does not have, and every page using that
 * model fails at runtime — with a green build, because nothing was wrong with
 * the build. That is exactly how `customDomainVerifiedAt` took the dashboard
 * down.
 *
 * Rather than `prisma db push --accept-data-loss`, which waives Prisma's
 * safety check for every future deploy, this computes the delta first and
 * applies it only when it cannot lose anything. A destructive change stops the
 * deploy and prints the SQL, so a person decides instead of a build script.
 */

import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const url = process.env.DATABASE_URL;

// Local builds, and preview builds without a database, are left alone: the
// sync is only meaningful where there is something to sync against.
const shouldSync = Boolean(url) && (process.env.VERCEL || process.env.FORCE_DB_SYNC);

if (!shouldSync) {
  console.log(
    url
      ? '[db] Skipping schema sync (set FORCE_DB_SYNC=1 to run it outside Vercel).'
      : '[db] Skipping schema sync: DATABASE_URL is not set.'
  );
  process.exit(0);
}

function run(args, options = {}) {
  return spawnSync('npx', ['prisma', ...args], {
    encoding: 'utf8',
    env: process.env,
    ...options,
  });
}

console.log('[db] Comparing the database against schema.prisma…');

const diff = run([
  'migrate',
  'diff',
  '--from-config-datasource',
  '--to-schema',
  'prisma/schema.prisma',
  '--script',
]);

if (diff.status !== 0) {
  console.error('[db] Could not read the database schema.');
  console.error(diff.stderr || diff.stdout);
  process.exit(1);
}

// Prisma prints its config banner on stdout too; only SQL matters here.
const sql = diff.stdout
  .split('\n')
  .filter((line) => !line.startsWith('Loaded Prisma config') && !line.startsWith('◇'))
  .join('\n')
  .trim();

if (sql === '' || sql === '-- This is an empty migration.') {
  console.log('[db] Schema is already up to date.');
  process.exit(0);
}

/*
 * Statements that can destroy data that is already there. Dropping an index or
 * a constraint is not on this list: it changes what the database enforces, not
 * what it stores.
 */
const DESTRUCTIVE = [
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+COLUMN\b/i,
  /\bDROP\s+SCHEMA\b/i,
  /\bDROP\s+DATABASE\b/i,
  /\bTRUNCATE\b/i,
  // A narrowing type change silently truncates values.
  /\bSET\s+DATA\s+TYPE\b/i,
];

const destructive = DESTRUCTIVE.filter((pattern) => pattern.test(sql));

if (destructive.length > 0) {
  console.error(
    '\n[db] Refusing to apply this change automatically — it can destroy data ' +
      'that is already in the database:\n'
  );
  console.error(sql);
  console.error(
    '\n[db] Review it, then apply it yourself with `npx prisma db push`. ' +
      'The deploy is stopped so the decision stays with a person.\n'
  );
  process.exit(1);
}

console.log('[db] Applying additive changes:\n');
console.log(sql);

const scriptPath = join(mkdtempSync(join(tmpdir(), 'wedinvite-db-')), 'sync.sql');
writeFileSync(scriptPath, sql);

try {
  const apply = run(['db', 'execute', '--file', scriptPath], { stdio: 'inherit' });

  if (apply.status !== 0) {
    console.error(
      '\n[db] Schema sync failed. The deploy stops here on purpose: shipping ' +
        'code against a schema the database does not have breaks the app at ' +
        'runtime instead of at build time.'
    );
    process.exit(apply.status ?? 1);
  }
} finally {
  try {
    unlinkSync(scriptPath);
  } catch {
    // A leftover file in the build's temp directory is not worth failing over.
  }
}

console.log('\n[db] Schema is up to date.');
