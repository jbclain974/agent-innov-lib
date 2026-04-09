import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function extractText(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  try {
    if (mimeType === 'text/plain') {
      return buffer.toString('utf-8')
    }
    if (mimeType === 'application/pdf') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(buffer)
      return data.text || `Document PDF: ${filename}`
    }
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value || `Document Word: ${filename}`
    }
    if (mimeType.startsWith('image/')) {
      return `[Image jointe: ${filename}]`
    }
    return `Document: ${filename}`
  } catch {
    return `Document: ${filename}`
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('user_id') as string

    if (!file || !userId) {
      return NextResponse.json({ error: 'Fichier et user_id requis' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const content = await extractText(buffer, file.type, file.name)

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({ user_id: userId, name: file.name, content, file_type: file.type })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ document: data })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erreur upload' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id requis' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: data || [] })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })
  const { error } = await supabaseAdmin.from('documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
