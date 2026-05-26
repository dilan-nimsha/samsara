// Seed auth users + profiles for Samsara RMS.
// Run after auth-rbac.sql:  npm run seed:users
// (uses SUPABASE_SERVICE_ROLE_KEY from .env.local — never ship this to the client)

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run with: node --env-file=.env.local scripts/seed-users.mjs');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const PASSWORD    = process.env.SEED_PASSWORD     || 'Samsara#2026';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL  || 'dilannimsha1@gmail.com';

const USERS = [
  { email: ADMIN_EMAIL,            full_name: 'Dilan Nimsha',  role: 'admin',   station: null         },
  { email: 'ops@samsara.test',     full_name: 'Ops Staff',     role: 'ops',     station: 'Sri Lanka'  },
  { email: 'finance@samsara.test', full_name: 'Finance Staff', role: 'finance', station: null         },
  { email: 'partner@samsara.test', full_name: 'Partner Agent', role: 'partner', station: null         },
];

async function ensurePartner() {
  const { data: existing } = await sb.from('partners').select('id').limit(1);
  if (existing && existing.length) return existing[0].id;
  const { data, error } = await sb.from('partners')
    .insert({ company_name: 'Demo Partner Co', contact_person: 'Partner Agent', email: 'partner@samsara.test', commission_rate: 10, is_active: true })
    .select('id').single();
  if (error) { console.warn('  (could not create demo partner:', error.message, ')'); return null; }
  return data.id;
}

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) return null;
    const u = data.users.find(x => (x.email ?? '').toLowerCase() === email.toLowerCase());
    if (u) return u;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function run() {
  const partnerId = await ensurePartner();

  for (const u of USERS) {
    const meta = { full_name: u.full_name, role: u.role, station: u.station };
    let userId;

    const { data: created, error } = await sb.auth.admin.createUser({
      email: u.email, password: PASSWORD, email_confirm: true, user_metadata: meta,
    });

    if (error) {
      const existing = await findUserByEmail(u.email);
      if (!existing) { console.error(`✗ ${u.email}: ${error.message}`); continue; }
      userId = existing.id;
      await sb.auth.admin.updateUserById(userId, { password: PASSWORD, user_metadata: meta });
      console.log(`• ${u.email} — already existed, password + profile refreshed`);
    } else {
      userId = created.user.id;
      console.log(`✓ ${u.email} — created`);
    }

    const { error: pErr } = await sb.from('profiles').upsert({
      id: userId,
      full_name:  u.full_name,
      role:       u.role,
      station:    u.station,
      initials:   u.full_name.slice(0, 1).toUpperCase(),
      partner_id: u.role === 'partner' ? partnerId : null,
    });
    if (pErr) console.error(`  ⚠ profile upsert failed (run auth-rbac.sql first?): ${pErr.message}`);
  }

  console.log(`\n✅ Done. All seeded accounts use password:  ${PASSWORD}`);
  console.log(`   Admin login: ${ADMIN_EMAIL}`);
}

run().catch(e => { console.error(e); process.exit(1); });
