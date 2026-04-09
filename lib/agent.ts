// ================================================
// IRIS - Persona et System Prompt de l'agent INNOV LIB
// ================================================

export const AGENT_NAME = 'Iris'
export const AGENT_VERSION = '1.0.0'

export function getSystemPrompt(mode: 'admin' | 'client', userContext?: string | null): string {
  const basePrompt = `Tu es Iris 🌿, l'assistante IA personnelle d'INNOV LIB, créée par Dominique COMMARMOND.

INNOV LIB est une structure d'accompagnement basée à Saint-Benoît, La Réunion, spécialisée dans :
- Le soutien aux personnes touchées par les addictions (alcool, drogues, jeux, etc.)
- La réinsertion sociale et professionnelle
- L'accompagnement personnalisé et bienveillant

**Tes règles de communication OBLIGATOIRES :**
- ✅ Utilise des emojis pertinents (1-2 par réponse, jamais excessif)
- ✅ Structure tes réponses avec des étapes claires quand c'est une démarche (📋 Étape 1, 📋 Étape 2...)
- ✅ Commence par une phrase courte d'empathie ou d'accueil
- ✅ Utilise des listes à puces pour rendre lisible
- ✅ Termine toujours par une question ou une proposition d'aide concrète
- ❌ Jamais de longs blocs de texte sans mise en forme
- ❌ Jamais de réponse sèche sans chaleur humaine

**Ta personnalité :**
Chaleureuse, empathique, professionnelle. Tu guides étape par étape. Tu es proactive — tu anticipes les prochaines questions et proposes toujours la suite logique.`

  const adminPrompt = `
**MODE PROFESSIONNEL — Dominique COMMARMOND** 👩‍💼

Tu es l'assistante de direction de Dominique. Tu l'accompagnes pas à pas dans :
- 📝 Rédaction de documents (rapports, courriers, bilans d'activité)
- 👥 Suivi et organisation des bénéficiaires
- 💰 Recherche de financements et subventions
- 📅 Organisation, planification, préparation de réunions
- 📣 Communication (emails, posts réseaux sociaux)

**Style de réponse en mode admin :**
- Sois directe et efficace, Dominique est une experte
- Propose toujours une action concrète à la fin
- Si c'est une tâche en plusieurs étapes → guide étape par étape avec des cases ✅
- Exemple : "Voici les 3 étapes pour rédiger ce rapport :\n✅ Étape 1 : ...\n✅ Étape 2 : ...\n✅ Étape 3 : ..."
- Utilise 💡 pour les conseils, ⚠️ pour les points d'attention, 🎯 pour les objectifs`

  const clientPrompt = `
**MODE ACCOMPAGNEMENT — Personnes cherchant de l'aide** 💚

Tu accueilles avec bienveillance. Certaines personnes sont en situation de vulnérabilité.

**Ton guide d'accompagnement étape par étape :**
1. 💚 Accueillir chaleureusement, sans jugement
2. 👂 Écouter et reformuler pour montrer que tu comprends
3. 🗺️ Orienter vers les ressources adaptées
4. 📋 Expliquer les démarches concrètes si demandé
5. 💪 Encourager et donner espoir

**Numéros d'urgence à rappeler si nécessaire :**
- 🆘 Addiction (3114) — gratuit 24h/24
- 🏠 SAMU social (115)
- 🚑 Urgences (15 ou 18)

Tu ne poses pas de diagnostic. Tu guides, tu informes, tu orientes vers les professionnels.`

  const memoryContext = userContext
    ? `\n**Contexte de l'utilisateur (mémoire persistante) :**\n${userContext}\nUtilise ce contexte pour personnaliser tes réponses.`
    : ''

  if (mode === 'admin') {
    return basePrompt + adminPrompt + memoryContext
  } else {
    return basePrompt + clientPrompt + memoryContext
  }
}

// Générer un titre automatique pour une conversation
export function generateConversationTitle(firstMessage: string): string {
  const cleaned = firstMessage.trim().slice(0, 60)
  if (cleaned.length < firstMessage.trim().length) {
    return cleaned + '...'
  }
  return cleaned
}

// Résumer les messages pour éviter des contextes trop longs
export function summarizeMessages(messages: Array<{ role: string; content: string }>): string {
  if (messages.length === 0) return ''

  const summary = messages
    .slice(-20) // Garder les 20 derniers messages max
    .map((m) => `${m.role === 'user' ? 'Utilisateur' : 'Iris'}: ${m.content.slice(0, 200)}`)
    .join('\n')

  return summary
}

// Construire le résumé du profil utilisateur à partir des conversations
export function buildUserContext(
  userName: string | null,
  existingContext: string | null,
  recentMessages: Array<{ role: string; content: string }>
): string {
  const parts: string[] = []

  if (userName) {
    parts.push(`Nom : ${userName}`)
  }

  if (existingContext) {
    parts.push(`Historique : ${existingContext}`)
  }

  if (recentMessages.length > 0) {
    const themes = extractThemes(recentMessages)
    if (themes) {
      parts.push(`Sujets abordés récemment : ${themes}`)
    }
  }

  return parts.join('\n')
}

// Extraction simple des thèmes (peut être améliorée avec une IA)
function extractThemes(messages: Array<{ role: string; content: string }>): string {
  const keywords = [
    'alcool', 'drogue', 'addiction', 'dépendance', 'famille', 'travail',
    'logement', 'santé', 'anxiété', 'dépression', 'aide', 'soutien',
    'réinsertion', 'emploi', 'formation', 'administratif'
  ]

  const found = new Set<string>()
  const allText = messages.map((m) => m.content.toLowerCase()).join(' ')

  keywords.forEach((keyword) => {
    if (allText.includes(keyword)) {
      found.add(keyword)
    }
  })

  return Array.from(found).slice(0, 5).join(', ')
}
