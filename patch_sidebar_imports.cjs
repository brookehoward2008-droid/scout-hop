const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');
code = code.replace('import {', 'import {\\n  Flame,');
fs.writeFileSync('src/components/Sidebar.tsx', code);
