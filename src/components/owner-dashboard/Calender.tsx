"use client"

import { useState, useEffect, useCallback } from "react"

interface CalendarProps {
  selectedCabin: string | null
}

interface CalendarItem {
  type: string
  status: string
  guestName: string
  startDateTime: string
  endDateTime: string
}

interface CalendarDay {
  date: string
  status: string
  items: CalendarItem[]
}

interface CalendarStats {
  totalDays: number
  bookedDays: number
  availableDays: number
  maintenanceDays: number
  unavailableDays: number
  occupancyRate: number
}

interface CalendarMonth {
  year: number
  month: number
  name: string
}

interface CalendarData {
  calendar: CalendarDay[]
  stats: CalendarStats
  month: CalendarMonth
}

export default function Calendar({ selectedCabin }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 8)) // September 2025
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null

  const fetchCalendarData = useCallback(async (year: number, month: number) => {
    if (!selectedCabin) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/${selectedCabin}/calendar?year=${year}&month=${month + 1}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (data.success) {
        setCalendarData(data.data)
      } else {
        setError("Failed to load calendar data")
      }
    } catch (err) {
      console.error("Error fetching calendar data:", err)
      setError("Error loading calendar data")
    } finally {
      setLoading(false)
    }
  }, [selectedCabin, token])

  useEffect(() => {
    fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth())
  }, [selectedCabin, currentDate, fetchCalendarData])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7 // Adjust for Monday start

    const days = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

const isPartialBooking = (dayData : CalendarDay) => {
  if (!dayData.items || dayData.items.length === 0) return false

  for (const item of dayData.items) {
    if (item.type === 'booking') {
      // Extract just the time portion
      const startTime = item.startDateTime.split('T')[1]
      const endTime = item.endDateTime.split('T')[1]
      
      // Check if it's NOT a full day booking
      // Full day should start with 00:00:00 and end with 23:59:59
      const isNotFullDay = !(
        startTime.startsWith('00:00:00') && 
        (endTime.startsWith('23:59:59') || endTime.startsWith('00:00:00'))
      )
      
      if (isNotFullDay) {
        return true
      }
    }
  }
  return false
}

// Helper function to check which halves are booked
const getBookedHalves = (dayData: CalendarDay): { first: boolean, second: boolean } => {
  if (!dayData.items || dayData.items.length === 0) return { first: false, second: false }

  let firstHalfBooked = false
  let secondHalfBooked = false

  for (const item of dayData.items) {
    if (item.type === 'booking') {
      const startTime = item.startDateTime.split('T')[1]
      const endTime = item.endDateTime.split('T')[1]
      const startHour = parseInt(startTime.split(':')[0])
      const endHour = parseInt(endTime.split(':')[0])
      const endMinute = parseInt(endTime.split(':')[1])
      
      // Check if booking covers first half (00:00 - 11:59)
      if (startHour === 0) {
        // If it ends at 11:59 or later, it covers first half
        if (endHour >= 11 && (endHour > 11 || endMinute >= 59)) {
          firstHalfBooked = true
        }
      }
      
      // Check if booking covers second half (12:00 - 23:59)
      if (startHour >= 12 || (startHour <= 12 && endHour >= 12)) {
        secondHalfBooked = true
      }
    }
  }
  
  return { first: firstHalfBooked, second: secondHalfBooked }
}

  const getDateStatus = (day: number | null) => {
    if (!day || !calendarData) return "available"

    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const dateString = `${year}-${month}-${dayStr}`

    const dayData = calendarData.calendar.find(d => d.date === dateString)

    if (dayData) {
      if (dayData.status === 'booked' && isPartialBooking(dayData)) {
        return 'partially_booked'
      }
      return dayData.status
    }

    return "available"
  }

  const getDateStyles = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-red-100 text-red-800 border-red-200"
      case "unavailable":
        return "bg-gray-100 text-gray-500 border-gray-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "available":
      default:
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
    }
  }

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const days = getDaysInMonth(currentDate)

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading calendar...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth())}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-800 min-w-[180px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const status = getDateStatus(day)

          if (!day) return <div key={index}></div>

          if (status === "partially_booked") {
            const year = currentDate.getFullYear()
            const month = String(currentDate.getMonth() + 1).padStart(2, '0')
            const dayStr = String(day).padStart(2, '0')
            const dateString = `${year}-${month}-${dayStr}`
            const dayData = calendarData?.calendar.find(d => d.date === dateString)
            
            if (dayData) {
              const bookedHalves = getBookedHalves(dayData)
              
              return (
                <div key={index} className="aspect-square relative border border-gray-300 rounded-lg overflow-hidden cursor-pointer">
                  {/* First half (12 AM - 12 PM) - Top-left triangle */}
                  <div 
                    className={`absolute inset-0 ${bookedHalves.first ? 'bg-red-200' : 'bg-green-200'}`} 
                    style={{ clipPath: 'polygon(0% 0%, 100% 0%, 0% 100%)' }}
                  ></div>
                  {/* Second half (12 PM - 12 AM) - Bottom-right triangle */}
                  <div 
                    className={`absolute inset-0 ${bookedHalves.second ? 'bg-red-200' : 'bg-green-200'}`} 
                    style={{ clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%)' }}
                  ></div>
                  <div className="relative z-10 flex items-center justify-center text-sm font-medium text-gray-800 h-full w-full">
                    {day}
                  </div>
                </div>
              )
            }
          }

          return (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center text-sm font-medium border rounded-lg cursor-pointer transition-colors ${getDateStyles(status)}`}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800 text-sm">Legend</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-xs text-gray-600">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-xs text-gray-600">Booked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border border-gray-300 rounded relative overflow-hidden bg-white">
                <div className="absolute inset-0 bg-green-200" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 0% 100%)' }}></div>
                <div className="absolute inset-0 bg-red-200" style={{ clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%)' }}></div>
              </div>
              <span className="text-xs text-gray-600">Partially Booked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span className="text-xs text-gray-600">Maintenance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span className="text-xs text-gray-600">Unavailable</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800 text-sm">Quick Stats</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Booked days:</span>
              <span className="font-medium">{calendarData?.stats.bookedDays || 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Available days:</span>
              <span className="font-medium">{calendarData?.stats.availableDays || 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Occupancy rate:</span>
              <span className="font-medium text-green-600">{calendarData?.stats.occupancyRate || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
