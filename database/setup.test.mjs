import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { initializeDatabase } from './setup.mjs';
import { counties, locations } from './data.mjs';
import { embeddedClient } from './embedded.mjs';

// PGlite executes real PostgreSQL SQL in-process. Its single-connection engine
// has no concurrent sessions, so the production advisory lock is skipped here.
const adapter = embeddedClient;
test('setup, repeatability, source coverage and constraints', async()=>{
  const db = new PGlite();
  try {
    const client = adapter(db);
    assert.equal(new Set(counties).size,39);
    assert.deepEqual(await initializeDatabase(client),{counties:39,locations:40,seededEvents:0,seededGeocaches:0});
    await initializeDatabase(client);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM hopscout.counties')).rows[0].n,39);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM hopscout.youth_locations')).rows[0].n,40);
    assert.deepEqual([...new Set(locations.map(l=>l.county))].sort(),[...counties].sort());
    assert.equal((await db.query('SELECT count(DISTINCT county)::int AS n FROM hopscout.youth_locations')).rows[0].n,39);
    assert.equal(new Set(locations.map(l=>l.id)).size,locations.length);
    for(const table of ['events','geocaches','zip_code_index','zip_code_counties','users','community_submissions']) {
      assert.equal((await db.query(`SELECT count(*)::int AS n FROM hopscout.${table}`)).rows[0].n,0);
    }
    assert.equal((await db.query('SELECT count(*)::int AS n FROM hopscout.youth_locations WHERE is_free IS NOT NULL OR age_range IS NOT NULL OR latitude IS NOT NULL OR longitude IS NOT NULL OR nearest_transit IS NOT NULL OR contact_email IS NOT NULL')).rows[0].n,0);
    assert.ok(locations.every(loc=>loc.source_url.startsWith('https://')));
    await assert.rejects(db.query("UPDATE hopscout.youth_locations SET county='Invented' WHERE id='loc_ymca_everett'"));
    await assert.rejects(db.query("UPDATE hopscout.youth_locations SET latitude=100 WHERE id='loc_ymca_everett'"));
    await assert.rejects(db.query("UPDATE hopscout.youth_locations SET latitude=47, longitude=-122 WHERE id='loc_ymca_everett'"));
    await assert.rejects(db.query("INSERT INTO hopscout.users(id,username,total_xp) VALUES('bad','bad',-1)"));
    await assert.rejects(db.query("INSERT INTO hopscout.events(id,location_id,title,starts_at,ends_at,source_url,verified_on) VALUES('bad','loc_ymca_everett','Bad', '2026-10-25','2026-10-24','https://example.org','2026-10-25')"));
  } finally { await db.close(); }
});
test('a seed failure rolls back the entire new setup',async()=>{
  const db = new PGlite();
  const base = adapter(db);
  try {
    await assert.rejects(initializeDatabase({query:async(sql,params)=>{
      if(params?.[0]==='loc_tacoma_bgc') throw new Error('Injected failure');
      return base.query(sql,params);
    }}),/Injected failure/);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM information_schema.schemata WHERE schema_name='hopscout'")).rows[0].n,0);
    await initializeDatabase(base);
  } finally { await db.close(); }
});
