import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function extractTextFromFile(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'txt' || mimeType === 'text/plain') {
    return buffer.toString('utf-8')
  }

  if (ext === 'pdf' || mimeType === 'application/pdf') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    return data.text
  }

  if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  throw new Error(`Type de fichier non supporté: ${ext}`)
}

// POST — Upload un document
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const user_id = formData.get('user_id') as string | null

    if (!file || !user_id) {
      return NextResponse.json({ error: 'Fichier et user_id requis' }, { status: 400 })
    }

    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const allowedExts = ['txt', 'pdf', 'docx']
    const ext = file.name.split('.').pop()?.toLowerCase()

    if (!ext || !allowedExts.includes(ext)) {
      return NextResponse.json({ error: 'Type de fichier non supporté. Utilisez PDF, DOCX ou TXT.' }, { status: 400 })
    }

    // Limite 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let content: string
    try {
      content = await extractTextFromFile(buffer, file.name, file.type)
    } catch (err) {
      return NextResponse.json({ error: `Erreur extraction: ${err instanceof Error ? err.message : 'Inconnu'}` }, { status: 422 })
    }

    if (!content.trim()) {
      return NextResponse.json({ error: 'Le document semble vide ou illisible' }, { status: 422 })
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id,
        name: file.name,
        content: content.slice(0, 100000), // max 100k chars
        file_type: ext,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Erreur sauvegarde en base de données' }, { status: 500 })
    }

    return NextResponse.json({ document: data, message: 'Document uploadé avec succès' })
  } catch (error) {
    console.error('Erreur upload document:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// GET — Liste les documents d'un utilisateur
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id requis' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, name, file_type, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Erreur chargement documents' }, { status: 500 })
    }

    return NextResponse.json({ documents: data || [] })
  } catch (error) {
    console.error('Erreur GET documents:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// DELETE — Supprimer un document
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const user_id = searchParams.get('user_id')

    if (!id || !user_id) {
      return NextResponse.json({ error: 'id et user_id requis' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id) // sécurité : ne peut supprimer que ses propres docs

    if (error) {
      return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Document supprimé' })
  } catch (error) {
    console.error('Erreur DELETE document:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
