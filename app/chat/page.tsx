'use client'

import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import ChatInterface from '@/components/ChatInterface'

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Récupérer ou créer un userId anonyme
    let stored = localStorage.getItem('innov_user_id')
    if (!stored) {
      stored = uuidv4()
      localStorage.setItem('innov_user_id', stored)
    }
    setUserId(stored)
  }, [])

  if (!userId) {
    return (
      <div className="min-h-screen bg-innov-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-innov-400 to-innov-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-3xl">🌿</span>
          </div>
          <p className="text-innov-700 font-medium">Chargement d&apos;Iris...</p>
        </div>
      </div>
    )
  }

  return <ChatInterface mode="client" userId={userId} />
}
