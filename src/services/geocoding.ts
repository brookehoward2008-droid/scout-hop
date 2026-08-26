import { PRESET_LOCATIONS } from '../data/presets';
import { ApiErrorInfo, GeocodedLocationData, GeocodeV4Result } from '../types';

export interface GeocodeResponsePayload {
  data?: GeocodedLocationData;
  error?: ApiErrorInfo;
}

export async function requestGeocodeAddress(
  addressQuery: string,
  customApiKey?: string
): Promise<GeocodeResponsePayload> {
  const trimmed = addressQuery.trim();
  if (!trimmed) {
    return {
      error: {
        code: 400,
        status: 'EMPTY_QUERY',
        message: 'Please enter a valid location name, address, or neighborhood.',
        timestamp: Date.now(),
      },
    };
  }

  // Check matching preset for fallback or reference
  const matchedPreset = PRESET_LOCATIONS.find(
    (p) =>
      p.name.toLowerCase() === trimmed.toLowerCase() ||
      p.id.toLowerCase() === trimmed.toLowerCase() ||
      p.query.toLowerCase().includes(trimmed.toLowerCase())
  );

  const endpointUrl = `/api/geocode?address=${encodeURIComponent(trimmed)}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const activeKey =
      customApiKey ||
      (typeof window !== 'undefined' ? localStorage.getItem('block_explorer_gmp_key') : null) ||
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (activeKey) {
      headers['x-api-key'] = activeKey;
    }

    const res = await fetch(endpointUrl, { headers });
    const payload = await res.json();

    if (!res.ok || payload.error) {
      const errorInfo: ApiErrorInfo = {
        code: payload.code || res.status,
        status: payload.status || (res.status === 403 ? 'PERMISSION_DENIED' : 'API_ERROR'),
        message:
          payload.message ||
          (res.status === 403
            ? 'Geocoding request failed: Google Maps API key is missing or lacks Geocoding API permissions.'
            : `Geocoding request failed with HTTP ${res.status}`),
        endpoint: `https://geocode.googleapis.com/v4/geocode/address/${encodeURIComponent(trimmed)}`,
        timestamp: Date.now(),
        troubleshooting: payload.troubleshooting || {
          step1: 'Verify that GOOGLE_MAPS_API_KEY or VITE_GOOGLE_MAPS_API_KEY is configured in your project.',
          step2: 'Get a zero-billing Maps Demo Key from Google Maps Platform: https://mapsplatform.google.com/maps-demo-key',
          step3: 'Ensure the Geocoding API (v4) is enabled on your Google Cloud Console credentials.',
        },
        rawDetails: payload.raw || payload,
      };

      // If we have a matching preset, provide fallback coordinates so the UI still displays the map exploration
      if (matchedPreset) {
        const fallbackData: GeocodedLocationData = {
          query: trimmed,
          formattedAddress: `${matchedPreset.name}, ${matchedPreset.country}`,
          lat: matchedPreset.lat,
          lng: matchedPreset.lng,
          placeId: matchedPreset.id,
          granularity: 'PRESET_COORDINATES',
          viewport: {
            north: matchedPreset.lat + 0.04,
            south: matchedPreset.lat - 0.04,
            east: matchedPreset.lng + 0.04,
            west: matchedPreset.lng - 0.04,
          },
          types: ['preset_location', 'locality', 'political'],
          isPreset: true,
          isFallback: true,
          timestamp: Date.now(),
        };
        return { data: fallbackData, error: errorInfo };
      }

      return { error: errorInfo };
    }

    // Parse Geocoding V4 Results
    const results: GeocodeV4Result[] = payload.results || [];
    if (!results || results.length === 0) {
      return {
        error: {
          code: 404,
          status: 'ZERO_RESULTS',
          message: `No geographic coordinates found for "${trimmed}". Try searching with a broader city name or landmark.`,
          endpoint: `https://geocode.googleapis.com/v4/geocode/address/${encodeURIComponent(trimmed)}`,
          timestamp: Date.now(),
          troubleshooting: {
            step1: 'Check for typos in the city or neighborhood name.',
            step2: 'Try adding a country or region name (e.g. "Shibuya, Tokyo, Japan").',
            step3: 'Use one of the five quick-launch preset buttons below.',
          },
        },
      };
    }

    const first = results[0];
    const lat = first.location?.latitude ?? 0;
    const lng = first.location?.longitude ?? 0;

    const parsedData: GeocodedLocationData = {
      query: trimmed,
      formattedAddress: first.formattedAddress || trimmed,
      lat,
      lng,
      placeId: first.placeId || first.place,
      granularity: first.granularity || 'APPROXIMATE',
      viewport: first.viewport
        ? {
            north: first.viewport.high.latitude,
            south: first.viewport.low.latitude,
            east: first.viewport.high.longitude,
            west: first.viewport.low.longitude,
          }
        : undefined,
      types: first.types || [],
      components: first.addressComponents || [],
      isPreset: !!matchedPreset,
      isFallback: false,
      timestamp: Date.now(),
    };

    return { data: parsedData };
  } catch (netErr: any) {
    const errorInfo: ApiErrorInfo = {
      code: 'NETWORK_ERROR',
      status: 'CONNECTION_FAILED',
      message: netErr?.message || 'Failed to connect to the geocoding service.',
      endpoint: endpointUrl,
      timestamp: Date.now(),
      troubleshooting: {
        step1: 'Check your internet connection.',
        step2: 'Verify that the local server is running on port 3000.',
        step3: 'Review developer console logs for any blocking CORS or network errors.',
      },
    };

    if (matchedPreset) {
      const fallbackData: GeocodedLocationData = {
        query: trimmed,
        formattedAddress: `${matchedPreset.name}, ${matchedPreset.country}`,
        lat: matchedPreset.lat,
        lng: matchedPreset.lng,
        placeId: matchedPreset.id,
        granularity: 'PRESET_COORDINATES',
        viewport: {
          north: matchedPreset.lat + 0.04,
          south: matchedPreset.lat - 0.04,
          east: matchedPreset.lng + 0.04,
          west: matchedPreset.lng - 0.04,
        },
        types: ['preset_location'],
        isPreset: true,
        isFallback: true,
        timestamp: Date.now(),
      };
      return { data: fallbackData, error: errorInfo };
    }

    return { error: errorInfo };
  }
}
