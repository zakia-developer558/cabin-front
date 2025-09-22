import React, { useEffect, useState } from "react"
import { CheckCircle, Clock, XCircle, Ban } from "lucide-react"

interface Booking {
  _id: string
  cabin_name: string
  cabin_address: string
  start_date: string
  end_date: string
  booking_date: string
  status: string
  guest_name: string
  guest_email: string
  guest_phone: string
  guest_city: string
}

interface BookingApiItem {
  _id: string
  cabin?: {
    name?: string
    address?: string
    city?: string
  }
  startDate: string
  endDate: string
  createdAt: string
  status: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  guestCity?: string
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Clock className="w-4 h-4 mr-1" />,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="w-4 h-4 mr-1" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-200 text-gray-600",
    icon: <Ban className="w-4 h-4 mr-1" />,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="w-4 h-4 mr-1" />,
  },
}

const UserBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        if (!token) throw new Error("Authorization token missing")

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/user/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error("Failed to fetch bookings")

        const data = await res.json()
        const mapped: Booking[] = data.items.map((item: BookingApiItem) => ({
          _id: item._id,
          cabin_name: item.cabin?.name || "Unknown Cabin",
          cabin_address: `${item.cabin?.address || ""}, ${item.cabin?.city || ""}`,
          start_date: item.startDate,
          end_date: item.endDate,
          booking_date: item.createdAt,
          status: item.status,
          guest_name: item.guestName || "N/A",
          guest_email: item.guestEmail || "N/A",
          guest_phone: item.guestPhone || "N/A",
          guest_city: item.guestCity || "N/A",
        }))

        setBookings(mapped)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Authorization token missing")

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/user/bookings/${bookingId}/cancel`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!res.ok) throw new Error("Failed to cancel booking")

      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: "cancelled" } : b))
      )

      alert("Booking cancelled successfully!")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Something went wrong while cancelling.")
    }
  }

  const filteredBookings =
    filter === "all"
      ? bookings
      : bookings.filter((b) => b.status.toLowerCase() === filter)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">My Bookings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "pending", "approved", "cancelled", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === tab
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} (
            {tab === "all"
              ? bookings.length
              : bookings.filter((b) => b.status === tab).length}
            )
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && <p className="text-center text-gray-500">Loading bookings...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && filteredBookings.length === 0 && (
        <div className="text-center text-gray-500 py-10 border rounded-xl">
          No bookings found for this category.
        </div>
      )}

      <div className="grid gap-6">
        {filteredBookings.map((booking) => {
          const status =
            statusConfig[booking.status.toLowerCase()] || statusConfig["pending"]

          return (
            <div
              key={booking._id}
              className="rounded-2xl shadow-sm border bg-white hover:shadow-md transition-transform hover:scale-[1.01] p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {booking.cabin_name}
                  </h2>
                  <p className="text-gray-500 text-sm">{booking.cabin_address}</p>
                </div>
                <span
                  className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}
                >
                  {status.icon} {status.label}
                </span>
              </div>

              {/* Dates */}
              <div className="text-sm text-gray-600">
                📅 {new Date(booking.start_date).toLocaleDateString()} →{" "}
                {new Date(booking.end_date).toLocaleDateString()}
              </div>

              {/* Guest Info */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">
                    Guest: {booking.guest_name}
                  </p>
                  <p className="text-gray-600">{booking.guest_email}</p>
                  <p className="text-gray-600">{booking.guest_phone}</p>
                </div>
                <div className="text-right text-gray-500">
                  <p>City: {booking.guest_city}</p>
                  <p>
                    Booked on {new Date(booking.booking_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {booking.status.toLowerCase() === "pending" && (
                <button
                  onClick={() => handleCancelBooking(booking._id)}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default UserBookings
