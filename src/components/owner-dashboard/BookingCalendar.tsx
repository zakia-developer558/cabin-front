"use client"

import { useState, useEffect, useCallback } from "react"

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

interface CalendarItem {
  type: string
  status: string
  guestName: string
  startDateTime: string
  endDateTime: string
  reason?: string
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

interface BookingCalendarProps {
  booking: Booking
  cabinName: string | null
  currentDate: Date
  onDateChange: (date: Date) => void
  showCurrentBooking?: boolean  // New prop to control current booking display
}

export default function BookingCalendar({ 
  booking, 
  cabinName, 
  currentDate, 
  onDateChange,
  showCurrentBooking = true  // Default to true for backward compatibility
}: BookingCalendarProps) {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)

  const monthNames = [
    "Januar", "Februar", "Mars", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Desember"
  ]

  const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"]

  // Fetch calendar data from API
  const fetchCalendarData = useCallback(async (year: number, month: number) => {
    if (!cabinName) return

    try {
      const response = await fetch(`/api/owner/calendar/${cabinName}?year=${year}&month=${month + 1}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCalendarData(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    }
  }, [cabinName])

  useEffect(() => {
    fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth())
  }, [currentDate, fetchCalendarData])

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7 // Adjust for Monday start

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(day)
    return days
  }

  // Check if a day is part of the current booking being viewed
  const isCurrentBookingDate = (day: number | null) => {
    if (!day) return false
    
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const dayDate = new Date(year, month, day)
    
    // Parse booking dates - they come in format like "Sun, 28 Sept, 12:00" or ISO format
    // Let's handle both formats
    let checkInDate: Date
    let checkOutDate: Date
    
    try {
      // Try parsing as ISO first, then as formatted string
      if (booking.checkIn.includes('T') || booking.checkIn.includes('Z')) {
        checkInDate = new Date(booking.checkIn)
        checkOutDate = new Date(booking.checkOut)
      } else {
        // Handle formatted date strings like "Sun, 28 Sept, 12:00"
        checkInDate = new Date(booking.checkIn)
        checkOutDate = new Date(booking.checkOut)
      }
    } catch (error) {
      console.error('Error parsing booking dates:', error)
      return false
    }
    
    // Set time to start of day for accurate comparison using local time
    dayDate.setHours(0, 0, 0, 0)
    
    // Create start of day dates for check-in and check-out in local time
    const checkInStart = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate())
    const checkOutStart = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate())
    
    // For single-day bookings, check if it's the same day
    if (checkInStart.getTime() === checkOutStart.getTime()) {
      const isMatch = dayDate.getTime() === checkInStart.getTime()
      return isMatch
    }
    
    // For multi-day bookings, check if this day falls within the booking period
    // BUT exclude the checkout day if checkout is before noon (partial day)
    const checkOutHour = checkOutDate.getHours()
    const isCheckOutDay = dayDate.getTime() === checkOutStart.getTime()
    
    if (isCheckOutDay && checkOutHour < 12) {
      // If checkout is before noon, don't include the checkout day
      return false
    }
    
    const isInRange = dayDate >= checkInStart && dayDate <= checkOutStart
    return isInRange
  }

  // Get the booking display type based on the current booking times
  const getCurrentBookingDisplayType = (day: number | null) => {
    if (!day || !isCurrentBookingDate(day)) return null

    // Parse dates as UTC to match API response format
    const checkInDate = new Date(booking.checkIn)
    const checkOutDate = new Date(booking.checkOut)

    // Time components in UTC
    const checkInHour = checkInDate.getUTCHours()
    const checkInMinutes = checkInDate.getUTCMinutes()
    const checkOutHour = checkOutDate.getUTCHours()
    const checkOutMinutes = checkOutDate.getUTCMinutes()

    // Compare by calendar day using UTC Y/M/D to avoid timezone mismatches
    const dayY = currentDate.getFullYear()
    const dayM = currentDate.getMonth() // 0-indexed
    const dayD = day
    const isCheckInDay = (
      checkInDate.getUTCFullYear() === dayY &&
      checkInDate.getUTCMonth() === dayM &&
      checkInDate.getUTCDate() === dayD
    )
    const isCheckOutDay = (
      checkOutDate.getUTCFullYear() === dayY &&
      checkOutDate.getUTCMonth() === dayM &&
      checkOutDate.getUTCDate() === dayD
    )

    // Single-day booking
    const isSingleDay = (
      checkInDate.getUTCFullYear() === checkOutDate.getUTCFullYear() &&
      checkInDate.getUTCMonth() === checkOutDate.getUTCMonth() &&
      checkInDate.getUTCDate() === checkOutDate.getUTCDate()
    )

    if (isSingleDay) {
      // Full-day booking (00:00 → 23:59)
      if (checkInHour === 0 && checkInMinutes === 0 && checkOutHour === 23 && checkOutMinutes >= 59) {
        return 'full-day'
      }
      // Duration >= 12h considered full day
      const totalMinutes = (checkOutHour * 60 + checkOutMinutes) - (checkInHour * 60 + checkInMinutes)
      if (totalMinutes >= 12 * 60) return 'full-day'
      // Otherwise decide by times
      if (checkOutHour <= 12) return 'first-half'
      if (checkInHour >= 12) return 'second-half'
      return 'full-day'
    }

    // Multi-day booking
    if (isCheckInDay) {
      if (checkInHour === 0 && checkInMinutes === 0) return 'full-day'
      if (checkInHour >= 12) return 'second-half'
      return 'first-half'
    }

    if (isCheckOutDay) {
      if (checkOutHour === 23 && checkOutMinutes >= 59) return 'full-day'
      if (checkOutHour <= 12) return 'first-half'
      return 'second-half'
    }

    // Days between are full-day
    return 'full-day'
  }

  // Get the status of a day from API data
  const getDateStatus = (day: number | null) => {
    if (!day || !calendarData) return "available"

    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const dateString = `${year}-${month}-${dayStr}`

    const dayData = calendarData.calendar.find(d => d.date === dateString)
    
    // If this day is part of the current booking being viewed and we should show current booking,
    // don't show it as booked from API (let the current booking styling take precedence)
    if (showCurrentBooking && isCurrentBookingDate(day)) {
      // Check if there's conflicting API booking data for this date
      if (dayData && dayData.status === 'booked') {
        // There's a conflict - API says booked but this is current booking date
        // Return available to let current booking styling show
        return "available"
      }
      return "available"
    }
    
    if (dayData && dayData.status === 'booked') {
      return 'booked'
    }

    return "available"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-gray-300"
      case "maintenance":
        return "bg-gray-200"
      case "unavailable":
        return "bg-gray-100"
      default:
        return "bg-white"
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    onDateChange(newDate)
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((dayName) => (
            <div key={dayName} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-10"></div>
            }

            const status = getDateStatus(day)
            const isBookingDay = showCurrentBooking && isCurrentBookingDate(day)
            const bookingType = getCurrentBookingDisplayType(day)

            return (
              <div
                key={day}
                className={`
                  h-10 flex items-center justify-center text-sm border rounded relative
                  ${isBookingDay ? 'border-red-500 font-bold' : 'border-gray-200 dark:border-gray-600'}
                  ${!isBookingDay && status === 'booked' ? 'bg-gray-300 dark:bg-gray-600' : 'bg-white dark:bg-gray-800'}
                `}
              >
                {/* Background for current booking visualization */}
                {isBookingDay && (
                  <div
                    className={`
                      absolute inset-0 rounded
                      ${bookingType === 'full-day' ? 'bg-red-500' : ''}
                      ${bookingType === 'first-half' ? 'bg-gradient-to-r from-red-500 to-transparent' : ''}
                      ${bookingType === 'second-half' ? 'bg-gradient-to-l from-red-500 to-transparent' : ''}
                    `}
                    style={{
                      clipPath: bookingType === 'first-half' 
                        ? 'polygon(0 0, 100% 0, 0 100%)' 
                        : bookingType === 'second-half'
                        ? 'polygon(100% 0, 100% 100%, 0 100%)'
                        : undefined
                    }}
                  />
                )}
                
                {/* Day number */}
                <span className={`relative z-10 ${isBookingDay ? 'text-white' : status === 'booked' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
                  {day}
                </span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Gjeldende</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <span>Opptatt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded"></div>
            <span>Ledig</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded relative">
              <div 
                className="absolute inset-0 bg-white dark:bg-gray-800 rounded"
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
              />
            </div>
            <span>Halv dag</span>
          </div>
        </div>
      </div>
    </div>
  )
}