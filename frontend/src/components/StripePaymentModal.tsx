import React, { useState, useEffect } from 'react'
import { Fragment } from 'react'
import { XMarkIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

// Charger Stripe avec la clé publique
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...')

interface StripePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (sandbox: any) => void
  paymentIntent: {
    client_secret: string
    amount: number
    currency: string
  } | null
  sandboxName: string
}

const CheckoutForm: React.FC<{
  onSuccess: (sandbox: any) => void
  onClose: () => void
  paymentIntent: any
  sandboxName: string
}> = ({ onSuccess, onClose, paymentIntent, sandboxName }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Erreur: élément de carte non trouvé')
      setIsProcessing(false)
      return
    }

    const { error: stripeError, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
      paymentIntent.client_secret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    )

    if (stripeError) {
      setError(stripeError.message || 'Erreur lors du paiement')
      setIsProcessing(false)
    } else if (confirmedPaymentIntent.status === 'succeeded') {
      // Paiement réussi, confirmer la sandbox
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sandboxes/${paymentIntent.sandbox_id}/confirm-payment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const sandboxData = await response.json()
          onSuccess(sandboxData)
        } else {
          const errorData = await response.json()
          setError(errorData.detail || 'Erreur lors de l\'activation de la sandbox')
        }
      } catch (err) {
        setError('Erreur lors de la confirmation du paiement')
      }
      setIsProcessing(false)
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Titre du formulaire */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Informations de paiement
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Complétez vos informations pour finaliser votre commande
        </p>
      </div>

      {/* Résumé de la commande */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
          </svg>
          Résumé de la commande
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-indigo-100 dark:border-indigo-800">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Sandbox {sandboxName}</span>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatAmount(paymentIntent.amount, paymentIntent.currency)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>Paiement sécurisé via Stripe</span>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Sécurisé</span>
            </div>
          </div>
        </div>
      </div>

      {/* Informations de paiement */}
      <div className="space-y-4">
        <label className="block text-lg font-semibold text-gray-900 dark:text-white">
          Détails de la carte
        </label>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#374151',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  '::placeholder': {
                    color: '#9CA3AF',
                  },
                },
              },
            }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Vos informations de paiement sont protégées par un chiffrement SSL de niveau bancaire
        </p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex flex-col space-y-3 pt-4">
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full py-4 px-6 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 border border-transparent rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Traitement en cours...
            </div>
          ) : (
            `Payer ${formatAmount(paymentIntent.amount, paymentIntent.currency)}`
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-6 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  paymentIntent,
  sandboxName,
}) => {
  if (!isOpen || !paymentIntent) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-2xl transition-all w-full max-w-4xl">
          {/* Bouton fermer */}
          <div className="absolute right-4 top-4 z-10">
            <button
              type="button"
              className="rounded-full bg-white dark:bg-gray-800 p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-lg"
              onClick={onClose}
            >
              <span className="sr-only">Fermer</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex">
            {/* Section gauche - Image et informations */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white">
              <div className="flex flex-col justify-center items-center text-center space-y-6">
                {/* Icône de sécurité */}
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <CreditCardIcon className="h-10 w-10 text-white" />
                </div>
                
                {/* Titre */}
                <div>
                  <h2 className="text-2xl font-bold mb-2">Paiement sécurisé</h2>
                  <p className="text-indigo-100 text-lg">
                    Votre sandbox {sandboxName} sera activée après le paiement
                  </p>
                </div>

                {/* Avantages */}
                <div className="space-y-4 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-indigo-100">Paiement 100% sécurisé</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-indigo-100">Activation immédiate</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-indigo-100">Support technique inclus</span>
                  </div>
                </div>

                {/* Logo IAMAAS */}
                <div className="mt-8">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-sm">IA</span>
                    </div>
                    <span className="text-white font-semibold">IAMAAS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section droite - Formulaire de paiement */}
            <div className="w-full lg:w-1/2 p-8">
              <div className="max-w-md mx-auto">
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    onSuccess={onSuccess}
                    onClose={onClose}
                    paymentIntent={paymentIntent}
                    sandboxName={sandboxName}
                  />
                </Elements>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StripePaymentModal 