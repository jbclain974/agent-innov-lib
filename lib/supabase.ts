import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client public (frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client admin (backend uniquement - accès complet)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Types pour la base de données
export interface Conversation {
  id: string
  user_id: string
  title: string | null
  mode: 'admin' | 'client'
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface UserProfile {
  id: string
  name: string | null
  context: string | null
  last_seen: string
}
