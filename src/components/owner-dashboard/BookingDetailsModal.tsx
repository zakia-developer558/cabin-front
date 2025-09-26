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
}

const formatDateTime = (iso: string) => {
  return new Date(iso).toLocaleString("en-GB", {
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
  onClose
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
        success("Booking Confirmed!", "The booking has been successfully approved.")
        onClose()
      } else {
        error("Confirmation Failed", data.message || "Unable to confirm the booking. Please try again.")
      }
    } catch (err) {
      console.error("Error confirming booking:", err)
      error("Network Error", "An error occurred while confirming the booking. Please check your connection.")
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    if (!booking || !token) {
      error("Authentication Error", "Please log in again to continue.")
      return
    }

    if (!confirm("Are you sure you want to reject this booking?")) {
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
        success("Booking Rejected", "The booking has been successfully rejected.")
        onClose()
      } else {
        error("Rejection Failed", data.message || "Unable to reject the booking. Please try again.")
      }
    } catch (err) {
      console.error("Error rejecting booking:", err)
      error("Network Error", "An error occurred while rejecting the booking. Please check your connection.")
    } finally {
      setLoading(null)
    }
  }

  if (!isOpen || !booking) return null

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md shadow-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">Booking Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
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
                <h3 className="text-sm font-medium text-gray-900">Guest Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Order:</span>
                    <span className="ml-2 text-gray-900">{booking.orderNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 text-gray-900">{booking.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 text-gray-900">{booking.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Address:</span>
                    <span className="ml-2 text-gray-900">{booking.address}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Booking Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Check-in:</span>
                    <span className="ml-2 text-gray-900">{formatDateTime(booking.checkIn)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Check-out:</span>
                    <span className="ml-2 text-gray-900">{formatDateTime(booking.checkOut)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                      booking.status === "Bekreftet" ? "bg-green-50 text-green-700" :
                      booking.status === "Venter" ? "bg-yellow-50 text-yellow-700" :
                      "bg-red-50 text-red-700"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === "Bekreftet" 
                        ? "bg-green-100 text-green-800" 
                        : booking.status === "Venter" 
                        ? "bg-yellow-100 text-yellow-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Calendar */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Calendar</h3>
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
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
              <button
                onClick={handleReject}
                disabled={loading === "reject"}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 border border-red-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === "reject" ? (
                  <div className="w-3 h-3 border border-red-700 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                Reject
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading === "confirm"}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 border border-green-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === "confirm" ? (
                  <div className="w-3 h-3 border border-green-700 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle className="w-3 h-3" />
                )}
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}