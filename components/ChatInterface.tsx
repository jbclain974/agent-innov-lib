'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'

const DocumentsModal = dynamic(() => import('./DocumentsModal'), { ssr: false })

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

interface Conversation {
  id: string
  title: string | null
  mode: 'admin' | 'client'
  created_at: string
  updated_at: string
}

interface ChatInterfaceProps {
  mode: 'admin' | 'client'
  userId: string
  userName?: string
}

export default function ChatInterface({ mode, userId, userName }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)

  // Voice states
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations?user_id=${userId}&mode=all`)
      if (res.ok) {
        const data = await res.json()
        const convs = data.conversations || []
        setConversations(convs)
        // Restaurer la dernière conversation active
        const lastConvId = localStorage.getItem(`innov_last_conv_${userId}`)
        if (lastConvId && convs.find((c: Conversation) => c.id === lastConvId)) {
          await loadConversationById(lastConvId)
        } else if (convs.length > 0 && !activeConversationId) {
          await loadConversationById(convs[0].id)
        }
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const loadConversationById = async (conversationId: string) => {
    setActiveConversationId(conversationId)
    localStorage.setItem(`innov_last_conv_${userId}`, conversationId)
    try {
      const res = await fetch(`/api/conversations?conversation_id=${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const loadConversation = async (conversationId: string) => {
    setShowSidebar(false)
    await loadConversationById(conversationId)
  }

  const startNewConversation = () => {
    setActiveConversationId(null)
    setMessages([])
    setShowSidebar(false)
  }

  // ---- VOICE: Speech-to-Text ----
  const startListening = () => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('La reconnaissance vocale n\'est pas supportée par votre navigateur.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'fr-FR'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev + transcript)
      setIsListening(false)
    }

    recognition.start()
  }

  // ---- VOICE: Text-to-Speech ----
  const speakMessage = (text: string, messageId: string) => {
    if (typeof window === 'undefined') return

    if (isSpeaking && speakingMessageId === messageId) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      setSpeakingMessageId(null)
      return
    }

    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    utterance.rate = 1.0
    utterance.pitch = 1.0

    // Chercher une voix française
    const loadVoice = () => {
      const voices = speechSynthesis.getVoices()
      const frVoice = voices.find(v => v.lang.startsWith('fr'))
      if (frVoice) utterance.voice = frVoice
    }

    loadVoice()
    // Fallback si les voix ne sont pas encore chargées
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', loadVoice, { once: true })
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
      setSpeakingMessageId(messageId)
    }
    utterance.onend = () => {
      setIsSpeaking(false)
      setSpeakingMessageId(null)
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      setSpeakingMessageId(null)
    }

    speechSynthesis.speak(utterance)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsTyping(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_id: activeConversationId,
          user_id: userId,
          user_name: userName,
          mode,
        }),
      })

      if (!res.ok) {
        throw new Error('Erreur API')
      }

      const data = await res.json()

      setIsTyping(false)

      const assistantMessage: Message = {
        id: data.message_id || `assist-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (!activeConversationId && data.conversation_id) {
        setActiveConversationId(data.conversation_id)
        localStorage.setItem(`innov_last_conv_${userId}`, data.conversation_id)
        loadConversations()
      }
    } catch (error) {
      console.error('Erreur chat:', error)
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: "Je suis désolée, une erreur s'est produite. Veuillez réessayer dans un instant.",
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Aujourd\'hui'
    if (days === 1) return 'Hier'
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-innov-100 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:flex`}
      >
        {/* Header sidebar */}
        <div className="p-4 border-b border-innov-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-innov-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">IL</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">INNOV LIB</p>
              <p className="text-xs text-innov-600">
                {mode === 'admin' ? '⚙️ Mode admin' : '💬 Chat'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSidebar(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Nouvelle conversation */}
        <div className="p-3">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center gap-2 px-4 py-3 bg-innov-600 hover:bg-innov-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle conversation
          </button>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              Aucune conversation
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-colors ${
                  activeConversationId === conv.id
                    ? 'bg-innov-100 text-innov-800'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <p className="font-medium truncate">
                  {conv.title || 'Nouvelle conversation'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(conv.updated_at)}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Footer sidebar */}
        <div className="p-4 border-t border-innov-100">
          <a
            href="/"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Accueil INNOV LIB
          </a>
        </div>
      </aside>

      {/* Overlay mobile */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="bg-white border-b border-innov-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-innov-400 to-innov-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">🌿</span>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Iris</h2>
              <p className="text-xs text-gray-500">
                Assistante IA INNOV LIB · {mode === 'admin' ? 'Mode professionnel' : 'En ligne'}
              </p>
            </div>
          </div>

          {/* Bouton Documents (admin seulement) */}
          {mode === 'admin' && (
            <button
              onClick={() => setShowDocumentsModal(true)}
              title="Gérer les documents de référence"
              className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-innov-600 hover:bg-innov-50 rounded-xl transition-colors text-sm"
            >
              <span className="text-base">📎</span>
              <span className="hidden sm:inline text-xs font-medium">Documents</span>
            </button>
          )}

          {mode === 'admin' && (
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">
              ⚙️ Admin
            </span>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-innov-100 to-innov-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <span className="text-4xl">🌿</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Bonjour, je suis Iris</h3>
              <p className="text-gray-500 max-w-md leading-relaxed">
                {mode === 'admin'
                  ? 'Bonjour Dominique ! Comment puis-je vous aider aujourd\'hui ? Rédaction, suivi, organisation...'
                  : 'Je suis là pour vous écouter et vous accompagner. N\'hésitez pas à me parler de ce qui vous préoccupe.'}
              </p>
              {mode === 'client' && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                  {[
                    'Je cherche de l\'aide pour une addiction',
                    'Comment fonctionne INNOV LIB ?',
                    'Je veux soutenir un proche',
                    'Quels services proposez-vous ?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion)
                        textareaRef.current?.focus()
                      }}
                      className="text-left px-4 py-3 bg-innov-50 hover:bg-innov-100 border border-innov-200 rounded-xl text-sm text-innov-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 message-enter ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-innov-400 to-innov-600 rounded-full flex items-center justify-center shadow-sm mt-1">
                  <span className="text-white text-xs">🌿</span>
                </div>
              )}

              {/* Bulle */}
              <div
                className={`max-w-[75%] sm:max-w-[65%] px-4 py-3 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-innov-600 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 rounded-tl-sm border border-innov-100'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <div className={`flex items-center gap-2 mt-1 ${message.role === 'user' ? 'justify-end' : 'justify-between'}`}>
                  {message.created_at && (
                    <p
                      className={`text-xs ${
                        message.role === 'user' ? 'text-innov-200' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  )}
                  {/* Bouton TTS sur les messages assistant */}
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => speakMessage(message.content, message.id)}
                      title={isSpeaking && speakingMessageId === message.id ? 'Arrêter la lecture' : 'Lire à voix haute'}
                      className={`text-xs transition-all ${
                        isSpeaking && speakingMessageId === message.id
                          ? 'text-innov-500 animate-pulse'
                          : 'text-gray-300 hover:text-innov-400'
                      }`}
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 message-enter">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-innov-400 to-innov-600 rounded-full flex items-center justify-center shadow-sm mt-1">
                <span className="text-white text-xs">🌿</span>
              </div>
              <div className="bg-white border border-innov-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="typing-dot w-2 h-2 bg-innov-400 rounded-full"></span>
                  <span className="typing-dot w-2 h-2 bg-innov-400 rounded-full"></span>
                  <span className="typing-dot w-2 h-2 bg-innov-400 rounded-full"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-innov-100 p-4">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? '🎤 À l\'écoute...'
                    : mode === 'admin'
                    ? 'Écrivez votre demande professionnelle...'
                    : 'Écrivez votre message... (je vous réponds avec bienveillance)'
                }
                rows={1}
                disabled={isLoading}
                className="w-full resize-none border border-innov-200 rounded-2xl px-4 py-3 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-innov-400 focus:border-transparent placeholder-gray-400 disabled:opacity-50 transition-all max-h-36 overflow-y-auto"
                style={{ minHeight: '48px' }}
              />
            </div>

            {/* Bouton microphone */}
            <button
              type="button"
              onClick={startListening}
              title={isListening ? 'Arrêter la dictée' : 'Dicter un message'}
              className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-innov-100 hover:text-innov-600'
              }`}
            >
              🎤
            </button>

            {/* Bouton envoyer */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-12 h-12 bg-innov-600 hover:bg-innov-700 disabled:bg-innov-200 text-white rounded-2xl flex items-center justify-center transition-all shadow-md disabled:shadow-none"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-2">
            Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne · 🎤 pour dicter
          </p>
        </div>
      </div>

      {/* Modal Documents */}
      {showDocumentsModal && (
        <DocumentsModal
          userId={userId}
          onClose={() => setShowDocumentsModal(false)}
        />
      )}
    </div>
  )
}
