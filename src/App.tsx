import React, { useCallback, useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { PRESET_LOCATIONS } from './data/presets';
import { CommunityPlace, STOPS } from './data/transitCatalog';
import { GeocachingModal } from './components/GeocachingModal';
import { MapContainer } from './components/MapContainer';
import { PlacesExplorerModal } from './components/PlacesExplorerModal';
import { Sidebar } from './components/Sidebar';
import { YouthDiscoveryModal } from './components/YouthDiscoveryModal';
import { requestGeocodeAddress } from './services/geocoding';
import { extractCityAndState, fetchLocalInsights } from './services/insights';
import { TransitProvider, useApp } from './services/transitStore';
import { ApiErrorInfo, GeocodedLocationData, PresetLocation } from './types';

function AppContent() {
  const [currentLocation, setCurrentLocation] = useState<GeocodedLocationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [history, setHistory] = useState<GeocodedLocationData[]>([]);
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('block_explorer_gmp_key') ||
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
        ''
      );
    }
    return '';
  });

  const [mobileTab, setMobileTab] = useState<'panel' | 'map'>('panel');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [showPlacesModal, setShowPlacesModal] = useState<boolean>(false);
  const [showGeocachingModal, setShowGeocachingModal] = useState<boolean>(false);
  const [showYouthModal, setShowYouthModal] = useState<boolean>(false);

  const { setShowGeocachingLayer, setShowYouthPlacesLayer, setActiveTargetCache } = useApp();

  // Gemini Local Insights state
  const [insightsLocationName, setInsightsLocationName] = useState<string>('');
  const [insightsHtml, setInsightsHtml] = useState<string | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState<boolean>(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Fetch AI Insights for a given geocoded location
  const loadLocalInsights = useCallback(async (locationData: GeocodedLocationData) => {
    const cityAndState = extractCityAndState(locationData);
    if (!cityAndState) return;

    setInsightsLocationName(cityAndState);
    setIsInsightsLoading(true);
    setInsightsError(null);

    const result = await fetchLocalInsights(cityAndState);

    if (result.error) {
      setInsightsError(result.error);
      setInsightsHtml(null);
    } else if (result.html) {
      setInsightsHtml(result.html);
      setInsightsError(null);
    }

    setIsInsightsLoading(false);
  }, []);

  // Handle Geocoding query
  const handleSearch = useCallback(
    async (query: string, targetZoom?: number) => {
      setIsLoading(true);
      setError(null);

      const result = await requestGeocodeAddress(query, customApiKey);

      if (result.error) {
        setError(result.error);
      }

      if (result.data) {
        setCurrentLocation(result.data);

        // Add to history if not duplicate
        setHistory((prev) => {
          const filtered = prev.filter(
            (item) => item.formattedAddress !== result.data!.formattedAddress
          );
          return [result.data!, ...filtered].slice(0, 15);
        });

        // Trigger Gemini Local Insights upon identifying city/state
        loadLocalInsights(result.data);

        // On mobile, auto switch to map view to show results
        if (window.innerWidth < 1024) {
          setMobileTab('map');
        }
      }

      setIsLoading(false);
    },
    [customApiKey, loadLocalInsights]
  );

  // Handle preset click
  const handleSelectPreset = useCallback(
    (preset: PresetLocation) => {
      handleSearch(preset.query || preset.name);
    },
    [handleSearch]
  );

  // Handle history item select
  const handleSelectHistory = useCallback(
    (item: GeocodedLocationData) => {
      setCurrentLocation(item);
      setError(null);
      loadLocalInsights(item);
      if (window.innerWidth < 1024) {
        setMobileTab('map');
      }
    },
    [loadLocalInsights]
  );

  // Handle map coordinate focus from transit hub click
  const handleFocusMapCoord = useCallback(
    (lat: number, lng: number, zoom?: number) => {
      setCurrentLocation({
        lat,
        lng,
        formattedAddress: 'Transit Hub · ' + (STOPS.find(s => s.lat === lat)?.name || 'Seattle Transit Zone'),
        granularity: 'ROOFTOP',
        types: ['transit_station'],
        placeId: `transit-${lat}-${lng}`,
      });
      if (window.innerWidth < 1024) {
        setMobileTab('map');
      }
    },
    []
  );

  const handleSelectPlaceOnMap = useCallback(
    (lat: number, lng: number, place: CommunityPlace) => {
      setCurrentLocation({
        lat,
        lng,
        formattedAddress: `${place.name}, ${place.address}`,
        granularity: 'ROOFTOP',
        types: ['establishment'],
        placeId: place.id,
      });
      if (window.innerWidth < 1024) {
        setMobileTab('map');
      }
    },
    []
  );

  // Refresh Local Insights
  const handleRefreshInsights = useCallback(() => {
    if (currentLocation) {
      loadLocalInsights(currentLocation);
    } else if (insightsLocationName) {
      (async () => {
        setIsInsightsLoading(true);
        setInsightsError(null);
        const result = await fetchLocalInsights(insightsLocationName);
        if (result.error) {
          setInsightsError(result.error);
          setInsightsHtml(null);
        } else if (result.html) {
          setInsightsHtml(result.html);
          setInsightsError(null);
        }
        setIsInsightsLoading(false);
      })();
    }
  }, [currentLocation, insightsLocationName, loadLocalInsights]);

  // Save API key
  const handleSaveApiKey = useCallback((key: string) => {
    setCustomApiKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('block_explorer_gmp_key', key);
    }
  }, []);

  // Recenter map handler
  const handleCenterMap = useCallback(() => {
    if (currentLocation) {
      setCurrentLocation({ ...currentLocation });
    }
  }, [currentLocation]);

  // Zoom to block handler
  const handleZoomToBlock = useCallback(() => {
    if (currentLocation) {
      setCurrentLocation({
        ...currentLocation,
        granularity: 'ROOFTOP',
      });
    }
  }, [currentLocation]);

  const handleFocusGeocache = useCallback(
    (lat: number, lng: number) => {
      setShowGeocachingLayer(true);
      setCurrentLocation({
        lat,
        lng,
        formattedAddress: 'Geocache Quest Target Zone',
        granularity: 'ROOFTOP',
        types: ['point_of_interest'],
        placeId: `geocache-${lat}-${lng}`,
      });
      if (window.innerWidth < 1024) {
        setMobileTab('map');
      }
    },
    [setShowGeocachingLayer]
  );

  const handleFocusYouthPlace = useCallback(
    (lat: number, lng: number, name: string) => {
      setShowYouthPlacesLayer(true);
      setCurrentLocation({
        lat,
        lng,
        formattedAddress: `${name} (Youth Destination)`,
        granularity: 'ROOFTOP',
        types: ['establishment'],
        placeId: `youth-${lat}-${lng}`,
      });
      if (window.innerWidth < 1024) {
        setMobileTab('map');
      }
    },
    [setShowYouthPlacesLayer]
  );

  // Initial geocode load with Seattle Transit Core default
  useEffect(() => {
    handleFocusMapCoord(47.6114, -122.3370);
  }, []);

  return (
    <div id="block-explorer-app" className="flex h-screen w-screen overflow-hidden bg-[var(--color-game-bg)] font-sans antialiased text-white selection:bg-[var(--color-neon-pink)] selection:text-white">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center rounded-full border border-[var(--color-neon-blue)]/30 bg-[var(--color-game-panel)]/95 p-1 shadow-2xl backdrop-blur-md">
        <button
          id="btn-mobile-tab-panel"
          onClick={() => setMobileTab('panel')}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            mobileTab === 'panel'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
              : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          Transit & Controls
        </button>
        <button
          id="btn-mobile-tab-map"
          onClick={() => setMobileTab('map')}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            mobileTab === 'map'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
              : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          Interactive Map
        </button>
      </div>

      {/* Desktop Split-Screen: 1/3 Width Left Control Panel */}
      <div
        id="desktop-sidebar-container"
        className={`w-full lg:w-1/3 xl:w-1/3 min-w-[340px] max-w-full lg:max-w-[480px] h-full flex-shrink-0 z-10 ${
          mobileTab === 'panel' ? 'block' : 'hidden lg:block'
        }`}
      >
        <Sidebar
          currentLocation={currentLocation}
          isLoading={isLoading}
          error={error}
          history={history}
          onSearch={handleSearch}
          onSelectPreset={handleSelectPreset}
          onSelectHistory={handleSelectHistory}
          onClearHistory={() => setHistory([])}
          onDismissError={() => setError(null)}
          onCenterMap={handleCenterMap}
          onZoomToBlock={handleZoomToBlock}
          customApiKey={customApiKey}
          onSaveApiKey={handleSaveApiKey}
          showKeyModal={showKeyModal}
          onToggleKeyModal={setShowKeyModal}
          onFocusMapCoord={handleFocusMapCoord}
          onOpenPlacesView={() => setShowPlacesModal(true)}
          onOpenGeocaching={() => setShowGeocachingModal(true)}
          onOpenYouthEvents={() => setShowYouthModal(true)}
        />
      </div>

      {/* Desktop Split-Screen: 2/3 Width Right Full-Height Interactive Map */}
      <main
        id="desktop-map-container"
        className={`flex-1 h-full relative ${
          mobileTab === 'map' ? 'block' : 'hidden lg:block'
        }`}
      >
        <MapContainer
          currentLocation={currentLocation}
          apiKey={customApiKey}
          onOpenKeySettings={() => {
            setShowKeyModal(true);
            setMobileTab('panel');
          }}
          insightsLocationName={insightsLocationName}
          insightsHtml={insightsHtml}
          isInsightsLoading={isInsightsLoading}
          insightsError={insightsError}
          onRefreshInsights={handleRefreshInsights}
        />
      </main>

      {/* Community Places & Destinations Explorer Modal */}
      <PlacesExplorerModal
        isOpen={showPlacesModal}
        onClose={() => setShowPlacesModal(false)}
        onSelectPlaceOnMap={handleSelectPlaceOnMap}
      />

      {/* Geocaching Quest & Swag Trading Game Modal */}
      <GeocachingModal
        isOpen={showGeocachingModal}
        onClose={() => setShowGeocachingModal(false)}
        onFocusCacheOnMap={handleFocusGeocache}
      />

      {/* Youth Centers & Free Events Discovery Modal */}
      <YouthDiscoveryModal
        isOpen={showYouthModal}
        onClose={() => setShowYouthModal(false)}
        onFocusPlaceOnMap={handleFocusYouthPlace}
      />
    </div>
  );
}

export default function App() {
  return (
    <TransitProvider>
      <AppContent />
      <Analytics />
    </TransitProvider>
  );
}

