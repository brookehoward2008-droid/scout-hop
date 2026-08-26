import React, { useState } from 'react';
import {
  Check,
  Compass,
  Copy,
  ExternalLink,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
} from 'lucide-react';
import { PRESET_LOCATIONS } from '../data/presets';
import { GeocodedLocationData } from '../types';

interface LocationDetailsProps {
  location: GeocodedLocationData;
  onCenterMap: () => void;
  onZoomToBlock: () => void;
}

export const LocationDetails: React.FC<LocationDetailsProps> = ({
  location,
  onCenterMap,
  onZoomToBlock,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const matchedPreset = PRESET_LOCATIONS.find(
    (p) =>
      p.id === location.placeId ||
      p.name.toLowerCase() === location.query.toLowerCase() ||
      p.query.toLowerCase() === location.query.toLowerCase()
  );

  const handleCopyCoords = () => {
    const text = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(location, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div
      id="location-inspection-panel"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-sm transition-all"
    >
      {/* Header with Title & Granularity Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <MapPin className="h-3 w-3" />
              {location.granularity || 'Geocoded'}
            </span>
            {location.isFallback && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                Preset Preview
              </span>
            )}
            {matchedPreset && (
              <span className="rounded-full bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                {matchedPreset.tag}
              </span>
            )}
          </div>
          <h3 className="mt-2 text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 line-clamp-2">
            {location.formattedAddress}
          </h3>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Searched: <span className="font-mono font-medium">"{location.query}"</span>
          </p>
        </div>
      </div>

      {/* Preset Description & Highlights if applicable */}
      {matchedPreset && (
        <div className="mt-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3 text-xs text-stone-600 dark:text-stone-300">
          <p className="leading-relaxed">{matchedPreset.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 pt-2 border-t border-stone-200/80 dark:border-stone-700/60">
            <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">Key Landmarks:</span>
            {matchedPreset.highlights.map((item, idx) => (
              <span
                key={idx}
                className="rounded bg-white dark:bg-stone-700 px-1.5 py-0.5 text-[11px] font-medium text-stone-700 dark:text-stone-200 border border-stone-200/60 dark:border-stone-600/60"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Coordinate Telemetry Grid */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/40 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Latitude
          </span>
          <p className="mt-0.5 font-mono text-sm font-bold text-stone-900 dark:text-stone-100">
            {location.lat.toFixed(6)}°
          </p>
        </div>
        <div className="rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/40 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Longitude
          </span>
          <p className="mt-0.5 font-mono text-sm font-bold text-stone-900 dark:text-stone-100">
            {location.lng.toFixed(6)}°
          </p>
        </div>
      </div>

      {/* Viewport Bounds if available */}
      {location.viewport && (
        <div className="mt-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/20 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-stone-700 dark:text-stone-300">
            <Compass className="h-3.5 w-3.5 text-stone-500" />
            <span>Geocoding V4 Bounding Viewport</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-stone-600 dark:text-stone-400">
            <div>
              <span className="text-stone-400">N:</span> {location.viewport.north.toFixed(5)}°
            </div>
            <div>
              <span className="text-stone-400">E:</span> {location.viewport.east.toFixed(5)}°
            </div>
            <div>
              <span className="text-stone-400">S:</span> {location.viewport.south.toFixed(5)}°
            </div>
            <div>
              <span className="text-stone-400">W:</span> {location.viewport.west.toFixed(5)}°
            </div>
          </div>
        </div>
      )}

      {/* Address Components Chips */}
      {location.components && location.components.length > 0 && (
        <div className="mt-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Identified Components
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {location.components.map((comp, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md bg-stone-100 dark:bg-stone-800 px-2 py-1 text-[11px] text-stone-700 dark:text-stone-300 border border-stone-200/50 dark:border-stone-700/50"
                title={`Types: ${comp.types.join(', ')}`}
              >
                <span className="font-medium">{comp.longText || comp.shortText}</span>
                {comp.types[0] && (
                  <span className="text-[9px] text-stone-400 dark:text-stone-500">
                    ({comp.types[0].replace(/_/g, ' ')})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
        <button
          id="btn-recenter-map"
          onClick={onCenterMap}
          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-white transition-colors"
        >
          <Navigation className="h-3.5 w-3.5" />
          Center Camera
        </button>

        <button
          id="btn-zoom-block"
          onClick={onZoomToBlock}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Zoom to Block (16x)
        </button>

        <button
          id="btn-copy-coords"
          onClick={handleCopyCoords}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-700 px-2.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title="Copy lat, lng to clipboard"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Coords'}
        </button>

        <button
          id="btn-copy-json"
          onClick={handleCopyJson}
          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 dark:border-stone-700 px-2.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title="Copy Geocoding JSON data"
        >
          {copiedJson ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Layers className="h-3.5 w-3.5" />}
          {copiedJson ? 'Copied JSON' : 'JSON'}
        </button>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
          target="_blank"
          rel="noreferrer noopener"
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
        >
          <span>Google Maps</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};
