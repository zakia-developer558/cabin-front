"use client"

import { useState } from "react"
import { Eye } from "lucide-react"
import { useToast } from "../../hooks/useToast"
import { ToastContainer } from "../ui/Toast"
import BookingDetailsModal from "./BookingDetailsModal"

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

interface BookingTableProps {
  bookings: Booking[]
  cabinName: string | null
}

export default function BookingTable({ bookings, cabinName }: BookingTableProps) {
  const [activeTab, setActiveTab] = useState<"all" | "confirmed" | "pending" | "rejected">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const bookingsPerPage = 10
  const { toasts, removeToast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Bekreftet":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Venter":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Avlyst":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
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

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBooking(null)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Bestillinger for {cabinName}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{filteredBookings.length} vist av {bookings.length}</p>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex space-x-2">
          {[
            { key: "all", label: "Alle" },
            { key: "confirmed", label: "Bekreftet" },
            { key: "pending", label: "Venter" },
            { key: "rejected", label: "Avlyst" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as "all" | "confirmed" | "pending" | "rejected")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? "bg-gray-800 text-white dark:bg-gray-600 dark:text-white"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-600"
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
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ordrenr.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Navn</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">E-post</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Adresse</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bestillingsperiode</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Handlinger</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {booking.orderNo || 'N/A'}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900 dark:text-gray-100 truncate" title={booking.name}>{booking.name}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate" title={booking.email}>{booking.email}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 break-words" title={booking.address}>
                    {booking.address.length > 50 ? `${booking.address.substring(0, 50)}...` : booking.address}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">{formatDateTime(booking.checkIn)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">→ {formatDateTime(booking.checkOut)}</div>
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
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleViewDetails(booking)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="Se detaljer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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
        <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
          <p>Ingen bestillinger funnet for det valgte filteret.</p>
        </div>
      )}

      {/* Pagination */}
      {filteredBookings.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Viser {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} av {filteredBookings.length} resultater
            </div>
            <div className="flex space-x-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:text-gray-400 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-600 dark:disabled:text-gray-500"
              >
                Forrige
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === page
                      ? "text-white bg-gray-800 dark:bg-gray-600 dark:text-white"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:text-gray-400 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-600 dark:disabled:text-gray-500"
              >
                Neste
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          cabinSlug={cabinName}
        />
      )}
    </div>
  )
}