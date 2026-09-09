import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
import { runHdbBuildingCollection } from '../lib/data-operations/hdb-buildings.server.ts';
if(!process.argv.includes('--apply') || !process.env.DATABASE_URL) throw new Error('Explicit --apply and DATABASE_URL required');
const sql=neon(process.env.DATABASE_URL);
if(process.argv.includes('--migrate')) {
 const migration=await readFile(new URL('../db/migrations/0024_hdb_building_collection.sql',import.meta.url),'utf8');
 for(const statement of migration.split('-- statement-breakpoint')) if(statement.trim())await sql.query(statement);
}
console.log(JSON.stringify(await runHdbBuildingCollection({query:async(s,p)=>sql.query(s,p)},{force:true})));
