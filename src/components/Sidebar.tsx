import React, { useState } from 'react';
import {
  Flame,
  Building2,
  Bus,
  Check,
  Compass,
  History,
  Info,
  Key,
  Landmark,
  Layers,
  LogIn,
  LogOut,
  MapPin,
  Palmtree,
  Radio,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { PRESET_LOCATIONS } from '../data/presets';
import { useApp } from '../services/transitStore';
import { ApiErrorInfo, GeocodedLocationData, PresetLocation } from '../types';
import { ErrorBanner } from './ErrorBanner';
import { LocationDetails } from './LocationDetails';
import { TransitHomeView } from './TransitHomeView';

interface SidebarProps {
  currentLocation: GeocodedLocationData | null;
  isLoading: boolean;
  error: ApiErrorInfo | null;
  history: GeocodedLocationData[];
  onSearch: (query: string) => void;
  onSelectPreset: (preset: PresetLocation) => void;
  onSelectHistory: (item: GeocodedLocationData) => void;
  onClearHistory: () => void;
  onDismissError: () => void;
  onCenterMap: () => void;
  onZoomToBlock: () => void;
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
  showKeyModal: boolean;
  onToggleKeyModal: (show: boolean) => void;
  onFocusMapCoord?: (lat: number, lng: number, zoom?: number) => void;
  onOpenPlacesView?: () => void;
  onOpenGeocaching?: () => void;
  onOpenYouthEvents?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentLocation,
  isLoading,
  error,
  history,
  onSearch,
  onSelectPreset,
  onSelectHistory,
  onClearHistory,
  onDismissError,
  onCenterMap,
  onZoomToBlock,
  customApiKey,
  onSaveApiKey,
  showKeyModal,
  onToggleKeyModal,
  onFocusMapCoord,
  onOpenPlacesView,
  onOpenGeocaching,
  onOpenYouthEvents,
}) => {
  const {
    showTransitLayer,
    setShowTransitLayer,
    foundCacheIds,
    geocaches,
    scoutPoints,
    currentStreak,
    currentUser,
    loginWithGoogle,
    logoutUser,
    isAuthLoading,
    displayName,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'transit' | 'geocoding'>('transit');
  const [searchInput, setSearchInput] = useState('');
  const [tempKey, setTempKey] = useState(customApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(tempKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onToggleKeyModal(false);
    }, 1200);
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2':
        return <Building2 className="h-4 w-4" />;
      case 'Zap':
        return <Zap className="h-4 w-4" />;
      case 'Palmtree':
        return <Palmtree className="h-4 w-4" />;
      case 'Landmark':
        return <Landmark className="h-4 w-4" />;
      case 'Compass':
      default:
        return <Compass className="h-4 w-4" />;
    }
  };

  return (
    <aside
      id="control-sidebar-panel"
      className="flex h-full w-full flex-col overflow-y-auto bg-[var(--color-game-panel)] text-white border-r border-indigo-500/30"
    >
      {/* Editorial Header */}
      <div className="sticky top-0 z-10 border-b border-indigo-500/30 bg-[var(--color-game-bg)]/90 backdrop-blur-md px-6 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-neon-pink)] to-[var(--color-neon-purple)] shadow-[0_0_15px_rgba(255,42,133,0.5)] transform -rotate-6 animate-bounce-slight">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-green)] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
                SEATTLE QUEST
              </h1>
              <p className="text-[10px] font-bold tracking-widest uppercase text-indigo-300">
                City Explorer AR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Streak Badge */}
            {currentUser && currentStreak > 0 && (
              <div className="flex items-center gap-1 rounded-lg border border-[var(--color-neon-pink)]/50 bg-[var(--color-game-panel)] px-2 py-1 shadow-[0_0_8px_rgba(255,42,133,0.3)]" title={`Daily Quest Streak: ${currentStreak} days`}>
                 <Flame className={`h-3.5 w-3.5 ${currentStreak >= 3 ? 'text-[var(--color-neon-pink)] animate-pulse' : 'text-orange-400'}`} />
                 <span className="text-[11px] font-black text-white">{currentStreak}</span>
              </div>
            )}
            {/* Firebase Auth Google Sign In Button */}
            {currentUser ? (
              <button
                id="btn-firebase-logout"
                onClick={() => logoutUser()}
                className="flex items-center gap-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 px-2 py-1 text-[11px] font-bold text-stone-700 dark:text-stone-300 shadow-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title={`Signed in as ${displayName} (${currentUser.email}). Click to sign out.`}
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="max-w-[70px] truncate">{displayName.split(' ')[0]}</span>
                <LogOut className="h-3 w-3 text-stone-400" />
              </button>
            ) : (
              <button
                id="btn-firebase-login"
                onClick={() => loginWithGoogle()}
                disabled={isAuthLoading}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                title="Sign in with Google to sync scout points and geocache finds across devices"
              >
                <LogIn className="h-3 w-3" />
                <span>Sign In</span>
              </button>
            )}

            <button
              id="btn-settings-toggle"
              onClick={() => onToggleKeyModal(!showKeyModal)}
              className={`rounded-lg p-2 transition-colors ${
                customApiKey
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
              title="Google Maps API Key Configuration & Status"
              aria-label="Settings"
            >
              <Key className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Public Transit Layers Checkbox */}
        <div className="mt-3.5 flex items-center justify-between rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 px-3.5 py-2.5 shadow-xs backdrop-blur-sm">
          <label
            htmlFor="checkbox-transit-layer"
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <input
              id="checkbox-transit-layer"
              type="checkbox"
              checked={showTransitLayer}
              onChange={(e) => setShowTransitLayer(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 dark:border-stone-700 dark:bg-stone-800"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Bus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Transit Lines Layer</span>
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400">
                Show Bus & Light Rail routes & hubs on map
              </span>
            </div>
          </label>

          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              showTransitLayer
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
            }`}
          >
            {showTransitLayer ? 'Visible' : 'Hidden'}
          </span>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="mt-3.5 flex rounded-xl bg-stone-200/80 dark:bg-stone-850 p-1">
          <button
            id="tab-transit"
            onClick={() => setActiveTab('transit')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
              activeTab === 'transit'
                ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Bus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Transit & Ride</span>
          </button>

          <button
            id="tab-geocoding"
            onClick={() => setActiveTab('geocoding')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
              activeTab === 'geocoding'
                ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Geocoding & AI</span>
          </button>
        </div>

        {/* API Key Modal / Drawer */}
        {showKeyModal && (
          <div className="mt-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                <Settings className="h-4 w-4 text-stone-500" />
                <span>API Configuration</span>
              </div>
              <button
                onClick={() => onToggleKeyModal(false)}
                className="rounded p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Geocoding requests target the Google Geocoding V4 REST endpoint. You can provide a custom Google Maps API key or Maps Demo Key:
            </p>

            <form onSubmit={handleSaveKey} className="mt-3 space-y-2">
              <input
                id="input-custom-api-key"
                type="password"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-xs font-mono focus:border-stone-900 dark:focus:border-stone-100 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                <a
                  href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[11px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 underline"
                >
                  Get free demo key
                </a>
                <button
                  id="btn-save-key-submit"
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-stone-900 dark:bg-stone-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-stone-900 hover:bg-stone-800"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Saved!
                    </>
                  ) : (
                    'Save Key'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="flex-1 p-6">
        {activeTab === 'transit' ? (
          /* Transit Zone View */
          <TransitHomeView
            onFocusMapCoord={onFocusMapCoord}
            onOpenPlacesView={onOpenPlacesView}
            onOpenGeocaching={onOpenGeocaching}
            onOpenYouthEvents={onOpenYouthEvents}
          />
        ) : (
          /* Geocoding & AI Tour Guide View */
          <div className="space-y-6">
            {/* Search Bar Section */}
            <section id="section-search" className="space-y-2">
              <label
                htmlFor="input-location-search"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
              >
                Find City, Neighborhood, or Landmark
              </label>

              <form onSubmit={handleFormSubmit} className="relative flex items-center">
                <div className="pointer-events-none absolute left-3.5 flex items-center text-stone-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  id="input-location-search"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g. Seattle, Shibuya, Miami..."
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 py-3 pl-10 pr-24 text-sm font-medium placeholder:text-stone-400 focus:border-stone-900 dark:focus:border-stone-100 focus:outline-none shadow-sm transition-all"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute right-16 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    title="Clear input"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  id="btn-submit-search"
                  type="submit"
                  disabled={isLoading || !searchInput.trim()}
                  className="absolute right-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 px-3.5 py-1.5 text-xs font-bold text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white disabled:opacity-40 transition-all"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white dark:border-stone-900 border-t-transparent" />
                      <span>Geocoding...</span>
                    </div>
                  ) : (
                    'Explore'
                  )}
                </button>
              </form>
            </section>

            {/* 5 Presets Section */}
            <section id="section-presets" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Curated Exploration Presets
                </span>
                <span className="text-[11px] font-mono text-stone-400">5 locations</span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-1">
                {PRESET_LOCATIONS.map((preset) => {
                  const isSelected =
                    currentLocation?.formattedAddress?.includes(preset.name) ||
                    currentLocation?.query?.toLowerCase() === preset.query.toLowerCase() ||
                    currentLocation?.query?.toLowerCase() === preset.name.toLowerCase();

                  return (
                    <button
                      key={preset.id}
                      id={`btn-preset-${preset.id}`}
                      onClick={() => onSelectPreset(preset)}
                      disabled={isLoading}
                      className={`group flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-stone-900 dark:border-stone-100 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 shadow-md ring-1 ring-stone-900/10 dark:ring-stone-100/10'
                          : 'border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-600 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isSelected
                              ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-950'
                              : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 group-hover:bg-stone-200 dark:group-hover:bg-stone-700'
                          }`}
                        >
                          {getPresetIcon(preset.iconName)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold tracking-tight leading-tight">
                            {preset.name}
                          </h4>
                          <p
                            className={`text-[11px] ${
                              isSelected
                                ? 'text-stone-300 dark:text-stone-600'
                                : 'text-stone-500 dark:text-stone-400'
                            }`}
                          >
                            {preset.sublabel}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            isSelected
                              ? 'bg-stone-800 text-stone-200 dark:bg-stone-200 dark:text-stone-800'
                              : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                          }`}
                        >
                          {preset.country}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Error Notification Banner if active */}
            {error && (
              <section id="section-error-banner">
                <ErrorBanner
                  error={error}
                  onDismiss={onDismissError}
                  onRetry={() => {
                    if (currentLocation?.query) {
                      onSearch(currentLocation.query);
                    } else if (searchInput) {
                      onSearch(searchInput);
                    }
                  }}
                  onOpenKeySettings={() => onToggleKeyModal(true)}
                />
              </section>
            )}

            {/* Active Geocoded Location Inspection Card */}
            {currentLocation && (
              <section id="section-active-location" className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Active Geocoded Telemetry
                </span>
                <LocationDetails
                  location={currentLocation}
                  onCenterMap={onCenterMap}
                  onZoomToBlock={onZoomToBlock}
                />
              </section>
            )}

            {/* Recent Exploration History */}
            {history.length > 0 && (
              <section id="section-history" className="space-y-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    <History className="h-3.5 w-3.5" />
                    <span>Search Log</span>
                  </div>
                  <button
                    id="btn-clear-history"
                    onClick={onClearHistory}
                    className="text-[11px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {history.map((item, idx) => (
                    <button
                      key={`${item.lat}-${item.lng}-${idx}`}
                      onClick={() => onSelectHistory(item)}
                      className="flex w-full items-center justify-between rounded-lg border border-stone-200/60 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 p-2 text-left text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
                        <span className="truncate font-medium text-stone-800 dark:text-stone-200">
                          {item.formattedAddress}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-stone-400 flex-shrink-0 ml-2">
                        {item.lat.toFixed(2)}, {item.lng.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-auto border-t border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/40 px-6 py-3.5 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Seattle Youth Zone · Zero Fare Transit</span>
        </div>
        <span className="font-mono text-[10px]">Active</span>
      </div>
    </aside>
  );
};

