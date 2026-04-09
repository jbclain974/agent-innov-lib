import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.nimxjlqomkgghdbttcrj.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'FcdXM!s?86N9EyxL',
  ssl: { rejectUnauthorized: false }
});

const SQL = `
-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT,
  mode TEXT DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profils utilisateurs
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  context TEXT,
  last_seen TIMESTAMPTZ DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- RLS désactivé (accès via service role uniquement)
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
`;

async function run() {
  await client.connect();
  console.log('✅ Connecté à Supabase');
  await client.query(SQL);
  console.log('✅ Tables créées : conversations, messages, user_profiles');
  await client.end();
}

run().catch(console.error);
