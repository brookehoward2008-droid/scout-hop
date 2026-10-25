// src/scripts/scraper.ts
// Reuse the server collector so manual ingestion follows the same data rules.
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { collectFeeds, configuredFeeds } from '../server/youthEvents.ts';

export async function scrapeAndIngestFeeds() {
  const sources = configuredFeeds();
  if (!sources.length) throw new Error('Configure reviewed RSS/Atom sources in HOPSCOUT_FEEDS first.');
  const token = process.env.HOPSCOUT_INGEST_TOKEN;
  if (!token) throw new Error('HOPSCOUT_INGEST_TOKEN is required for batch ingestion.');
  const result = await collectFeeds(sources);
  if (result.failures.length) console.warn('Unavailable feeds:', result.failures.join(', '));
  if (!result.items.length) {
    if (result.failures.length) throw new Error('No events collected; one or more feeds failed.');
    return { count: 0 };
  }
  const endpoint = process.env.API_INGEST_URL || `http://localhost:${process.env.PORT || 3000}/api/youth-events/batch`;
  let count = 0;
  for (let offset = 0; offset < result.items.length; offset += 200) {
    const response = await fetch(endpoint, {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ events: result.items.slice(offset, offset + 200) }),
    });
    if (!response.ok) throw new Error(`Ingestion failed with HTTP ${response.status}`);
    const data = await response.json();
    count += data.count;
  }
  return { count };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scrapeAndIngestFeeds().then(result => console.log(`Saved ${result.count} discoveries.`))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
