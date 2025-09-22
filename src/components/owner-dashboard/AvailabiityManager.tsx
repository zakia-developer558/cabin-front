"use client"

import { useState, useEffect, useCallback } from "react"
import { format, addDays, startOfDay, parseISO } from "date-fns"

interface AvailabilityManagerProps {
  selectedCabin: string | null
}

interface AvailabilitySetting {
  id: string
  date: string
  status: "available" | "unavailable" | "maintenance"
  type: string
}

interface BookingRange {
  startDate: string
  endDate: string
}

interface BlockRange {
  startDate: string
  endDate: string
  reason?: string
}

export default function AvailabilityManager({ selectedCabin }: AvailabilityManagerProps) {
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [availabilityType, setAvailabilityType] = useState<"available" | "unavailable" | "maintenance">("available")
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySetting[]>([])
  const [loading, setLoading] = useState(false)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  // Helper function to safely parse date and format it
  const safeFormatDate = (dateStr: string): string => {
    try {
      // If the date string already looks like YYYY-MM-DD, use it directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr
      }
      // Otherwise, parse and format it
      const date = parseISO(dateStr.split('T')[0]) // Take only the date part, ignore time
      return format(date, "yyyy-MM-dd")
    } catch (error) {
      console.error('Date parsing error:', error, 'for date:', dateStr)
      return dateStr
    }
  }

  // Helper function to get date range without timezone issues
  const getDateRange = useCallback((startDateStr: string, endDateStr: string): string[] => {
    try {
      const startDate = safeFormatDate(startDateStr)
      const endDate = safeFormatDate(endDateStr)
      
      // If start and end are the same, return single date
      if (startDate === endDate) {
        return [startDate]
      }
      
      // Create dates at noon to avoid timezone issues
      const start = new Date(startDate + 'T12:00:00')
      const end = new Date(endDate + 'T12:00:00')
      
      const dates: string[] = []
      const current = new Date(start)
      
      while (current <= end) {
        dates.push(format(current, "yyyy-MM-dd"))
        current.setDate(current.getDate() + 1)
      }
      
      return dates
    } catch (error) {
      console.error('Date range error:', error)
      return [safeFormatDate(startDateStr)]
    }
  }, [])

  useEffect(() => {
    if (!selectedCabin || !token) return

    const fetchAvailability = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/${selectedCabin}/booked-dates`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        if (data.success && data.data) {
          const bookings = data.data.bookings ?? []
          const blocks = data.data.blocks ?? []

          // Sets to track unavailable and maintenance dates separately
          const unavailableDates = new Set<string>()
          const maintenanceDates = new Set<string>()

          // Process bookings
          bookings.forEach((range: BookingRange) => {
            const dateRange = getDateRange(range.startDate, range.endDate)
            dateRange.forEach(date => unavailableDates.add(date))
          })

          // Process blocks
          blocks.forEach((range: BlockRange) => {
            const reason = (range.reason ?? "unavailable").toLowerCase()
            const dateRange = getDateRange(range.startDate, range.endDate)
            
            dateRange.forEach(dateStr => {
              if (reason === "maintenance") {
                maintenanceDates.add(dateStr)
                unavailableDates.delete(dateStr) // Remove from unavailable if it's maintenance
              } else {
                if (!maintenanceDates.has(dateStr)) {
                  unavailableDates.add(dateStr)
                }
              }
            })
          })

          // Build final list from today to 90 days ahead
          const today = startOfDay(new Date())
          const finalDates: AvailabilitySetting[] = []
          
          for (let i = 0; i < 90; i++) {
            const currentDate = addDays(today, i)
            const dateStr = format(currentDate, "yyyy-MM-dd")

            if (maintenanceDates.has(dateStr)) {
              finalDates.push({
                id: dateStr,
                date: dateStr,
                status: "maintenance",
                type: "Maintenance",
              })
            } else if (unavailableDates.has(dateStr)) {
              finalDates.push({
                id: dateStr,
                date: dateStr,
                status: "unavailable",
                type: "Unavailable",
              })
            } else {
              finalDates.push({
                id: dateStr,
                date: dateStr,
                status: "available",
                type: "Available",
              })
            }
          }

          setAvailabilitySettings(finalDates)
        } else {
          console.error("Unexpected API response:", data)
        }
      } catch (err) {
        console.error("Failed to fetch availability:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [selectedCabin, token, getDateRange])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "unavailable":
        return "bg-red-100 text-red-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const toggleDateSelection = (date: string) => {
    setSelectedDates((prev) => {
      if (prev.includes(date)) {
        return prev.filter((d) => d !== date)
      } else {
        return [...prev, date]
      }
    })
  }

  const handleBulkUpdate = async () => {
    if (!token || selectedDates.length === 0) return

    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/${selectedCabin}/block`

      if (availabilityType === "available") {
        // Unblock selected dates individually
        const requests = selectedDates.map((date) =>
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: "unblock",
              date,
              half: "FULL",
            }),
          })
        )
        await Promise.all(requests)
      } else {
        // Block selected dates
        const payload = {
          action: "block",
          dates: selectedDates.map((date) => ({ date, half: "FULL" })),
          reason: availabilityType === "maintenance" ? "Maintenance" : "Unavailable",
        }

        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      }

      setSelectedDates([])

      // Refresh data after update - you might want to call fetchAvailability instead of full reload
      location.reload()
    } catch (error) {
      console.error("Bulk update error:", error)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Availability Management</h2>
        <div className="flex items-center space-x-3">
          <select
            value={availabilityType}
            onChange={(e) => setAvailabilityType(e.target.value as "available" | "unavailable" | "maintenance")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="available">Set as Available</option>
            <option value="unavailable">Set as Unavailable</option>
            <option value="maintenance">Set as Maintenance</option>
          </select>
          <button
            onClick={handleBulkUpdate}
            disabled={selectedDates.length === 0}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Update Selected ({selectedDates.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Date-Specific Settings</h3>

          {loading ? (
            <p className="text-gray-500">Loading availability...</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {availabilitySettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedDates.includes(setting.id)}
                        onChange={() => toggleDateSelection(setting.id)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{setting.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(setting.status)}`}
                      >
                        {setting.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}