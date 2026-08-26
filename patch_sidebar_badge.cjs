const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

const regex = /<div className="flex items-center gap-1\.5">\s*\{\/\* Firebase Auth Google Sign In Button \*\/\}/;
const replacement = `<div className="flex items-center gap-1.5">
            {/* Streak Badge */}
            {currentUser && currentStreak > 0 && (
              <div className="flex items-center gap-1 rounded-lg border border-[var(--color-neon-pink)]/50 bg-[var(--color-game-panel)] px-2 py-1 shadow-[0_0_8px_rgba(255,42,133,0.3)]" title={\`Daily Quest Streak: \${currentStreak} days\`}>
                 <Flame className={\`h-3.5 w-3.5 \${currentStreak >= 3 ? 'text-[var(--color-neon-pink)] animate-pulse' : 'text-orange-400'}\`} />
                 <span className="text-[11px] font-black text-white">{currentStreak}</span>
              </div>
            )}
            {/* Firebase Auth Google Sign In Button */}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/Sidebar.tsx', code);
