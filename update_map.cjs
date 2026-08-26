const fs = require('fs');
let code = fs.readFileSync('src/components/MapContainer.tsx', 'utf-8');

// 1. Add state for youthEvents and nearby targets
const stateRegex = /const \[gmpAuthFailed, setGmpAuthFailed\] = useState<boolean>\(false\);/;
const newState = `const [gmpAuthFailed, setGmpAuthFailed] = useState<boolean>(false);
  const [youthEvents, setYouthEvents] = useState<any[]>([]);
  const [hasNearbyTargets, setHasNearbyTargets] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/youth-events/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '', county: 'all', category: 'all' })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.items) {
          setYouthEvents(data.items);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!currentLocation) {
      setHasNearbyTargets(false);
      return;
    }
    
    function deg2rad(deg: number) { return deg * (Math.PI/180); }
    function getDistanceInMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 3958.8; 
      const dLat = deg2rad(lat2-lat1);
      const dLon = deg2rad(lon2-lon1); 
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    }

    const nearbyCache = geocaches.some((c: any) => getDistanceInMiles(currentLocation.lat, currentLocation.lng, c.lat, c.lng) <= 1.0);
    const nearbyYouth = youthEvents.some((y: any) => getDistanceInMiles(currentLocation.lat, currentLocation.lng, y.lat, y.lng) <= 1.0);
    
    setHasNearbyTargets(nearbyCache || nearbyYouth);
  }, [currentLocation, geocaches, youthEvents]);`;

code = code.replace(stateRegex, newState);

// 2. Add dependency to currentLocation useEffect
const currentLocUseEffectRegex = /\}, \[currentLocation\]\);/;
code = code.replace(currentLocUseEffectRegex, '}, [currentLocation, hasNearbyTargets]);');

// 3. Update the HTML for the Leaflet Marker
const htmlRegex = /<div class="relative flex items-center justify-center -translate-x-1\/2 -translate-y-full">[\s\S]*?<div class="absolute bottom-11/;
const newHtml = `<div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
          \${hasNearbyTargets ? \`
            <div class="absolute -inset-10 animate-[ping_3s_ease-out_infinite] rounded-full bg-[var(--color-neon-pink)]/20 border border-[var(--color-neon-pink)]/40 shadow-[0_0_20px_rgba(255,42,133,0.5)]"></div>
            <div class="absolute -inset-5 animate-pulse rounded-full bg-[var(--color-neon-blue)]/30 border border-[var(--color-neon-blue)]/50"></div>
          \` : \`
            <div class="absolute -inset-2 animate-ping rounded-full bg-indigo-500/40"></div>
          \`}
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-white shadow-xl ring-2 \${hasNearbyTargets ? 'ring-[var(--color-neon-pink)]' : 'ring-white'}">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div class="absolute bottom-11`;

code = code.replace(htmlRegex, newHtml);

fs.writeFileSync('src/components/MapContainer.tsx', code);
