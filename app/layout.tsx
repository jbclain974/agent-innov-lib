import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'INNOV LIB — Accompagnement & Réinsertion | La Réunion',
  description:
    'INNOV LIB vous accompagne dans votre parcours de libération des addictions et de réinsertion sociale. Basé à Saint-Benoît, La Réunion.',
  keywords: 'addiction, réinsertion, accompagnement, La Réunion, Saint-Benoît, aide sociale',
  openGraph: {
    title: 'INNOV LIB — Accompagnement & Réinsertion',
    description: 'Accompagnement bienveillant pour les personnes touchées par les addictions',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-white text-gray-800">
        {children}
      </body>
    </html>
  )
}
