// Seed sample fleet (vehicles, drivers, guides) so assignment dropdowns are usable.
// Run:  npm run seed:fleet   (idempotent — skips a table if it already has rows)

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('✗ Missing Supabase env. Use: node --env-file=.env.local scripts/seed-fleet.mjs'); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

const vehicles = [
  { type: 'van',     registration: 'WP-CAB-1234', make: 'Toyota',        model: 'KDH',        year: 2021, capacity_adults: 9,  air_conditioned: true, owner: 'own_fleet' },
  { type: 'car',     registration: 'WP-CAR-4567', make: 'Toyota',        model: 'Axio',       year: 2020, capacity_adults: 3,  air_conditioned: true, owner: 'own_fleet' },
  { type: 'car',     registration: 'WP-LUX-9001', make: 'Mercedes-Benz', model: 'E-Class',    year: 2022, capacity_adults: 3,  air_conditioned: true, owner: 'own_fleet' },
  { type: 'minibus', registration: 'WP-BUS-7788', make: 'Nissan',        model: 'Civilian',   year: 2019, capacity_adults: 18, air_conditioned: true, owner: 'own_fleet' },
];

const drivers = [
  { full_name: 'Chaminda Perera',    phone: '+94 77 123 4567', license_number: 'B1234567', languages: ['English', 'Sinhala'],          daily_rate: 35 },
  { full_name: 'Roshan Jayawardena', phone: '+94 71 234 5678', license_number: 'B2345678', languages: ['English', 'Sinhala', 'Tamil'], daily_rate: 40 },
  { full_name: 'Nuwan Silva',        phone: '+94 76 345 6789', license_number: 'B3456789', languages: ['English'],                       daily_rate: 30 },
];

const guides = [
  { full_name: 'Priya Wickramasinghe', phone: '+94 77 555 1212', languages: ['English', 'German'], specializations: ['cultural', 'wildlife'],     base_location: 'Kandy', daily_rate: 60 },
  { full_name: 'Arjuna Bandara',       phone: '+94 71 555 3434', languages: ['English', 'French'], specializations: ['hiking', 'photography'],     base_location: 'Ella',  daily_rate: 55 },
  { full_name: 'Dilani Fernando',      phone: '+94 76 555 5656', languages: ['English', 'Mandarin'], specializations: ['cultural', 'culinary'],   base_location: 'Colombo', daily_rate: 50 },
];

async function seed(table, rows) {
  const { count } = await sb.from(table).select('*', { count: 'exact', head: true });
  if (count && count > 0) { console.log(`• ${table}: ${count} row(s) already present — skipped`); return; }
  const { error } = await sb.from(table).insert(rows);
  console.log(error ? `✗ ${table}: ${error.message}` : `✓ ${table}: seeded ${rows.length}`);
}

await seed('vehicles', vehicles);
await seed('drivers',  drivers);
await seed('guides',   guides);
console.log('\n✅ Fleet seed complete.');
