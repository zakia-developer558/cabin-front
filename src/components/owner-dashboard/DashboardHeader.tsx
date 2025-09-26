"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from 'next/link'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  companyName: string
}

export default function DashboardHeader() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Load user from localStorage when component mounts
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error("Error parsing user from localStorage", err)
      }
    }
  }, [])

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem("token")
    localStorage.removeItem("user")

    // Redirect to login page
    router.push("/login")
  }

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold text-white">{user?.companyName || "CabinOwner"}</h1>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/owner-dashboard" className="text-white font-medium">
              Dashboard
            </Link>
            <Link href="/settings" className="text-gray-300 hover:text-white transition-colors">
              Settings
            </Link>
          </nav>

          {/* User + Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-white font-medium">
                {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
              </p>
              <p className="text-xs text-gray-400">{user?.companyName || "Cabin Owner"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
