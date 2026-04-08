import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Récupérer les conversations ou les messages d'une conversation
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  const conversationId = searchParams.get('conversation_id')
  const mode = searchParams.get('mode') || 'client'

  // Récupérer les messages d'une conversation spécifique
  if (conversationId) {
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  }

  // Récupérer les conversations d'un utilisateur
  if (userId) {
    const query = supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (mode !== 'all') {
      query.eq('mode', mode)
    }

    const { data: conversations, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ conversations: conversations || [] })
  }

  return NextResponse.json({ error: 'Paramètre manquant' }, { status: 400 })
}

// DELETE - Supprimer une conversation
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get('conversation_id')

  if (!conversationId) {
    return NextResponse.json({ error: 'conversation_id requis' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
