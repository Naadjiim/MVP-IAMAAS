'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import AuthModal from '@/components/AuthModal'
import {
  ShieldCheckIcon,
  CubeIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlayIcon,
  UsersIcon,
  CogIcon,
  ChartBarIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()

  // Rediriger vers le dashboard si déjà connecté
  if (user) {
    router.push('/dashboard')
    return null
  }

  const handleGetStarted = () => {
    setAuthMode('register')
    setShowAuthModal(true)
  }

  const handleSignIn = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  const features = [
    {
      icon: ShieldCheckIcon,
      title: 'Sécurité de niveau entreprise',
      description: 'Environnements IAM isolés et sécurisés pour vos tests et formations'
    },
    {
      icon: RocketLaunchIcon,
      title: 'Déploiement instantané',
      description: 'Créez des sandboxes IAM en quelques clics, prêtes à l\'emploi'
    },
    {
      icon: CogIcon,
      title: 'Gestion automatisée',
      description: 'Expiration automatique et nettoyage des ressources'
    },
    {
      icon: UsersIcon,
      title: 'Collaboration simplifiée',
      description: 'Partagez facilement vos environnements avec votre équipe'
    }
  ]

  const currentSolutions = [
    {
      name: 'Keycloak',
      description: 'Solution IAM open source leader du marché',
      features: ['SSO/SAML', 'OAuth 2.0/OpenID Connect', 'Gestion des utilisateurs', 'Fédération d\'identités'],
      status: 'Disponible'
    }
  ]

  const futureSolutions = [
    {
      name: 'WSO2 Identity Server',
      description: 'Plateforme d\'identité numérique complète',
      features: ['API Security', 'Multi-tenancy', 'Identity Analytics', 'IoT Security'],
      status: 'Bientôt disponible'
    },
    {
      name: 'Gluu Server',
      description: 'Stack d\'identité numérique open source',
      features: ['Single Sign-On', 'Multi-Factor Authentication', 'API Security', 'Consent Management'],
      status: 'En développement'
    },
    {
      name: 'Authelia',
      description: 'Authentification et autorisation unifiées',
      features: ['2FA/3FA', 'Single Sign-On', 'Access Control', 'High Availability'],
      status: 'Planifié'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GL</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">GateLabs</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                aria-label={theme === 'light' ? 'Passer au mode sombre' : 'Passer au mode clair'}
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-5 w-5" />
                ) : (
                  <SunIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={handleSignIn}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Se connecter
              </button>
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Commencer
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              La plateforme{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                IAM-as-a-Service
              </span>
              {' '}pour les professionnels
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              GateLabs révolutionne la façon dont les consultants, formateurs et équipes DevOps 
              créent et gèrent leurs environnements d'identité et d'accès. 
              Déployez des sandboxes IAM en quelques clics, testez et formez en toute sécurité.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Commencer gratuitement</span>
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center space-x-2">
                <PlayIcon className="h-5 w-5" />
                <span>Voir la démo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Pourquoi choisir GateLabs ?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Une solution complète pour tous vos besoins en matière d'identité et d'accès
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Solutions IAM disponibles
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Une gamme complète de solutions d'identité et d'accès pour tous vos besoins
            </p>
          </div>

          {/* Current Solutions */}
          <div className="mb-16">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
              Solutions disponibles
            </h3>
            <div className="grid lg:grid-cols-1 gap-8">
              {currentSolutions.map((solution, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{solution.name}</h4>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {solution.status}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-lg">{solution.description}</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {solution.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Future Solutions */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
              Solutions à venir
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {futureSolutions.map((solution, index) => (
                <div key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">{solution.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      solution.status === 'Bientôt disponible' 
                        ? 'bg-blue-100 text-blue-800'
                        : solution.status === 'En développement'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {solution.status}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{solution.description}</p>
                  <div className="space-y-2">
                    {solution.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MVP Section */}
      <section className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              GateLabs MVP - Version avancée
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Notre MVP représente une solution complète et fonctionnelle, 
              prête pour la production et l'utilisation en entreprise.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Fonctionnalités MVP complètes
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Interface utilisateur moderne</h4>
                    <p className="text-gray-600 dark:text-gray-300">Dashboard intuitif avec gestion complète des sandboxes</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Paiements intégrés</h4>
                    <p className="text-gray-600 dark:text-gray-300">Système de paiement Stripe sécurisé et automatisé</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Gestion des utilisateurs</h4>
                    <p className="text-gray-600 dark:text-gray-300">Authentification, rôles et permissions avancées</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">API REST complète</h4>
                    <p className="text-gray-600 dark:text-gray-300">Intégration facile avec vos outils existants</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Monitoring et logs</h4>
                    <p className="text-gray-600 dark:text-gray-300">Suivi complet de l'utilisation et des performances</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Prêt pour la production</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="h-6 w-6" />
                  <span>Sécurité de niveau entreprise</span>
                </div>
                <div className="flex items-center space-x-3">
                  <RocketLaunchIcon className="h-6 w-6" />
                  <span>Déploiement automatisé</span>
                </div>
                <div className="flex items-center space-x-3">
                  <ChartBarIcon className="h-6 w-6" />
                  <span>Scalabilité garantie</span>
                </div>
                <div className="flex items-center space-x-3">
                  <UsersIcon className="h-6 w-6" />
                  <span>Support multi-utilisateurs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à révolutionner votre approche IAM ?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Rejoignez les professionnels qui utilisent déjà GateLabs pour leurs environnements d'identité
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Commencer maintenant
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GL</span>
              </div>
              <span className="text-xl font-bold">GateLabs</span>
            </div>
            <p className="text-gray-400 mb-4">
              La plateforme IAM-as-a-Service pour les professionnels
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 GateLabs. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />
    </div>
  )
} 