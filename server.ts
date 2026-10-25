// server.ts
// Serve the existing app and its discovery services from one origin.
import 'dotenv/config';
import { createYouthEventStore, registerYouthRoutes, startFeedPolling } from './src/server/youthEvents.ts';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';



const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Lazy initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export async function createApp({ serveFrontend = false } = {}) {
  const app = express();

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!(process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY),
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Gemini API Local Insights endpoint (gemini-2.5-flash)
  app.post('/api/gemini/insights', async (req, res) => {
    try {
      const location = (req.body?.location as string || '').trim();
      if (!location) {
        return res.status(400).json({
          error: true,
          message: 'Location (City, State) is required to generate insights.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: true,
          status: 'MISSING_GEMINI_KEY',
          message: 'Gemini API key is not configured on the server. Please verify your GEMINI_API_KEY in the Secrets panel.',
        });
      }

      const ai = getGeminiClient();
      const prompt = `You are a local tour guide for ${location}. Give me exactly 3 short, highly engaging, and unusual or surprising fun facts about this place. Keep each fact under 2 sentences. Format the response as a clean HTML unordered list (<ul>) so I can inject it directly.`;

      const candidateModels = [
        'gemini-3.7-flash',
        'gemini-flash-latest',
        'gemini-3.6-flash',
        'gemini-3.1-flash-lite',
      ];

      let response: any = null;
      let usedModel = candidateModels[0];
      let lastError: any = null;

      for (const model of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: prompt,
          });
          if (response?.text) {
            usedModel = model;
            lastError = null;
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${model} failed (${err?.status || err?.message}), trying next candidate...`);
          lastError = err;
        }
      }

      if (!response && lastError) {
        throw lastError;
      }

      const rawText = response.text || '';
      
      // Clean up any markdown wrapping (e.g. ```html <ul>...</ul> ```)
      let cleanHtml = rawText.trim();
      if (cleanHtml.startsWith('```html')) {
        cleanHtml = cleanHtml.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');
      } else if (cleanHtml.startsWith('```')) {
        cleanHtml = cleanHtml.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      }

      return res.json({
        success: true,
        location,
        html: cleanHtml,
        model: usedModel,
      });
    } catch (err: any) {
      console.error('Gemini insights generation error:', err);
      return res.status(500).json({
        error: true,
        message: err.message || 'Failed to generate local insights for this location.',
      });
    }
  });

  // Calculate Directions (Walking & Driving routes between 2 points)
  app.get('/api/directions', async (req, res) => {
    try {
      const originLat = parseFloat(req.query.originLat as string);
      const originLng = parseFloat(req.query.originLng as string);
      const destLat = parseFloat(req.query.destLat as string);
      const destLng = parseFloat(req.query.destLng as string);
      const mode = ((req.query.mode as string) || 'WALK').toUpperCase(); // 'WALK' or 'DRIVE'
      const clientApiKey = req.headers['x-api-key'] as string;
      const apiKey = clientApiKey || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

      if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
        return res.status(400).json({
          error: true,
          message: 'originLat, originLng, destLat, and destLng are required valid coordinates.',
        });
      }

      // 1. Try Google Routes Preferred API (computeRoutes) if API key is provided
      if (apiKey) {
        try {
          const travelModeParam = mode === 'WALK' ? 'WALK' : 'DRIVE';
          const routesApiRes = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps',
            },
            body: JSON.stringify({
              origin: {
                location: {
                  latLng: {
                    latitude: originLat,
                    longitude: originLng,
                  },
                },
              },
              destination: {
                location: {
                  latLng: {
                    latitude: destLat,
                    longitude: destLng,
                  },
                },
              },
              travelMode: travelModeParam,
              routingPreference: mode === 'WALK' ? undefined : 'TRAFFIC_UNAWARE',
            }),
          });

          if (routesApiRes.ok) {
            const data: any = await routesApiRes.json();
            const route = data.routes?.[0];
            if (route) {
              const distanceMeters = route.distanceMeters || 0;
              const durationSeconds = parseInt(route.duration?.replace('s', '') || '0', 10);
              
              // Decode polyline if Google encoded polyline is returned
              let polylineCoords: [number, number][] = [];
              if (route.polyline?.encodedPolyline) {
                polylineCoords = decodePolyline(route.polyline.encodedPolyline);
              }

              if (polylineCoords.length > 0) {
                return res.json({
                  success: true,
                  source: 'google_routes',
                  mode,
                  distanceMeters,
                  durationSeconds,
                  polyline: polylineCoords,
                });
              }
            }
          }
        } catch (gErr) {
          console.warn('Google Routes computeRoutes failed, falling back to OSRM:', gErr);
        }
      }

      // 2. Fallback to OpenStreetMap OSRM routing (supports foot and car)
      const osrmProfile = mode === 'WALK' ? 'foot' : 'car';
      const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

      const osrmRes = await fetch(osrmUrl, {
        headers: {
          'User-Agent': 'BlockExplorer/1.0',
        },
      });

      if (osrmRes.ok) {
        const osrmData: any = await osrmRes.json();
        if (osrmData.code === 'Ok' && osrmData.routes?.[0]) {
          const route = osrmData.routes[0];
          // GeoJSON coordinates are [lng, lat], convert to Leaflet/Map standard [lat, lng]
          const polylineCoords: [number, number][] = (route.geometry?.coordinates || []).map(
            (c: [number, number]) => [c[1], c[0]]
          );

          return res.json({
            success: true,
            source: 'osrm',
            mode,
            distanceMeters: Math.round(route.distance || 0),
            durationSeconds: Math.round(route.duration || 0),
            polyline: polylineCoords,
          });
        }
      }

      // 3. Fallback direct line interpolation if network routing fails
      const directPolyline: [number, number][] = [
        [originLat, originLng],
        [destLat, destLng],
      ];
      // Simple haversine estimate
      const R = 6371e3;
      const φ1 = (originLat * Math.PI) / 180;
      const φ2 = (destLat * Math.PI) / 180;
      const Δφ = ((destLat - originLat) * Math.PI) / 180;
      const Δλ = ((destLng - originLng) * Math.PI) / 180;
      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = Math.round(R * c * (mode === 'WALK' ? 1.3 : 1.4)); // routing tortuosity factor
      const speedMps = mode === 'WALK' ? 1.38 : 11.1; // ~5 km/h walking, ~40 km/h driving
      const dur = Math.round(dist / speedMps);

      return res.json({
        success: true,
        source: 'direct_estimate',
        mode,
        distanceMeters: dist,
        durationSeconds: dur,
        polyline: directPolyline,
      });
    } catch (err: any) {
      console.error('Directions error:', err);
      return res.status(500).json({
        error: true,
        message: err.message || 'Failed to compute route directions.',
      });
    }
  });

  // Polyline decoding helper for Google encoded polylines
  function decodePolyline(encoded: string): [number, number][] {
    const poly: [number, number][] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b: number;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push([lat / 1e5, lng / 1e5]);
    }
    return poly;
  }

  // Geocoding V4 API proxy endpoint

  const youthStore = await createYouthEventStore();
  registerYouthRoutes(app, youthStore);
  app.locals.stopFeedPolling = startFeedPolling(youthStore);

  app.get('/api/geocode', async (req, res) => {
    try {
      const address = (req.query.address as string || '').trim();
      const clientApiKey = req.headers['x-api-key'] as string;
      const apiKey = clientApiKey || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!address) {
        return res.status(400).json({
          error: true,
          code: 400,
          message: 'Address parameter is required.',
        });
      }

      if (!apiKey) {
        return res.status(403).json({
          error: true,
          code: 403,
          status: 'MISSING_API_KEY',
          message: 'Google Maps API Key is not configured on the server or client.',
          troubleshooting: {
            step1: 'Add GOOGLE_MAPS_API_KEY or VITE_GOOGLE_MAPS_API_KEY in your environment secrets.',
            step2: 'Or obtain a free Maps Demo Key from Google Maps Platform.',
            step3: 'Alternatively, enter your API key in the App Settings / Troubleshooting drawer.',
          },
        });
      }

      // Call Google Geocoding V4 REST API: https://geocode.googleapis.com/v4/geocode/address/{address}
      const geocodeUrl = `https://geocode.googleapis.com/v4/geocode/address/${encodeURIComponent(address)}`;
      
      const response = await fetch(geocodeUrl, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: true,
          code: response.status,
          status: data?.error?.status || 'API_ERROR',
          message: data?.error?.message || `Geocoding V4 request failed with status ${response.status}`,
          raw: data,
        });
      }

      return res.json({
        success: true,
        address,
        results: data.results || [],
      });
    } catch (err: any) {
      console.error('Geocoding proxy error:', err);
      return res.status(500).json({
        error: true,
        code: 500,
        message: err.message || 'Internal server error while geocoding.',
      });
    }
  });

  // API misses must not fall through to the frontend HTML response.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: true, message: 'API route not found.' });
  });

  // Vercel serves the Vite build separately from the API function.
  if (serveFrontend && process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (serveFrontend) {
    const distPath = path.basename(currentDir) === 'dist' ? currentDir : path.join(currentDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}
