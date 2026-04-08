'use client'

import Link from 'next/link'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

export default function HomePage() {
  const [showInfo, setShowInfo] = useState(false)

  const handleStartChat = () => {
    // Générer un userId anonyme si pas déjà présent
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('innov_user_id')) {
        localStorage.setItem('innov_user_id', uuidv4())
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-innov-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-innov-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-innov-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">IL</span>
            </div>
            <div>
              <h1 className="font-bold text-innov-800 text-lg leading-tight">INNOV LIB</h1>
              <p className="text-innov-600 text-xs">Saint-Benoît, La Réunion</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-innov-600 hover:text-innov-800 text-sm font-medium transition-colors"
            >
              À propos
            </button>
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              Espace pro
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-innov-100 text-innov-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-innov-500 rounded-full animate-pulse"></span>
          Iris est disponible pour vous accompagner
        </div>

        <h2 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4 leading-tight">
          Vous n&apos;êtes pas seul(e).
          <br />
          <span className="text-innov-600">Nous sommes là pour vous.</span>
        </h2>

        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          INNOV LIB accompagne les personnes touchées par les addictions et soutient 
          leur réinsertion sociale avec bienveillance et professionnalisme.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/chat"
            onClick={handleStartChat}
            className="inline-flex items-center justify-center gap-2 bg-innov-600 hover:bg-innov-700 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all transform hover:scale-105 shadow-lg shadow-innov-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Parler avec Iris
          </Link>
          <a
            href="mailto:innovlibreunion@gmail.com"
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-innov-50 text-innov-700 font-semibold px-8 py-4 rounded-2xl text-lg transition-all border-2 border-innov-200 hover:border-innov-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Nous contacter
          </a>
        </div>
      </section>

      {/* Info Section */}
      {showInfo && (
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <div className="bg-white rounded-3xl shadow-lg border border-innov-100 p-8">
            <h3 className="text-2xl font-bold text-innov-800 mb-6">À propos d&apos;INNOV LIB</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-innov-100 rounded-full flex items-center justify-center text-innov-600 text-xs">✦</span>
                  Notre mission
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  INNOV LIB accompagne les personnes en situation de dépendance sur le chemin 
                  de la libération et de la réinsertion sociale. Nous croyons en la capacité 
                  de chacun à retrouver une vie épanouie.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-innov-100 rounded-full flex items-center justify-center text-innov-600 text-xs">✦</span>
                  Nos services
                </h4>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-innov-500 mt-1">•</span>
                    Accompagnement individuel personnalisé
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-innov-500 mt-1">•</span>
                    Soutien à la réinsertion sociale et professionnelle
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-innov-500 mt-1">•</span>
                    Orientation vers les ressources adaptées
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-innov-500 mt-1">•</span>
                    Suivi bienveillant dans la durée
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-innov-100 rounded-full flex items-center justify-center text-innov-600 text-xs">✦</span>
                  Fondatrice
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Dominique Corinne COMMARMOND</strong><br />
                  Auto-entrepreneuse spécialisée dans l&apos;accompagnement social<br />
                  Saint-Benoît, La Réunion
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-innov-100 rounded-full flex items-center justify-center text-innov-600 text-xs">✦</span>
                  Contact
                </h4>
                <p className="text-gray-600">
                  📧 <a href="mailto:innovlibreunion@gmail.com" className="text-innov-600 hover:underline">
                    innovlibreunion@gmail.com
                  </a>
                  <br />
                  📍 Saint-Benoît, La Réunion (974)
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-innov-100 hover:border-innov-300 transition-colors">
            <div className="w-12 h-12 bg-innov-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-innov-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Écoute bienveillante</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Un espace sans jugement pour exprimer vos préoccupations et recevoir un soutien adapté.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-innov-100 hover:border-innov-300 transition-colors">
            <div className="w-12 h-12 bg-innov-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-innov-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Orientation personnalisée</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Des conseils et orientations adaptés à votre situation unique et vos besoins spécifiques.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-innov-100 hover:border-innov-300 transition-colors">
            <div className="w-12 h-12 bg-innov-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-innov-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Confidentialité totale</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Vos échanges sont privés et sécurisés. Vous pouvez vous exprimer en toute confiance.
            </p>
          </div>
        </div>
      </section>

      {/* Urgences */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-800 font-medium mb-2">🆘 En cas d&apos;urgence</p>
          <p className="text-amber-700 text-sm">
            Addiction : <strong>3114</strong> (gratuit, 24h/24) · 
            SAMU social : <strong>115</strong> · 
            Urgences : <strong>15 ou 18</strong>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-innov-100 bg-innov-50">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-innov-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">IL</span>
            </div>
            <span className="text-innov-800 font-semibold">INNOV LIB</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 INNOV LIB — Dominique COMMARMOND · Saint-Benoît, La Réunion
          </p>
          <p className="text-gray-400 text-xs">
            Assisté par Iris IA
          </p>
        </div>
      </footer>
    </main>
  )
}
