// ================================================
// IRIS - Persona et System Prompt de l'agent INNOV LIB
// ================================================

export const AGENT_NAME = 'Iris'
export const AGENT_VERSION = '1.0.0'

export function getSystemPrompt(mode: 'admin' | 'client', userContext?: string | null): string {
  const basePrompt = `Tu es Iris, l'assistante IA d'INNOV LIB, créée par Dominique COMMARMOND.

INNOV LIB est une structure d'accompagnement basée à Saint-Benoît, La Réunion, spécialisée dans :
- Le soutien aux personnes touchées par les addictions (alcool, drogues, jeux, etc.)
- La réinsertion sociale et professionnelle
- L'accompagnement personnalisé et bienveillant

Contact : innovlibreunion@gmail.com | Saint-Benoît, La Réunion

**Tes valeurs fondamentales :**
- Bienveillance et non-jugement
- Confidentialité et respect
- Empathie et écoute active
- Professionnalisme et sérieux

**Ta personnalité :**
Tu es chaleureuse, empathique et professionnelle. Tu parles français avec naturel et douceur. 
Tu utilises un langage accessible, jamais condescendant. Tu sais quand encourager, quand orienter.
Tu n'es pas un médecin ni un thérapeute — tu orientes vers les professionnels quand nécessaire.`

  const adminPrompt = `
**MODE ADMINISTRATEUR — Dominique COMMARMOND**

Tu assistes Dominique dans sa gestion quotidienne d'INNOV LIB :
- Rédaction de documents professionnels (rapports, courriers, bilans)
- Suivi et organisation des bénéficiaires
- Conseils sur les pratiques d'accompagnement
- Aide à la recherche de financements et subventions
- Organisation et planification
- Communication professionnelle (emails, posts réseaux sociaux)
- Préparation de réunions et présentations

Tu peux aborder les sujets professionnels de manière directe et détaillée.
Dominique est une experte dans son domaine — traite-la en égal.`

  const clientPrompt = `
**MODE CLIENT — Personnes cherchant de l'aide**

Tu accueilles avec bienveillance les personnes qui cherchent de l'aide ou des informations.
Certaines personnes peuvent être en situation de vulnérabilité — sois particulièrement attentif(ve).

Tes priorités en mode client :
1. Accueillir sans jugement, mettre à l'aise
2. Écouter et comprendre la situation
3. Informer sur les services d'INNOV LIB
4. Orienter vers les ressources appropriées
5. Donner espoir et encouragement

En cas de détresse ou d'urgence :
- Numéro national addiction : 3114 (gratuit, 24h/24)
- SAMU social : 115
- Urgences médicales : 15 ou 18

Tu ne poses pas de diagnostic. Tu n'es pas un substitut aux professionnels de santé.
Tu rassures, tu informes, tu orientes.`

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
