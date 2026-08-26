import React from 'react';
import {
  AlertTriangle,
  Award,
  Bus,
  CheckCircle2,
  ChevronRight,
  Compass,
  MapPin,
  Navigation,
  Radio,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../services/transitStore';

export const RideModeHud: React.FC = () => {
  const { activeRide, endRide, addScoutPoints, schoolName } = useApp();

  if (!activeRide) return null;

  const isNearArrival = activeRide.progress >= 0.85;

  const handleClaimRidePoints = () => {
    addScoutPoints(100);
    endRide();
  };

  return (
    <div
      id="ride-mode-hud"
      className="pointer-events-auto w-full max-w-lg rounded-2xl border border-indigo-500/40 bg-stone-950/90 p-4 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 ring-1 ring-white/10"
    >
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <Bus className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                Ride Mode Active
              </span>
              <span className="rounded bg-indigo-950 px-1.5 py-0.2 text-[10px] font-bold text-indigo-300 border border-indigo-800/60">
                {activeRide.busLine}
              </span>
            </div>
            <p className="text-xs font-bold text-stone-200">
              To {activeRide.destinationName}
            </p>
          </div>
        </div>

        <button
          id="btn-exit-ride-mode"
          onClick={endRide}
          className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
          title="Exit Ride Mode"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar & ETA */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-1.5">
          <span>{Math.round(activeRide.progress * 100)}% route complete</span>
          <span className="font-bold text-white">
            {activeRide.isComplete ? 'Arrived' : `ETA: ~${activeRide.etaMinutes} min`}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 transition-all duration-700 ease-out"
            style={{ width: `${Math.round(activeRide.progress * 100)}%` }}
          />
        </div>
      </div>

      {/* Ride Metrics Grid */}
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-stone-900/80 p-2.5 text-center text-xs">
        <div>
          <span className="text-[10px] uppercase text-stone-400">Speed</span>
          <p className="font-mono font-bold text-stone-100">{activeRide.speedMph} mph</p>
        </div>
        <div>
          <span className="text-[10px] uppercase text-stone-400">Next Hub</span>
          <p className="font-semibold text-stone-100 truncate">{activeRide.nextStopName.split(' ')[0]}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase text-stone-400">Youth Fare</span>
          <p className="font-bold text-emerald-400">$0.00 Free</p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Parent live check-in active</span>
        </div>

        {isNearArrival ? (
          <button
            onClick={handleClaimRidePoints}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-all animate-bounce"
          >
            <Award className="h-3.5 w-3.5" />
            Check-in (+100 pts)
          </button>
        ) : (
          <button
            onClick={endRide}
            className="rounded-lg bg-stone-800 hover:bg-stone-700 px-2.5 py-1.5 text-xs font-semibold text-stone-300 transition-colors"
          >
            End Trip
          </button>
        )}
      </div>
    </div>
  );
};
