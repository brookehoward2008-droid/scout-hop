import React, { useState } from 'react';
import {
  Car,
  CheckCircle2,
  Copy,
  Footprints,
  HelpCircle,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Route as RouteIcon,
  Trash2,
  X,
} from 'lucide-react';
import { formatDistance, formatDuration } from '../services/routing';
import { useApp } from '../services/transitStore';
import { TravelMode } from '../types';

interface RoutePlannerCardProps {
  embedded?: boolean;
}

export const RoutePlannerCard: React.FC<RoutePlannerCardProps> = ({ embedded = false }) => {
  const [isCopied, setIsCopied] = useState(false);
  const {
    isRoutePlanningActive,
    setIsRoutePlanningActive,
    travelMode,
    setTravelMode,
    routeOrigin,
    routeDestination,
    calculatedRoute,
    isRouteCalculating,
    routeError,
    clearRoute,
  } = useApp();

  if (!isRoutePlanningActive && !embedded) {
    return (
      <button
        id="btn-open-route-planner"
        onClick={() => setIsRoutePlanningActive(true)}
        className="pointer-events-auto flex items-center gap-2 rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 px-3.5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all hover:bg-stone-50 dark:hover:bg-stone-900 active:scale-95"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-500 text-white">
          <RouteIcon className="h-3.5 w-3.5" />
        </div>
        <span>Measure & Draw Route</span>
      </button>
    );
  }

  const handleShareRoute = () => {
    if (!routeOrigin || !routeDestination) return;
    const url = new URL(window.location.href);
    url.searchParams.set('origin', `${routeOrigin.lat},${routeOrigin.lng}`);
    url.searchParams.set('destination', `${routeDestination.lat},${routeDestination.lng}`);
    url.searchParams.set('mode', travelMode);
    
    navigator.clipboard.writeText(url.toString()).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const stepStatus = !routeOrigin
    ? 'Click Point A on the map'
    : !routeDestination
    ? 'Click Point B on the map'
    : 'Route calculated & drawn on map!';

  return (
    <div
      id="route-planner-hud"
      className={`pointer-events-auto w-full ${
        embedded
          ? 'rounded-xl border border-stone-200/80 dark:border-stone-800 bg-[var(--color-game-panel)] p-3 shadow-xs'
          : 'max-w-md rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-sm">
            <RouteIcon className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="font-display text-xs sm:text-sm font-bold text-stone-950 dark:text-white">
              {embedded ? 'Click 2 Points on Map' : 'Point-to-Point Route Calculator'}
            </h3>
            {!embedded && (
              <p className="text-[10px] sm:text-[11px] text-[var(--color-neon-pink)]">
                Click 2 points on the map to calculate distance & directions
              </p>
            )}
          </div>
        </div>

        {!embedded && (
          <button
            id="btn-close-route-planner"
            onClick={() => {
              setIsRoutePlanningActive(false);
            }}
            className="rounded-lg p-1 text-slate-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors"
            title="Close Route Planner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Travel Mode Selector (Walking vs Driving) */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex rounded-xl bg-stone-100 dark:bg-stone-900 p-1">
          <button
            id="btn-mode-walk"
            onClick={() => setTravelMode('WALK')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              travelMode === 'WALK'
                ? 'bg-[var(--color-neon-green)] text-white shadow-sm'
                : 'text-slate-300 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Footprints className="h-3.5 w-3.5" />
            <span>Walking</span>
          </button>
          <button
            id="btn-mode-drive"
            onClick={() => setTravelMode('DRIVE')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              travelMode === 'DRIVE'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>Driving</span>
          </button>
        </div>

        {(routeOrigin || routeDestination) && (
          <button
            id="btn-clear-route-points"
            onClick={clearRoute}
            className="flex items-center gap-1 rounded-lg border border-[var(--color-neon-blue)]/30 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:text-slate-500 dark:hover:bg-stone-900 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Reset Points</span>
          </button>
        )}
      </div>

      {/* Interactive Step Instructions */}
      <div className="mt-3 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/50 p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                routeOrigin ? 'bg-[var(--color-neon-green)] text-white' : 'border border-dashed border-stone-400 text-slate-400'
              }`}
            >
              A
            </div>
            <span className="font-medium text-slate-200 truncate">
              {routeOrigin
                ? `${routeOrigin.lat.toFixed(4)}°, ${routeOrigin.lng.toFixed(4)}°`
                : 'Click map for Point A'}
            </span>
          </div>

          <div className="text-slate-500">→</div>

          <div className="flex items-center gap-2 text-xs">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                routeDestination
                  ? 'bg-indigo-500 text-white'
                  : 'border border-dashed border-stone-400 text-slate-400'
              }`}
            >
              B
            </div>
            <span className="font-medium text-slate-200 truncate">
              {routeDestination
                ? `${routeDestination.lat.toFixed(4)}°, ${routeDestination.lng.toFixed(4)}°`
                : 'Click map for Point B'}
            </span>
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] font-medium text-[var(--color-neon-pink)]">
          {stepStatus}
        </p>
      </div>

      {/* Loading Indicator */}
      {isRouteCalculating && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Computing {travelMode.toLowerCase()} path & road geometry...</span>
        </div>
      )}

      {/* Route Error Notice */}
      {routeError && (
        <div className="mt-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs text-rose-800 dark:text-rose-200">
          <p className="font-bold">Could not calculate route</p>
          <p className="text-[11px] mt-0.5">{routeError}</p>
        </div>
      )}

      {/* Calculated Route Results Card */}
      {calculatedRoute && !isRouteCalculating && (
        <div className="mt-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-neon-green)]">
                {travelMode === 'WALK' ? 'Walking Path' : 'Driving Path'}
              </span>
            </div>
            <span className="rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900 dark:text-emerald-200">
              {calculatedRoute.polyline.length} Waypoints
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 text-white">
            <div className="rounded-lg bg-white/80 dark:bg-stone-900/80 p-2 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="text-[10px] font-bold text-[var(--color-neon-pink)] uppercase">
                Total Distance
              </span>
              <p className="font-mono text-base font-bold text-stone-900 dark:text-white">
                {formatDistance(calculatedRoute.distanceMeters)}
              </p>
            </div>

            <div className="rounded-lg bg-white/80 dark:bg-stone-900/80 p-2 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="text-[10px] font-bold text-[var(--color-neon-pink)] uppercase">
                Estimated Time
              </span>
              <p className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400">
                {formatDuration(calculatedRoute.durationSeconds)}
              </p>
            </div>
          </div>
          
          <div className="mt-3">
            <button
              onClick={handleShareRoute}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--color-neon-green)]/40 bg-slate-900/50 py-2 text-xs font-bold text-[var(--color-neon-green)] transition-colors hover:bg-[var(--color-neon-green)]/20 hover:bg-[var(--color-neon-green)]/30"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  <span>Share Route</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
