// src/server/youthEvents.ts
// Keep source-backed discoveries separate from clearly labeled prototype listings.
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import type { Express, Request, Response } from 'express';
import Parser from 'rss-parser';
import { SAMPLE_YOUTH_DIRECTORY } from '../data/youthDirectory.ts';
import type { YouthDiscoveryItem } from '../types.ts';

export interface FeedSource {
  name: string;
  url: string;
  county: 'king' | 'snohomish';
  city: string;
}

export function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

const text = (value: unknown, max = 1000) => typeof value === 'string'
  ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';

export function normalizeFeedItems(items: Parser.Item[], source: FeedSource): YouthDiscoveryItem[] {
  return items.flatMap(item => {
    const name = text(item.title, 200);
    const description = text(item.contentSnippet || item.content || (item as Record<string, unknown>).description);
    const content = `${name} ${description}`;
    if (!name || !/\b(youth|teens?|children|kids|storytime|tutoring|open gym)\b/i.test(content)) return [];
    const reportedFree = /\b(free (?:admission|entry|event)|admission (?:is )?free|no admission (?:fee|charge))\b/i.test(content)
      && !/(?:\$\s*\d|\b(?:paid|fee required)\b)/i.test(content);
    const type: YouthDiscoveryItem['type'] = /\b(stem|robotics|coding|lego)\b/i.test(content) ? 'maker_space'
      : /\b(art|arts|crafts?|music)\b/i.test(content) ? 'arts_culture'
      : /\b(sports?|gym|swim|hike)\b/i.test(content) ? 'sports_rec'
      : /\b(library|storytime|books?)\b/i.test(content) ? 'teen_room' : 'youth_center';
    const extras = item as Record<string, unknown>;
    const rawLat = extras['geo:lat'];
    const rawLng = extras['geo:long'];
    const lat = typeof rawLat === 'string' && rawLat.trim() ? Number(rawLat) : NaN;
    const lng = typeof rawLng === 'string' && rawLng.trim() ? Number(rawLng) : NaN;
    const located = Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lng) && Math.abs(lng) <= 180;
    return [{
      id: 'feed-' + createHash('sha256').update(`${source.url}|${item.guid || item.link || `${name}|${item.pubDate || ''}`}`).digest('hex').slice(0, 24),
      name, description, type, county: source.county, city: source.city,
      freeDetails: reportedFree ? 'Source reports free admission. Confirm eligibility and dates with the organizer.' : 'Admission cost is not confirmed. Check the organizer.',
      costStatus: reportedFree ? 'reported_free' : 'unknown',
      verifiedFree: false, isSample: false, sourceName: source.name,
      ageGroup: 'Check organizer age requirements', address: source.city,
      lat: located ? lat : null, lng: located ? lng : null,
      transitAccess: 'Check transit service before traveling',
      scheduleOrDate: 'See organizer for event date and hours', publishedAt: item.pubDate,
      scoutPoints: 0, tags: ['Youth', source.name], contactOrLink: safeHttpUrl(item.link),
    }];
  });
}

export function validateDiscovery(value: unknown): value is YouthDiscoveryItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as YouthDiscoveryItem;
  return typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 256
    && typeof item.name === 'string' && item.name.length > 0 && item.name.length <= 200
    && ['king', 'snohomish', 'other'].includes(item.county)
    && ['youth_center', 'free_event', 'teen_room', 'maker_space', 'sports_rec', 'arts_culture'].includes(item.type)
    && ['city', 'description', 'freeDetails', 'ageGroup', 'address', 'transitAccess', 'scheduleOrDate'].every(key => typeof item[key] === 'string' && item[key].length <= 2000)
    && Array.isArray(item.tags) && item.tags.length <= 20 && item.tags.every(tag => typeof tag === 'string' && tag.length <= 200)
    && (item.lat === null && item.lng === null || typeof item.lat === 'number' && Number.isFinite(item.lat) && Math.abs(item.lat) <= 90 && typeof item.lng === 'number' && Number.isFinite(item.lng) && Math.abs(item.lng) <= 180);
}

export class YouthEventStore {
  private records = new Map<string, YouthDiscoveryItem>();
  private writes: Promise<void> = Promise.resolve();
  constructor(private file?: string) {}
  async load() {
    if (!this.file) return;
    try {
      const values: unknown = JSON.parse(await readFile(this.file, 'utf8'));
      if (!Array.isArray(values) || !values.every(validateDiscovery)) throw new Error('Invalid discovery data file');
      this.records = new Map(values.slice(-2000).map(item => [item.id, item]));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  all() { return [...this.records.values()]; }
  async upsert(items: YouthDiscoveryItem[]) {
    const update = async () => {
      const next = new Map(this.records);
      for (const item of items) next.set(item.id, { ...item, contactOrLink: safeHttpUrl(item.contactOrLink), verifiedFree: false, isSample: false, scoutPoints: 0 });
      while (next.size > 2000) next.delete(next.keys().next().value!);
      if (this.file) {
        await mkdir(path.dirname(this.file), { recursive: true });
        await writeFile(this.file + '.tmp', JSON.stringify([...next.values()], null, 2));
        await rename(this.file + '.tmp', this.file);
      }
      this.records = next;
    };
    const result = this.writes.then(update);
    this.writes = result.catch(() => {});
    await result;
  }
}

export async function createYouthEventStore() {
  const store = new YouthEventStore(process.env.HOPSCOUT_DATA_FILE || path.resolve('data/youth-events.json'));
  await store.load();
  // Import a configured legacy database without inventing geographic coordinates.
  if (process.env.SQL_HOST) {
    try {
      const { db } = await import('../db/index.ts');
      const { youthEvents } = await import('../db/schema.ts');
      const rows = await db.select().from(youthEvents);
      const imported = rows.map(row => ({
        id: row.id, name: row.name, description: row.description, type: 'youth_center' as const,
        county: row.county as YouthDiscoveryItem['county'], city: row.city, tags: row.tags || [],
        ageGroup: 'Check organizer', address: row.city, lat: null, lng: null,
        freeDetails: 'Admission cost is not confirmed. Check the organizer.', verifiedFree: false,
        transitAccess: 'Check transit service', scheduleOrDate: 'See organizer for event date',
        contactOrLink: safeHttpUrl(row.link), scoutPoints: 0,
      })).filter(validateDiscovery).filter(item => !store.all().some(saved => saved.id === item.id));
      if (imported.length) await store.upsert(imported);
    } catch { console.warn('Legacy youth database unavailable; using the local discovery store.'); }
  }
  return store;
}

export function searchDiscoveries(items: YouthDiscoveryItem[], filters: Record<string, unknown>) {
  const query = text(filters.query, 200).toLowerCase();
  const city = text(filters.city, 200).toLowerCase();
  return items.filter(item => (!filters.county || filters.county === 'all' || item.county === filters.county)
    && (!filters.category || filters.category === 'all' || (filters.category === 'free_event' ? item.costStatus === 'reported_free' : item.type === filters.category))
    && (!city || item.city.toLowerCase().includes(city))
    && (!query || [item.name, item.description, item.city, ...item.tags].join(' ').toLowerCase().includes(query)));
}

export function registerYouthRoutes(app: Express, store: YouthEventStore, ingestToken = process.env.HOPSCOUT_INGEST_TOKEN) {
  app.post('/api/youth-events/search', (req, res) => {
    const sourceItems = store.all();
    const allItems = sourceItems.length ? sourceItems : SAMPLE_YOUTH_DIRECTORY;
    const items = searchDiscoveries(allItems, req.body || {});
    res.json({ success: true, count: items.length, items, sampleMode: !sourceItems.length });
  });
  app.get('/api/youth-events/db', (_req, res) => res.json({ success: true, items: store.all() }));
  app.get('/api/places/nearby', (_req, res) => res.json({ success: true, pois: store.all().filter(item => item.lat !== null && item.lng !== null) }));
  app.post('/api/youth-events/batch', async (req: Request, res: Response) => {
    if (!ingestToken) return res.status(503).json({ error: true, message: 'Feed ingestion is not configured.' });
    const provided = Buffer.from(req.get('authorization') || '');
    const expected = Buffer.from(`Bearer ${ingestToken}`);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return res.status(401).json({ error: true, message: 'Unauthorized' });
    const events: unknown = req.body?.events;
    if (!Array.isArray(events) || !events.length || events.length > 200 || !events.every(validateDiscovery)) return res.status(400).json({ error: true, message: 'Expected 1–200 valid discoveries.' });
    try {
      await store.upsert(events);
      return res.json({ success: true, count: events.length });
    } catch {
      return res.status(500).json({ error: true, message: 'Could not save discoveries.' });
    }
  });
}

export function configuredFeeds(raw = process.env.HOPSCOUT_FEEDS || '[]'): FeedSource[] {
  const sources: unknown = JSON.parse(raw);
  if (!Array.isArray(sources) || sources.length > 10 || !sources.every(source => source && typeof source.name === 'string' && typeof source.city === 'string' && ['king', 'snohomish'].includes(source.county) && safeHttpUrl(source.url)?.startsWith('https:'))) throw new Error('HOPSCOUT_FEEDS must contain at most 10 named HTTPS RSS/Atom sources with county and city.');
  return sources;
}

export async function collectFeeds(sources: FeedSource[], fetcher: typeof fetch = fetch) {
  const parser = new Parser({ customFields: { item: ['description', 'geo:lat', 'geo:long'] } });
  const items: YouthDiscoveryItem[] = [];
  const failures: string[] = [];
  for (const source of sources) {
    try {
      const response = await fetcher(source.url, { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml', 'User-Agent': 'HopScout/1.0' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Empty response');
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 2_000_000) { await reader.cancel(); throw new Error('Feed too large'); }
        chunks.push(chunk.value);
      }
      const feed = await parser.parseString(Buffer.concat(chunks).toString('utf8'));
      items.push(...normalizeFeedItems(feed.items.slice(0, 500), source));
    } catch { failures.push(source.name); }
  }
  const unique = new Map<string, YouthDiscoveryItem>();
  for (const item of items) if (!unique.has(item.id)) unique.set(item.id, item);
  return { items: [...unique.values()], failures };
}

export function startFeedPolling(store: YouthEventStore) {
  let sources: FeedSource[];
  try { sources = configuredFeeds(); } catch (error) { console.error((error as Error).message); return () => {}; }
  if (!sources.length) return () => {};
  let busy = false;
  let stopped = false;
  const poll = async () => {
    if (busy || stopped) return;
    busy = true;
    try {
      const result = await collectFeeds(sources);
      if (result.items.length && !stopped) await store.upsert(result.items);
      if (result.failures.length) console.warn('Youth feeds unavailable:', result.failures.join(', '));
    } catch { console.error('Youth feed persistence failed.'); } finally { busy = false; }
  };
  void poll();
  const timer = setInterval(poll, 15 * 60 * 1000);
  timer.unref();
  return () => { stopped = true; clearInterval(timer); };
}
