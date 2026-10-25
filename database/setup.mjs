import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { counties, countySource, locations, verifiedOn } from './data.mjs';

export async function initializeDatabase(client) {
  await client.query('BEGIN');
  try {
    // Serialize setup invocations on PostgreSQL; no extension privileges required.
    await client.query('SELECT pg_advisory_xact_lock(20261025, 1)');
    await client.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
    const { rows } = await client.query('SELECT version FROM hopscout.schema_migrations ORDER BY version');
    if (rows.some(row => row.version > 1)) throw new Error('Database schema is newer than this setup supports.');
    for (const name of counties) {
      await client.query(`INSERT INTO hopscout.counties(name,source_url,verified_on) VALUES($1,$2,$3)
        ON CONFLICT(name) DO UPDATE SET source_url=excluded.source_url, verified_on=excluded.verified_on`, [name,countySource,verifiedOn]);
    }
    for (const loc of locations) {
      const keys = Object.keys(loc);
      const values = Object.values(loc);
      keys.push('verified_on'); values.push(verifiedOn);
      // Column names come exclusively from this bundled seed, never user input.
      await client.query(`INSERT INTO hopscout.youth_locations(${keys.join(',')})
        VALUES(${values.map((_,i)=>`$${i+1}`).join(',')}) ON CONFLICT(id) DO UPDATE SET
        ${keys.filter(k=>k!=='id').map(k=>`${k}=excluded.${k}`).join(',')}, updated_at=now()`, values);
    }
    await client.query('INSERT INTO hopscout.schema_migrations(version) VALUES(1) ON CONFLICT DO NOTHING');
    await client.query('COMMIT');
    return { counties:counties.length, locations:locations.length, seededEvents:0, seededGeocaches:0 };
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env or the environment. See .env.example.');
  const client = new pg.Client({ connectionString:process.env.DATABASE_URL, connectionTimeoutMillis:10000 });
  try {
    await client.connect();
    console.log('HopScout setup complete:', await initializeDatabase(client));
  } finally { await client.end(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    // Do not print connection strings or credential-bearing error objects.
    console.error(`HopScout setup failed (${error.code || error.name}). ${process.env.DATABASE_URL ? 'Check database connectivity and schema permissions.' : 'Set DATABASE_URL; see .env.example.'}`);
    process.exitCode = 1;
  });
}
