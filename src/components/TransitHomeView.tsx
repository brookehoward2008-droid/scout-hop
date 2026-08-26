import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  Bus,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  MapPin,
  Navigation,
  Radio,
  School,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  COMMUNITY_PLACES,
  EVENTS,
  HOW_TO_RIDE,
  STOPS,
  TransitArrival,
  arrivalsForStop,
  formatMinutes,
  placeById,
} from '../data/transitCatalog';
import { useApp } from '../services/transitStore';
import { RoutePlannerCard } from './RoutePlannerCard';

interface TransitHomeViewProps {
  onFocusMapCoord?: (lat: number, lng: number, zoom?: number) => void;
  onOpenPlacesView?: () => void;
  onOpenGeocaching?: () => void;
  onOpenYouthEvents?: () => void;
}

export const TransitHomeView: React.FC<TransitHomeViewProps> = ({
  onFocusMapCoord,
  onOpenPlacesView,
  onOpenGeocaching,
  onOpenYouthEvents,
}) => {
  const {
    displayName,
    hasOrca,
    setHasOrca,
    schoolName,
    startRide,
    scoutPoints,
    selectedStop,
    setSelectedStop,
    selectedPlace,
    setSelectedPlace,
    checkInAtLocation,
    checkedInEvents,
    activeRide,
    foundCacheIds,
    geocaches,
    badges,
  } = useApp();

  const [now, setNow] = useState<Date>(() => new Date());
  const [checkInNotice, setCheckInNotice] = useState<string | null>(null);

  // Update live arrival times every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeHub = selectedStop || STOPS[0];
  const arrivals: TransitArrival[] = arrivalsForStop(activeHub, now);

  const handleStopSelect = (stop: typeof STOPS[0]) => {
    setSelectedStop(stop);
    if (onFocusMapCoord) {
      onFocusMapCoord(stop.lat, stop.lng, 16);
    }
  };

  const handlePlaceSelect = (placeId: string) => {
    const place = placeById(placeId);
    if (place) {
      setSelectedPlace(place);
      if (onFocusMapCoord) {
        onFocusMapCoord(place.lat, place.lng, 16);
      }
    }
  };

  const handleEventCheckIn = (eventId: string, title: string, pts: number) => {
    const success = checkInAtLocation(eventId, title, pts);
    if (success) {
      setCheckInNotice(`+${pts} Scout Points earned! Checked in at ${title}`);
      setTimeout(() => setCheckInNotice(null), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-white">
      {/* Toast Notice */}
      {checkInNotice && (
        <div className="animate-in fade-in slide-in-from-top duration-200 flex items-center gap-2 rounded-xl bg-[var(--color-neon-green)] px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{checkInNotice}</span>
        </div>
      )}

      {/* Hero: Hi {name} / Ride free today */}
      <section className="rounded-2xl border border-indigo-500/30 bg-[var(--color-game-panel)] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[var(--color-neon-pink)]">
            Hi {displayName}
          </p>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <Award className="h-3.5 w-3.5" />
            <span>{scoutPoints} Scout Pts</span>
          </div>
        </div>

        <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-neon-blue)]">
          Ride free today.
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {hasOrca
            ? 'Tap your Youth ORCA when you board. If you forget it, still hop on.'
            : 'No ORCA card needed. Board the bus or Link and ride free.'}
        </p>

        {/* Quick ORCA Card Toggle */}
        <div className="mt-3.5 flex items-center justify-between border-t border-[var(--color-neon-blue)]/30 pt-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300 dark:text-stone-400">
            <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Youth ORCA Pass</span>
          </div>
          <button
            onClick={() => setHasOrca(!hasOrca)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
              hasOrca
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-700 text-slate-200 dark:bg-stone-800 dark:text-stone-300'
            }`}
          >
            {hasOrca ? 'Card Active' : 'No Card'}
          </button>
        </div>
      </section>

      {/* Interactive Geocaching Quest & Youth Discovery API Launchers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Geocaching Game Launcher */}
        <button
          id="btn-open-geocaching-banner"
          onClick={onOpenGeocaching}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-300/80 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/90 via-amber-100/40 to-white dark:from-amber-950/40 dark:via-stone-900 dark:to-stone-900 p-4 text-left shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-700 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md group-hover:scale-105 transition-transform">
              <Compass className="h-5 w-5 animate-pulse" />
            </div>
            <span className="rounded-full bg-amber-200/80 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-[10px] font-extrabold px-2 py-0.5 border border-amber-300 dark:border-amber-800">
              {foundCacheIds.length} / {geocaches.length} Found
            </span>
          </div>

          <div className="mt-3">
            <h3 className="font-display text-sm font-bold text-[var(--color-neon-blue)] flex items-center justify-between">
              <span>GeoScout Quest</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                Play →
              </span>
            </h3>
            <p className="mt-1 text-[11px] text-slate-300 leading-snug">
              Hunt digital caches at transit hubs & trade swag across King & Snohomish!
            </p>
          </div>
        </button>

        {/* Youth Discovery Finder Launcher */}
        <button
          id="btn-open-youth-events-banner"
          onClick={onOpenYouthEvents}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white dark:from-indigo-950/40 dark:via-stone-900 dark:to-stone-900 p-4 text-left shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-[var(--color-neon-green)]/20 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 border border-emerald-300 dark:border-emerald-800">
              100% Free
            </span>
          </div>

          <div className="mt-3">
            <h3 className="font-display text-sm font-bold text-[var(--color-neon-blue)] flex items-center justify-between">
              <span>Youth Centers & Events</span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                Search API →
              </span>
            </h3>
            <p className="mt-1 text-[11px] text-slate-300 leading-snug">
              Find teen rooms, free STEM labs, open gyms & community events.
            </p>
          </div>
        </button>
      </div>

      {/* Point-to-Point Walking / Driving Route Planner Card */}
      <section className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/40 dark:to-purple-950/20 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Navigation className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-white">
                Map Route Calculator
              </h2>
              <p className="text-[11px] text-[var(--color-neon-pink)]">
                Click 2 points on the map to calculate walking or driving routes
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <RoutePlannerCard embedded />
        </div>
      </section>

      {/* Live Departures from Hub */}
      <section className="rounded-2xl border border-indigo-500/30 bg-[var(--color-game-panel)] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Radio className="h-3 w-3 animate-pulse" />
              Next from {activeHub.name}
            </p>
            <h2 className="font-display text-lg font-bold text-white">
              Live departures
            </h2>
          </div>
          <Clock className="h-4 w-4 text-stone-400" />
        </div>

        {/* Hub Selector Pills */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {STOPS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleStopSelect(s)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeHub.id === s.id
                  ? 'bg-[var(--color-neon-blue)] text-slate-900 dark:bg-slate-800 dark:text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
              }`}
            >
              {s.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Arrivals List */}
        <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800/80">
          {arrivals.slice(0, 5).map((a, i) => (
            <li
              key={`${a.routeId}-${i}`}
              className="flex items-center justify-between gap-2.5 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-800/40 rounded-lg px-1.5 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  style={{ borderColor: a.color || '#6366f1' }}
                  className="rounded-md border-l-4 bg-slate-800 px-2 py-0.5 text-xs font-bold tabular-nums text-white"
                >
                  {a.shortName}
                </span>
                <span className="truncate text-xs font-medium text-slate-300 dark:text-stone-400">
                  {a.headsign}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${
                    a.isLive
                      ? 'bg-[var(--color-neon-green)]/20 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : 'bg-slate-800 text-slate-200 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  {a.isLive ? 'Live' : 'Sched'}
                </span>
                <span className="w-14 text-right text-xs font-bold tabular-nums text-white">
                  {formatMinutes(a.minutes)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-2.5 text-[11px] text-slate-400">
          Times refresh every second. Live when the transit agency is reporting.
        </p>
      </section>

      {/* School Ride Card */}
      <section className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-sm">
            <School className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white">
                {schoolName}
              </h2>
              <span className="rounded bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                +100 pts
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Highest scout points for showing up. Parents see the check-in.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                id="btn-ride-to-school"
                onClick={() => startRide('school')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--color-neon-pink)] to-purple-600 hover:scale-105 transition-transform px-3 py-2 text-xs font-bold text-white shadow-sm transition-all"
              >
                <Bus className="h-3.5 w-3.5" />
                Ride to school
              </button>
              {onOpenPlacesView && (
                <button
                  id="btn-other-places"
                  onClick={onOpenPlacesView}
                  className="rounded-xl border border-[var(--color-neon-pink)]/40 bg-white dark:bg-stone-900 px-3 py-2 text-xs font-semibold text-slate-200 dark:text-stone-300 hover:bg-slate-800 dark:hover:bg-stone-800 transition-colors"
                >
                  Other places
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Free This Week: Community Events & Verified Locations */}
      <section className="rounded-2xl border border-indigo-500/30 bg-[var(--color-game-panel)] p-4 shadow-sm">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Community Hubs
            </p>
            <h2 className="font-display text-lg font-bold text-white">
              Free this week
            </h2>
          </div>
          {onOpenPlacesView && (
            <button
              onClick={onOpenPlacesView}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All places →
            </button>
          )}
        </div>

        <ul className="flex flex-col gap-2.5">
          {EVENTS.slice(0, 4).map((ev) => {
            const place = placeById(ev.placeId);
            const isCheckedIn = checkedInEvents.includes(ev.id);
            return (
              <li
                key={ev.id}
                className="rounded-xl border border-[var(--color-neon-blue)]/30 bg-slate-800/50 p-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-white">
                      {ev.title}
                    </p>
                    <p className="text-[11px] font-medium text-[var(--color-neon-pink)] mt-0.5">
                      {place?.name} · {ev.when}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-[var(--color-neon-green)]/20 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    Verified
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                  {ev.blurb}
                </p>

                <div className="mt-2.5 flex items-center justify-between border-t border-stone-200/60 dark:border-stone-800/80 pt-2 text-xs">
                  <button
                    onClick={() => handlePlaceSelect(ev.placeId)}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <MapPin className="h-3 w-3" />
                    View on Map
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEventCheckIn(ev.id, ev.title, ev.points)}
                      disabled={isCheckedIn}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                        isCheckedIn
                          ? 'bg-[var(--color-neon-green)]/20 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-[var(--color-neon-blue)] text-slate-900 dark:bg-slate-800 dark:text-white hover:bg-stone-800'
                      }`}
                    >
                      <Award className="h-3 w-3" />
                      {isCheckedIn ? 'Checked In' : `Check-In (+${ev.points} pts)`}
                    </button>
                    <button
                      onClick={() => startRide(ev.placeId)}
                      className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 p-1 text-indigo-600 dark:text-indigo-400"
                      title="Start ride to this event"
                    >
                      <Bus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* How to Ride Steps */}
      <section className="rounded-2xl border border-indigo-500/30 bg-[var(--color-game-panel)] p-4 shadow-sm">
        <h2 className="font-display text-lg font-bold text-white">
          How to ride
        </h2>
        <ol className="mt-3 flex flex-col gap-3">
          {HOW_TO_RIDE.map((step, i) => (
            <li key={step.title} className="flex gap-3 items-start">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 font-mono text-xs font-bold text-slate-300 border border-stone-200 dark:border-stone-700">
                {i + 1}
              </span>
              <div>
                <p className="text-xs font-bold text-white">
                  {step.title}
                </p>
                <p className="text-xs text-[var(--color-neon-pink)] leading-relaxed mt-0.5">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Start Ride Mode Floating/Bottom Action */}
      {!activeRide && (
        <button
          id="btn-start-ride-mode"
          onClick={() => startRide('school')}
          className="mb-2 flex items-center justify-between rounded-2xl bg-gradient-to-r from-[var(--color-neon-pink)] to-purple-600 hover:scale-105 transition-transform px-4 py-4 text-white shadow-xl transition-all group"
        >
          <span className="flex items-center gap-2.5 font-bold text-sm">
            <Bus className="h-5 w-5" />
            Start Ride Mode
          </span>
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
};
