const fs = require('fs');
let code = fs.readFileSync('src/components/MapContainer.tsx', 'utf-8');

// 1. Add AdvancedMarker to imports
code = code.replace(
  'import {\\n  APIProvider,\\n  InfoWindow,\\n  Map,\\n  Marker,\\n  useMap,\\n} from \\'@vis.gl/react-google-maps\\';',
  'import {\\n  APIProvider,\\n  InfoWindow,\\n  Map,\\n  Marker,\\n  AdvancedMarker,\\n  useMap,\\n} from \\'@vis.gl/react-google-maps\\';'
);

// 2. Add mapId to <Map>
code = code.replace(
  '<Map\\n            id="block-explorer-map"',
  '<Map\\n            id="block-explorer-map"\\n            mapId="DEMO_MAP_ID"'
);

// 3. Replace <Marker> for current location with <AdvancedMarker>
const gmapsMarkerRegex = /\{currentLocation && \\(\\s*<Marker\\s*position=\\{activePosition\\}\\s*onClick=\\{.*?\\}\\s*title=\\{currentLocation\\.formattedAddress\\}\\s*\\/>\\s*\\)\\}/;

const newGmapsMarker = \`{currentLocation && (
              <AdvancedMarker
                position={activePosition}
                onClick={() => setShowInfoWindow(!showInfoWindow)}
                title={currentLocation.formattedAddress}
              >
                <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
                  \${hasNearbyTargets ? \`
                    <div className="absolute -inset-10 animate-[ping_3s_ease-out_infinite] rounded-full bg-[var(--color-neon-pink)]/20 border border-[var(--color-neon-pink)]/40 shadow-[0_0_20px_rgba(255,42,133,0.5)]"></div>
                    <div className="absolute -inset-5 animate-pulse rounded-full bg-[var(--color-neon-blue)]/30 border border-[var(--color-neon-blue)]/50"></div>
                  \` : \`
                    <div className="absolute -inset-2 animate-ping rounded-full bg-indigo-500/40"></div>
                  \`}
                  <div className={\`flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-white shadow-xl ring-2 \${hasNearbyTargets ? 'ring-[var(--color-neon-pink)]' : 'ring-white'}\`}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className="absolute bottom-11 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-[11px] font-bold text-white shadow-lg">
                    {currentLocation.formattedAddress.split(',')[0]}
                  </div>
                </div>
              </AdvancedMarker>
            )}\`;

code = code.replace(gmapsMarkerRegex, newGmapsMarker);

fs.writeFileSync('src/components/MapContainer.tsx', code);
