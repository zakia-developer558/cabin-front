"use client"

import { useState } from "react"
import UserDashboardHeader from "@/components/user-dashboard/UserDashboardHeader"
import CabinTable from "@/components/user-dashboard/CabinTable"
import UserBookings from "@/components/user-dashboard/UserBookings"
import BookingModal from "@/components/user-dashboard/BookingModal"

interface Cabin {
  id: string
  name: string
  address: string
  city: string
  postal_code: string
  phone: string
  slug: string
  email: string
  contact_person_name: string
  price_per_night: number
  max_guests: number
  amenities: string[]
}

interface CabinTableItem {
  _id: string
  id: number
  name: string
  address: string
  city: string
  postal_code: string
  phone: string
  email: string
  contact_person_name: string
  is_member?: boolean
  createdAt?: string
  updatedAt?: string
}

export default function UserDashboard() {
  const [activeView, setActiveView] = useState<"browse" | "bookings">("browse")
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)

  const handleViewDetails = (cabinItem: CabinTableItem) => {
    // Convert CabinTableItem to Cabin for BookingModal
    const cabin: Cabin = {
      id: cabinItem._id,
      name: cabinItem.name,
      address: cabinItem.address,
      city: cabinItem.city,
      postal_code: cabinItem.postal_code,
      phone: cabinItem.phone,
      slug: cabinItem.name.toLowerCase().replace(/\s+/g, '-'),
      email: cabinItem.email,
      contact_person_name: cabinItem.contact_person_name,
      price_per_night: 100, // Default value - should be fetched from API
      max_guests: 4, // Default value - should be fetched from API
      amenities: [] // Default value - should be fetched from API
    }
    setSelectedCabin(cabin)
    setShowBookingModal(true)
  }

  const handleCloseBookingModal = () => {
    setShowBookingModal(false)
    setSelectedCabin(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
      <UserDashboardHeader activeView={activeView} setActiveView={setActiveView} />

      <main className="container mx-auto px-6 py-8">
        {activeView === "browse" ? <CabinTable onViewDetails={handleViewDetails} /> : <UserBookings />}
      </main>

      {showBookingModal && selectedCabin && <BookingModal cabin={selectedCabin} onClose={handleCloseBookingModal} />}
    </div>
  )
}
