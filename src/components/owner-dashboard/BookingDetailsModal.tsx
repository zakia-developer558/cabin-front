"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "../../hooks/useToast"
import BookingCalendar from "./BookingCalendar"

interface Booking {
  id: string
  orderNo: string
  name: string
  email: string
  address: string
  status: "Venter" | "Bekreftet" | "Avlyst"
  checkIn: string
  checkOut: string
}

interface BookingDetailsModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  cabinSlug: string | null
  onBookingUpdate?: () => void // Callback to refresh booking data after actions
}

const formatDateTime = (iso: string) => {
  return new Date(iso).toLocaleString("nb-NO", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })
}

export default function BookingDetailsModal({ 
  booking, 
  isOpen, 
  onClose,
  cabinSlug,
  onBookingUpdate
}: BookingDetailsModalProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const { success, error } = useToast()

  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null

  // Set current date to booking month when modal opens
  useEffect(() => {
    if (isOpen && booking) {
      const bookingDate = new Date(booking.checkIn)
      setCurrentDate(new Date(bookingDate.getFullYear(), bookingDate.getMonth()))
    }
  }, [isOpen, booking])

  const handleConfirm = async () => {
    if (!booking || !token) {
      error("Authentication Error", "Please log in again to continue.")
      return
    }

    setLoading("confirm")
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/admin/bookings/${booking.id}/approve`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        success("Bestilling bekreftet!", "Bestillingen har blitt godkjent.")
        // Trigger refresh of booking data
        if (onBookingUpdate) {
          onBookingUpdate()
        }
        onClose()
      } else {
        error("Bekreftelse feilet", data.message || "Kunne ikke bekrefte bestillingen. Prøv igjen.")
      }
    } catch (err) {
      console.error("Error confirming booking:", err)
      error("Nettverksfeil", "En feil oppstod under bekreftelse av bestillingen. Sjekk tilkoblingen din.")
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    if (!booking || !token) {
      error("Autentiseringsfeil", "Vennligst logg inn igjen for å fortsette.")
      return
    }

    if (!confirm("Er du sikker på at du vil avslå denne bestillingen?")) {
      return
    }

    setLoading("reject")
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/admin/bookings/${booking.id}/reject`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        success("Bestilling avslått", "Bestillingen har blitt avslått.")
        // Trigger refresh of booking data
        if (onBookingUpdate) {
          onBookingUpdate()
        }
        onClose()
      } else {
        error("Avslag feilet", data.message || "Kunne ikke avslå bestillingen. Prøv igjen.")
      }
    } catch (err) {
      console.error("Error rejecting booking:", err)
      error("Nettverksfeil", "En feil oppstod under avslag av bestillingen. Sjekk tilkoblingen din.")
    } finally {
      setLoading(null)
    }
  }

  const handleCancel = async () => {
    if (!booking || !token) {
      error("Autentiseringsfeil", "Vennligst logg inn igjen for å fortsette.")
      return
    }

    if (!cabinSlug) {
      error("Feil", "Hytteinformasjon mangler. Kan ikke kansellere bestillingen.")
      return
    }

    if (!confirm("Er du sikker på at du vil kansellere denne bekreftede bestillingen?")) {
      return
    }

    setLoading("cancel")
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/${cabinSlug}/bookings/${booking.id}/owner-cancel`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        success("Bestilling kansellert", "Den bekreftede bestillingen har blitt kansellert.")
        // Trigger refresh of booking data
        if (onBookingUpdate) {
          onBookingUpdate()
        }
        onClose()
      } else {
        error("Kansellering feilet", data.message || "Kunne ikke kansellere bestillingen. Prøv igjen.")
      }
    } catch (err) {
      console.error("Error cancelling booking:", err)
      error("Nettverksfeil", "En feil oppstod under kansellering av bestillingen. Sjekk tilkoblingen din.")
    } finally {
      setLoading(null)
    }
  }

  if (!isOpen || !booking) return null

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Bestillingsdetaljer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Main Content - Side by Side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Booking Information */}
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Gjesteinformasjon</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Ordre:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{booking.orderNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Navn:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{booking.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">E-post:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{booking.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Adresse:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{booking.address}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Bestillingsdetaljer</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Innsjekking:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{formatDateTime(booking.checkIn)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Utsjekking:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{formatDateTime(booking.checkOut)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                      booking.status === "Bekreftet" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                      booking.status === "Venter" ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" :
                      "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === "Bekreftet" 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" 
                        : booking.status === "Venter" 
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" 
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Calendar */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Kalender</h3>
              <BookingCalendar 
                booking={booking}
                cabinName={null}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                showCurrentBooking={true}
              />
            </div>
          </div>

          {/* Action Buttons - Moved to Bottom */}
          {booking.status === "Venter" && (
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleReject}
                disabled={loading === "reject"}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === "reject" ? (
                  <div className="w-3 h-3 border border-red-700 dark:border-red-300 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                Avslå
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading === "confirm"}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === "confirm" ? (
                  <div className="w-3 h-3 border border-green-700 dark:border-green-300 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle className="w-3 h-3" />
                )}
                Bekreft
              </button>
            </div>
          )}

          {/* Cancel Button for Confirmed Bookings */}
          {booking.status === "Bekreftet" && (
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleCancel}
                disabled={loading === "cancel"}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === "cancel" ? (
                  <div className="w-3 h-3 border border-red-700 dark:border-red-300 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                Kanseller bestilling
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}