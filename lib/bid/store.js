// Storage adapter for the bid board.
// Uses Vercel KV when configured; otherwise falls back to in-memory (demo mode).
// Data model is intentionally simple: we persist an array of entries under one key.
// For low write volume this is acceptable and easy to port to another store later.
import { nanoid } from 'nanoid';

let kvClient = null;
let liveStore = false;

async function getKv() {
  if (kvClient !== null) return kvClient;
  const hasKv =
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
  if (!hasKv) {
    kvClient = undefined;
    liveStore = false;
    return kvClient;
  }
  try {
    // Lazy import to avoid bundling when unused
    const { kv } = await import('@vercel/kv');
    kvClient = kv;
    liveStore = true;
  } catch {
    kvClient = undefined;
    liveStore = false;
  }
  return kvClient;
}

const STORE_KEY = 'bid:entries:v1';

// In-memory fallback for local/dev without KV
const memory = {
  entries: null
};

function nowIso() {
  return new Date().toISOString();
}

export function getConfig() {
  return {
    storage: liveStore ? 'kv' : 'memory',
    maxEntries: Number(process.env.BID_MAX_ENTRIES || 50),
    takeoverPriceCents: Number(process.env.BID_TAKEOVER_PRICE_CENTS || 100000),
    minEnterCents: Number(process.env.BID_MIN_ENTER_CENTS || 10000)
  };
}

export async function readEntries() {
  const kv = await getKv();
  if (kv) {
    const stored = await kv.get(STORE_KEY);
    if (stored && Array.isArray(stored)) return stored;
    // Seed KV on first boot
    const seeded = seedEntries();
    await kv.set(STORE_KEY, seeded);
    return seeded;
  }
  if (!memory.entries) {
    memory.entries = seedEntries();
  }
  return memory.entries;
}

export async function writeEntries(next) {
  const kv = await getKv();
  if (kv) {
    await kv.set(STORE_KEY, next);
  }
  memory.entries = next;
}

export function seedEntries() {
  const created = nowIso();
  return [
    {
      id: nanoid(),
      url: 'https://supercompress.dev',
      title: 'SuperCompress',
      description: 'context compression for ai agents',
      bidCents: 50000,
      clicks: 0,
      createdAt: created,
      updatedAt: created
    },
    {
      id: nanoid(),
      url: 'https://trybeacon.ai',
      title: 'Beacon',
      description: 'ai bug tracker',
      bidCents: 25000,
      clicks: 0,
      createdAt: created,
      updatedAt: created
    },
    {
      id: nanoid(),
      url: 'https://coincell.run',
      title: 'CoinCell',
      description: 'personalized ai devices',
      bidCents: 10000,
      clicks: 0,
      createdAt: created,
      updatedAt: created
    }
  ];
}

export function normalizeUrlOrHandle(input) {
  if (!input) return '';
  const s = String(input).trim();
  if (s.startsWith('@')) {
    const handle = s.replace(/^@+/, '');
    return `@${handle.toLowerCase()}`;
  }
  // Prepend https if missing
  if (!/^https?:\/\//i.test(s)) {
    return `https://${s}`;
  }
  try {
    const u = new URL(s);
    // Normalize host casing and remove trailing slash
    u.hash = '';
    if (u.pathname !== '/' && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return s;
  }
}

export function externalUrlFor(input) {
  if (!input) return 'https://arjunshah.xyz';
  const s = String(input);
  if (s.startsWith('@')) {
    const handle = s.replace(/^@+/, '');
    return `https://x.com/${handle}`;
  }
  if (!/^https?:\/\//i.test(s)) return `https://${s}`;
  return s;
}

export function rankEntries(entries) {
  const sorted = [...entries].sort((a, b) => b.bidCents - a.bidCents);
  sorted.forEach((e, idx) => {
    e.rank = idx + 1;
    e.claimCents = e.bidCents + 100;
    e.claimLabel = formatUsd(e.claimCents);
    e.bidLabel = formatUsd(e.bidCents);
  });
  return sorted;
}

export function formatUsd(cents) {
  return `$${(cents / 100).toFixed(2).replace(/\\.00$/, '')}`;
}

export async function recordClick(id) {
  const entries = await readEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const copy = [...entries];
  copy[idx] = { ...copy[idx], clicks: (copy[idx].clicks || 0) + 1, updatedAt: nowIso() };
  await writeEntries(copy);
  return copy[idx];
}

export async function upsertListing({ url, title, description, email, bidCents }) {
  const normalized = normalizeUrlOrHandle(url);
  const entries = await readEntries();
  const existingIdx = entries.findIndex((e) => normalizeUrlOrHandle(e.url) === normalized);
  const now = nowIso();
  if (existingIdx !== -1) {
    const prev = entries[existingIdx];
    const next = { 
      ...prev, 
      title: title || prev.title, 
      description: description || prev.description,
      bidCents: Math.max(prev.bidCents, bidCents),
      updatedAt: now
    };
    const copy = [...entries];
    copy[existingIdx] = next;
    await writeEntries(copy);
    return next;
  }
  const created = {
    id: nanoid(),
    url,
    title,
    description,
    email: email || '',
    bidCents,
    clicks: 0,
    createdAt: now,
    updatedAt: now
  };
  await writeEntries([created, ...entries].slice(0, getConfig().maxEntries));
  return created;
}
