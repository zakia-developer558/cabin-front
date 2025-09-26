
"use client"

import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 text-white px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-xl font-semibold">Logo</div>
          <nav className="flex items-center space-x-8">
            <a href="#" className="hover:text-gray-300 transition-colors">
              Home
            </a>
           
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative min-h-[calc(100vh-80px)] flex items-center justify-center">
        {/* Background gradient mimicking mountain landscape */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">Welcome to our website</h1>
          <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-2xl mx-auto text-pretty">
            Discover amazing experience and create lasting memories
          </p>
          <button 
            onClick={handleGetStarted}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>


        </div>
      </main>
    </div>
  )
}
