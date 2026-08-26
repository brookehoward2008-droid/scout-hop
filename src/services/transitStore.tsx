import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logoutUser } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import {
  COMMUNITY_PLACES,
  CommunityPlace,
  EVENTS,
  HOW_TO_RIDE,
  STOPS,
  TransitStop,
  placeById,
  stopById,
} from '../data/transitCatalog';
import {
  DEFAULT_USER_SWAG_INVENTORY,
  INITIAL_GEOCACHES,
  INITIAL_GEOCACHE_BADGES,
} from '../data/geocaches';
import { calculateRoute } from './routing';
import {
  CalculatedRoute,
  GeocacheBadge,
  GeocacheItem,
  GeocacheLog,
  LatLngLiteral,
  TravelMode,
  YouthDiscoveryItem,
} from '../types';

export interface ActiveRide {
  id: string;
  destinationName: string;
  destinationType: 'school' | 'place' | 'stop';
  destinationCoord: { lat: number; lng: number };
  originCoord: { lat: number; lng: number };
  routePolyline: [number, number][];
  currentCoord: { lat: number; lng: number };
  progress: number;
  speedMph: number;
  etaMinutes: number;
  nextStopName: string;
  busLine: string;
  isComplete: boolean;
}

interface TransitContextType {
  // Auth state
  currentUser: User | null;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<User | null>;
  logoutUser: () => Promise<void>;

  displayName: string;
  setDisplayName: (name: string) => void;
  hasOrca: boolean;
  setHasOrca: (has: boolean) => void;
  schoolName: string;
  currentStreak: number;
  scoutPoints: number;
  addScoutPoints: (pts: number) => void;
  checkedInEvents: string[];
  activeRide: ActiveRide | null;
  selectedStop: TransitStop | null;
  setSelectedStop: (stop: TransitStop | null) => void;
  selectedPlace: CommunityPlace | null;
  setSelectedPlace: (place: CommunityPlace | null) => void;
  startRide: (target: 'school' | string) => void;
  endRide: () => void;
  checkInAtLocation: (id: string, name: string, pts: number) => boolean;
  showTransitLayer: boolean;
  setShowTransitLayer: (show: boolean) => void;

  // 2-point map route planning state
  isRoutePlanningActive: boolean;
  setIsRoutePlanningActive: (active: boolean) => void;
  travelMode: TravelMode;
  setTravelMode: (mode: TravelMode) => void;
  routeOrigin: LatLngLiteral | null;
  routeDestination: LatLngLiteral | null;
  setRouteOrigin: (pt: LatLngLiteral | null) => void;
  setRouteDestination: (pt: LatLngLiteral | null) => void;
  handleMapClickForRoute: (lat: number, lng: number) => void;
  calculatedRoute: CalculatedRoute | null;
  isRouteCalculating: boolean;
  routeError: string | null;
  clearRoute: () => void;

  // Geocaching Game Quest State
  geocaches: GeocacheItem[];
  foundCacheIds: string[];
  userSwagInventory: string[];
  geocacheLogs: GeocacheLog[];
  badges: GeocacheBadge[];
  activeTargetCache: GeocacheItem | null;
  setActiveTargetCache: (cache: GeocacheItem | null) => void;
  showGeocachingLayer: boolean;
  setShowGeocachingLayer: (show: boolean) => void;
  logGeocacheFind: (
    cacheId: string,
    secretCodeEntered: string,
    swagToLeave?: string,
    userNote?: string
  ) => { success: boolean; message: string; xpEarned?: number };
  addCustomGeocache: (cache: Omit<GeocacheItem, 'id' | 'isCustom'>) => Promise<void>;
  navigateToGeocache: (cache: GeocacheItem) => void;

  // Youth Centers & Free Events Discovery State
  showYouthPlacesLayer: boolean;
  setShowYouthPlacesLayer: (show: boolean) => void;
  selectedYouthItem: YouthDiscoveryItem | null;
  setSelectedYouthItem: (item: YouthDiscoveryItem | null) => void;
}

const TransitContext = createContext<TransitContextType | null>(null);

export const TransitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [displayName, setDisplayName] = useState<string>('Alex M.');
  const [hasOrca, setHasOrca] = useState<boolean>(true);
  const [schoolName] = useState<string>('Garfield High School');
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [scoutPoints, setScoutPoints] = useState<number>(450);
  const [checkedInEvents, setCheckedInEvents] = useState<string[]>([]);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [selectedStop, setSelectedStop] = useState<TransitStop | null>(STOPS[0]);
  const [selectedPlace, setSelectedPlace] = useState<CommunityPlace | null>(null);
  const [showTransitLayer, setShowTransitLayer] = useState<boolean>(true);

  // Route Planning State
  const [isRoutePlanningActive, setIsRoutePlanningActive] = useState<boolean>(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('WALK');
  const [routeOrigin, setRouteOrigin] = useState<LatLngLiteral | null>(null);
  const [routeDestination, setRouteDestination] = useState<LatLngLiteral | null>(null);
  const [calculatedRoute, setCalculatedRoute] = useState<CalculatedRoute | null>(null);
  const [isRouteCalculating, setIsRouteCalculating] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Initialize Route Planning from URL Deep-Link Parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const originParam = params.get('origin');
      const destParam = params.get('destination');
      const modeParam = params.get('mode');

      if (originParam && destParam) {
        const [oLat, oLng] = originParam.split(',').map(Number);
        const [dLat, dLng] = destParam.split(',').map(Number);

        if (!isNaN(oLat) && !isNaN(oLng) && !isNaN(dLat) && !isNaN(dLng)) {
          setIsRoutePlanningActive(true);
          setRouteOrigin({ lat: oLat, lng: oLng });
          setRouteDestination({ lat: dLat, lng: dLng });

          if (modeParam && ['DRIVE', 'BICYCLE', 'WALK', 'TRANSIT'].includes(modeParam.toUpperCase())) {
            setTravelMode(modeParam.toUpperCase() as TravelMode);
          }
        }
      }
    }
  }, []);

  // Geocaching Game Quest State
  const [geocaches, setGeocaches] = useState<GeocacheItem[]>(() => {
    const saved = localStorage.getItem('geo_scout_caches');
    return saved ? JSON.parse(saved) : INITIAL_GEOCACHES;
  });
  const [foundCacheIds, setFoundCacheIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('geo_scout_found');
    return saved ? JSON.parse(saved) : [];
  });
  const [userSwagInventory, setUserSwagInventory] = useState<string[]>(() => {
    const saved = localStorage.getItem('geo_scout_swag');
    return saved ? JSON.parse(saved) : DEFAULT_USER_SWAG_INVENTORY;
  });
  const [geocacheLogs, setGeocacheLogs] = useState<GeocacheLog[]>(() => {
    const saved = localStorage.getItem('geo_scout_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [badges, setBadges] = useState<GeocacheBadge[]>(() => {
    const saved = localStorage.getItem('geo_scout_badges');
    return saved ? JSON.parse(saved) : INITIAL_GEOCACHE_BADGES;
  });
  const [activeTargetCache, setActiveTargetCache] = useState<GeocacheItem | null>(null);
  const [showGeocachingLayer, setShowGeocachingLayer] = useState<boolean>(true);

  // Youth Discovery Layer State
  const [showYouthPlacesLayer, setShowYouthPlacesLayer] = useState<boolean>(true);
  const [selectedYouthItem, setSelectedYouthItem] = useState<YouthDiscoveryItem | null>(null);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        setDisplayName(user.displayName || user.email?.split('@')[0] || 'Scout Explorer');

        // Sync User Profile from Firestore
        const userDocPath = `users/${user.uid}`;
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const today = new Date().toISOString().split('T')[0];

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.scoutPoints !== undefined) setScoutPoints(data.scoutPoints);
            if (data.hasOrca !== undefined) setHasOrca(data.hasOrca);
            if (data.foundCacheIds) setFoundCacheIds(data.foundCacheIds);
            if (data.userSwagInventory) setUserSwagInventory(data.userSwagInventory);
            if (data.checkedInEvents) setCheckedInEvents(data.checkedInEvents);

            // Streak Logic
            let streak = data.currentStreak || 0;
            const lastAccess = data.lastAccessDate;
            let needsUpdate = false;

            if (lastAccess !== today) {
              needsUpdate = true;
              if (lastAccess) {
                const lastDate = new Date(lastAccess);
                const todayDate = new Date(today);
                const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays === 1) {
                  streak += 1;
                } else if (diffDays > 1) {
                  streak = 1; // reset streak
                }
              } else {
                streak = 1;
              }
            }
            setCurrentStreak(streak);

            if (needsUpdate) {
              await setDoc(doc(db, 'users', user.uid), {
                ...data,
                currentStreak: streak,
                lastAccessDate: today,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }

          } else {
            // Initial create on Firestore
            await setDoc(doc(db, 'users', user.uid), {
              userId: user.uid,
              displayName: user.displayName || 'Scout Explorer',
              email: user.email || '',
              photoURL: user.photoURL || '',
              scoutPoints: 450,
              hasOrca: true,
              schoolName: 'Garfield High School',
              foundCacheIds: [],
              userSwagInventory: DEFAULT_USER_SWAG_INVENTORY,
              checkedInEvents: [],
              currentStreak: 1,
              lastAccessDate: today,
              updatedAt: new Date().toISOString(),
            });
            setCurrentStreak(1);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, userDocPath);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync Community Geocaches & Logs from Firestore
  useEffect(() => {
    const geocachesPath = 'geocaches';
    const unsubCaches = onSnapshot(
      collection(db, geocachesPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudCaches: GeocacheItem[] = [];
          snapshot.forEach((d) => {
            cloudCaches.push(d.data() as GeocacheItem);
          });
          // Merge initial + cloud
          const merged = [...INITIAL_GEOCACHES];
          cloudCaches.forEach((cc) => {
            if (!merged.some((m) => m.id === cc.id)) {
              merged.push(cc);
            }
          });
          setGeocaches(merged);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, geocachesPath);
      }
    );

    const logsPath = 'geocacheLogs';
    const unsubLogs = onSnapshot(
      collection(db, logsPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudLogs: GeocacheLog[] = [];
          snapshot.forEach((d) => {
            cloudLogs.push(d.data() as GeocacheLog);
          });
          setGeocacheLogs(cloudLogs);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, logsPath);
      }
    );

    return () => {
      unsubCaches();
      unsubLogs();
    };
  }, []);

  // Save changes to Firestore if user logged in, plus localStorage
  useEffect(() => {
    localStorage.setItem('geo_scout_caches', JSON.stringify(geocaches));
  }, [geocaches]);

  useEffect(() => {
    localStorage.setItem('geo_scout_found', JSON.stringify(foundCacheIds));
  }, [foundCacheIds]);

  useEffect(() => {
    localStorage.setItem('geo_scout_swag', JSON.stringify(userSwagInventory));
  }, [userSwagInventory]);

  useEffect(() => {
    localStorage.setItem('geo_scout_logs', JSON.stringify(geocacheLogs));
  }, [geocacheLogs]);

  useEffect(() => {
    localStorage.setItem('geo_scout_badges', JSON.stringify(badges));
  }, [badges]);

  // Sync profile data to cloud when points/found items change
  useEffect(() => {
    if (!currentUser) return;
    const saveProfileToCloud = async () => {
      const userPath = `users/${currentUser.uid}`;
      try {
        await setDoc(
          doc(db, 'users', currentUser.uid),
          {
            userId: currentUser.uid,
            displayName: displayName || currentUser.displayName || 'Scout Explorer',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            scoutPoints,
            hasOrca,
            schoolName,
            foundCacheIds,
            userSwagInventory,
            checkedInEvents,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, userPath);
      }
    };
    saveProfileToCloud();
  }, [currentUser, scoutPoints, hasOrca, foundCacheIds, userSwagInventory, checkedInEvents, displayName, schoolName]);

  // Check and unlock badges based on progress
  useEffect(() => {
    setBadges((prevBadges) => {
      return prevBadges.map((badge) => {
        if (badge.isUnlocked) return badge;

        let shouldUnlock = false;
        if (badge.id === 'badge-first-find' && foundCacheIds.length >= 1) {
          shouldUnlock = true;
        } else if (badge.id === 'badge-link-rider' && foundCacheIds.length >= 3) {
          shouldUnlock = true;
        } else if (badge.id === 'badge-king-explorer') {
          const kingCount = foundCacheIds.filter((id) => {
            const c = geocaches.find((item) => item.id === id);
            return c && c.county === 'king';
          }).length;
          if (kingCount >= 2) shouldUnlock = true;
        } else if (badge.id === 'badge-snoho-trailblazer') {
          const snohoCount = foundCacheIds.filter((id) => {
            const c = geocaches.find((item) => item.id === id);
            return c && c.county === 'snohomish';
          }).length;
          if (snohoCount >= 2) shouldUnlock = true;
        } else if (badge.id === 'badge-swag-trader') {
          const tradedCount = geocacheLogs.filter((l) => l.swagTradedIn).length;
          if (tradedCount >= 3) shouldUnlock = true;
        } else if (badge.id === 'badge-cache-creator') {
          const customCount = geocaches.filter((c) => c.isCustom).length;
          if (customCount >= 1) shouldUnlock = true;
        }

        if (shouldUnlock) {
          return { ...badge, isUnlocked: true, unlockedAt: Date.now() };
        }
        return badge;
      });
    });
  }, [foundCacheIds, geocacheLogs, geocaches]);

  const clearRoute = () => {
    setRouteOrigin(null);
    setRouteDestination(null);
    setCalculatedRoute(null);
    setRouteError(null);
  };

  // Re-calculate route whenever points or mode change
  useEffect(() => {
    if (!routeOrigin || !routeDestination) {
      setCalculatedRoute(null);
      return;
    }

    let isMounted = true;
    const fetchRoute = async () => {
      setIsRouteCalculating(true);
      setRouteError(null);
      const res = await calculateRoute({
        origin: routeOrigin,
        destination: routeDestination,
        mode: travelMode,
      });

      if (!isMounted) return;

      if (res.route) {
        setCalculatedRoute(res.route);
        setRouteError(null);
      } else {
        setRouteError(res.error || 'Could not find route path.');
      }
      setIsRouteCalculating(false);
    };

    fetchRoute();

    return () => {
      isMounted = false;
    };
  }, [routeOrigin, routeDestination, travelMode]);

  // Click on map to set Point A (Origin) then Point B (Destination)
  const handleMapClickForRoute = (lat: number, lng: number) => {
    if (!routeOrigin || (routeOrigin && routeDestination)) {
      setRouteOrigin({ lat, lng });
      setRouteDestination(null);
      setCalculatedRoute(null);
      setRouteError(null);
    } else if (routeOrigin && !routeDestination) {
      setRouteDestination({ lat, lng });
    }
  };

  const addScoutPoints = (pts: number) => {
    setScoutPoints((prev) => prev + pts);
  };

  const checkInAtLocation = (id: string, name: string, pts: number): boolean => {
    if (checkedInEvents.includes(id)) return false;
    setCheckedInEvents((prev) => [...prev, id]);
    setScoutPoints((prev) => prev + pts);
    return true;
  };

  // Geocaching Find Logger
  const logGeocacheFind = (
    cacheId: string,
    secretCodeEntered: string,
    swagToLeave?: string,
    userNote?: string
  ): { success: boolean; message: string; xpEarned?: number } => {
    const cache = geocaches.find((c) => c.id === cacheId);
    if (!cache) {
      return { success: false, message: 'Geocache not found.' };
    }

    if (foundCacheIds.includes(cacheId)) {
      return { success: false, message: 'You have already logged this geocache!' };
    }

    const normalizedInput = secretCodeEntered.trim().toUpperCase();
    const normalizedSecret = cache.secretCode.trim().toUpperCase();

    if (normalizedInput !== normalizedSecret) {
      return {
        success: false,
        message: 'Incorrect Secret Code! Check the cache hint and clue closely.',
      };
    }

    let swagTaken: string | undefined;
    if (cache.virtualSwag.length > 0) {
      swagTaken = cache.virtualSwag[0];
      setUserSwagInventory((prev) => [...prev, swagTaken!]);
    }

    if (swagToLeave) {
      setUserSwagInventory((prev) => prev.filter((item) => item !== swagToLeave));
      setGeocaches((prev) =>
        prev.map((c) =>
          c.id === cacheId
            ? { ...c, virtualSwag: [...c.virtualSwag.filter((s) => s !== swagTaken), swagToLeave] }
            : c
        )
      );
    }

    const xp = cache.xpReward || 150;
    setFoundCacheIds((prev) => [...prev, cacheId]);
    addScoutPoints(xp);

    const newLog: GeocacheLog = {
      cacheId: cache.id,
      cacheName: cache.name,
      timestamp: Date.now(),
      swagTradedIn: swagToLeave,
      swagTaken,
      userNote,
      xpEarned: xp,
    };

    setGeocacheLogs((prev) => [newLog, ...prev]);

    // Save Log to Firestore if signed in
    if (currentUser) {
      const logId = `log-${Date.now()}-${currentUser.uid.slice(0, 5)}`;
      const logPath = `geocacheLogs/${logId}`;
      setDoc(doc(db, 'geocacheLogs', logId), {
        userId: currentUser.uid,
        cacheId: cache.id,
        cacheName: cache.name,
        timestamp: Date.now(),
        swagTradedIn: swagToLeave || '',
        swagTaken: swagTaken || '',
        userNote: userNote || '',
        xpEarned: xp,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, logPath);
      });
    }

    return {
      success: true,
      message: `Trophy unlocked! You found ${cache.name} and earned +${xp} XP!`,
      xpEarned: xp,
    };
  };

  // Add custom user-created cache & persist to Firebase
  const addCustomGeocache = async (cacheData: Omit<GeocacheItem, 'id' | 'isCustom'>) => {
    const newId = `custom-cache-${Date.now()}`;
    const newCache: GeocacheItem = {
      ...cacheData,
      id: newId,
      isCustom: true,
      createdBy: displayName || currentUser?.displayName || 'Scout Explorer',
    };
    setGeocaches((prev) => [newCache, ...prev]);
    addScoutPoints(250);

    // Save to Firestore if signed in
    if (currentUser) {
      const cachePath = `geocaches/${newId}`;
      try {
        await setDoc(doc(db, 'geocaches', newId), {
          ...newCache,
          creatorUid: currentUser.uid,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, cachePath);
      }
    }
  };

  // Navigate to Geocache with walking route calculation
  const navigateToGeocache = (cache: GeocacheItem) => {
    setActiveTargetCache(cache);
    setIsRoutePlanningActive(true);
    setTravelMode('WALK');
    const startPoint =
      cache.county === 'snohomish'
        ? { lat: 47.8155, lng: -122.2945 }
        : { lat: 47.6114, lng: -122.3370 };

    setRouteOrigin(startPoint);
    setRouteDestination({ lat: cache.lat, lng: cache.lng });
  };

  const startRide = (target: 'school' | string) => {
    let destName = schoolName;
    let destLat = 47.6063;
    let destLng = -122.3018;
    let destType: 'school' | 'place' | 'stop' = 'school';

    if (target !== 'school') {
      const place = placeById(target);
      const stop = stopById(target);
      if (place) {
        destName = place.name;
        destLat = place.lat;
        destLng = place.lng;
        destType = 'place';
      } else if (stop) {
        destName = stop.name;
        destLat = stop.lat;
        destLng = stop.lng;
        destType = 'stop';
      }
    }

    const originLat = 47.6114;
    const originLng = -122.3370;

    const steps = 20;
    const waypoints: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = originLat + (destLat - originLat) * t + Math.sin(t * Math.PI) * 0.003;
      const lng = originLng + (destLng - originLng) * t + Math.cos(t * Math.PI) * 0.002;
      waypoints.push([lat, lng]);
    }

    setActiveRide({
      id: `ride-${Date.now()}`,
      destinationName: destName,
      destinationType: destType,
      destinationCoord: { lat: destLat, lng: destLng },
      originCoord: { lat: originLat, lng: originLng },
      routePolyline: waypoints,
      currentCoord: { lat: originLat, lng: originLng },
      progress: 0.05,
      speedMph: 24,
      etaMinutes: 8,
      nextStopName: STOPS[1].name,
      busLine: 'Route 48 Express',
      isComplete: false,
    });
  };

  const endRide = () => {
    setActiveRide(null);
  };

  // Simulate active ride progress over time
  useEffect(() => {
    if (!activeRide || activeRide.isComplete) return;

    const interval = setInterval(() => {
      setActiveRide((prev) => {
        if (!prev || prev.isComplete) return prev;
        const newProgress = Math.min(1, prev.progress + 0.025);
        const pointIndex = Math.min(
          prev.routePolyline.length - 1,
          Math.floor(newProgress * (prev.routePolyline.length - 1))
        );
        const nextCoord = prev.routePolyline[pointIndex];
        const remainingMinutes = Math.max(1, Math.round((1 - newProgress) * 8));

        return {
          ...prev,
          progress: newProgress,
          currentCoord: { lat: nextCoord[0], lng: nextCoord[1] },
          etaMinutes: remainingMinutes,
          speedMph: newProgress >= 0.95 ? 0 : 20 + Math.floor(Math.random() * 8),
          isComplete: newProgress >= 1,
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [activeRide]);

  return (
    <TransitContext.Provider
      value={{
        currentUser,
        isAuthLoading,
        loginWithGoogle,
        logoutUser,
        displayName,
        setDisplayName,
    currentStreak,
        hasOrca,
        setHasOrca,
        schoolName,
        scoutPoints,
        addScoutPoints,
        checkedInEvents,
        activeRide,
        selectedStop,
        setSelectedStop,
        selectedPlace,
        setSelectedPlace,
        startRide,
        endRide,
        checkInAtLocation,
        showTransitLayer,
        setShowTransitLayer,
        isRoutePlanningActive,
        setIsRoutePlanningActive,
        travelMode,
        setTravelMode,
        routeOrigin,
        routeDestination,
        setRouteOrigin,
        setRouteDestination,
        handleMapClickForRoute,
        calculatedRoute,
        isRouteCalculating,
        routeError,
        clearRoute,
        geocaches,
        foundCacheIds,
        userSwagInventory,
        geocacheLogs,
        badges,
        activeTargetCache,
        setActiveTargetCache,
        showGeocachingLayer,
        setShowGeocachingLayer,
        logGeocacheFind,
        addCustomGeocache,
        navigateToGeocache,
        showYouthPlacesLayer,
        setShowYouthPlacesLayer,
        selectedYouthItem,
        setSelectedYouthItem,
      }}
    >
      {children}
    </TransitContext.Provider>
  );
};

export function useApp() {
  const context = useContext(TransitContext);
  if (!context) {
    throw new Error('useApp must be used within a TransitProvider');
  }
  return context;
}
