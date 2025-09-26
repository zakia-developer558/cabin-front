"use client"

import { useState, useEffect } from "react"
import AddCabinModal from "./AddCabinModal"
import type { CabinData } from "./AddCabinModal"

interface Cabin {
  _id: string
  name: string
  slug: string
  bookings?: number
}


interface SidebarProps {
  selectedCabin: string | null
  onCabinSelect: (cabin: string) => void
  onCabinAdded?: () => void
  cabins: Cabin[]
  loading: boolean
}

export default function Sidebar({ selectedCabin, onCabinSelect, onCabinAdded, cabins, loading }: SidebarProps) {
  const [isAddCabinModalOpen, setIsAddCabinModalOpen] = useState(false)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  // Listen for custom event to open add cabin modal
  useEffect(() => {
    const handleOpenModal = () => {
      setIsAddCabinModalOpen(true)
    }

    window.addEventListener('openAddCabinModal', handleOpenModal)
    return () => {
      window.removeEventListener('openAddCabinModal', handleOpenModal)
    }
  }, [])

  const handleAddCabin = async (cabinData: CabinData) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("Unauthorized: No token found")
        return
      }

      const response = await fetch(`${backendUrl}/v1/cabins/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cabinData),
      })

      if (!response.ok) throw new Error(`Error: ${response.status}`)

      const result = await response.json()

      if (result.success) {
        // Notify parent component that a cabin was added
        if (onCabinAdded) {
          onCabinAdded()
        }
        // Close the modal
        setIsAddCabinModalOpen(false)
      } else {
        alert("Failed to add cabin")
      }
    } catch (err) {
      console.error("Error creating cabin:", err)
      alert("Something went wrong while adding the cabin")
    }
  }

  return (
    <>
      <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Mine Hytter</h2>

          {loading && <p className="text-gray-400">Laster hytter...</p>}

          <div className="space-y-2">
            {cabins.map((cabin) => (
              <button
                key={cabin._id}
                onClick={() => onCabinSelect(cabin.slug)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedCabin === cabin.slug
                    ? "bg-red-500 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{cabin.name}</span>
                  
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={() => setIsAddCabinModalOpen(true)}
              className="w-full text-left p-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Legg til ny hytte</span>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <AddCabinModal
        isOpen={isAddCabinModalOpen}
        onClose={() => setIsAddCabinModalOpen(false)}
        onSubmit={handleAddCabin}
      />
    </>
  )
}
