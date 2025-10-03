"use client"

import { useEffect, useState } from "react"
import { useToast } from "../../hooks/useToast"
import { ToastContainer } from "../ui/Toast"

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
  affiliations?: string[]
}

interface BookingModalProps {
  cabin: Cabin
  onClose: () => void
}

type HalfDay = "first" | "second" // first: 12 AM to 12 PM, second: 12 PM to 12 AM
interface HalfDaySelection {
  date: Date
  half: HalfDay
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
  status: "available" | "booked" | "partiallyBooked" | "unavailable" | "maintenance"
  items?: CalendarItem[]
}

interface ProcessedBooking {
  guestName: string
  guestAddress: string
  guestPostalCode: string
  guestCity: string
  guestPhone: string
  guestEmail: string
  guestAffiliation: string
  date: string
  half: string
}

export default function BookingModal({ cabin, onClose }: BookingModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toasts, success, error, warning, info, removeToast } = useToast()

  const [selectedHalfDays, setSelectedHalfDays] = useState<HalfDaySelection[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<HalfDaySelection | null>(null)
  // Removed unused hoveredHalfDay state

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    postalCode: "",
    city: "",
    phone: "",
    email: "",
    employer: "",
    selectedAffiliations: [] as string[],
  })

  // Helper function to create consistent dates without timezone issues
  const createLocalDate = (year: number, month: number, day: number): Date => {
    // Create date in local timezone without time component
    return new Date(year, month, day, 12, 0, 0); // Set to noon to avoid timezone issues
  }

  // Get auth headers from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  // Removed unused isPartialBooking function

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

  // Helper function to determine which half is booked for partially booked days (legacy compatibility)
  const getBookedHalf = (dayData: CalendarDay): HalfDay | null => {
    const bookedHalves = getBookedHalves(dayData)
    
    // If both halves are booked, this shouldn't be called (day should be fully booked)
    if (bookedHalves.first && bookedHalves.second) return null
    
    // Return the booked half
    if (bookedHalves.first) return 'first'
    if (bookedHalves.second) return 'second'
    
    return null
  }

  // Fetch calendar data dynamically
  useEffect(() => {
    const fetchCalendar = async () => {
      if (!cabin?.slug) return
      setLoading(true)
      try {
        const year = selectedMonth.getFullYear()
        const month = selectedMonth.getMonth() + 1
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/${cabin.slug}/calendar?year=${year}&month=${month}`,
          { headers: getAuthHeaders() }
        )
        const data = await res.json()
        if (data.success && data.data?.calendar) {
          setCalendarData(data.data.calendar)
        } else {
          setCalendarData([])
        }
      } catch (err) {
        console.error("Error fetching calendar:", err)
        setCalendarData([])
      } finally {
        setLoading(false)
      }
    }

    fetchCalendar()
  }, [cabin?.slug, selectedMonth])

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

  // Fixed date status function to avoid timezone issues
  const getDateStatus = (day: number) => {
    if (!day) return ""
    
    // Create date string directly to avoid timezone conversion issues
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth() + 1
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

    // Check if the date is in the past
    const currentDate = new Date()
    const checkDate = new Date(year, selectedMonth.getMonth(), day)
    
    // Set time to start of day for accurate comparison
    currentDate.setHours(0, 0, 0, 0)
    checkDate.setHours(0, 0, 0, 0)
    
    // If date is in the past, mark as unavailable
    if (checkDate < currentDate) {
      return "unavailable"
    }

    const dayData = calendarData.find((d) => d.date === dateStr)
    
    if (dayData) {
      // Check if both halves are booked by separate bookings
      if (dayData.status === 'booked') {
        const bookedHalves = getBookedHalves(dayData)
        
        // If both halves are booked, show as fully booked
        if (bookedHalves.first && bookedHalves.second) {
          return 'booked'
        }
        
        // If only one half is booked, show as partially booked
        if (bookedHalves.first || bookedHalves.second) {
          return 'partially_booked'
        }
      }
      
      return dayData.status
    }

    return "available"
  }

  const isHalfDaySelected = (day: number, half: HalfDay): boolean => {
    const currentDate = createLocalDate(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const currentDateStr = currentDate.toISOString().split('T')[0];
    
    return selectedHalfDays.some((selection) => {
      const selectionDateStr = selection.date.toISOString().split('T')[0];
      return selectionDateStr === currentDateStr && selection.half === half;
    });
  }

  const getHalfDaysBetween = (start: HalfDaySelection, end: HalfDaySelection): HalfDaySelection[] => {
    const selections: HalfDaySelection[] = [];
    
    // Convert to date strings for comparison
    const startDateStr = start.date.toISOString().split('T')[0];
    const endDateStr = end.date.toISOString().split('T')[0];
    
    // If same date, just return the appropriate halves
    if (startDateStr === endDateStr) {
      if (start.half === end.half) {
        return [{ date: new Date(start.date), half: start.half }];
      } else {
        return [
          { date: new Date(start.date), half: "first" },
          { date: new Date(start.date), half: "second" }
        ];
      }
    }
    
    // For multiple days, create all half-day selections
    const startTime = start.date.getTime();
    const endTime = end.date.getTime();
    const actualStart = startTime <= endTime ? start : end;
    const actualEnd = startTime <= endTime ? end : start;

    const currentDate = new Date(actualStart.date);
    let currentHalf = actualStart.half;

    while (currentDate <= actualEnd.date) {
      selections.push({ date: new Date(currentDate), half: currentHalf });
      
      if (currentDate.getTime() === actualEnd.date.getTime() && currentHalf === actualEnd.half) {
        break;
      }
      
      if (currentHalf === "first") {
        currentHalf = "second";
      } else {
        currentHalf = "first";
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return selections;
  }

  const handleHalfDayMouseDown = (day: number, half: HalfDay) => {
    if (!day) return
    
    const status = getDateStatus(day)
    
    // Allow selection for available days
    if (status === "available") {
      const clickedDate = createLocalDate(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      const selection: HalfDaySelection = { date: clickedDate, half }

      setIsDragging(true)
      setDragStart(selection)
      setSelectedHalfDays([selection])
      return
    }
    
    // For partially booked days, only allow selection of the available half
    if (status === "partially_booked") {
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const dayData = calendarData.find((d) => d.date === dateStr)
      
      if (dayData) {
        const bookedHalf = getBookedHalf(dayData)
        
        // Only allow selection if this half is NOT the booked half
        if (half !== bookedHalf) {
          const clickedDate = createLocalDate(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
          const selection: HalfDaySelection = { date: clickedDate, half }

          setIsDragging(true)
          setDragStart(selection)
          setSelectedHalfDays([selection])
          return
        }
      }
    }
    
    // Block selection for all other cases (booked, maintenance, unavailable, or first half of partially booked)
    return
  }

  const handleHalfDayMouseEnter = (day: number, half: HalfDay) => {
    if (!isDragging || !day) return
    
    const status = getDateStatus(day)
    
    // Allow hover for available days
    if (status === "available") {
      const hoveredDate = createLocalDate(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      const hoveredSelection: HalfDaySelection = { date: hoveredDate, half }

      if (dragStart) {
        const rangeSelections = getHalfDaysBetween(dragStart, hoveredSelection)
        setSelectedHalfDays(rangeSelections)
      }
      return
    }
    
    // For partially booked days, only allow hover on the available half
    if (status === "partially_booked") {
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const dayData = calendarData.find((d) => d.date === dateStr)
      
      if (dayData) {
        const bookedHalf = getBookedHalf(dayData)
        
        // Only allow hover if this half is NOT the booked half
        if (half !== bookedHalf) {
          const hoveredDate = createLocalDate(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
          const hoveredSelection: HalfDaySelection = { date: hoveredDate, half }

          if (dragStart) {
            const rangeSelections = getHalfDaysBetween(dragStart, hoveredSelection)
            setSelectedHalfDays(rangeSelections)
          }
          return
        }
      }
    }
    
    // Block interaction for all other cases
    return
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      setDragStart(null)
    }
  }

  const getHalfDayStyles = (day: number, half: HalfDay) => {
    if (!day) return ""

    const status = getDateStatus(day)
    const isSelected = isHalfDaySelected(day, half)

    // Check selected state FIRST - this should override all other styling
    if (isSelected) {
      return "bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500"
    }

    if (status === "booked") {
      return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700 cursor-not-allowed"
    }

    if (status === "maintenance") {
      return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 cursor-not-allowed"
    }

    if (status === "unavailable") {
      return "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-600 cursor-not-allowed"
    }

    if (status === "partially_booked") {
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const dayData = calendarData.find((d) => d.date === dateStr)
      
      if (dayData) {
        const bookedHalf = getBookedHalf(dayData)
        
        if (half === bookedHalf) {
          // This half is booked (red, not clickable)
          return "bg-red-200 dark:bg-red-900/40 border-red-300 dark:border-red-600 cursor-not-allowed"
        } else {
          // This half is available (green, clickable)
          return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer"
        }
      }
    }

    if (status === "available") {
      return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer"
    }

    return ""
  }

  // Helper function to determine guest affiliation
  const getGuestAffiliation = () => {
    return formData.selectedAffiliations.join(", ")
  }

  // FIXED: Helper function to format half-day selections for API
  const formatBookingData = () => {
  if (selectedHalfDays.length === 0) return null

  console.log("Selected half days:", selectedHalfDays) // Debug log

  const baseData = {
    guestName: formData.name,
    guestAddress: formData.address,
    guestPostalCode: formData.postalCode,
    guestCity: formData.city,
    guestPhone: formData.phone,
    guestEmail: formData.email,
    guestAffiliation: getGuestAffiliation()
  }

  // Group selections by date to check for full day bookings
  const selectionsByDate = new Map<string, HalfDaySelection[]>()
  selectedHalfDays.forEach(selection => {
    const dateKey = selection.date.toISOString().split('T')[0]
    if (!selectionsByDate.has(dateKey)) {
      selectionsByDate.set(dateKey, [])
    }
    selectionsByDate.get(dateKey)!.push(selection)
  })

  console.log("Selections by date:", Object.fromEntries(selectionsByDate)) // Debug log

  // Convert to individual bookings - each date becomes its own booking
  const processedBookings: ProcessedBooking[] = []
  
  selectionsByDate.forEach((daySelections, dateKey) => {
    if (daySelections.length === 2) {
      // Both halves selected = FULL day
      processedBookings.push({
        ...baseData,
        date: dateKey,
        half: "FULL"
      })
    } else if (daySelections.length === 1) {
      // Single half selected
      const halfValue = daySelections[0].half === "first" ? "AM" : "PM"
      processedBookings.push({
        ...baseData,
        date: dateKey,
        half: halfValue
      })
    }
  })

  // Sort bookings by date
  processedBookings.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  console.log("Processed bookings:", processedBookings) // Debug log

  return processedBookings
}

  // Handle form submission with API call
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (selectedHalfDays.length === 0) {
    alert("Vennligst velg bestillingsdatoer")
    return
  }

  if (!cabin?.slug) {
    error("Bestillingsfeil", "Hytteinformasjon mangler")
    return
  }

  setSubmitting(true)
  info("Behandler bestilling", "Sender inn bestillingsforespørselen din...")

  try {
    const bookingData = formatBookingData()
    if (!bookingData || !Array.isArray(bookingData)) {
      throw new Error("Kunne ikke formatere bestillingsdata")
    }

    console.log("Submitting bookings:", bookingData) // Debug log

    const headers = getAuthHeaders()
    const results = []

    // Process bookings one by one instead of Promise.all for better error tracking
    for (let i = 0; i < bookingData.length; i++) {
      const booking = bookingData[i]
      
      try {
        console.log(`Submitting booking ${i + 1}/${bookingData.length}:`, booking) // Debug log
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/${cabin.slug}/book`, {
          method: 'POST',
          headers,
          body: JSON.stringify(booking)
        })

        console.log(`Response ${i + 1} status:`, response.status) // Debug log

        let responseData = null
        const contentType = response.headers.get('content-type')
        
        // Only try to parse JSON if the response has content and is JSON
        if (contentType && contentType.includes('application/json')) {
          try {
            responseData = await response.json()
            console.log(`Response ${i + 1} data:`, responseData) // Debug log
          } catch (parseError) {
            console.warn(`Could not parse JSON response for booking ${i + 1}:`, parseError)
          }
        } else {
          // For non-JSON responses (like empty 201), just get the text
          const textResponse = await response.text()
          console.log(`Response ${i + 1} text:`, textResponse) // Debug log
        }

        if (response.ok) {
          results.push({
            success: true,
            booking,
            status: response.status,
            data: responseData
          })
        } else {
          // Extract detailed error message from response
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          
          if (responseData) {
            // Try to get more specific error message from API response
            if (responseData.message) {
              errorMessage = responseData.message
            } else if (responseData.error) {
              errorMessage = responseData.error
            } else if (responseData.details) {
              errorMessage = responseData.details
            }
          }
          
          results.push({
            success: false,
            booking,
            status: response.status,
            data: responseData,
            error: errorMessage
          })
        }

      } catch (error) {
        console.error(`Error submitting booking ${i + 1}:`, error)
        results.push({
          success: false,
          booking,
          error: error instanceof Error ? error.message : 'Unknown error',
          exception: error
        })
      }
    }

    // Analyze results
    const successfulBookings = results.filter(result => result.success)
    const failedBookings = results.filter(result => !result.success)

    console.log("Booking results summary:", {
      total: results.length,
      successful: successfulBookings.length,
      failed: failedBookings.length,
      results
    })

    // Refresh calendar data if any bookings were successful
    if (successfulBookings.length > 0) {
      try {
        const year = selectedMonth.getFullYear()
        const month = selectedMonth.getMonth() + 1
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/${cabin.slug}/calendar?year=${year}&month=${month}`,
          { headers: getAuthHeaders() }
        )
        const data = await res.json()
        if (data.success && data.data?.calendar) {
          setCalendarData(data.data.calendar)
        }
      } catch (err) {
        console.error("Error refreshing calendar after booking:", err)
      }
    }

    if (failedBookings.length > 0) {
      console.error("Failed bookings:", failedBookings)
      
      // Create detailed error messages for each failed booking
      const errorDetails = failedBookings.map((result, index) => {
        const bookingInfo = `Booking ${index + 1} (${result.booking?.date || 'Unknown date'})`
        const errorMsg = result.error || 'Unknown error'
        return `${bookingInfo}: ${errorMsg}`
      }).join('\n')
      
      // Show detailed error in console for debugging
      console.error("Detailed booking errors:", errorDetails)
      
      error(
        "Bestilling mislyktes", 
        `${failedBookings.length} av ${bookingData.length} bestillinger mislyktes. Vennligst sjekk detaljene og prøv igjen.`,
        8000
      )
      
      // If some succeeded, show warning with details
      if (successfulBookings.length > 0) {
        warning(
          "Partial Success",
          `${successfulBookings.length} bookings were successful, but ${failedBookings.length} failed. Please review and try again for the failed bookings.`,
          10000
        )
      }
    } else {
      success(
        "Bestilling vellykket", 
        `Alle ${successfulBookings.length} bestillinger ble sendt inn!`,
        5000
      )
      // Clear selected dates and form
      setSelectedHalfDays([])
      setFormData({
        name: "",
        address: "",
        postalCode: "",
        city: "",
        phone: "",
        email: "",
        employer: "",
        selectedAffiliations: [],
      })
      // Close modal after a short delay to allow user to see the success message
      setTimeout(() => {
        onClose()
      }, 2000)
    }

  } catch (err) {
    console.error("Error in handleSubmit:", err)
    error("Bestillingsfeil", "En uventet feil oppstod under innsending av bestillingen. Vennligst prøv igjen.")
  } finally {
    setSubmitting(false)
  }
}

  const calendarDays = getDaysInMonth(selectedMonth)
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ]

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAffiliationChange = (affiliation: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedAffiliations: checked
        ? [...prev.selectedAffiliations, affiliation]
        : prev.selectedAffiliations.filter(a => a !== affiliation)
    }))
  }

  const removeHalfDaySelection = (selectionToRemove: HalfDaySelection) => {
    setSelectedHalfDays((prev) =>
      prev.filter(
        (selection) =>
          !(
            selection.date.getTime() === selectionToRemove.date.getTime() &&
            selection.half === selectionToRemove.half
          )
      )
    )
  }

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bestill {cabin.name}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            disabled={submitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{cabin.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))
                      }
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <select
                      value={`${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}`}
                      onChange={(e) => {
                        const [year, month] = e.target.value.split("-")
                        setSelectedMonth(new Date(Number.parseInt(year), Number.parseInt(month)))
                      }}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded text-sm"
                      disabled={loading}
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date(selectedMonth.getFullYear(), i)
                        return (
                          <option key={i} value={`${date.getFullYear()}-${i}`}>
                            {monthNames[i]} {date.getFullYear()}
                          </option>
                        )
                      })}
                    </select>
                    <button
                      onClick={() =>
                        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))
                      }
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Loading calendar...</span>
                  </div>
                )}

                <div className={`grid grid-cols-7 gap-1 mb-4 select-none ${loading ? 'opacity-50' : ''}`} onMouseLeave={handleMouseUp}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                    <div key={index} className="text-center text-sm font-medium text-gray-600 dark:text-gray-300 py-2">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((day, index) => (
                    <div key={index} className="aspect-square">
                      {day ? (
                        <div className="h-full relative border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                          {getDateStatus(day) === "partially_booked" ? (
                            // Render partially booked day - but allow interaction with available halves
                            <>
                              {/* First half (12 AM - 12 PM) */}
                              <div
                                onMouseDown={() => !loading && handleHalfDayMouseDown(day, "first")}
                                onMouseEnter={() => !loading && handleHalfDayMouseEnter(day, "first")}
                                onMouseUp={handleMouseUp}
                                className={`
                                  absolute inset-0 transition-colors
                                  ${getHalfDayStyles(day, "first")}
                                `}
                                style={{
                                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                                }}
                              />

                              {/* Second half (12 PM - 12 AM) */}
                              <div
                                onMouseDown={() => !loading && handleHalfDayMouseDown(day, "second")}
                                onMouseEnter={() => !loading && handleHalfDayMouseEnter(day, "second")}
                                onMouseUp={handleMouseUp}
                                className={`
                                  absolute inset-0 transition-colors
                                  ${getHalfDayStyles(day, "second")}
                                `}
                                style={{
                                  clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                                }}
                              />

                              {/* Day number overlay */}
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-gray-100 pointer-events-none z-10">
                                {day}
                              </div>
                            </>
                          ) : (
                            // Render normal half-day selection interface
                            <>
                              {/* First half (12 AM - 12 PM) - Top-left diagonal */}
                              <div
                                onMouseDown={() => !loading && handleHalfDayMouseDown(day, "first")}
                                onMouseEnter={() => !loading && handleHalfDayMouseEnter(day, "first")}
                                onMouseUp={handleMouseUp}
                                className={`
                                  absolute inset-0 transition-colors
                                  ${getHalfDayStyles(day, "first")}
                                `}
                                style={{
                                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                                }}
                              />

                              {/* Second half (12 PM - 12 AM) - Bottom-right diagonal */}
                              <div
                                onMouseDown={() => !loading && handleHalfDayMouseDown(day, "second")}
                                onMouseEnter={() => !loading && handleHalfDayMouseEnter(day, "second")}
                                onMouseUp={handleMouseUp}
                                className={`
                                  absolute inset-0 transition-colors
                                  ${getHalfDayStyles(day, "second")}
                                `}
                                style={{
                                  clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                                }}
                              />

                              {/* Day number overlay */}
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-gray-100 pointer-events-none z-10">
                                {day}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="h-full"></div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                      <span className="text-gray-600 dark:text-gray-300">Tilgjengelig</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                      <span className="text-gray-600 dark:text-gray-300">Opptatt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-gray-300 rounded relative overflow-hidden bg-white">
                        <div className="absolute inset-0 bg-green-200" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%)' }}></div>
                        <div className="absolute inset-0 bg-red-200" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%)' }}></div>
                      </div>
                      <span className="text-gray-600 dark:text-gray-300">Delvis opptatt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-gray-600 dark:text-gray-300">Valgt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                      <span className="text-gray-600 dark:text-gray-300">Utilgjengelig</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                      <span className="text-gray-600 dark:text-gray-300">Vedlikehold</span>
                    </div>
                  </div>
                </div>

                {selectedHalfDays.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mt-4">
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-200">Valgte tidslots:</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1 max-h-32 overflow-y-auto">
                      {selectedHalfDays.map((selection, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span>
                            {selection.date.toLocaleDateString("nb-NO")} •{" "}
                            {selection.half === "first" ? "12:00 AM - 12:00 PM" : "12:00 PM - 12:00 AM"}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeHalfDaySelection(selection)}
                            className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1 transition-colors"
                            title="Fjern dette tidsslotet"
                            disabled={submitting}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Navn *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postnummer *</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">By *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-post *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medlem av:</label>
                  <div className="space-y-2">
                    {cabin.affiliations && cabin.affiliations.length > 0 ? (
                      cabin.affiliations.map((affiliation) => (
                        <label key={affiliation} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.selectedAffiliations.includes(affiliation)}
                            onChange={(e) => handleAffiliationChange(affiliation, e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-red-500 focus:ring-red-500"
                            disabled={submitting}
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{affiliation}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ingen tilgjengelige tilhørigheter</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  disabled={submitting || selectedHalfDays.length === 0}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sender inn...
                    </>
                  ) : (
                    "Send bestillingsforespørsel"
                  )}
                </button>

                {selectedHalfDays.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Vennligst velg minst ett tidslot for å aktivere bestilling
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}