import React from 'react';
import {
  Award,
  Bus,
  CheckCircle2,
  Compass,
  Landmark,
  MapPin,
  School,
  Sparkles,
  X,
} from 'lucide-react';
import { COMMUNITY_PLACES, CommunityPlace, EVENTS } from '../data/transitCatalog';
import { useApp } from '../services/transitStore';

interface PlacesExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlaceOnMap: (lat: number, lng: number, place: CommunityPlace) => void;
}

export const PlacesExplorerModal: React.FC<PlacesExplorerModalProps> = ({
  isOpen,
  onClose,
  onSelectPlaceOnMap,
}) => {
  const { startRide } = useApp();

  if (!isOpen) return null;

  const getCategoryIcon = (category: CommunityPlace['category']) => {
    switch (category) {
      case 'school':
        return <School className="h-4 w-4 text-indigo-500" />;
      case 'museum':
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      case 'library':
        return <Landmark className="h-4 w-4 text-emerald-500" />;
      default:
        return <MapPin className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div
      id="places-explorer-modal"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-6 py-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Community Transit Network
            </span>
            <h2 className="font-display text-xl font-bold">
              Youth Destinations & Free Hubs
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Places List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {COMMUNITY_PLACES.map((place) => {
            const placeEvents = EVENTS.filter((e) => e.placeId === place.id);
            return (
              <div
                key={place.id}
                className="group rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850/70 p-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white dark:bg-stone-800 p-2.5 shadow-sm border border-stone-200/80 dark:border-stone-700">
                      {getCategoryIcon(place.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
                          {place.name}
                        </h3>
                        <span className="rounded bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                          Free Admission
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {place.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectPlaceOnMap(place.lat, place.lng, place);
                        onClose();
                      }}
                      className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    >
                      Show on Map
                    </button>
                    <button
                      onClick={() => {
                        startRide(place.id);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
                    >
                      <Bus className="h-3.5 w-3.5" />
                      Ride Here
                    </button>
                  </div>
                </div>

                <p className="mt-2.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {place.description}
                </p>

                {placeEvents.length > 0 && (
                  <div className="mt-3 rounded-xl bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 p-2.5 text-xs">
                    <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                      Featured Activity
                    </span>
                    <p className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5">
                      {placeEvents[0].title} · {placeEvents[0].when}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
