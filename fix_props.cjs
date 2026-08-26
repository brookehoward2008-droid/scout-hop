const fs = require('fs');
let code = fs.readFileSync('src/components/MapContainer.tsx', 'utf-8');

// Add hasNearbyTargets to LeafletFallbackMap props
code = code.replace(
  'onOpenKeySettings?: () => void;',
  'onOpenKeySettings?: () => void;\\n  hasNearbyTargets?: boolean;'
);

code = code.replace(
  '({ currentLocation, mapType, onOpenKeySettings })',
  '({ currentLocation, mapType, onOpenKeySettings, hasNearbyTargets })'
);

code = code.replace(
  '<LeafletFallbackMap\\n          currentLocation={currentLocation}\\n          mapType={mapType}\\n          onOpenKeySettings={onOpenKeySettings}\\n        />',
  '<LeafletFallbackMap\\n          currentLocation={currentLocation}\\n          mapType={mapType}\\n          onOpenKeySettings={onOpenKeySettings}\\n          hasNearbyTargets={hasNearbyTargets}\\n        />'
);

fs.writeFileSync('src/components/MapContainer.tsx', code);
