'use client'

import { useState, useEffect } from 'react'
import ChatInterface from '@/components/ChatInterface'

const ADMIN_USER_ID = 'dominique-commarmond-admin'
const ADMIN_NAME = 'Dominique'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    // Vérifier session admin persistante (localStorage)
    const session = localStorage.getItem('innov_admin_session')
    if (session === 'authenticated') {
      setIsAuthenticated(true)
    }
    setCheckingSession(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        localStorage.setItem('innov_admin_session', 'authenticated')
        setIsAuthenticated(true)
      } else {
        setError('Mot de passe incorrect. Veuillez réessayer.')
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-innov-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-innov-300 border-t-innov-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <ChatInterface
        mode="admin"
        userId={ADMIN_USER_ID}
        userName={ADMIN_NAME}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-innov-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-innov-100 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-innov-400 to-innov-600 rounded-2xl shadow-lg mb-4">
              <span className="text-3xl">🌿</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Espace Professionnel</h1>
            <p className="text-gray-500 mt-1 text-sm">INNOV LIB — Dominique COMMARMOND</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mot de passe administrateur
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoFocus
                className="w-full px-4 py-3 border border-innov-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-innov-400 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-innov-600 hover:bg-innov-700 disabled:bg-innov-200 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connexion...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Accéder à l&apos;espace pro
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-innov-600 hover:text-innov-800 text-sm transition-colors">
              ← Retour à l&apos;accueil
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Accès réservé à Dominique COMMARMOND
        </p>
      </div>
    </div>
  )
}
