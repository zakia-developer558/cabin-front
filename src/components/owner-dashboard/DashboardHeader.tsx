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
    <header className="bg-gray-800 dark:bg-gray-900 border-b border-gray-700 dark:border-gray-600">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-red-500 dark:bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold text-white dark:text-gray-100">{user?.companyName || "Hytteeier"}</h1>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
              Hjem
            </Link>
            <Link href="/dashboard/owner" className="text-white dark:text-gray-100 font-medium">
              Dashbord
            </Link>
            <Link href="/settings" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
              Innstillinger
            </Link>
          </nav>

          {/* User + Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-white dark:text-gray-100 font-medium">
                {user ? `${user.firstName} ${user.lastName}` : "Laster..."}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{user?.companyName || "Hytteeier"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Logg ut
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
