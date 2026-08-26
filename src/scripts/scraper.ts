import Parser from 'rss-parser';
import axios from 'axios';

interface ParsedYouthEvent {
  id: string;
  name: string;
  category: string;
  county: 'king' | 'snohomish';
  city: string;
  isFree: boolean;
  freeDetails: string;
  description: string;
  tags: string[];
  link: string;
  pubDate?: string;
}

const parser = new Parser({
  customFields: {
    item: ['description', 'category', 'pubDate', 'guid'],
  },
});

const FEED_SOURCES = [
  {
    name: 'Sno-Isle Libraries',
    url: 'https://sno-isle.bibliocommons.com/v2/events?types=5f0ce972da1b731c0af31864',
    county: 'snohomish' as const,
    defaultCity: 'Snohomish County',
  },
  {
    name: 'City of Everett Community Calendar',
    url: 'https://www.everettwa.gov/rss.aspx?AMID=2',
    county: 'snohomish' as const,
    defaultCity: 'Everett',
  },
  {
    name: 'Snohomish County Community News',
    url: 'https://snohomishcountywa.gov/rss.aspx',
    county: 'snohomish' as const,
    defaultCity: 'Everett',
  },
];

const YOUTH_KEYWORDS = [
  'youth', 'teen', 'teens', 'kids', 'child', 'children', 'toddler',
  'stem', 'lego', 'storytime', 'camp', 'open gym', 'tutoring', 'free'
];

function isYouthFocused(title: string, description: string): boolean {
  const content = `${title} ${description}`.toLowerCase();
  return YOUTH_KEYWORDS.some((kw) => content.includes(kw));
}

function categorizeEvent(title: string, description: string): string {
  const content = `${title} ${description}`.toLowerCase();
  if (content.includes('stem') || content.includes('lego') || content.includes('tech') || content.includes('code')) {
    return 'STEM & Tech';
  }
  if (content.includes('art') || content.includes('craft') || content.includes('music')) {
    return 'Art & Music';
  }
  if (content.includes('storytime') || content.includes('book') || content.includes('read')) {
    return 'Literacy & Storytime';
  }
  if (content.includes('sports') || content.includes('gym') || content.includes('hike') || content.includes('outdoor')) {
    return 'Sports & Fitness';
  }
  return 'Community & Youth Services';
}

export async function scrapeAndIngestFeeds() {
  console.log(' Starting Youth Event Feed Ingestion Job...');
  const aggregatedEvents: ParsedYouthEvent[] = [];

  for (const source of FEED_SOURCES) {
    try {
      console.log(`📡 Fetching feed from: ${source.name}`);
      const feed = await parser.parseURL(source.url);

      for (const item of feed.items) {
        const title = item.title || '';
        const description = item.contentSnippet || item.description || '';

        if (!isYouthFocused(title, description)) continue;

        const eventId = item.guid || item.link || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        const youthEvent: ParsedYouthEvent = {
          id: eventId,
          name: title.trim(),
          category: categorizeEvent(title, description),
          county: source.county,
          city: source.defaultCity,
          isFree: true,
          freeDetails: 'Free admission provided by community program',
          description: description.replace(/<[^>]*>?/gm, '').substring(0, 300).trim(),
          tags: ['community', 'youth', source.name.toLowerCase().includes('library') ? 'library' : 'municipal'],
          link: item.link || '',
          pubDate: item.pubDate,
        };

        aggregatedEvents.push(youthEvent);
      }
    } catch (err: any) {
      console.error(` Error scraping ${source.name}:`, err.message);
    }
  }

  console.log(` Processing complete. Found ${aggregatedEvents.length} youth-focused events.`);

  if (aggregatedEvents.length > 0) {
    try {
      const apiEndpoint = process.env.API_INGEST_URL || 'http://localhost:3000/api/youth-events/batch';
      const response = await axios.post(apiEndpoint, { events: aggregatedEvents });
      console.log(` Successfully posted ${aggregatedEvents.length} events to API. Status: ${response.status}`);
    } catch (apiErr: any) {
      console.error(' Failed to push ingested events to API database:', apiErr.message);
    }
  }
}

// Check if running as main module and execute
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scrapeAndIngestFeeds();
}
