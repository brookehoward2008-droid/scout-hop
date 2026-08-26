import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, InfoWindow, Map, Marker, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import L from 'leaflet';
import {
  AlertTriangle,
  Award,
  Bus,
  Car,
  Compass,
  Footprints,
  Key,
  Layers,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Radio,
  RotateCcw,
  Route as RouteIcon,
  School,
  Sparkles,
} from 'lucide-react';
import { COMMUNITY_PLACES, CommunityPlace, STOPS, TRANSIT_NETWORK_LINES, TransitLineRoute, TransitStop } from '../data/transitCatalog';
import { useApp } from '../services/transitStore';
import { GeocodedLocationData, MapTypeStyle } from '../types';
import { LocalInsightsBanner } from './LocalInsightsBanner';
import { RideModeHud } from './RideModeHud';
import { RoutePlannerCard } from './RoutePlannerCard';

interface MapContainerProps {
  currentLocation: GeocodedLocationData | null;
  apiKey: string;
  onOpenKeySettings?: () => void;
  insightsLocationName: string;
  insightsHtml: string | null;
  isInsightsLoading: boolean;
  insightsError: string | null;
  onRefreshInsights: () => void;
}

// Controller component to smoothly pan and zoom Google Map
// Controls the camera on Google Maps with smooth cinematic pan-and-zoom flight animations
const GoogleMapCameraController: React.FC<{
  currentLocation: GeocodedLocationData | null;
  targetZoom?: number;
  activeRideCoord?: { lat: number; lng: number };
}> = ({ currentLocation, targetZoom, activeRideCoord }) => {
  const map = useMap();
  const animationFrameRef = useRef<number | null>(null);
  const prevCoordRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!map) return;

    // Smooth pan tracking for active bus ride
    if (activeRideCoord) {
      map.panTo(activeRideCoord);
      return;
    }

    if (!currentLocation) return;

    const targetLat = currentLocation.lat;
    const targetLng = currentLocation.lng;
    const target = { lat: targetLat, lng: targetLng };

    let endZoom = 14;
    if (targetZoom) {
      endZoom = targetZoom;
    } else if (currentLocation.granularity === 'ROOFTOP') {
      endZoom = 17;
    } else if (currentLocation.granularity === 'GEOMETRIC_CENTER') {
      endZoom = 15;
    } else if (currentLocation.isPreset) {
      endZoom = 14;
    } else {
      endZoom = 13;
    }

    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom() || 14;

    // If map center is not yet ready or this is first load
    if (!currentCenter) {
      map.panTo(target);
      map.setZoom(endZoom);
      prevCoordRef.current = target;
      return;
    }

    const startLat = currentCenter.lat();
    const startLng = currentCenter.lng();
    const startZoom = currentZoom;

    // Check if the change is noticeable
    const distLat = Math.abs(startLat - targetLat);
    const distLng = Math.abs(startLng - targetLng);
    const isSignificantMove = distLat > 0.0001 || distLng > 0.0001 || Math.abs(startZoom - endZoom) > 0.1;

    if (!isSignificantMove) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const totalDist = Math.sqrt(distLat * distLat + distLng * distLng);
    // Smooth flight duration scaled by distance (between 1.0s and 1.6s)
    const duration = Math.min(1600, Math.max(1000, 1000 + totalDist * 1200));
    // For longer jumps across counties, dip zoom slightly in the middle for a parabolic flight arc
    const zoomDip = totalDist > 0.04 ? Math.min(2.5, totalDist * 18) : 0;

    const startTime = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateFlight = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(progress);

      const curLat = startLat + (targetLat - startLat) * eased;
      const curLng = startLng + (targetLng - startLng) * eased;

      // Calculate parabolic zoom curve
      let curZoom: number;
      if (zoomDip > 0) {
        const dip = Math.sin(progress * Math.PI) * zoomDip;
        curZoom = startZoom + (endZoom - startZoom) * eased - dip;
      } else {
        curZoom = startZoom + (endZoom - startZoom) * eased;
      }

      if (typeof map.moveCamera === 'function') {
        map.moveCamera({
          center: { lat: curLat, lng: curLng },
          zoom: curZoom,
        });
      } else {
        map.panTo({ lat: curLat, lng: curLng });
        if (Math.round(curZoom) !== map.getZoom()) {
          map.setZoom(Math.round(curZoom));
        }
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateFlight);
      } else {
        map.panTo(target);
        map.setZoom(endZoom);
        prevCoordRef.current = target;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateFlight);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [map, currentLocation, targetZoom, activeRideCoord]);

  return null;
};

// Resilient Fallback Interactive Tile Map (Leaflet) with Full Transit, Ride Mode, and Point-to-Point Route Calculation
const LeafletFallbackMap: React.FC<{
  currentLocation: GeocodedLocationData | null;
  mapType: MapTypeStyle;
  onOpenKeySettings?: () => void;
  hasNearbyTargets?: boolean;
}> = ({ currentLocation, mapType, onOpenKeySettings, hasNearbyTargets }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const transitLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const ridePolylineRef = useRef<L.Polyline | null>(null);
  const rideBusMarkerRef = useRef<L.Marker | null>(null);

  const {
    showTransitLayer,
    setShowTransitLayer,
    activeRide,
    startRide,
    setSelectedStop,
    setSelectedPlace,
    isRoutePlanningActive,
    handleMapClickForRoute,
    routeOrigin,
    routeDestination,
    calculatedRoute,
    travelMode,
    geocaches,
    foundCacheIds,
    activeTargetCache,
    setActiveTargetCache,
    showGeocachingLayer,
    setShowGeocachingLayer,
    navigateToGeocache,
    showYouthPlacesLayer,
    setShowYouthPlacesLayer,
    selectedYouthItem,
    setSelectedYouthItem,
  } = useApp();

  const geocacheLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const youthLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const defaultCenter: [number, number] = currentLocation
      ? [currentLocation.lat, currentLocation.lng]
      : [47.6114, -122.3370]; // Seattle transit core default

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;
    transitLayerGroupRef.current = L.layerGroup().addTo(map);
    geocacheLayerGroupRef.current = L.layerGroup().addTo(map);
    youthLayerGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);

    // Click handler for 2-point route calculation
    map.on('click', (e: L.LeafletMouseEvent) => {
      handleMapClickForRoute(e.latlng.lat, e.latlng.lng);
    });

    // Tile URLs based on style
    const getTileUrl = (style: MapTypeStyle) => {
      switch (style) {
        case 'satellite':
        case 'hybrid':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        case 'terrain':
          return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
        case 'roadmap':
        default:
          return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      }
    };

    const tileLayer = L.tileLayer(getTileUrl(mapType), {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map click handler reference whenever handleMapClickForRoute changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.off('click');
    mapInstanceRef.current.on('click', (e: L.LeafletMouseEvent) => {
      handleMapClickForRoute(e.latlng.lat, e.latlng.lng);
    });
  }, [handleMapClickForRoute]);

  // Update Tile Layer when map style changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    if (mapType === 'satellite' || mapType === 'hybrid') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else if (mapType === 'terrain') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
    }

    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapInstanceRef.current);
  }, [mapType]);

  // Render Point A and Point B Markers and Calculated Route Polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerGroupRef.current) return;

    routeLayerGroupRef.current.clearLayers();

    // 1. Point A (Origin Marker)
    if (routeOrigin) {
      const iconA = L.divIcon({
        className: 'leaflet-route-point-a',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
            <div class="absolute -inset-2 animate-ping rounded-full bg-emerald-500/40"></div>
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-extrabold text-xs shadow-xl ring-2 ring-white">
              A
            </div>
            <div class="absolute -top-7 whitespace-nowrap rounded-md bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
              Start Point
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([routeOrigin.lat, routeOrigin.lng], { icon: iconA })
        .addTo(routeLayerGroupRef.current)
        .bindPopup('<strong>Point A (Start)</strong><br />' + routeOrigin.lat.toFixed(5) + ', ' + routeOrigin.lng.toFixed(5));
    }

    // 2. Point B (Destination Marker)
    if (routeDestination) {
      const iconB = L.divIcon({
        className: 'leaflet-route-point-b',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
            <div class="absolute -inset-2 animate-ping rounded-full bg-indigo-500/40"></div>
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-extrabold text-xs shadow-xl ring-2 ring-white">
              B
            </div>
            <div class="absolute -top-7 whitespace-nowrap rounded-md bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
              Destination
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([routeDestination.lat, routeDestination.lng], { icon: iconB })
        .addTo(routeLayerGroupRef.current)
        .bindPopup('<strong>Point B (Destination)</strong><br />' + routeDestination.lat.toFixed(5) + ', ' + routeDestination.lng.toFixed(5));
    }

    // 3. Calculated Route Polyline
    if (calculatedRoute && calculatedRoute.polyline.length > 0) {
      const isWalking = calculatedRoute.mode === 'WALK';
      const routePolyline = L.polyline(calculatedRoute.polyline, {
        color: isWalking ? '#059669' : '#4f46e5',
        weight: isWalking ? 6 : 7,
        opacity: 0.9,
        dashArray: isWalking ? '8, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routeLayerGroupRef.current);

      const bounds = routePolyline.getBounds();
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [routeOrigin, routeDestination, calculatedRoute]);

  // Render Transit Stops and Places Markers on Leaflet
  useEffect(() => {
    if (!mapInstanceRef.current || !transitLayerGroupRef.current) return;

    transitLayerGroupRef.current.clearLayers();

    if (!showTransitLayer) return;

    // 0. Render Transit Bus & Train Lines (Polylines)
    TRANSIT_NETWORK_LINES.forEach((line) => {
      const isTrain = line.type === 'train';
      const polyline = L.polyline(line.coordinates, {
        color: line.color,
        weight: isTrain ? 6 : 4,
        opacity: 0.85,
        dashArray: isTrain ? '10, 6' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(transitLayerGroupRef.current!);

      polyline.bindPopup(`
        <div style="font-family: inherit; padding: 2px 4px; color: #1c1917;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${line.color};">
            ${isTrain ? 'Light Rail Line' : 'Bus Rapid / Transit Route'}
          </div>
          <div style="font-size: 13px; font-weight: 800; margin-top: 2px;">
            ${line.name}
          </div>
          <div style="font-size: 11px; color: #57534e; margin-top: 2px;">
            Youth Fare: <strong>100% Free</strong>
          </div>
        </div>
      `);
    });

    // 1. Add Transit Stops
    STOPS.forEach((stop) => {
      const stopIcon = L.divIcon({
        className: 'leaflet-transit-stop-icon',
        html: `
          <div class="group relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
            <div class="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg ring-2 ring-white hover:scale-110 transition-transform">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4C2.9 6 1.9 6.8 1.6 7.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2C.5 16.3.8 18 3 18h3"></path><circle cx="6.5" cy="17.5" r="2.5"></circle><circle cx="16.5" cy="17.5" r="2.5"></circle>
              </svg>
            </div>
            <div class="absolute top-8 whitespace-nowrap rounded-md bg-stone-900/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md pointer-events-none">
              ${stop.name.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const m = L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(transitLayerGroupRef.current!);
      m.on('click', () => {
        setSelectedStop(stop);
      });

      const popupHtml = `
        <div style="font-family: inherit; padding: 4px; max-width: 220px; color: #1c1917;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6366f1;">
            Transit Hub · ${stop.code}
          </div>
          <div style="font-size: 13px; font-weight: 700; line-height: 1.3; margin-top: 2px;">
            ${stop.name}
          </div>
          <div style="font-size: 11px; color: #44403c; margin-top: 4px;">
            Lines: <strong>${stop.lines.join(', ')}</strong>
          </div>
        </div>
      `;
      m.bindPopup(popupHtml);
    });

    // 2. Add Community Places & School
    COMMUNITY_PLACES.forEach((place) => {
      const isSchool = place.category === 'school';
      const placeIcon = L.divIcon({
        className: 'leaflet-community-place-icon',
        html: `
          <div class="group relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl ${isSchool ? 'bg-amber-600' : 'bg-emerald-600'} text-white shadow-xl ring-2 ring-white hover:scale-110 transition-transform">
              <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${isSchool ? '<path d="m4 6 8-4 8 4"></path><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"></path><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"></path><path d="M18 5v17"></path><path d="M6 5v17"></path><circle cx="12" cy="9" r="2"></circle>' : '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>'}
              </svg>
            </div>
            <div class="absolute top-9 whitespace-nowrap rounded-md bg-stone-900/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md pointer-events-none">
              ${place.name.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const m = L.marker([place.lat, place.lng], { icon: placeIcon }).addTo(transitLayerGroupRef.current!);
      m.on('click', () => {
        setSelectedPlace(place);
      });

      const popupHtml = `
        <div style="font-family: inherit; padding: 4px; max-width: 240px; color: #1c1917;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${isSchool ? '#d97706' : '#059669'};">
            ${isSchool ? 'Designated Learning Hub' : 'Verified Youth Destination'}
          </div>
          <div style="font-size: 13px; font-weight: 700; line-height: 1.3; margin-top: 2px;">
            ${place.name}
          </div>
          <div style="font-size: 11px; color: #78716c; margin-top: 4px;">
            ${place.address}
          </div>
          <div style="font-size: 11px; color: #1c1917; margin-top: 4px;">
            ${place.description}
          </div>
        </div>
      `;
      m.bindPopup(popupHtml);
    });
  }, [showTransitLayer, setSelectedStop, setSelectedPlace]);

  // Render Geocache Markers on Leaflet
  useEffect(() => {
    if (!mapInstanceRef.current || !geocacheLayerGroupRef.current) return;

    geocacheLayerGroupRef.current.clearLayers();

    if (!showGeocachingLayer) return;

    geocaches.forEach((cache) => {
      const isFound = foundCacheIds.includes(cache.id);
      const isTarget = activeTargetCache?.id === cache.id;

      const cacheIcon = L.divIcon({
        className: 'leaflet-geocache-icon',
        html: `
          <div class="group relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer z-50">
            ${isTarget ? '<div class="absolute -inset-4 animate-pulse-ring rounded-full bg-[var(--color-neon-pink)]/50"></div>' : ''}
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl ${
              isFound
                ? 'bg-emerald-900/80 ring-2 ring-[var(--color-neon-green)]'
                : isTarget
                ? 'bg-[var(--color-game-panel)] ring-4 ring-[var(--color-neon-pink)] shadow-[0_0_20px_rgba(255,42,133,0.8)] animate-bounce-slight'
                : 'bg-gradient-to-br from-[var(--color-neon-blue)] to-purple-600 ring-2 ring-white shadow-[0_0_15px_rgba(0,240,255,0.5)]'
            } text-white transition-all transform hover:scale-110 hover:shadow-[0_0_25px_currentColor]">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>
            <div class="absolute top-14 whitespace-nowrap rounded-lg ${
              isFound ? 'bg-emerald-950/80 border-[var(--color-neon-green)]/50 text-[var(--color-neon-green)]' : 'bg-slate-900/90 border-[var(--color-neon-blue)]/50 text-white'
            } px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg pointer-events-none border backdrop-blur-md">
              ${isFound ? '✓ ' : '💎 '}${cache.name.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const m = L.marker([cache.lat, cache.lng], { icon: cacheIcon }).addTo(geocacheLayerGroupRef.current!);

      const popupHtml = `
        <div style="font-family: inherit; padding: 4px; max-width: 240px; color: #1c1917;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #d97706;">
              Geocache Quest · ${cache.county === 'snohomish' ? 'Snohomish' : 'King County'}
            </span>
            <span style="font-size: 10px; font-weight: 800; background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 9999px;">
              +${cache.xpReward} XP
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 700; line-height: 1.3; margin-top: 2px;">
            ${cache.name} ${isFound ? '✓ (Found)' : ''}
          </div>
          <div style="font-size: 11px; font-style: italic; color: #78716c; margin-top: 4px; background: #fffbeb; padding: 6px; border-radius: 8px; border: 1px solid #fde68a;">
            "${cache.clue}"
          </div>
          <div style="font-size: 11px; color: #57534e; margin-top: 4px;">
            Transit: <strong>${cache.nearestTransit}</strong>
          </div>
        </div>
      `;
      m.bindPopup(popupHtml);
    });
  }, [showGeocachingLayer, geocaches, foundCacheIds, activeTargetCache]);

  // Handle Active Ride Mode polyline & Moving Bus Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!activeRide) {
      if (ridePolylineRef.current) {
        mapInstanceRef.current.removeLayer(ridePolylineRef.current);
        ridePolylineRef.current = null;
      }
      if (rideBusMarkerRef.current) {
        mapInstanceRef.current.removeLayer(rideBusMarkerRef.current);
        rideBusMarkerRef.current = null;
      }
      return;
    }

    // 1. Draw Route Polyline
    if (!ridePolylineRef.current) {
      ridePolylineRef.current = L.polyline(activeRide.routePolyline, {
        color: '#6366f1',
        weight: 5,
        opacity: 0.9,
        dashArray: '8, 8',
      }).addTo(mapInstanceRef.current);
    } else {
      ridePolylineRef.current.setLatLngs(activeRide.routePolyline);
    }

    // 2. Draw Moving Bus Marker
    const busCoord: [number, number] = [activeRide.currentCoord.lat, activeRide.currentCoord.lng];
    const busIcon = L.divIcon({
      className: 'leaflet-moving-bus-icon',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <div class="absolute -inset-3 animate-ping rounded-full bg-emerald-500/40"></div>
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-700 text-white shadow-2xl ring-4 ring-emerald-400">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4C2.9 6 1.9 6.8 1.6 7.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2C.5 16.3.8 18 3 18h3"></path><circle cx="6.5" cy="17.5" r="2.5"></circle><circle cx="16.5" cy="17.5" r="2.5"></circle>
            </svg>
          </div>
          <div class="absolute -top-7 whitespace-nowrap rounded-md bg-indigo-900 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-lg">
            ${activeRide.busLine} (${activeRide.speedMph} mph)
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (rideBusMarkerRef.current) {
      rideBusMarkerRef.current.setLatLng(busCoord);
      rideBusMarkerRef.current.setIcon(busIcon);
    } else {
      rideBusMarkerRef.current = L.marker(busCoord, { icon: busIcon }).addTo(mapInstanceRef.current);
    }

    // Auto-pan map smoothly with the bus
    mapInstanceRef.current.panTo(busCoord, { animate: true, duration: 1.0 });
  }, [activeRide]);

  // Update Location Marker & Pan Camera for search
  useEffect(() => {
    if (!mapInstanceRef.current || !currentLocation) return;

    const latLng: [number, number] = [currentLocation.lat, currentLocation.lng];

    const zoom = currentLocation.granularity === 'ROOFTOP' ? 17 : 14;
    mapInstanceRef.current.flyTo(latLng, zoom, {
      duration: 1.5,
      easeLinearity: 0.25,
      noMoveStart: true,
    });

    const customIcon = L.divIcon({
      className: 'custom-leaflet-pin',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
          ${hasNearbyTargets ? `
            <div class="absolute -inset-10 animate-[ping_3s_ease-out_infinite] rounded-full bg-[var(--color-neon-pink)]/20 border border-[var(--color-neon-pink)]/40 shadow-[0_0_20px_rgba(255,42,133,0.5)]"></div>
            <div class="absolute -inset-5 animate-pulse rounded-full bg-[var(--color-neon-blue)]/30 border border-[var(--color-neon-blue)]/50"></div>
          ` : `
            <div class="absolute -inset-2 animate-ping rounded-full bg-indigo-500/40"></div>
          `}
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-white shadow-xl ring-2 ${hasNearbyTargets ? 'ring-[var(--color-neon-pink)]' : 'ring-white'}">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div class="absolute bottom-11 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-[11px] font-bold text-white shadow-lg">
            ${currentLocation.formattedAddress.split(',')[0]}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng(latLng);
      markerRef.current.setIcon(customIcon);
    } else {
      markerRef.current = L.marker(latLng, { icon: customIcon }).addTo(mapInstanceRef.current);
    }

    const popupHtml = `
      <div style="font-family: inherit; padding: 4px; max-width: 240px; color: #1c1917;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6366f1; margin-bottom: 2px;">
          ${currentLocation.granularity || 'Geocoded Target'}
        </div>
        <div style="font-size: 13px; font-weight: 700; line-height: 1.3;">
          ${currentLocation.formattedAddress}
        </div>
        <div style="font-family: monospace; font-size: 11px; color: #78716c; margin-top: 4px;">
          ${currentLocation.lat.toFixed(5)}°, ${currentLocation.lng.toFixed(5)}°
        </div>
      </div>
    `;

    markerRef.current.bindPopup(popupHtml).openPopup();
  }, [currentLocation, hasNearbyTargets]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full cursor-crosshair" />

      {/* Zero-Config Interactive Fallback Notice Overlay */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] max-w-sm rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-start gap-2 text-xs">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
          <div>
            <span className="font-bold text-stone-900 dark:text-stone-100">
              Interactive Geospatial Canvas
            </span>
            <p className="mt-0.5 text-[11px] text-stone-600 dark:text-stone-400 leading-snug">
              Point-to-point routing, live transit hubs, and real-time Ride Mode tracking are active. Click 2 points anywhere on the map to draw routes!
            </p>
            {onOpenKeySettings && (
              <button
                onClick={onOpenKeySettings}
                className="pointer-events-auto mt-2 inline-flex items-center gap-1 rounded bg-stone-900 dark:bg-stone-100 px-2 py-1 text-[10px] font-bold text-white dark:text-stone-900 hover:bg-stone-800"
              >
                <Key className="h-3 w-3" />
                Configure Google API Key
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MapContainer: React.FC<MapContainerProps> = ({
  currentLocation,
  apiKey,
  onOpenKeySettings,
  insightsLocationName,
  insightsHtml,
  isInsightsLoading,
  insightsError,
  onRefreshInsights,
}) => {
  const [mapType, setMapType] = useState<MapTypeStyle>('roadmap');
  const [showInfoWindow, setShowInfoWindow] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(14);
  const [gmpAuthFailed, setGmpAuthFailed] = useState<boolean>(false);
  const [youthEvents, setYouthEvents] = useState<any[]>([]);
  const [hasNearbyTargets, setHasNearbyTargets] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/youth-events/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '', county: 'all', category: 'all' })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.items) {
          setYouthEvents(data.items);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!currentLocation) {
      setHasNearbyTargets(false);
      return;
    }
    
    function deg2rad(deg: number) { return deg * (Math.PI/180); }
    function getDistanceInMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 3958.8; 
      const dLat = deg2rad(lat2-lat1);
      const dLon = deg2rad(lon2-lon1); 
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    }

    const nearbyCache = geocaches.some((c: any) => getDistanceInMiles(currentLocation.lat, currentLocation.lng, c.lat, c.lng) <= 1.0);
    const nearbyYouth = youthEvents.some((y: any) => getDistanceInMiles(currentLocation.lat, currentLocation.lng, y.lat, y.lng) <= 1.0);
    
    setHasNearbyTargets(nearbyCache || nearbyYouth);
  }, [currentLocation, geocaches, youthEvents]);

  const {
    showTransitLayer,
    setShowTransitLayer,
    activeRide,
    setSelectedStop,
    setSelectedPlace,
    handleMapClickForRoute,
    routeOrigin,
    routeDestination,
    geocaches,
    foundCacheIds,
    activeTargetCache,
    setActiveTargetCache,
    showGeocachingLayer,
    setShowGeocachingLayer,
    showYouthPlacesLayer,
    setShowYouthPlacesLayer,
    selectedYouthItem,
  } = useApp();

  // Catch Google Maps Authentication Failure (ApiProjectMapError / Missing Key)
  useEffect(() => {
    const handleAuthFailure = () => {
      console.warn('Google Maps JS API Authentication failed. Switching to resilient exploration canvas.');
      setGmpAuthFailed(true);
    };

    (window as any).gm_authFailure = handleAuthFailure;

    return () => {
      if ((window as any).gm_authFailure === handleAuthFailure) {
        delete (window as any).gm_authFailure;
      }
    };
  }, []);

  // Default fallback center (Seattle Transit Core)
  const defaultCenter = { lat: 47.6114, lng: -122.3370 };
  const activePosition = activeRide
    ? activeRide.currentCoord
    : currentLocation
    ? { lat: currentLocation.lat, lng: currentLocation.lng }
    : defaultCenter;

  useEffect(() => {
    if (currentLocation) {
      setShowInfoWindow(true);
    }
  }, [currentLocation]);

  // Use resilient fallback map if no valid API key or if Google Maps auth error occurred
  const useFallbackMap = !apiKey || gmpAuthFailed;

  return (
    <div id="interactive-map-wrapper" className="relative h-full w-full bg-stone-200 dark:bg-stone-900 overflow-hidden">
      {useFallbackMap ? (
        <LeafletFallbackMap
          currentLocation={currentLocation}
          mapType={mapType}
          onOpenKeySettings={onOpenKeySettings}
          hasNearbyTargets={hasNearbyTargets}
        />
      ) : (
        <APIProvider apiKey={apiKey}>
          <Map id="block-explorer-map" mapId="DEMO_MAP_ID"
            defaultCenter={defaultCenter}
            center={activePosition}
            defaultZoom={14}
            zoom={zoomLevel}
            onZoomChanged={(e) => setZoomLevel(e.detail.zoom)}
            onClick={(e) => {
              if (e.detail.latLng) {
                handleMapClickForRoute(e.detail.latLng.lat, e.detail.latLng.lng);
              }
            }}
            mapTypeId={mapType}
            disableDefaultUI={false}
            gestureHandling="greedy"
            style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
          >
            <GoogleMapCameraController
              currentLocation={currentLocation}
              activeRideCoord={activeRide?.currentCoord}
            />

            {/* Point A (Start) and Point B (End) on Google Maps */}
            {routeOrigin && (
              <Marker
                position={routeOrigin}
                title="Point A (Start)"
                label={{ text: 'A', color: '#ffffff', fontWeight: 'bold' }}
              />
            )}
            {routeDestination && (
              <Marker
                position={routeDestination}
                title="Point B (Destination)"
                label={{ text: 'B', color: '#ffffff', fontWeight: 'bold' }}
              />
            )}

            {/* Transit Stops Markers */}
            {showTransitLayer &&
              STOPS.map((stop) => (
                <Marker
                  key={stop.id}
                  position={{ lat: stop.lat, lng: stop.lng }}
                  onClick={() => setSelectedStop(stop)}
                  title={`${stop.name} (${stop.code})`}
                />
              ))}

            {/* Community Places & School Markers */}
            {showTransitLayer &&
              COMMUNITY_PLACES.map((place) => (
                <Marker
                  key={place.id}
                  position={{ lat: place.lat, lng: place.lng }}
                  onClick={() => setSelectedPlace(place)}
                  title={place.name}
                />
              ))}

            {/* Geocaches Markers */}
            {showGeocachingLayer &&
              geocaches.map((cache) => (
                <Marker
                  key={cache.id}
                  position={{ lat: cache.lat, lng: cache.lng }}
                  onClick={() => setActiveTargetCache(cache)}
                  title={`Geocache: ${cache.name} (+${cache.xpReward} XP)`}
                />
              ))}

            {/* Active Moving Bus Marker in Ride Mode */}
            {activeRide && (
              <Marker
                position={activeRide.currentCoord}
                title={`${activeRide.busLine} to ${activeRide.destinationName}`}
              />
            )}

            {currentLocation && (
              <AdvancedMarker
                position={activePosition}
                onClick={() => setShowInfoWindow(!showInfoWindow)}
                title={currentLocation.formattedAddress}
              >
                <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
                  {hasNearbyTargets ? (
                    <>
                      <div className="absolute -inset-10 animate-[ping_3s_ease-out_infinite] rounded-full bg-[var(--color-neon-pink)]/20 border border-[var(--color-neon-pink)]/40 shadow-[0_0_20px_rgba(255,42,133,0.5)]"></div>
                      <div className="absolute -inset-5 animate-pulse rounded-full bg-[var(--color-neon-blue)]/30 border border-[var(--color-neon-blue)]/50"></div>
                    </>
                  ) : (
                    <div className="absolute -inset-2 animate-ping rounded-full bg-indigo-500/40"></div>
                  )}
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-white shadow-xl ring-2 ${hasNearbyTargets ? 'ring-[var(--color-neon-pink)]' : 'ring-white'}`}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {currentLocation && showInfoWindow && (
              <InfoWindow
                position={activePosition}
                onCloseClick={() => setShowInfoWindow(false)}
                pixelOffset={[0, -35]}
              >
                <div className="max-w-[280px] p-1 text-stone-900">
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    <MapPin className="h-3 w-3 text-indigo-600" />
                    <span>{currentLocation.granularity || 'Geocoded Target'}</span>
                  </div>
                  <h4 className="mt-1 text-sm font-bold leading-snug">
                    {currentLocation.formattedAddress}
                  </h4>
                  <p className="mt-1 font-mono text-[11px] text-stone-500">
                    {currentLocation.lat.toFixed(5)}°, {currentLocation.lng.toFixed(5)}°
                  </p>
                  <div className="mt-2.5 flex items-center justify-between border-t border-stone-200 pt-2 text-[11px]">
                    <span className="text-stone-400">Google Geocoding V4</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${currentLocation.lat},${currentLocation.lng}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-semibold text-indigo-600 hover:underline"
                    >
                      Open in Maps →
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      )}

      {/* Floating Custom HUD Controls */}
      <div className="pointer-events-none absolute inset-x-0 top-4 z-[600] flex justify-between px-4">
        {/* Top Left: Map Style Selector, Transit Layer Toggle & Route Planner Trigger */}
        <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 p-1 shadow-lg backdrop-blur-md">
            {(['roadmap', 'satellite', 'hybrid', 'terrain'] as MapTypeStyle[]).map((type) => (
              <button
                key={type}
                id={`btn-map-type-${type}`}
                onClick={() => setMapType(type)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                  mapType === type
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            id="btn-toggle-transit-layer"
            onClick={() => setShowTransitLayer(!showTransitLayer)}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all ${
              showTransitLayer
                ? 'border-indigo-500 bg-indigo-600 text-white'
                : 'border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
            }`}
            title="Toggle transit hubs and community destinations on the map"
          >
            <Bus className="h-3.5 w-3.5" />
            <span>Transit</span>
          </button>

          <button
            id="btn-toggle-geocaching-layer"
            onClick={() => setShowGeocachingLayer(!showGeocachingLayer)}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all ${
              showGeocachingLayer
                ? 'border-amber-500 bg-amber-500 text-white'
                : 'border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
            }`}
            title="Toggle geocaching quest targets on the map"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              Geocaches ({foundCacheIds.length}/{geocaches.length})
            </span>
          </button>
        </div>

        {/* Top Right: Telemetry, Attribution & Route Planner HUD Trigger */}
        <div className="pointer-events-auto flex items-center gap-2">
          <RoutePlannerCard />

          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 px-3 py-1.5 text-xs font-mono text-stone-700 dark:text-stone-300 shadow-lg backdrop-blur-md">
            <Compass className="h-3.5 w-3.5 text-stone-400" />
            <span>
              {activePosition.lat.toFixed(4)}°, {activePosition.lng.toFixed(4)}°
            </span>
          </div>
        </div>
      </div>

      {/* Floating Active Ride Mode HUD */}
      {activeRide && (
        <div
          id="map-ride-mode-overlay"
          className="pointer-events-none absolute inset-x-0 top-18 z-[650] flex justify-center px-4"
        >
          <RideModeHud />
        </div>
      )}

      {/* Bottom Portion of Map Screen: Local Insights Banner */}
      {!activeRide && (insightsLocationName || isInsightsLoading || insightsHtml || insightsError) && (
        <div
          id="map-local-insights-overlay"
          className="pointer-events-none absolute inset-x-0 bottom-20 lg:bottom-6 z-[600] flex justify-center px-4"
        >
          <div className="pointer-events-auto w-full max-w-xl">
            <LocalInsightsBanner
              locationName={insightsLocationName}
              insightsHtml={insightsHtml}
              isLoading={isInsightsLoading}
              error={insightsError}
              onRefresh={onRefreshInsights}
            />
          </div>
        </div>
      )}
    </div>
  );
};

