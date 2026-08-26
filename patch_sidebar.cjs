const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

code = code.replace('scoutPoints,', 'scoutPoints,\\n    currentStreak,');
fs.writeFileSync('src/components/Sidebar.tsx', code);
