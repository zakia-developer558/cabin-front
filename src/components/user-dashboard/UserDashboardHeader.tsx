"use client"

import { useRouter } from "next/navigation"

interface UserDashboardHeaderProps {
  activeView: "browse" | "bookings"
  setActiveView: (view: "browse" | "bookings") => void
}

export default function UserDashboardHeader({ activeView, setActiveView }: UserDashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem("token")
    localStorage.removeItem("user")

    // Redirect to login page
    router.push("/login")
  }

  return (
    <header className="bg-gray-800 dark:bg-gray-900 border-b border-gray-700 dark:border-gray-600 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold text-white dark:text-gray-100">Hyttereservasjon</h1>
          </div>

          {/* Nav buttons */}
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveView("browse")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === "browse" ? "bg-red-500 text-white" : "text-gray-300 dark:text-gray-400 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-600"
              }`}
            >
              Bla gjennom hytter
            </button>
            <button
              onClick={() => setActiveView("bookings")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === "bookings" ? "bg-red-500 text-white" : "text-gray-300 dark:text-gray-400 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-600"
              }`}
            >
              Mine bestillinger
            </button>
          </nav>

          {/* User + Logout */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-300 dark:text-gray-400">Velkommen</span>
            <button
              onClick={handleLogout}
              className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-200 transition-colors"
            >
              Logg ut
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
