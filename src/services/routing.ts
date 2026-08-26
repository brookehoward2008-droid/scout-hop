import { CalculatedRoute, LatLngLiteral, TravelMode } from '../types';

export interface RequestRouteParams {
  origin: LatLngLiteral;
  destination: LatLngLiteral;
  mode: TravelMode;
  apiKey?: string;
}

export interface RouteResult {
  route: CalculatedRoute | null;
  error?: string;
  source?: string;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  const km = (meters / 1000).toFixed(2);
  const miles = (meters * 0.000621371).toFixed(2);
  return `${km} km (${miles} mi)`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 1) {
    return '< 1 min';
  }
  if (mins < 60) {
    return `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours} hr ${remainingMins} min`;
}

export async function calculateRoute(params: RequestRouteParams): Promise<RouteResult> {
  const { origin, destination, mode, apiKey } = params;

  try {
    const url = new URL('/api/directions', window.location.origin);
    url.searchParams.set('originLat', origin.lat.toString());
    url.searchParams.set('originLng', origin.lng.toString());
    url.searchParams.set('destLat', destination.lat.toString());
    url.searchParams.set('destLng', destination.lng.toString());
    url.searchParams.set('mode', mode);

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(url.toString(), { headers });
    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        route: null,
        error: data.message || `Failed to calculate route (Status ${response.status})`,
      };
    }

    const calculatedRoute: CalculatedRoute = {
      mode: data.mode || mode,
      start: origin,
      end: destination,
      distanceMeters: data.distanceMeters,
      durationSeconds: data.durationSeconds,
      polyline: data.polyline || [],
    };

    return {
      route: calculatedRoute,
      source: data.source,
    };
  } catch (err: any) {
    return {
      route: null,
      error: err.message || 'Network error while calculating route.',
    };
  }
}
