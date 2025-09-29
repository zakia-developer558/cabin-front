
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  companySlug?: string
}

export default function HomePage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in by checking localStorage
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setIsLoggedIn(true)
      } catch (err) {
        console.error("Error parsing user from localStorage", err)
        // Clear invalid data
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  const handleGetStarted = () => {
    if (isLoggedIn && user) {
      // Navigate to appropriate dashboard based on user role
      if (user.role === "owner") {
        router.push('/dashboard/owner')
      } else {
        router.push('/dashboard/user')
      }
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 text-white px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-xl font-semibold">Logo</div>
          <nav className="flex items-center space-x-8">
            <Link href="/" className="hover:text-gray-300 transition-colors">
              Hjem
            </Link>
           
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative min-h-[calc(100vh-80px)] flex items-center justify-center">
        {/* Background gradient mimicking mountain landscape */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 dark:from-gray-800 dark:via-gray-900 dark:to-black"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent dark:from-black"></div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance text-white dark:text-gray-100">Velkommen til vår nettside</h1>
          <p className="text-lg md:text-xl mb-8 text-gray-200 dark:text-gray-300 max-w-2xl mx-auto text-pretty">
            Oppdag fantastiske opplevelser og skap varige minner
          </p>
          <button 
            onClick={handleGetStarted}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors font-semibold text-lg"
            disabled={loading}
          >
            {loading ? "Laster..." : isLoggedIn ? "Gå til Dashboard" : "Logg inn"}
          </button>


        </div>
      </main>
    </div>
  )
}
