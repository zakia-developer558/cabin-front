"use client"

import { useState, useEffect, useCallback } from "react"
import { LegendsProvider } from "../../../contexts/LegendsContext"
import DashboardHeader from "../../../components/owner-dashboard/DashboardHeader"
import Sidebar from "../../../components/owner-dashboard/Sidebar"
import BookingTable from "../../../components/owner-dashboard/BookingTable"
import Calendar from "../../../components/owner-dashboard/Calender"
import AvailabilityManager from "../../../components/owner-dashboard/AvailabiityManager"
import LegendManager from "../../../components/owner-dashboard/LegendManager"
import AddCabinModal from "../../../components/owner-dashboard/AddCabinModal"
import UpdateCabinModal from "../../../components/owner-dashboard/UpdateCabinModal"
import type { CabinData } from "../../../components/owner-dashboard/AddCabinModal"

interface Cabin {
  _id: string
  slug: string
  name: string
  description?: string
  price?: number
  capacity?: number
}

interface BackendBooking {
  _id: string
  orderNo: string
  guestName: string
  guestEmail: string
  guestAddress: string
  guestCity: string
  status: 'pending' | 'approved' | 'confirmed' | 'cancelled'
  startDateTime: string
  endDateTime: string
}

export default function OwnerDashboard() {
  const [selectedCabin, setSelectedCabin] = useState<string | null>(null) // will be set to first available cabin
  const [bookings, setBookings] = useState([])
  const [token, setToken] = useState<string | null>(null)
  const [cabins, setCabins] = useState<Cabin[]>([])
  const [cabinsLoading, setCabinsLoading] = useState(true)
  const [isAddCabinModalOpen, setIsAddCabinModalOpen] = useState(false)
  const [isUpdateCabinModalOpen, setIsUpdateCabinModalOpen] = useState(false)

  // Get token on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token")
      setToken(storedToken)
    }
  }, [])

  // Fetch cabins function
  const fetchCabins = useCallback(async () => {
    if (!token) return
    
    setCabinsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/get/owner-cabins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      
      const data = await response.json()
      const cabinList: Cabin[] = data.data || []
      setCabins(cabinList)
      
      // Set first cabin as selected if no cabin is selected yet
      if (cabinList.length > 0) {
        setSelectedCabin(prev => prev || cabinList[0].slug)
      }
    } catch (err) {
      console.error("Failed to fetch cabins:", err)
    } finally {
      setCabinsLoading(false)
    }
  }, [token])

  // Fetch cabins and set first one as selected
  useEffect(() => {
    fetchCabins()
  }, [fetchCabins])

  // Handle adding a new cabin
  const handleAddCabin = async (cabinData: CabinData) => {
    try {
      if (!token) {
        alert("Unauthorized: No token found")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/create`, {
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
        // Refresh the cabins list
        await fetchCabins()
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

  const handleUpdateCabin = async (cabinData: CabinData) => {
    try {
      if (!token) {
        alert("Unauthorized: No token found")
        return
      }

      if (!selectedCabin) {
        alert("No cabin selected")
        return
      }

      const response = await fetch(`http://localhost:5000/v1/cabins/update/${selectedCabin}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cabinData),
      })

      if (!response.ok) throw new Error(`Error: ${response.status}`)

      const result = await response.json()

      if (result.success) {
        // Refresh the cabins list
        await fetchCabins()
        // Close the modal
        setIsUpdateCabinModalOpen(false)
        alert("Cabin updated successfully!")
      } else {
        alert("Failed to update cabin")
      }
    } catch (err) {
      console.error("Error updating cabin:", err)
      alert("Something went wrong while updating the cabin")
    }
  }

  const fetchBookings = useCallback(async () => {
    if (!selectedCabin || !token) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/${selectedCabin}/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (data.success) {
        // Map backend → frontend format
        const mapped = data.items.map((b: BackendBooking) => ({
          id: b._id,
          orderNo: b.orderNo,
          name: b.guestName,
          email: b.guestEmail,
          address: `${b.guestAddress}, ${b.guestCity}`,
          status:
            b.status === "pending"
              ? "Venter"
              : b.status === "approved" || b.status === "confirmed"
              ? "Bekreftet"
              : "Avlyst",
          checkIn: b.startDateTime,
          checkOut: b.endDateTime,
        }))

        setBookings(mapped)
      }
    } catch (err) {
      console.error("Error fetching bookings:", err)
    }
  }, [selectedCabin, token])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Show loading until we have the token and cabins are loaded
  if (token === null || cabinsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show empty state when no cabins exist
  if (cabins.length === 0) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
          <DashboardHeader />
          
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
            <div className="text-center text-white max-w-md">
              <div className="mb-8">
                <svg className="w-24 h-24 mx-auto mb-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 21l4-4 4 4" />
                </svg>
                <h1 className="text-3xl font-bold mb-4">Velkommen til ditt dashbord!</h1>
                <p className="text-gray-300 text-lg mb-8">
                  Du har ikke lagt til noen hytter ennå. Start med å legge til din første hytte for å begynne å administrere bestillinger og tilgjengelighet.
                </p>
              </div>
              
              <button
                 onClick={() => setIsAddCabinModalOpen(true)}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-8 rounded-lg transition-colors text-lg inline-flex items-center space-x-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Legg til din første hytte</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Add Cabin Modal */}
         <AddCabinModal
          isOpen={isAddCabinModalOpen}
          onClose={() => setIsAddCabinModalOpen(false)}
          onSubmit={handleAddCabin}
        />
      </>
    )
  }

  return (
    <LegendsProvider selectedCabin={selectedCabin}>
      <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
        <DashboardHeader />

        <div className="flex">
          <Sidebar 
            selectedCabin={selectedCabin} 
            onCabinSelect={setSelectedCabin} 
            onCabinAdded={fetchCabins}
            cabins={cabins}
            loading={cabinsLoading}
          />

          <main className="flex-1 p-6 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                {selectedCabin && (
                  <button
                    onClick={() => setIsUpdateCabinModalOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Oppdater hytte</span>
                  </button>
                )}
              </div>

              <BookingTable bookings={bookings} cabinName={selectedCabin} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Calendar selectedCabin={selectedCabin} />
              <AvailabilityManager selectedCabin={selectedCabin} />
              <LegendManager selectedCabin={selectedCabin} />
            </div>
          </main>
        </div>
        
        {/* Add Cabin Modal */}
        <AddCabinModal
          isOpen={isAddCabinModalOpen}
          onClose={() => setIsAddCabinModalOpen(false)}
          onSubmit={handleAddCabin}
        />
        
        {/* Update Cabin Modal */}
        <UpdateCabinModal
          isOpen={isUpdateCabinModalOpen}
          onClose={() => setIsUpdateCabinModalOpen(false)}
          onSubmit={handleUpdateCabin}
          cabinSlug={selectedCabin}
        />
      </div>
    </LegendsProvider>
  )
}