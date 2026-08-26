import { GeocodedLocationData } from '../types';

export interface LocalInsightsResult {
  html?: string;
  location: string;
  error?: string;
}

/**
 * Extracts a clean "City, State" (or "City, Region/Country") string from Geocoded Location data.
 * Examples: "Miami, Florida", "Buenos Aires, Argentina", "Shibuya, Tokyo", "Cologne, North Rhine-Westphalia".
 */
export function extractCityAndState(location: GeocodedLocationData): string {
  if (!location) return '';

  let locality = '';
  let sublocality = '';
  let adminArea1 = '';
  let country = '';

  if (location.components && location.components.length > 0) {
    for (const comp of location.components) {
      const types = comp.types || [];
      if (types.includes('locality')) {
        locality = comp.longText || comp.shortText;
      } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        sublocality = comp.longText || comp.shortText;
      } else if (types.includes('administrative_area_level_1')) {
        adminArea1 = comp.longText || comp.shortText;
      } else if (types.includes('country')) {
        country = comp.longText || comp.shortText;
      }
    }
  }

  const city = locality || sublocality;
  const stateOrRegion = adminArea1 || country;

  if (city && stateOrRegion) {
    return `${city}, ${stateOrRegion}`;
  } else if (city) {
    return city;
  }

  // Fallback parsing from formattedAddress or query
  if (location.formattedAddress) {
    const parts = location.formattedAddress.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return parts[0];
  }

  return location.query;
}

/**
 * Fetches Local Insights from the Gemini 2.5 Flash server endpoint
 */
export async function fetchLocalInsights(
  locationString: string
): Promise<LocalInsightsResult> {
  const trimmed = locationString.trim();
  if (!trimmed) {
    return {
      location: '',
      error: 'Location name is required to fetch local insights.',
    };
  }

  try {
    const response = await fetch('/api/gemini/insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location: trimmed,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        location: trimmed,
        error: data.message || `Failed to fetch insights (Status ${response.status})`,
      };
    }

    return {
      location: trimmed,
      html: data.html,
    };
  } catch (err: any) {
    return {
      location: trimmed,
      error: err.message || 'Network error while contacting the Gemini AI service.',
    };
  }
}
