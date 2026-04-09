// ================================================
// OUTILS EXTERNES — data.gouv.fr + service-public.fr
// ================================================

export interface ToolResult {
  source: string
  title: string
  summary: string
  url?: string
}

// ─── data.gouv.fr ─────────────────────────────────────────────
export async function searchDataGouv(query: string): Promise<ToolResult[]> {
  try {
    const url = `https://www.data.gouv.fr/api/1/datasets/?q=${encodeURIComponent(query)}&page_size=3&sort=-created`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).slice(0, 3).map((d: any) => ({
      source: 'data.gouv.fr',
      title: d.title || 'Sans titre',
      summary: (d.description || '').slice(0, 300),
      url: `https://www.data.gouv.fr/datasets/${d.slug || d.id}`,
    }))
  } catch {
    return []
  }
}

// ─── service-public.fr ────────────────────────────────────────
export async function searchServicePublic(query: string): Promise<ToolResult[]> {
  try {
    // API de recherche service-public.fr (endpoint public)
    const url = `https://lecomarquage.service-public.fr/vdd/3.3/part/json/recherche/${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!res.ok) return []
    const data = await res.json()
    const results = data.reponsesDocuments || data.resultats || []
    return results.slice(0, 3).map((r: any) => ({
      source: 'service-public.fr',
      title: r.titre || r.title || 'Fiche pratique',
      summary: (r.description || r.resume || '').slice(0, 300),
      url: r.url || `https://www.service-public.fr`,
    }))
  } catch {
    return []
  }
}

// ─── Détecter si la question nécessite des données externes ───
export function needsExternalData(message: string): { dataGouv: boolean; servicePublic: boolean } {
  const msg = message.toLowerCase()

  const dataGouvKeywords = [
    'statistique', 'données', 'chiffre', 'taux', 'nombre', 'combien',
    'étude', 'rapport', 'enquête', 'population', 'france', 'national',
    'addiction', 'dépendance', 'alcool', 'drogue', 'prévalence'
  ]

  const servicePublicKeywords = [
    'démarche', 'administratif', 'formulaire', 'dossier', 'droits',
    'aide', 'allocation', 'prestation', 'caf', 'rsa', 'aah', 'cpam',
    'logement', 'emploi', 'formation', 'carte vitale', 'sécu',
    'retraite', 'pension', 'impôt', 'taxe', 'papier', 'document',
    'comment faire', 'où s\'adresser', 'qui contacter', 'délai'
  ]

  return {
    dataGouv: dataGouvKeywords.some(k => msg.includes(k)),
    servicePublic: servicePublicKeywords.some(k => msg.includes(k)),
  }
}

// ─── Formatter les résultats pour injection dans le prompt ────
export function formatToolResults(results: ToolResult[]): string {
  if (results.length === 0) return ''

  return `\n\n---\n**Informations officielles trouvées :**\n` +
    results.map(r =>
      `📄 **${r.title}** (${r.source})\n${r.summary}${r.url ? `\n🔗 ${r.url}` : ''}`
    ).join('\n\n')
}
