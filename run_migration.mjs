import pg from 'pg';
import { readFileSync } from 'fs';
const { Client } = pg;

// On utilise le projet le-renard-paresseux qui a déjà pg et peut se connecter
// Mais on se connecte au projet nimxjlqomkgghdbttcrj (agent-innov-lib)
const client = new Client({
  host: 'db.nimxjlqomkgghdbttcrj.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'FcdXM!s?86N9EyxL',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('✅ Connecté');
  const sql = readFileSync('./supabase/migrations/001_agent_tables.sql', 'utf8');
  await client.query(sql);
  console.log('✅ Tables créées');
  await client.end();
}

run().catch(console.error);
