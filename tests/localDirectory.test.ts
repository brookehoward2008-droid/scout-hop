import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';
import { openLocalDirectory, registerLocalDirectoryRoutes } from '../src/server/localDirectory.ts';

test('HTTP directory queries persistent SQL in every county without samples', async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'hopscout-app-'));
 let db=await openLocalDirectory(dir);
 const app=express(); app.use(express.json()); registerLocalDirectoryRoutes(app,db);
 const server=app.listen(0,'127.0.0.1');
 await new Promise<void>(resolve=>server.once('listening',resolve));
 const base=`http://127.0.0.1:${(server.address() as any).port}`;
 const search=async(body:unknown)=>(await fetch(base+'/api/youth-events/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json();
 try {
  const {counties}=await(await fetch(base+'/api/counties')).json();
  assert.equal(counties.length,39);
  const all=await search({county:'all'}); assert.equal(all.count,40);
  for(const county of counties) {
   const result=await search({county}); assert.ok(result.count>=1,county);
   assert.ok(result.items.every((item:any)=>item.county===county));
  }
  for(const item of all.items) {
   for(const key of ['description','ageGroup','freeDetails','verifiedFree','lat','lng','transitAccess','scheduleOrDate','scoutPoints']) assert.equal(item[key],null,`${item.id}.${key}`);
   assert.equal(item.isSample,false);assert.ok(item.contactOrLink.startsWith('https://'));
  }
  assert.equal((await search({query:'Moses Lake',category:'library'})).count,1);
  assert.equal((await search({county:"King' OR 1=1 --"})).count,0);
  assert.equal((await search({category:'free_event'})).count,0);
  assert.equal((await search({query:'%'})).count,0);
  for(const route of ['/api/events','/api/geocaches']) assert.deepEqual((await(await fetch(base+route)).json()).items,[]);
  assert.deepEqual((await(await fetch(base+'/api/places/nearby')).json()).pois,[]);
  await db.query("UPDATE hopscout.youth_locations SET name='Database test name' WHERE id='loc_library_adams'");
  assert.equal((await search({query:'Database test name'})).count,1);
  await db.query('DELETE FROM hopscout.youth_locations');
  assert.equal((await search({})).count,0);
  await db.close(); db=await openLocalDirectory(dir);
  assert.equal((await db.query<{n:number}>('SELECT count(*)::int AS n FROM hopscout.youth_locations')).rows[0].n,40);
 } finally {
  await new Promise<void>(resolve=>server.close(()=>resolve()));
  await db.close(); await rm(dir,{recursive:true,force:true});
 }
});
