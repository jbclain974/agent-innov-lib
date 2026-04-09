import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Récupérer les conversations ou les messages d'une conversation
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  const conversationId = searchParams.get('conversation_id')

  if (conversationId) {
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ messages: messages || [] })
  }

  if (userId) {
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ conversations: conversations || [] })
  }

  return NextResponse.json({ error: 'Paramètre manquant' }, { status: 400 })
}

// PATCH - Renommer une conversation
export async function PATCH(req: NextRequest) {
  const { conversation_id, title } = await req.json()
  if (!conversation_id || !title) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  const { error } = await supabaseAdmin.from('conversations').update({ title }).eq('id', conversation_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE - Supprimer une conversation
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get('conversation_id')
  if (!conversationId) return NextResponse.json({ error: 'conversation_id requis' }, { status: 400 })
  const { error } = await supabaseAdmin.from('conversations').delete().eq('id', conversationId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
