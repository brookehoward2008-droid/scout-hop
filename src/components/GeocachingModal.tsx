import React, { useState } from 'react';
import {
  Award,
  Box,
  Check,
  CheckCircle,
  Compass,
  Crosshair,
  Flame,
  Gift,
  HelpCircle,
  Info,
  Key,
  Lock,
  MapPin,
  Navigation,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Trophy,
  Unlock,
  Zap,
  X,
} from 'lucide-react';
import { useApp } from '../services/transitStore';
import { GeocacheItem } from '../types';

import mysteryCrateUrl from '../assets/images/mystery_loot_crate_1787746177884.jpg';
import sneakerUrl from '../assets/images/neon_sneaker_prize_1787746151909.jpg';
import headphonesUrl from '../assets/images/golden_headphones_prize_1787746163069.jpg';

const PRIZE_IMAGES = [mysteryCrateUrl, sneakerUrl, headphonesUrl];

interface GeocachingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOnMap?: (lat: number, lng: number, zoom?: number) => void;
  onFocusCacheOnMap?: (lat: number, lng: number, zoom?: number) => void;
}

export const GeocachingModal: React.FC<GeocachingModalProps> = ({
  isOpen,
  onClose,
  onFocusCacheOnMap,
}) => {
  const {
    geocaches,
    foundCacheIds,
    userSwagInventory,
    badges,
    activeTargetCache,
    setActiveTargetCache,
    logGeocacheFind,
    addCustomGeocache,
    navigateToGeocache,
    scoutPoints,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'quest' | 'passport' | 'hide'>('quest');
  const [countyFilter, setCountyFilter] = useState<'all' | 'king' | 'snohomish'>('all');
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  // Logging Find state
  const [loggingCache, setLoggingCache] = useState<GeocacheItem | null>(null);
  const [secretCodeInput, setSecretCodeInput] = useState<string>('');
  const [selectedSwagToLeave, setSelectedSwagToLeave] = useState<string>('');
  const [userLogNote, setUserLogNote] = useState<string>('');
  const [logFeedback, setLogFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Hide Custom Cache form state
  const [newCacheName, setNewCacheName] = useState<string>('');
  const [newCacheCounty, setNewCacheCounty] = useState<'king' | 'snohomish'>('king');
  const [newCacheCity, setNewCacheCity] = useState<string>('Seattle');
  const [newCacheClue, setNewCacheClue] = useState<string>('');
  const [newCacheHint, setNewCacheHint] = useState<string>('');
  const [newCacheCode, setNewCacheCode] = useState<string>('');
  const [newCacheSwag, setNewCacheSwag] = useState<string>('');
  const [newCacheLat, setNewCacheLat] = useState<number>(47.6062);
  const [newCacheLng, setNewCacheLng] = useState<number>(-122.3321);
  const [hideSuccess, setHideSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const filteredCaches = geocaches.filter((c) => {
    if (countyFilter === 'all') return true;
    return c.county === countyFilter;
  });

  const foundCount = foundCacheIds.length;
  const totalCount = geocaches.length;
  const progressPercent = Math.round((foundCount / (totalCount || 1)) * 100);

  const toggleHint = (cacheId: string) => {
    setRevealedHints((prev) => ({ ...prev, [cacheId]: !prev[cacheId] }));
  };

  const handleOpenLogModal = (cache: GeocacheItem) => {
    setLoggingCache(cache);
    setSecretCodeInput('');
    setSelectedSwagToLeave(userSwagInventory[0] || '');
    setUserLogNote('');
    setLogFeedback(null);
  };

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingCache) return;

    const res = logGeocacheFind(
      loggingCache.id,
      secretCodeInput,
      selectedSwagToLeave,
      userLogNote
    );
    setLogFeedback(res);
    if (res.success) {
      setTimeout(() => {
        setLoggingCache(null);
        setLogFeedback(null);
      }, 1800);
    }
  };

  const handleCreateCache = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomGeocache({
      name: newCacheName,
      county: newCacheCounty,
      city: newCacheCity,
      clue: newCacheClue,
      hint: newCacheHint,
      secretCode: newCacheCode.toUpperCase(),
      xpReward: 250,
      swagItems: [newCacheSwag],
      lat: newCacheLat,
      lng: newCacheLng,
    });
    setHideSuccess(true);
    setTimeout(() => {
      setHideSuccess(false);
      setActiveTab('quest');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Main Content Modal */}
      <div className="relative flex h-full max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border-4 border-[var(--color-neon-blue)]/50 bg-[var(--color-game-bg)] shadow-[0_0_50px_rgba(0,240,255,0.3)]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[var(--color-neon-pink)]/30 bg-slate-900/80 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-neon-pink)] to-[var(--color-neon-purple)] shadow-[0_0_15px_rgba(255,42,133,0.6)] animate-bounce-slight">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-green)] drop-shadow-md tracking-wider">
                STREET QUEST
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-[var(--color-neon-pink)] bg-[var(--color-neon-pink)]/20 px-2 py-0.5 rounded-full border border-[var(--color-neon-pink)]/50">
                  LVL {Math.floor(scoutPoints / 1000) + 1}
                </span>
                <span className="text-[11px] font-black tracking-widest uppercase text-slate-400">
                  {scoutPoints} XP
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border border-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/50 p-2 border-b border-[var(--color-neon-blue)]/20">
          <button
            onClick={() => setActiveTab('quest')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'quest'
                ? 'bg-gradient-to-r from-[var(--color-neon-blue)] to-indigo-600 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)] transform scale-105 z-10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="h-4 w-4" /> Active Drops
          </button>
          <button
            onClick={() => setActiveTab('passport')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'passport'
                ? 'bg-gradient-to-r from-[var(--color-neon-pink)] to-purple-600 text-white shadow-[0_0_15px_rgba(255,42,133,0.4)] transform scale-105 z-10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="h-4 w-4" /> My Loot
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {activeTab === 'quest' && (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="rounded-2xl border-2 border-[var(--color-neon-blue)]/30 bg-slate-900/60 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display tracking-widest text-[11px] font-bold text-slate-300 uppercase">
                    City Discovery Progress
                  </span>
                  <span className="font-black text-[var(--color-neon-blue)] text-sm">
                    {foundCount} / {totalCount} FOUND
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-green)] shadow-[0_0_10px_rgba(0,240,255,0.8)] relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse-ring" />
                  </div>
                </div>
              </div>

              {/* Cache Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCaches.map((cache, idx) => {
                  const isFound = foundCacheIds.includes(cache.id);
                  const isTarget = activeTargetCache === cache.id;
                  const prizeImgUrl = PRIZE_IMAGES[idx % PRIZE_IMAGES.length];

                  return (
                    <div
                      key={cache.id}
                      className={`relative flex flex-col rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                        isFound
                          ? 'border-[var(--color-neon-green)]/40 bg-emerald-950/20 opacity-80'
                          : isTarget
                          ? 'border-[var(--color-neon-pink)] bg-slate-800 shadow-[0_0_20px_rgba(255,42,133,0.3)]'
                          : 'border-slate-700 bg-slate-800 hover:border-[var(--color-neon-blue)]'
                      }`}
                    >
                      {/* Image Header */}
                      <div className="relative h-40 w-full overflow-hidden rounded-t-xl bg-slate-900 border-b border-slate-700">
                        <img 
                          src={prizeImgUrl} 
                          alt="Loot" 
                          className={`w-full h-full object-cover transition-transform duration-700 ${isFound ? 'opacity-50' : 'hover:scale-110'} ${isTarget && !isFound ? 'animate-pulse' : ''}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border">
                          {isFound ? (
                            <span className="bg-[var(--color-neon-green)]/20 text-[var(--color-neon-green)] border-[var(--color-neon-green)]/50 inline-flex items-center gap-1 px-2 py-0.5 rounded-full">
                              <CheckCircle className="h-3 w-3" /> CAPTURED
                            </span>
                          ) : (
                            <span className="bg-[var(--color-neon-pink)]/20 text-[var(--color-neon-pink)] border-[var(--color-neon-pink)]/50 inline-flex items-center gap-1 px-2 py-0.5 rounded-full">
                              <Lock className="h-3 w-3" /> LOCKED
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 p-4 flex flex-col">
                        <h3 className="font-display text-lg font-bold text-white mb-1 drop-shadow-md">
                          {cache.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {cache.city} • {cache.county} County
                        </p>

                        <div className="mt-3 flex-1">
                          <p className="text-sm font-semibold text-slate-200 italic leading-relaxed">
                            "{cache.clue}"
                          </p>
                        </div>

                        {/* Hint Section */}
                        {!isFound && (
                          <div className="mt-3 rounded-xl bg-slate-900/80 p-2.5 border border-slate-700">
                            <button
                              onClick={() => toggleHint(cache.id)}
                              className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-wider text-[var(--color-neon-blue)] hover:text-white transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <HelpCircle className="h-3.5 w-3.5" /> Request Intel
                              </span>
                              <span>{revealedHints[cache.id] ? '-' : '+'}</span>
                            </button>
                            {revealedHints[cache.id] && (
                              <p className="mt-2 text-xs font-bold text-slate-300 animate-in fade-in slide-in-from-top-2">
                                {cache.hint}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-700 flex items-center gap-2">
                          <div className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-neon-green)]/20 text-[var(--color-neon-green)] py-2 text-xs font-black shadow-inner border border-[var(--color-neon-green)]/30">
                            <Zap className="h-4 w-4" /> +{cache.xpReward} XP
                          </div>
                          
                          {!isFound && (
                            <button
                              onClick={() => {
                                if (onFocusCacheOnMap) onFocusCacheOnMap(cache.lat, cache.lng, 16);
                                navigateToGeocache(cache);
                                onClose();
                              }}
                              className={`game-btn flex h-10 w-10 items-center justify-center rounded-xl shadow-lg ${
                                isTarget
                                  ? 'bg-[var(--color-neon-pink)] text-white'
                                  : 'bg-slate-700 text-slate-300 hover:bg-[var(--color-neon-blue)] hover:text-white'
                              }`}
                              title="Track on Map"
                            >
                              <Crosshair className="h-5 w-5" />
                            </button>
                          )}
                          
                          {!isFound && (
                            <button
                              onClick={() => handleOpenLogModal(cache)}
                              className="game-btn flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 font-black tracking-widest text-xs py-2 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                            >
                              <Unlock className="h-4 w-4" /> DECODE
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'passport' && (
             <div className="space-y-6">
                <div className="text-center py-10">
                   <h2 className="text-2xl font-display font-black text-white drop-shadow-md">YOUR LOOT BAG</h2>
                   <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs">Trade virtual swag at cache locations.</p>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                     {userSwagInventory.map((swag, idx) => (
                       <div key={idx} className="bg-slate-800 rounded-2xl p-4 border-2 border-[var(--color-neon-pink)]/30">
                         <div className="h-16 w-16 mx-auto rounded-full bg-[var(--color-neon-pink)]/20 flex items-center justify-center mb-3">
                           <Gift className="h-8 w-8 text-[var(--color-neon-pink)] animate-bounce-slight" />
                         </div>
                         <p className="text-xs font-black text-white">{swag}</p>
                       </div>
                     ))}
                   </div>
                </div>
             </div>
          )}
        </div>
        
        {/* Sub Modal: Log Find */}
        {loggingCache && (
          <div className="absolute inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-[2rem] border-4 border-[var(--color-neon-pink)] bg-slate-900 p-6 shadow-[0_0_40px_rgba(255,42,133,0.5)] transform animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/50">
                    <Key className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-black text-white">
                    SYSTEM OVERRIDE
                  </h3>
                </div>
                <button
                  onClick={() => setLoggingCache(null)}
                  className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {logFeedback && (
                <div className={`rounded-xl p-3 text-xs font-black uppercase text-center mb-4 ${
                    logFeedback.success ? 'bg-[var(--color-neon-green)]/20 text-[var(--color-neon-green)] border border-[var(--color-neon-green)]/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'
                  }`}
                >
                  {logFeedback.message}
                </div>
              )}

              <form onSubmit={handleSubmitLog} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-neon-pink)]">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    value={secretCodeInput}
                    onChange={(e) => setSecretCodeInput(e.target.value)}
                    placeholder="e.g. SCOUT-123"
                    className="mt-1 w-full rounded-xl border-2 border-slate-700 bg-slate-950 px-4 py-3 text-sm font-mono tracking-widest font-black text-white uppercase focus:border-[var(--color-neon-blue)] focus:outline-none transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider text-center">
                    Hint: {loggingCache.hint}
                  </p>
                </div>

                <button
                  type="submit"
                  className="game-btn w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-neon-pink)] to-purple-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(255,42,133,0.5)] hover:scale-105"
                >
                  <Unlock className="h-5 w-5" />
                  <span>CLAIM {loggingCache.xpReward} XP</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
