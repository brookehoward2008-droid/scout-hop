import { execSync } from 'child_process';
import fs from 'fs';

fs.writeFileSync('test.css', `@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));`);
try {
  execSync('npx @tailwindcss/cli -i test.css -o out.css', { stdio: 'pipe' });
  console.log("Success with @custom-variant");
} catch(e) {
  console.log("Failed with @custom-variant:", e.message);
}
