"use client"

import { useState, useEffect } from "react"
import DashboardHeader from "../../components/owner-dashboard/DashboardHeader"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  slug?: string
  companySlug?: string // Add company slug to user interface
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [companySlug, setCompanySlug] = useState<string>('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load user from localStorage when component mounts
    const storedUser = localStorage.getItem("user")
    const storedSlug = localStorage.getItem("companySlug")
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        
        // Get company slug from localStorage or user data
        if (storedSlug) {
          setCompanySlug(storedSlug)
        } else if (userData.companySlug) {
          setCompanySlug(userData.companySlug)
        } else if (userData.slug) {
          // Fallback to user slug if no company slug is available
          setCompanySlug(userData.slug)
        }
      } catch (err) {
        console.error("Error parsing user from localStorage", err)
      }
    }
    setLoading(false)
  }, [])

  const publicCabinUrl = companySlug ? `${window.location.origin}/${companySlug}` : ''

  const handleCopyLink = async () => {
    if (!publicCabinUrl) return
    
    try {
      await navigator.clipboard.writeText(publicCabinUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = publicCabinUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Laster innstillinger...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
      <DashboardHeader />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Innstillinger</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Administrer din konto og hytteinnstillinger</p>
          </div>

          <div className="p-6 space-y-8">
            {/* Profile Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Profilinformasjon</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornavn</label>
                    <p className="text-gray-900">{user?.firstName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Etternavn</label>
                    <p className="text-gray-900">{user?.lastName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                    <p className="text-gray-900">{user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
                    <p className="text-gray-900 capitalize">{user?.role || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Public Cabin Link Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Offentlig hyttelenke</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-3">
                  Del denne lenken med potensielle gjester for å vise frem alle dine hytter. 
                  De kan bla gjennom og bestille direkte fra denne offentlige siden.
                </p>
                
                {companySlug ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-700">
                        {publicCabinUrl}
                      </div>
                      <button
                        onClick={handleCopyLink}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          copySuccess 
                            ? 'bg-green-500 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {copySuccess ? (
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Kopiert!</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Kopier lenke</span>
                          </span>
                        )}
                      </button>
                    </div>
                    
                    <div className="text-xs text-blue-600">
                      <strong>Din firmaslug:</strong> {companySlug}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Firmaslug ikke funnet. Vennligst kontakt support for å sette opp din offentlige hyttelenke.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Settings Placeholder */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Kontoinnstillinger</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm">
                  Ytterligere kontoinnstillinger og preferanser vil være tilgjengelige her i fremtidige oppdateringer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}