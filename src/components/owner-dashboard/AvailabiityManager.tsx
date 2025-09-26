"use client"

import { useState, useEffect, useCallback } from "react"
import { format, addDays, startOfDay, parseISO } from "date-fns"
import { useLegends } from "../../contexts/LegendsContext"
import type { Legend } from "../../contexts/LegendsContext"

interface AvailabilityManagerProps {
  selectedCabin: string | null
}

interface AvailabilitySetting {
  id: string
  date: string
  status: string
  type: string
  legendData?: Legend // Optional legend data for custom legends
}

interface BookingRange {
  startDate: string
  endDate: string
  status: string
  orderNo: string
  guestName: string
}

interface BlockRange {
  startDate: string
  endDate: string
  reason?: string
}

export default function AvailabilityManager({ selectedCabin }: AvailabilityManagerProps) {
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [availabilityType, setAvailabilityType] = useState<string>("available")
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySetting[]>([])
  const [loading, setLoading] = useState(false)
  const { legends, activeLegends, getLegendByStatus, loading: legendsLoading } = useLegends()

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

  const fetchAvailability = useCallback(async () => {
    if (!selectedCabin || !token) return
    
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/${selectedCabin}/booked-dates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      console.log('Full API response:', JSON.stringify(data, null, 2))

      if (data.success && data.data) {
        const bookings = data.data.bookings ?? []
        const blocks = data.data.blocks ?? []
        
        console.log('Bookings:', bookings)
        console.log('Blocks:', blocks)

        // Sets to track different types of dates
        const unavailableDates = new Set<string>()
        const maintenanceDates = new Set<string>()
        const bookingDates = new Map<string, { orderNo: string, guestName: string }>() // date -> booking info

        // Process bookings - store orderNo and guestName for approved bookings
        bookings.forEach((range: BookingRange) => {
          // Only process approved bookings for availability blocking
          if (range.status === 'approved') {
            const dateRange = getDateRange(range.startDate, range.endDate)
            dateRange.forEach(date => {
              bookingDates.set(date, { orderNo: range.orderNo, guestName: range.guestName })
            })
          }
        })

        // Process blocks - fetch legend details for each unique reason ID
        const customLegendDates = new Map<string, Legend>() // date -> legend object
        const legendCache = new Map<string, Legend>() // Cache fetched legends
        
        // Collect unique reason IDs that need to be fetched
        const uniqueReasonIds = new Set<string>()
        blocks.forEach((range: BlockRange) => {
          const reason = range.reason ?? "unavailable"
          if (reason !== "unavailable" && reason.toLowerCase() !== "maintenance") {
            uniqueReasonIds.add(reason)
          }
        })
        
        // Fetch legend details for all unique reason IDs
         console.log("🔍 Fetching legend details for IDs:", Array.from(uniqueReasonIds))
         
         for (const legendId of uniqueReasonIds) {
           try {
             console.log(`🌐 Making API call for legend ID: ${legendId}`)
             const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/legends/public/${legendId}`)
             console.log(`📡 Response status for ${legendId}:`, response.status)
             
             if (response.ok) {
               const data = await response.json()
               console.log(`📦 API response for ${legendId}:`, data)
               
               if (data.success && data.data) {
                 legendCache.set(legendId, data.data)
                 console.log(`✅ Cached legend: ${data.data.name} (${legendId})`, data.data)
               } else {
                 console.warn(`⚠️ Invalid response structure for ${legendId}:`, data)
               }
             } else {
               console.warn(`⚠️ Failed to fetch legend ${legendId}: ${response.status}`)
             }
           } catch (error) {
             console.error(`❌ Error fetching legend ${legendId}:`, error)
           }
         }
        
        // Now process blocks with the fetched legend data
        console.log("🔄 Processing blocks with legend cache:", legendCache)
        
        blocks.forEach((range: BlockRange) => {
          console.log(`📅 Processing block:`, range)
          
          const reason = range.reason ?? "unavailable"
          const dateRange = getDateRange(range.startDate, range.endDate)
          
          dateRange.forEach(dateStr => {
            if (reason.toLowerCase() === "maintenance") {
              maintenanceDates.add(dateStr)
              unavailableDates.delete(dateStr)
            } else if (legendCache.has(reason)) {
              console.log(`🔍 Looking for legend with ID: ${reason}`)
              // Found a custom legend
              const legendData = legendCache.get(reason)
              if (legendData) {
                customLegendDates.set(dateStr, legendData)
                // Remove from other sets to avoid conflicts
                unavailableDates.delete(dateStr)
                maintenanceDates.delete(dateStr)
                console.log(`✅ Found custom legend for ${dateStr}:`, legendData)
                console.log(`📅 Assigned custom legend "${legendData.name}" to date ${dateStr}`)
                console.log(`📝 Added custom date setting:`, {
                  date: dateStr,
                status: legendData.name,
                type: legendData.name
              })
            } else {
              console.warn(`❌ Legend not found for ID: ${reason}`)
              // No legend found - treat as unavailable
              unavailableDates.add(dateStr)
              console.log(`📝 Adding blocked date without reason: ${dateStr}`)
            }
          }})
        })
        
        console.log("📊 Final processing complete:", {
          customLegendDates: Array.from(customLegendDates.entries()),
          maintenanceDates: Array.from(maintenanceDates),
          unavailableDates: Array.from(unavailableDates)
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
              type: "Vedlikehold",
            })
          } else if (customLegendDates.has(dateStr)) {
            // Handle custom legend dates
            const customLegend = customLegendDates.get(dateStr)!
            
            finalDates.push({
              id: `${dateStr}-custom`,
              date: dateStr,
              status: customLegend.name, // Use the legend name as status
              type: customLegend.name, // Use legend name as type instead of "custom"
              legendData: customLegend // Store full legend data for styling
            })
          } else if (bookingDates.has(dateStr)) {
            // Handle booking dates - show guestName and orderNo
            const bookingInfo = bookingDates.get(dateStr)!
            finalDates.push({
              id: dateStr,
              date: dateStr,
              status: "booked",
              type: `${bookingInfo.guestName} - ${bookingInfo.orderNo}`, // Show guest name and orderNo
            })
          } else if (unavailableDates.has(dateStr)) {
            finalDates.push({
              id: dateStr,
              date: dateStr,
              status: "unavailable",
              type: "Utilgjengelig",
            })
          } else {
            finalDates.push({
              id: dateStr,
              date: dateStr,
              status: "available",
              type: "Tilgjengelig",
            })
          }
        }

        setAvailabilitySettings(finalDates)
        console.log("🎯 Final availability settings:", finalDates.filter(d => d.legendData).map(d => ({
          date: d.date,
          type: d.type,
          status: d.status,
          legendName: d.legendData?.name
        })))
      } else {
        console.error("Unexpected API response:", data)
      }
    } catch (err) {
      console.error("Failed to fetch availability:", err)
    } finally {
      setLoading(false)
    }
  }, [selectedCabin, token, getDateRange])

  useEffect(() => {
    // Only fetch availability after legends are loaded AND we have legends data
    if (!legendsLoading && legends.length > 0) {
      fetchAvailability()
    }
  }, [fetchAvailability, legendsLoading, legends.length])

  const getStatusColor = (status: string, legendData?: Legend) => {
    // If we have legendData (for custom legends), use its colors
    if (legendData && legendData.bgColor && legendData.textColor) {
      return `${legendData.bgColor} ${legendData.textColor}`
    }
    
    const legend = getLegendByStatus(status)
    if (legend) {
      return `${legend.bgColor} ${legend.textColor}`
    }
    
    // Fallback to default styles if legend not found
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
          reason: availabilityType, // Use the selected availability type directly as the reason
        }

        console.log("🚀 Sending payload:", payload) // Debug log to see what's being sent
        console.log("🎯 Selected availability type (legend ID):", availabilityType)

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })

        const result = await response.json()
        console.log("📡 API response:", result) // Debug log to see the response
      }

      setSelectedDates([])

      // Refresh data after update - removed auto reload for debugging
      // location.reload()
      
      // Instead, manually refresh the availability data
      await fetchAvailability()
    } catch (error) {
      console.error("Bulk update error:", error)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Tilgjengelighetshåndtering</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <select
              value={availabilityType}
              onChange={(e) => setAvailabilityType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-0 flex-1 sm:flex-none sm:min-w-[200px]"
            >
              {activeLegends
                .filter(legend => legend.id !== 'booked' && legend.id !== 'partially_booked')
                .map(legend => (
                  <option key={legend.id} value={legend.id}>
                    Sett som {legend.name}
                  </option>
                ))
              }
            </select>
          </div>
          <button
            onClick={handleBulkUpdate}
            disabled={selectedDates.length === 0}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            Oppdater valgte ({selectedDates.length})
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Datospesifikke innstillinger</h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">Laster tilgjengelighet...</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <div className="divide-y divide-gray-200">
                {availabilitySettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedDates.includes(setting.id)}
                        onChange={() => toggleDateSelection(setting.id)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{setting.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(setting.status, setting.legendData)}`}
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