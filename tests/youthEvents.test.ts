// tests/youthEvents.test.ts
// Protect discovery truthfulness, filtering, persistence and authenticated ingestion.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';
import { collectFeeds, normalizeFeedItems, registerYouthRoutes, searchDiscoveries, YouthEventStore } from '../src/server/youthEvents.ts';

const source = { name: 'Fixture Library', url: 'https://library.example/feed.xml', county: 'snohomish' as const, city: 'Everett' };
const event = () => normalizeFeedItems([{ guid: 'teen-art', title: 'Teen art workshop', contentSnippet: 'Free admission for teens.' }], source)[0];

test('free WiFi and unrelated free content do not establish free youth admission', () => {
  const items = normalizeFeedItems([
    { title: 'Teen study session', contentSnippet: 'Free WiFi; admission $15.' },
    { title: 'Free parking meeting', contentSnippet: 'Planning for next year.' },
  ], source);
  assert.equal(items.length, 1);
  assert.equal(items[0].costStatus, 'unknown');
  assert.equal(items[0].verifiedFree, false);
  assert.equal(items[0].lat, null);
  assert.equal(items[0].lng, null);
});

test('source admission claims remain unverified and identifiers are stable', () => {
  assert.equal(event().costStatus, 'reported_free');
  assert.equal(event().verifiedFree, false);
  assert.equal(event().id, event().id);
  const conflicts = normalizeFeedItems([{ title: 'Teen class', contentSnippet: 'Free admission; materials $5.' }], source);
  assert.equal(conflicts[0].costStatus, 'unknown');
});

test('filtering covers every source item and free-event category checks admission', () => {
  const king = { ...event(), id: 'king', county: 'king' as const, city: 'Seattle', type: 'sports_rec' as const, costStatus: 'unknown' as const };
  const items = [event(), king];
  assert.deepEqual(searchDiscoveries(items, { county: 'snohomish', category: 'maker_space' }), []);
  assert.equal(searchDiscoveries(items, { county: 'king', category: 'sports_rec', query: 'workshop' }).length, 1);
  assert.equal(searchDiscoveries(items, { city: 'Everett' }).length, 1);
  assert.equal(searchDiscoveries(items, { category: 'free_event' }).length, 1);
});

test('collector parses RSS, rejects webpage responses, deduplicates and checks coordinates', async () => {
  const rss = '<rss version="2.0" xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"><channel><title>Library</title><item><guid>1</guid><title>Teen coding lab</title><description>Free admission</description><link>javascript:alert(1)</link><geo:lat>47.9</geo:lat><geo:long>-122.2</geo:long></item><item><guid>1</guid><title>Teen coding lab</title></item></channel></rss>';
  const fixtureFetch = (async (url: string) => new Response(url.includes('broken') ? '<html>Not RSS</html>' : rss)) as typeof fetch;
  const result = await collectFeeds([source, { ...source, name: 'Broken', url: 'https://broken.example' }], fixtureFetch);
  assert.equal(result.items.length, 1);
  assert.deepEqual(result.failures, ['Broken']);
  assert.equal(result.items[0].contactOrLink, undefined);
  assert.equal(result.items[0].lat, 47.9);
  const located = normalizeFeedItems([{ title: 'Teen coding lab', 'geo:lat': '47.9', 'geo:long': '-122.2' } as any], source)[0];
  assert.equal(located.lat, 47.9);
  assert.equal(normalizeFeedItems([{ title: 'Teen coding lab', 'geo:lat': '999', 'geo:long': '0' } as any], source)[0].lat, null);
});

test('serialized updates survive reload and strip unsafe links and verification claims', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'hopscout-'));
  try {
    const store = new YouthEventStore(path.join(dir, 'events.json'));
    await store.load();
    await Promise.all([store.upsert([{ ...event(), verifiedFree: true, contactOrLink: 'javascript:alert(1)' }]), store.upsert([{ ...event(), id: 'second' }])]);
    const loaded = new YouthEventStore(path.join(dir, 'events.json'));
    await loaded.load();
    assert.equal(loaded.all().length, 2);
    assert.equal(loaded.all()[0].verifiedFree, false);
    assert.equal(loaded.all()[0].contactOrLink, undefined);
  } finally { await rm(dir, { recursive: true }); }
});

test('API labels samples, rejects unauthorized/invalid writes and excludes unlocated map items', async () => {
  const app = express();
  app.use(express.json());
  const store = new YouthEventStore();
  registerYouthRoutes(app, store, 'fixture-token');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  const post = (route: string, body: unknown, token = '') => fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token }, body: JSON.stringify(body) });
  try {
    const initial = await (await post('/api/youth-events/search', { county: 'king' })).json();
    assert.equal(initial.sampleMode, true);
    assert.ok(initial.items.length > 0);
    assert.ok(initial.items.every(item => item.isSample && !item.verifiedFree && item.county === 'king'));
    assert.equal((await post('/api/youth-events/batch', { events: [event()] })).status, 401);
    assert.equal((await post('/api/youth-events/batch', { events: [{ name: 'Incomplete' }] }, 'Bearer fixture-token')).status, 400);
    assert.equal((await post('/api/youth-events/batch', { events: [event()] }, 'Bearer fixture-token')).status, 200);
    const loaded = await (await post('/api/youth-events/search', { county: 'snohomish' })).json();
    assert.equal(loaded.sampleMode, false);
    assert.equal(loaded.items.length, 1);
    assert.deepEqual((await (await fetch(base + '/api/places/nearby')).json()).pois, []);
    await post('/api/youth-events/batch', { events: [{ ...event(), lat: 47.9, lng: -122.2 }] }, 'Bearer fixture-token');
    assert.equal((await (await fetch(base + '/api/places/nearby')).json()).pois.length, 1);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
