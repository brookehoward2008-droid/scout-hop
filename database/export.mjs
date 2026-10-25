import { writeFile } from 'node:fs/promises';
import { counties, locations, verifiedOn } from './data.mjs';
const all = [...locations].sort((a,b)=>a.county.localeCompare(b.county)||a.name.localeCompare(b.name));
const optional = { age_range:null,is_free:null,region:null,nearest_transit:null,contact_email:null,description:null,latitude:null,longitude:null,coordinate_source_url:null,coordinates_verified_on:null };
await writeFile(new URL('./locations.json',import.meta.url),JSON.stringify(all.map(l=>({...optional,...l,verified_on:verifiedOn,verification_scope:'facility_identity_and_address'})),null,2)+'\n');
const header = `# Statewide facility/source register\n\nReviewed ${verifiedOn}. ${locations.length} facilities; ${new Set(locations.map(l=>l.county)).size} of ${counties.length} counties covered.\n\nVerification scope: facility identity and address. Public libraries are selected as general youth-friendly reading/learning places; this is an editorial inference, not a teen-program certification. Fees, ages, hours, coordinates, transit and contact details are not inferred. See VERIFICATION.md for source-access limitations and excluded closed/remodeling facilities.\n\n| County | Facility | Address | Official source |\n| --- | --- | --- | --- |\n`;
await writeFile(new URL('./STATEWIDE-SOURCES.md',import.meta.url), header+all.map(l=>`| ${l.county} | ${l.name} | ${l.address} | [Source](${l.source_url}) |`).join('\n')+'\n');
console.log('Exported locations.json and STATEWIDE-SOURCES.md');
