'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Document {
  id: string
  name: string
  file_type: string
  created_at: string
}

interface DocumentsModalProps {
  userId: string
  onClose: () => void
}

export default function DocumentsModal({ userId, onClose }: DocumentsModalProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/documents?user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const uploadFile = async (file: File) => {
    setUploadError(null)
    setUploadSuccess(null)
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId)

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error || 'Erreur lors de l\'upload')
      } else {
        setUploadSuccess(`✅ "${file.name}" uploadé avec succès !`)
        await loadDocuments()
      }
    } catch (error) {
      setUploadError('Erreur réseau lors de l\'upload')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const deleteDocument = async (docId: string, docName: string) => {
    if (!confirm(`Supprimer "${docName}" ?`)) return

    try {
      const res = await fetch(`/api/documents?id=${docId}&user_id=${userId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId))
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return '📄'
      case 'docx': return '📝'
      case 'txt': return '📃'
      default: return '📎'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">📚 Documents de référence</h2>
            <p className="text-xs text-gray-500 mt-0.5">Iris utilisera ces documents pour vous aider</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Upload zone */}
        <div className="px-6 py-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-innov-400 bg-innov-50'
                : 'border-gray-200 hover:border-innov-300 hover:bg-gray-50'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-innov-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Traitement en cours...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">📎</span>
                <p className="text-sm font-medium text-gray-700">
                  Glissez un fichier ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-400">PDF, DOCX, TXT — max 10 MB</p>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              ❌ {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="mt-3 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">
              {uploadSuccess}
            </div>
          )}
        </div>

        {/* Documents list */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-innov-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Aucun document uploadé</p>
              <p className="text-xs mt-1">Uploadez des documents pour enrichir les réponses d&apos;Iris</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium mb-3">
                {documents.length} document{documents.length > 1 ? 's' : ''} disponible{documents.length > 1 ? 's' : ''}
              </p>
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <span className="text-xl flex-shrink-0">{getFileIcon(doc.file_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(doc.created_at)} · {doc.file_type?.toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.id, doc.name)}
                    className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors text-lg"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
