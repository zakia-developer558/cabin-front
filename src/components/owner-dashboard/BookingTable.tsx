"use client"

import { useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"
import { useToast } from "../../hooks/useToast"
import { ToastContainer } from "../ui/Toast"

interface Booking {
  id: string
  orderer: string
  name: string
  email: string
  address: string
  status: "Venter" | "Bekreftet" | "Avlyst"
  checkIn: string
  checkOut: string
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

interface BookingTableProps {
  bookings: Booking[]
  cabinName: string | null
  onBookingUpdate?: () => void // Callback to refresh data after update
}

export default function BookingTable({ bookings, cabinName, onBookingUpdate }: BookingTableProps) {
  const [activeTab, setActiveTab] = useState<"all" | "confirmed" | "pending" | "rejected">("all")
  const [loading, setLoading] = useState<string | null>(null) // Track which booking is being processed
  const [currentPage, setCurrentPage] = useState(1)
  const bookingsPerPage = 10
  const { toasts, success, error, removeToast } = useToast()

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Bekreftet":
        return "bg-green-100 text-green-800"
      case "Venter":
        return "bg-yellow-100 text-yellow-800"
      case "Avlyst":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "all") return true
    if (activeTab === "confirmed") return b.status === "Bekreftet"
    if (activeTab === "pending") return b.status === "Venter"
    if (activeTab === "rejected") return b.status === "Avlyst"
    return true
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage)
  const startIndex = (currentPage - 1) * bookingsPerPage
  const endIndex = startIndex + bookingsPerPage
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex)

  // Reset to first page when filter changes
  const handleTabChange = (tab: "all" | "confirmed" | "pending" | "rejected") => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleConfirm = async (id: string) => {
    if (!token) {
      error("Authentication Error", "Please log in again to continue.")
      return
    }

    setLoading(id)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/admin/bookings/${id}/approve`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        success("Booking Confirmed!", "The booking has been successfully approved.")
        // Call the callback to refresh data if provided
        if (onBookingUpdate) {
          onBookingUpdate()
        }
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

  const handleReject = async (id: string) => {
    if (!token) {
      error("Authentication Error", "Please log in again to continue.")
      return
    }

    // Confirm before rejecting
    if (!confirm("Are you sure you want to reject this booking?")) {
      return
    }

    setLoading(id)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/admin/bookings/${id}/reject`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        success("Booking Rejected", "The booking has been successfully rejected.")
        // Call the callback to refresh data if provided
        if (onBookingUpdate) {
          onBookingUpdate()
        }
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Bookings for {cabinName}</h2>
        <p className="text-sm text-gray-600 mt-1">{filteredBookings.length} shown out of {bookings.length}</p>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-2">
          {[
            { key: "all", label: "All" },
            { key: "confirmed", label: "Confirmed" },
            { key: "pending", label: "Pending" },
            { key: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as "all" | "confirmed" | "pending" | "rejected")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? "bg-gray-800 text-white"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="max-h-96 overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[1200px]">
            <colgroup><col className="w-48" /><col className="w-40" /><col className="w-56" /><col className="w-64" /><col className="w-48" /><col className="w-32" /><col className="w-32" /></colgroup>
            <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orderer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {booking.orderer.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{booking.orderer}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900 truncate" title={booking.name}>{booking.name}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-600 truncate" title={booking.email}>{booking.email}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-600 break-words" title={booking.address}>
                    {booking.address.length > 50 ? `${booking.address.substring(0, 50)}...` : booking.address}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium text-gray-900 text-xs">{formatDateTime(booking.checkIn)}</div>
                    <div className="text-xs text-gray-500 mt-1">→ {formatDateTime(booking.checkOut)}</div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </td>
                
                <td className="px-4 py-4">
                  <div className="flex space-x-2 justify-center">
                      {booking.status === "Venter" && (
                        <>
                          <button
                            onClick={() => handleConfirm(booking.id)}
                            disabled={loading === booking.id}
                            className="text-green-600 hover:text-green-800 disabled:text-green-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110"
                            title="Confirm Booking"
                          >
                            {loading === booking.id ? (
                              <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(booking.id)}
                            disabled={loading === booking.id}
                            className="text-red-600 hover:text-red-800 disabled:text-red-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110"
                            title="Reject Booking"
                          >
                            {loading === booking.id ? (
                              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                          </button>
                        </>
                      )}
                      {booking.status !== "Venter" && (
                        <span className="text-gray-400 italic text-xs">No actions</span>
                      )}
                    </div>
                  </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      {/* No results message */}
      {filteredBookings.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          <p>No bookings found for the selected filter.</p>
        </div>
      )}

      {/* Pagination */}
      {filteredBookings.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} results
            </div>
            <div className="flex space-x-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === page
                      ? "text-white bg-gray-800"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}