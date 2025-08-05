import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import InactivityManager from '@/components/InactivityManager'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GateLabs - Identity Access Management as a Service',
  description: 'Plateforme SaaS pour créer et gérer des environnements IAM sandbox Keycloak',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
              {children}
            </div>
            <InactivityManager />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 