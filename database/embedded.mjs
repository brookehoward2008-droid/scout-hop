// A single in-process PostgreSQL engine cannot contend with another connection.
// Only this embedded adapter skips the production PostgreSQL advisory lock.
export function embeddedClient(db) {
 return { query:async(sql,params)=>{
   if(sql === 'SELECT pg_advisory_xact_lock(20261025, 1)') return {rows:[]};
   if(sql.startsWith('-- Dedicated schema')) { await db.exec(sql); return {rows:[]}; }
   return db.query(sql,params);
 }};
}
