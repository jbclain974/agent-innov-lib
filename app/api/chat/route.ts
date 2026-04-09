import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSystemPrompt, generateConversationTitle, buildUserContext } from '@/lib/agent'
import { searchDataGouv, searchServicePublic, needsExternalData, formatToolResults } from '@/lib/tools'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_MODEL_FAST = 'llama3-8b-8192'

async function callGroq(messages: Array<{ role: string; content: string }>, systemPrompt: string, fast = false) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: fast ? GROQ_MODEL_FAST : GROQ_MODEL,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq error: ${err}`)
  }
  const data = await res.json()
  return data.choices[0]?.message?.content || ''
}

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
      const { data: newProfile } = await supabaseAdmin
        .from('user_profiles')
        .insert({ id: user_id, name: user_name || null })
        .select()
        .single()
      userProfile = newProfile
    } else {
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
      const { data: msgs } = await supabaseAdmin
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(30)
      existingMessages = msgs || []
    } else {
      const { data: newConv } = await supabaseAdmin
        .from('conversations')
        .insert({ user_id, title: generateConversationTitle(message), mode: chatMode })
        .select()
        .single()
      conversationId = newConv?.id
    }

    // 3. Construire le contexte utilisateur
    const userContext = buildUserContext(
      userProfile?.name || user_name || null,
      userProfile?.context || null,
      existingMessages
    )

    // 4. Recherche données externes si pertinent
    let externalContext = ''
    const needs = needsExternalData(message)
    const externalResults = []

    if (needs.dataGouv) {
      const dgResults = await searchDataGouv(message)
      externalResults.push(...dgResults)
    }
    if (needs.servicePublic) {
      const spResults = await searchServicePublic(message)
      externalResults.push(...spResults)
    }
    if (externalResults.length > 0) {
      externalContext = formatToolResults(externalResults)
    }

    const isReturningUser = existingMessages.length > 0
    let systemPrompt = getSystemPrompt(chatMode, userContext, isReturningUser)

    // Charger les documents de référence de l'utilisateur
    const { data: docs } = await supabaseAdmin
      .from('documents')
      .select('name, content')
      .eq('user_id', user_id)
      .limit(5)

    if (docs && docs.length > 0) {
      const docsContext = docs.map(d => `📄 ${d.name}:\n${d.content.slice(0, 2000)}`).join('\n\n')
      systemPrompt += `\n\n**Documents de référence disponibles :**\n${docsContext}`
    }

    const systemWithTools = systemPrompt + (externalContext ? `\n\nSources officielles consultées pour cette question :${externalContext}\n\nUtilise ces informations pour enrichir ta réponse et cite les sources pertinentes.` : '')

    const groqMessages: Array<{ role: string; content: string }> = [
      ...existingMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    // 5. Appeler Groq
    const assistantResponse = await callGroq(groqMessages, systemWithTools)

    // 6. Sauvegarder en Supabase
    await supabaseAdmin.from('messages').insert([
      { conversation_id: conversationId, role: 'user', content: message },
      { conversation_id: conversationId, role: 'assistant', content: assistantResponse },
    ])

    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // 7. Mise à jour contexte périodique
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
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

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

    const summaryPrompt = `Résume en 3-5 phrases courtes le profil de cet utilisateur basé sur ses échanges avec INNOV LIB. Focus sur : sa situation, ses besoins, ses sujets d'intérêt. Sois factuel et bienveillant.

Échanges :
${allMessages.slice(-20).map((m) => `${m.role === 'user' ? 'Client' : 'Iris'}: ${m.content.slice(0, 200)}`).join('\n')}`

    const contextSummary = await callGroq([{ role: 'user', content: summaryPrompt }], 'Tu es un assistant qui résume des profils utilisateurs.', true)

    await supabaseAdmin
      .from('user_profiles')
      .update({ context: contextSummary })
      .eq('id', userId)
  } catch (error) {
    console.error('Erreur mise à jour contexte:', error)
  }
}
