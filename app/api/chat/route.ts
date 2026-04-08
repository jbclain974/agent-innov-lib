import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { getSystemPrompt, generateConversationTitle, buildUserContext } from '@/lib/agent'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { message, conversation_id, user_id, user_name, mode } = await req.json()

    if (!message || !user_id) {
      return NextResponse.json({ error: 'Message et user_id requis' }, { status: 400 })
    }

    const chatMode: 'admin' | 'client' = mode === 'admin' ? 'admin' : 'client'

    // 1. Récupérer ou créer le profil utilisateur
    let userProfile = null
    const { data: profileData } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    userProfile = profileData

    if (!userProfile) {
      // Créer le profil
      const { data: newProfile } = await supabaseAdmin
        .from('user_profiles')
        .insert({ id: user_id, name: user_name || null })
        .select()
        .single()
      userProfile = newProfile
    } else {
      // Mettre à jour last_seen et le nom si fourni
      await supabaseAdmin
        .from('user_profiles')
        .update({
          last_seen: new Date().toISOString(),
          ...(user_name && { name: user_name }),
        })
        .eq('id', user_id)
    }

    // 2. Gérer la conversation
    let conversationId = conversation_id
    let existingMessages: Array<{ role: string; content: string }> = []

    if (conversationId) {
      // Charger les messages existants (max 30 derniers)
      const { data: msgs } = await supabaseAdmin
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(30)

      existingMessages = msgs || []
    } else {
      // Créer une nouvelle conversation
      const { data: newConv } = await supabaseAdmin
        .from('conversations')
        .insert({
          user_id,
          title: generateConversationTitle(message),
          mode: chatMode,
        })
        .select()
        .single()

      conversationId = newConv?.id
    }

    // 3. Construire le contexte utilisateur pour la mémoire
    const userContext = buildUserContext(
      userProfile?.name || user_name || null,
      userProfile?.context || null,
      existingMessages
    )

    // 4. Préparer les messages pour Claude
    const systemPrompt = getSystemPrompt(chatMode, userContext)

    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...existingMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    // 5. Appeler Claude
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    })

    const assistantResponse =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // 6. Sauvegarder les messages en Supabase
    await supabaseAdmin.from('messages').insert([
      {
        conversation_id: conversationId,
        role: 'user',
        content: message,
      },
      {
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantResponse,
      },
    ])

    // 7. Mettre à jour updated_at de la conversation
    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // 8. Mise à jour du contexte utilisateur (résumé périodique)
    if (existingMessages.length > 0 && existingMessages.length % 10 === 0) {
      await updateUserContext(user_id, existingMessages, message, assistantResponse)
    }

    return NextResponse.json({
      response: assistantResponse,
      conversation_id: conversationId,
      message_id: `msg-${Date.now()}`,
    })
  } catch (error) {
    console.error('Erreur API chat:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// Mise à jour périodique du contexte utilisateur
async function updateUserContext(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  lastUserMsg: string,
  lastAssistantMsg: string
) {
  try {
    const allMessages = [
      ...messages,
      { role: 'user', content: lastUserMsg },
      { role: 'assistant', content: lastAssistantMsg },
    ]

    // Générer un résumé avec Claude
    const summaryResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Résume en 3-5 phrases courtes le profil de cet utilisateur basé sur ses échanges avec INNOV LIB. Focus sur : sa situation, ses besoins, ses sujets d'intérêt. Sois factuel et bienveillant.

Échanges :
${allMessages
  .slice(-20)
  .map((m) => `${m.role === 'user' ? 'Client' : 'Iris'}: ${m.content.slice(0, 200)}`)
  .join('\n')}`,
        },
      ],
    })

    const contextSummary =
      summaryResponse.content[0].type === 'text'
        ? summaryResponse.content[0].text
        : ''

    await supabaseAdmin
      .from('user_profiles')
      .update({ context: contextSummary })
      .eq('id', userId)
  } catch (error) {
    console.error('Erreur mise à jour contexte:', error)
    // Non bloquant
  }
}
