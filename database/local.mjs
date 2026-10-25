import { PGlite } from '@electric-sql/pglite';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { initializeDatabase } from './setup.mjs';
import { embeddedClient } from './embedded.mjs';

const command = process.argv[2] || 'status';
if (!['setup','status'].includes(command)) {
 console.error('Usage: node local.mjs setup|status'); process.exitCode=1;
} else {
 const dir = fileURLToPath(new URL('./.local/hopscout/', import.meta.url));
 let db;
 try {
  await mkdir(dir,{recursive:true});
  db = new PGlite(dir);
  if(command === 'setup') console.log('Local HopScout setup complete:',await initializeDatabase(embeddedClient(db)));
  const result=await db.query(`SELECT c.name AS county,count(l.id)::int AS facilities
   FROM hopscout.counties c LEFT JOIN hopscout.youth_locations l ON l.county=c.name
   GROUP BY c.name ORDER BY c.name`);
  console.table(result.rows);
  console.log('Persistent database:',dir);
 } catch(error) {
  console.error(`Local database failed (${error.code || error.name}): ${error.message}`);
  process.exitCode=1;
 } finally { if(db) await db.close(); }
}
