import React, { useEffect, useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Filter,
  Flame,
  Globe,
  Info,
  Layers,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../services/transitStore';
import { YouthDiscoveryItem } from '../types';

interface YouthDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOnMap?: (lat: number, lng: number, zoom?: number) => void;
}

export const YouthDiscoveryModal: React.FC<YouthDiscoveryModalProps> = ({
  isOpen,
  onClose,
  onSelectOnMap,
}) => {
  const { setSelectedYouthItem, addScoutPoints } = useApp();
  const [items, setItems] = useState<YouthDiscoveryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [countyFilter, setCountyFilter] = useState<'all' | 'king' | 'snohomish'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'directory' | 'ai_search'>('directory');

  const categories = [
    { id: 'all', label: 'All Places & Events' },
    { id: 'youth_center', label: 'Youth & Teen Centers' },
    { id: 'free_event', label: 'Advertised Free Events' },
    { id: 'maker_space', label: 'Tech & STEM Labs' },
    { id: 'sports_rec', label: 'Sports & Open Gym' },
    { id: 'arts_culture', label: 'Arts, Music & Culture' },
    { id: 'teen_room', label: 'Library Teen Lounges' },
  ];

  const fetchYouthPlaces = async (customQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/youth-events/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: customQuery !== undefined ? customQuery : searchQuery,
          county: countyFilter,
          category: categoryFilter,
        }),
      });

      const data = await response.json();
      if (response.ok && data.items) {
        setItems(data.items);
      } else {
        setError(data.message || 'Failed to load youth centers.');
      }
    } catch (err: any) {
      console.error('Fetch youth items error:', err);
      setError('Network error while searching youth places.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when county or category changes
  useEffect(() => {
    if (isOpen) {
      fetchYouthPlaces();
    }
  }, [isOpen, countyFilter, categoryFilter]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-youth-discovery"
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 px-6 py-4 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 dark:from-indigo-950/40 dark:via-stone-900 dark:to-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-stone-950 dark:text-white flex items-center gap-2">
                Youth Centers & Free Events API Finder
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-300 dark:border-emerald-800">
                  Verified 100% Free
                </span>
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Discover teen life centers, advertised free community days, STEM labs, and open gyms across King & Snohomish.
              </p>
            </div>
          </div>

          <button
            id="btn-close-youth-modal"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Bar & Search Input */}
        <div className="border-b border-stone-100 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-900/90 px-6 py-3 space-y-2.5">
          {/* Live Search Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchYouthPlaces();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                id="input-youth-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by keyword (e.g., 'esports', 'robotics lab', 'basketball open gym', 'free pizza night', 'Lynnwood STEM')..."
                className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:border-indigo-500 focus:outline-none shadow-xs"
              />
            </div>
            <button
              id="btn-submit-youth-search"
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search API</span>
            </button>
            <button
              id="btn-refresh-youth"
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchYouthPlaces('');
              }}
              title="Reset search"
              className="rounded-xl border border-stone-200 dark:border-stone-700 p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </form>

          {/* County and Category Switchers */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* County Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                County:
              </span>
              {[
                { id: 'all', label: 'All Counties' },
                { id: 'king', label: 'King County' },
                { id: 'snohomish', label: 'Snohomish County' },
              ].map((c) => (
                <button
                  key={c.id}
                  id={`btn-filter-county-${c.id}`}
                  onClick={() => setCountyFilter(c.id as any)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    countyFilter === c.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Quick Filter Categories */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  id={`btn-cat-${cat.id}`}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    categoryFilter === cat.id
                      ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-stone-500">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <p className="font-bold text-sm text-stone-800 dark:text-stone-200">
                Searching Youth Centers & Free Events API...
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Grounded across King and Snohomish municipal directories
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 p-6 text-center text-red-700 dark:text-red-300">
              <p className="font-bold text-sm">{error}</p>
              <button
                onClick={() => fetchYouthPlaces()}
                className="mt-3 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-stone-500">
              <Building2 className="h-10 w-10 text-stone-300 dark:text-stone-600 mb-2" />
              <p className="font-bold text-sm text-stone-700 dark:text-stone-300">
                No matching youth centers or events found.
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Try switching the county filter or searching for broader terms like "teen", "open gym", or "STEM".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col justify-between rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-850 p-4.5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                >
                  <div>
                    {/* Header & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              item.county === 'snohomish'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}
                          >
                            {item.county === 'snohomish' ? 'Snohomish County' : 'King County'}
                          </span>
                          <span className="rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 text-[9px] font-bold">
                            {item.ageGroup}
                          </span>
                          <span className="rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 text-[9px] font-medium">
                            {item.city}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-stone-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.name}
                        </h3>
                      </div>

                      <div className="rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                        +{item.scoutPoints} XP
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Free Perks Callout */}
                    <div className="mt-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 p-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{item.freeDetails}</span>
                      </div>
                    </div>

                    {/* Meta Details: Hours & Transit */}
                    <div className="mt-3 space-y-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <span>{item.scheduleOrDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Navigation className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        <span className="font-medium text-stone-700 dark:text-stone-300">
                          {item.transitAccess}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <span>{item.address}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 text-[10px] text-stone-600 dark:text-stone-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                    <button
                      id={`btn-plot-youth-${item.id}`}
                      onClick={() => {
                        setSelectedYouthItem(item);
                        onSelectOnMap?.(item.lat, item.lng, 15);
                        onClose();
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span>View & Route on Map</span>
                    </button>

                    {item.contactOrLink && (
                      <a
                        href={item.contactOrLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-stone-200 dark:border-stone-700 p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Open Official Website"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 dark:border-stone-800 px-6 py-3 bg-stone-50/70 dark:bg-stone-900/60 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span>
              Connected to <strong>King & Snohomish Youth Transit Directory</strong> & Google AI
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            Close Finder
          </button>
        </div>
      </div>
    </div>
  );
};
