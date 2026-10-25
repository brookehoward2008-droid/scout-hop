import { PGlite } from '@electric-sql/pglite';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Express } from 'express';
import type { YouthDiscoveryItem } from '../types.ts';

export async function openLocalDirectory(dataDir = process.env.HOPSCOUT_DB_DIR || path.resolve('database/.local/hopscout')) {
  await mkdir(dataDir, { recursive: true });
  const db = new PGlite(dataDir);
  try {
    // Resolve from the project root in both dev and bundled production builds.
    const { initializeDatabase } = await import(pathToFileURL(path.resolve('database/setup.mjs')).href);
    const { embeddedClient } = await import(pathToFileURL(path.resolve('database/embedded.mjs')).href);
    await initializeDatabase(embeddedClient(db));
    return db;
  } catch (error) { await db.close(); throw error; }
}

export function toDiscovery(row: Record<string, any>): YouthDiscoveryItem {
  return {
    id: row.id, name: row.name, organization: row.organization,
    type: row.category === 'Library' ? 'library' : row.category === 'Youth club' ? 'youth_center' : 'sports_rec',
    county: row.county, city: row.city, address: row.address, zipCode: row.zip_code,
    description: row.description, ageGroup: row.age_range,
    freeDetails: null, verifiedFree: row.is_free, costStatus: row.is_free === true ? 'reported_free' : 'unknown',
    lat: row.latitude === null ? null : Number(row.latitude), lng: row.longitude === null ? null : Number(row.longitude),
    transitAccess: row.nearest_transit, scheduleOrDate: null, scoutPoints: null,
    tags: [], contactOrLink: row.source_url, sourceName: row.organization,
    verifiedOn: String(row.verified_on).slice(0,10), verificationScope: row.verification_scope, isSample: false,
  };
}

export function registerLocalDirectoryRoutes(app: Express, db: PGlite) {
  const guarded = (handler: any) => async (req: any, res: any) => {
    try { await handler(req,res); }
    catch { res.status(503).json({success:false,message:'Local directory unavailable. No sample data was substituted.'}); }
  };
  app.get('/api/counties', guarded(async (_req: any,res: any) => {
    const { rows } = await db.query('SELECT name FROM hopscout.counties ORDER BY name');
    res.json({counties:rows.map((r: any)=>r.name)});
  }));
  app.post('/api/youth-events/search', guarded(async (req: any,res: any) => {
    const {county, category, query} = req.body || {};
    const values: any[] = [];
    const clauses: string[] = [];
    if (county && county !== 'all') { values.push(String(county)); clauses.push(`lower(county)=lower($${values.length})`); }
    if(query) { values.push(`%${String(query).slice(0,200).replace(/[\\%_]/g,'\\$&')}%`); clauses.push(`concat_ws(' ',name,organization,city,county,address) ILIKE $${values.length}`); }
    if(category && category !== 'all') {
      const mapped: Record<string,string> = {library:'Library',youth_center:'Youth club',sports_rec:'Community recreation'};
      if(!mapped[category]) { res.json({success:true,items:[],count:0,sampleMode:false}); return; }
      values.push(mapped[category]); clauses.push(`category=$${values.length}`);
    }
    const {rows} = await db.query(`SELECT * FROM hopscout.youth_locations ${clauses.length ? 'WHERE '+clauses.join(' AND ') : ''} ORDER BY county,name`,values);
    const items = rows.map(toDiscovery);
    res.json({success:true,count:items.length,items,sampleMode:false});
  }));
  app.get('/api/youth-events/db', guarded(async (_req: any,res: any) => {
    const {rows} = await db.query('SELECT * FROM hopscout.youth_locations ORDER BY county,name');
    res.json({success:true,items:rows.map(toDiscovery)});
  }));
  app.get('/api/places/nearby', guarded(async (_req: any,res: any) => {
    const {rows} = await db.query('SELECT * FROM hopscout.youth_locations WHERE latitude IS NOT NULL AND longitude IS NOT NULL');
    res.json({success:true,pois:rows.map(toDiscovery)});
  }));
  // These inventories are deliberately empty until independently reviewed data exists.
  app.get('/api/events', (_req,res)=>res.json({success:true,items:[]}));
  app.get('/api/geocaches', (_req,res)=>res.json({success:true,items:[]}));
  app.post('/api/youth-events/batch', (_req,res)=>res.status(403).json({message:'Only the reviewed local directory is served. Unreviewed ingestion is disabled.'}));
}
