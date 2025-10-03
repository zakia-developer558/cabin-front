"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "../../../hooks/useToast"
import { ToastContainer } from "../../../components/ui/Toast"
import { LegendsProvider, type Legend } from "../../../contexts/LegendsContext"

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
  halfdayAvailability?: boolean
  color?: string
  affiliations?: string[]
}

type HalfDay = "first" | "second" // first: 00:00 to 12:00, second: 12:00 to 23:59
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
  reason?: string // Legend ID for custom statuses
}

interface CalendarApiItem {
  type: string
  status: string
  guestName: string
  startDateTime: string
  endDateTime: string
  reason?: string
}

interface CalendarApiDay {
  date: string
  status: "available" | "booked" | "partiallyBooked" | "unavailable" | "maintenance"
  items?: CalendarApiItem[]
  reason?: string
}

export default function CabinBookingPage() {
  return (
    <LegendsProvider>
      <CabinBookingPageContent />
    </LegendsProvider>
  )
}

function CabinBookingPageContent() {
  const params = useParams()
  const router = useRouter()
  const cabinSlug = params['cabin-slug'] as string
  const companySlug = params['company-slug'] as string

  const [cabin, setCabin] = useState<Cabin | null>(null)
  const [cabinLoading, setCabinLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toasts, success, error, info, removeToast } = useToast()
  
  // Custom legends state for public API (not using context since it's for authenticated users)
  const [legends, setLegends] = useState<Legend[]>([])

  const [selectedHalfDays, setSelectedHalfDays] = useState<HalfDaySelection[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<HalfDaySelection | null>(null)
  const [lastClickedDate, setLastClickedDate] = useState<HalfDaySelection | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    postalCode: "",
    city: "",
    phone: "+47 ",
    email: "",
    employer: "",
    selectedAffiliations: [] as string[],
  })

  // Helper function to generate dynamic color classes based on cabin color
  const getColorClasses = (baseColor: string = "#ef4444") => {
    // Convert hex to RGB for dynamic color generation
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 239, g: 68, b: 68 }; // Default red
    };

    const rgb = hexToRgb(baseColor);
    
    return {
      primary: baseColor,
      primaryHover: `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`,
      primaryLight: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
      primaryBorder: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
      primaryText: baseColor,
      primaryTextHover: `rgb(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)})`,
    };
  };

  const colors = getColorClasses(cabin?.color);

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

  // Fetch cabin data
  useEffect(() => {
    const fetchCabin = async () => {
      if (!cabinSlug) return
      setCabinLoading(true)
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/${cabinSlug}`,
          { headers: getAuthHeaders() }
        )
        const data = await res.json()
        if (data.success && data.data) {
          setCabin(data.data)
          console.log('Cabin loaded - halfdayAvailability:', data.data.halfdayAvailability)
        } else {
          error("Hytte ikke funnet", "Den forespurte hytta kunne ikke finnes.")
          router.push('/') // Redirect to home if cabin not found
        }
      } catch (err) {
        console.error("Error fetching cabin:", err)
        error("Feil", "Kunne ikke laste hytteinformasjon.")
        router.push('/') // Redirect to home on error
      } finally {
        setCabinLoading(false)
      }
    }

    fetchCabin()
  }, [cabinSlug, router, error])

  // Helper function to check which halves are booked (only approved bookings)
  const getBookedHalves = (dayData: CalendarDay): { first: boolean, second: boolean } => {
    if (!dayData.items || dayData.items.length === 0) return { first: false, second: false }

    let firstHalfBooked = false
    let secondHalfBooked = false

    for (const item of dayData.items) {
      // Only consider approved bookings as "booked" for visual display
      if (item.type === 'booking' && item.status === 'approved') {
        const startTime = item.startDateTime.split('T')[1]
        const endTime = item.endDateTime.split('T')[1]
        const startHour = parseInt(startTime.split(':')[0])
        const endHour = parseInt(endTime.split(':')[0])
        const endMinute = parseInt(endTime.split(':')[1])
        
        // Check if booking covers first half (00:00 - 11:59)
        // A booking covers first half if it starts at 00:00 and ends after 00:00
        if (startHour === 0) {
          firstHalfBooked = true
        }
        
        // Check if booking covers second half (12:00 - 23:59)
        // A booking covers second half if it starts at or before 12:00 and ends after 12:00
        if (startHour <= 12 && (endHour > 12 || (endHour === 12 && endMinute > 0))) {
          secondHalfBooked = true
        }
        // Or if it starts after 12:00
        if (startHour > 12) {
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

  // Fetch legends from public API
  useEffect(() => {
    const fetchLegends = async () => {
      if (!companySlug) return
      
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/legends/company/${companySlug}?active=true`
        )
        const data = await res.json()
        if (data.success && data.data) {
          setLegends(data.data)
        } else {
          setLegends([])
        }
      } catch (err) {
        console.error("Error fetching legends:", err)
        setLegends([])
      }
    }

    fetchLegends()
  }, [companySlug])

  // Helper functions for legends
  const getLegendByStatus = (status: string) => {
    return legends.find(legend => legend.id === status || legend.name?.toLowerCase().replace(/\s+/g, '_') === status)
  }

  const activeLegends = legends.filter(legend => legend.isActive !== false)

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
          // Process calendar data to extract reason from block items
          const processedCalendarData = data.data.calendar.map((dayData: CalendarApiDay) => {
            let reason = undefined
            
            // Check if there are block items with reason
            if (dayData.items && dayData.items.length > 0) {
              const blockItem = dayData.items.find((item: CalendarApiItem) => item.type === 'block' && item.reason)
              if (blockItem) {
                reason = blockItem.reason
              }
            }
            
            return {
              ...dayData,
              reason
            }
          })
          
          setCalendarData(processedCalendarData)
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
      // Check for custom legend status first
      if (dayData.reason) {
        const legend = getLegendByStatus(dayData.reason)
        if (legend) {
          return `legend_${dayData.reason}` // Custom legend status
        }
      }
      
      // Check if both halves are booked (approved only) for visual display
      if (dayData.status === 'booked') {
        const bookedHalves = getBookedHalves(dayData)
        
        // If both halves are booked (approved), show as fully booked
        if (bookedHalves.first && bookedHalves.second) {
          return 'booked'
        }
        
        // If only one half is booked (approved), show as partially booked
        if (bookedHalves.first || bookedHalves.second) {
          return 'partially_booked'
        }
        
        // If no approved bookings but status is booked, it means only pending bookings exist
        // In this case, show as available for visual purposes
        return 'available'
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
      // Check if this date is available before adding to selection
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayData = calendarData.find((d) => d.date === dateStr);
      
      // Only add if the date is available or partially booked (and the specific half is available)
      let canSelect = false;
      if (dayData) {
        if (dayData.status === "available") {
          canSelect = true;
        } else if (dayData.status === "partiallyBooked") {
          const bookedHalves = getBookedHalves(dayData);
          if (currentHalf === "first" && !bookedHalves.first) {
            canSelect = true;
          } else if (currentHalf === "second" && !bookedHalves.second) {
            canSelect = true;
          }
        }
      } else {
        // If no data found, assume available
        canSelect = true;
      }
      
      if (canSelect) {
        selections.push({ date: new Date(currentDate), half: currentHalf });
      }
      
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

  const handleFullDayMouseDown = (day: number) => {
    if (!day) return
    
    const status = getDateStatus(day)
    
    // Allow selection for available days
    if (status === "available") {
      
      const clickedDate = createLocalDate(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      const clickedSelection: HalfDaySelection = { date: clickedDate, half: "first" }
      
      console.log('=== RANGE SELECTION DEBUG ===')
      console.log('Clicked date:', clickedDate)
      console.log('Last clicked date:', lastClickedDate)
      console.log('Status:', status)
      console.log('Day:', day)
      
      // If there's a previous selection and this is a different date, select range
      if (lastClickedDate && 
          (lastClickedDate.date.getTime() !== clickedDate.getTime())) {
        
        console.log('Creating range selection between:', lastClickedDate.date, 'and', clickedDate)
        // Create range between last clicked and current clicked
        const rangeSelections = getHalfDaysBetween(lastClickedDate, { date: clickedDate, half: "second" })
        console.log('Range selections:', rangeSelections)
        // Single range logic: replace all existing selections with the new range
        setSelectedHalfDays(rangeSelections)
        setLastClickedDate(null) // Reset after range selection
        return
      }
      
      // Check if this date is already selected (both halves)
      const isAlreadySelected = selectedHalfDays.some(s => 
        s.date.getDate() === day && 
        s.date.getMonth() === selectedMonth.getMonth() && 
        s.date.getFullYear() === selectedMonth.getFullYear() &&
        s.half === "first"
      ) && selectedHalfDays.some(s => 
        s.date.getDate() === day && 
        s.date.getMonth() === selectedMonth.getMonth() && 
        s.date.getFullYear() === selectedMonth.getFullYear() &&
        s.half === "second"
      )
      
      if (isAlreadySelected) {
        // Deselection disabled - clicking selected dates does nothing
        return
      } else {
        // Single range logic: if no previous selection, clear all and start new range
        const newSelections: HalfDaySelection[] = [
          { date: clickedDate, half: "first" },
          { date: clickedDate, half: "second" }
        ]
        
        if (!lastClickedDate) {
          // Starting a new range - clear all previous selections
          setSelectedHalfDays(newSelections)
        } else {
          // Continuing a range - remove any existing selections for this date first, then add new ones
          setSelectedHalfDays(prev => {
            const filtered = prev.filter(s => 
              !(s.date.getDate() === day && 
                s.date.getMonth() === selectedMonth.getMonth() && 
                s.date.getFullYear() === selectedMonth.getFullYear())
            )
            return [...filtered, ...newSelections]
          })
        }
        
        // Set this as the last clicked date for potential range selection
        setLastClickedDate(clickedSelection)
      }

      setIsDragging(true)
      setDragStart({ date: clickedDate, half: "first" })
      return
    }

    // Allow selection for partially booked days - book only the available half
    if (status === "partially_booked") {
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const dayData = calendarData.find((d) => d.date === dateStr)
      
      if (dayData) {
        const bookedHalves = getBookedHalves(dayData)
        
        // Find which half is available and book only that half
        let availableHalf: HalfDay | null = null
        if (!bookedHalves.first) {
          availableHalf = "first"
        } else if (!bookedHalves.second) {
          availableHalf = "second"
        }
        
        if (availableHalf) {
          const clickedDate = createLocalDate(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
          const clickedSelection: HalfDaySelection = { date: clickedDate, half: availableHalf }
          
          // If there's a previous selection and this is a different date, select range
          if (lastClickedDate && 
              (lastClickedDate.date.getTime() !== clickedDate.getTime())) {
            
            // Create range between last clicked and current clicked
            const rangeSelections = getHalfDaysBetween(lastClickedDate, clickedSelection)
            // Single range logic: replace all existing selections with the new range
            setSelectedHalfDays(rangeSelections)
            setLastClickedDate(null) // Reset after range selection
            return
          }
          
          // Check if this half is already selected
          const isAlreadySelected = selectedHalfDays.some(s => 
            s.date.getDate() === day && 
            s.date.getMonth() === selectedMonth.getMonth() && 
            s.date.getFullYear() === selectedMonth.getFullYear() &&
            s.half === availableHalf
          )
          
          if (isAlreadySelected) {
            // Never deselect when clicking on an already selected date
            // Just update lastClickedDate for potential range extensions
            setLastClickedDate(clickedSelection)
          } else {
            // Single range logic: if no previous selection, clear all and start new range
            const selection: HalfDaySelection = { date: clickedDate, half: availableHalf }
            
            if (!lastClickedDate) {
              // Starting a new range - clear all previous selections
              setSelectedHalfDays([selection])
            } else {
              // Continuing a range - add to existing selection
              setSelectedHalfDays(prev => [...prev, selection])
            }
            
            // Set this as the last clicked date for potential range selection
            setLastClickedDate(clickedSelection)
          }

          setIsDragging(true)
          setDragStart({ date: clickedDate, half: availableHalf })
          return
        }
      }
    }
    
    // Block selection for all other cases (booked, maintenance, unavailable)
    return
  }

  const handleFullDayMouseEnter = (day: number) => {
    if (!isDragging || !day) return
    
    const status = getDateStatus(day)
    
    // Allow hover for available days
    if (status === "available") {
      // Check if any half is actually booked by approved bookings
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const dayData = calendarData.find((d) => d.date === dateStr)
      
      if (dayData) {
        const bookedHalves = getBookedHalves(dayData)
        
        // Block hover if any half is booked by approved bookings
        if (bookedHalves.first || bookedHalves.second) {
          return
        }
      }
      
      const hoveredDate = createLocalDate(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      const endSelection: HalfDaySelection = { date: hoveredDate, half: "second" }
      
      if (dragStart) {
        const selections = getHalfDaysBetween(dragStart, endSelection)
        // For full-day mode, ensure we select both halves for each day
        const fullDaySelections: HalfDaySelection[] = []
        const processedDates = new Set<string>()
        
        selections.forEach((selection: HalfDaySelection) => {
          const dateStr = selection.date.toDateString()
          if (!processedDates.has(dateStr)) {
            processedDates.add(dateStr)
            fullDaySelections.push(
              { date: selection.date, half: "first" },
              { date: selection.date, half: "second" }
            )
          }
        })
        
        // Add to existing selection instead of replacing it during drag
        setSelectedHalfDays(prev => {
          const newSelections = [...prev]
          fullDaySelections.forEach(selection => {
            // Only add if not already selected
            const alreadyExists = newSelections.some(s => 
              s.date.getTime() === selection.date.getTime() && s.half === selection.half
            )
            if (!alreadyExists) {
              newSelections.push(selection)
            }
          })
          return newSelections
        })
      }
    }
  }

  const handleHalfDayMouseDown = (day: number, half: HalfDay) => {
    if (!day) return
    
    // If half-day availability is disabled, use full-day selection instead
    if (!cabin?.halfdayAvailability) {
      handleFullDayMouseDown(day)
      return
    }
    
    const status = getDateStatus(day)
    
    // Allow selection for available days
    if (status === "available") {
      // Check if this half is actually booked by approved bookings only
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const dayData = calendarData.find((d) => d.date === dateStr)
      
      if (dayData) {
        const bookedHalves = getBookedHalves(dayData)
        
        // Only block selection if this half is booked by approved bookings
        if ((half === "first" && bookedHalves.first) || (half === "second" && bookedHalves.second)) {
          return
        }
      }
      
      const clickedDate = createLocalDate(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      const clickedSelection: HalfDaySelection = { date: clickedDate, half }
      
      console.log('Half-day clicked:', { day, half, clickedDate, lastClickedDate, selectedHalfDaysCount: selectedHalfDays.length })
      
      // Check if this specific half is already selected
      const isAlreadySelected = selectedHalfDays.some(s => 
        s.date.getDate() === day && 
        s.date.getMonth() === selectedMonth.getMonth() && 
        s.date.getFullYear() === selectedMonth.getFullYear() &&
        s.half === half
      )
      
      // Range selection logic - only trigger if:
      // 1. We have existing selections (selectedHalfDays.length > 0)
      // 2. We have a lastClickedDate 
      // 3. This is a different selection than lastClickedDate
      // 4. This half is not already selected
      // 5. The clicked date is NOT within the current selection range (to prevent accidental range replacement)
      if (selectedHalfDays.length > 0 && 
          lastClickedDate && 
          !isAlreadySelected &&
          !(lastClickedDate.date.getDate() === day && 
            lastClickedDate.date.getMonth() === selectedMonth.getMonth() && 
            lastClickedDate.date.getFullYear() === selectedMonth.getFullYear() &&
            lastClickedDate.half === half)) {
        
        console.log('Triggering range selection between:', lastClickedDate, 'and:', clickedSelection)
        
        // Get range between lastClickedDate and current selection
        const rangeSelections = getHalfDaysBetween(lastClickedDate, clickedSelection)
        console.log('Range selections:', rangeSelections)
        
        // Single range logic: replace all existing selections with the new range
        setSelectedHalfDays(rangeSelections)
        setLastClickedDate(clickedSelection)
        setIsDragging(true)
        setDragStart(clickedSelection)
        return
      }
      
      if (isAlreadySelected) {
        // Never deselect when clicking on an already selected date
        // Just update lastClickedDate for potential range extensions
        setLastClickedDate(clickedSelection)
        console.log('Clicked on selected date, updated lastClickedDate to:', clickedSelection)
      } else {
        // Single range logic: if no previous selection, clear all and start new range
        if (!lastClickedDate) {
          // Starting a new range - clear all previous selections
          setSelectedHalfDays([clickedSelection])
        } else {
          // Continuing a range - add to existing selection
          setSelectedHalfDays(prev => [...prev, clickedSelection])
        }
        setLastClickedDate(clickedSelection)
        console.log('Selected half-day, set lastClickedDate to:', clickedSelection)
      }

      setIsDragging(true)
      setDragStart(clickedSelection)
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
          const clickedSelection: HalfDaySelection = { date: clickedDate, half }
          
          console.log('Partially booked day clicked:', { day, half, clickedDate, lastClickedDate })
          
          // Check if this specific half is already selected
          const isAlreadySelected = selectedHalfDays.some(s => 
            s.date.getDate() === day && 
            s.date.getMonth() === selectedMonth.getMonth() && 
            s.date.getFullYear() === selectedMonth.getFullYear() &&
            s.half === half
          )
          
          // Range selection logic for partially booked days
          if (lastClickedDate && 
              !(lastClickedDate.date.getDate() === day && 
                lastClickedDate.date.getMonth() === selectedMonth.getMonth() && 
                lastClickedDate.date.getFullYear() === selectedMonth.getFullYear() &&
                lastClickedDate.half === half)) {
            
            console.log('Triggering range selection on partially booked day between:', lastClickedDate, 'and:', clickedSelection)
            
            // Get range between lastClickedDate and current selection
            const rangeSelections = getHalfDaysBetween(lastClickedDate, clickedSelection)
            console.log('Range selections for partially booked:', rangeSelections)
            
            // Single range logic: replace all existing selections with the new range
            setSelectedHalfDays(rangeSelections)
            setLastClickedDate(clickedSelection)
            setIsDragging(true)
            setDragStart(clickedSelection)
            return
          }
          
          if (isAlreadySelected) {
            // Deselection disabled - clicking selected half-days does nothing
            return
          } else {
            // Single range logic: if no previous selection, clear all and start new range
            if (!lastClickedDate) {
              // Starting a new range - clear all previous selections
              setSelectedHalfDays([clickedSelection])
            } else {
              // Continuing a range - add to existing selection
              setSelectedHalfDays(prev => [...prev, clickedSelection])
            }
            setLastClickedDate(clickedSelection)
            console.log('Selected partially booked half-day, set lastClickedDate to:', clickedSelection)
          }

          setIsDragging(true)
          setDragStart(clickedSelection)
          return
        }
      }
    }
    
    // Block selection for all other cases (booked, maintenance, unavailable, or first half of partially booked)
    return
  }

  const handleHalfDayMouseEnter = (day: number, half: HalfDay) => {
    if (!isDragging || !day) return
    
    // If half-day availability is disabled, use full-day selection instead
    if (!cabin?.halfdayAvailability) {
      handleFullDayMouseEnter(day)
      return
    }
    
    const status = getDateStatus(day)
    
    // Allow hover for available days
    if (status === "available") {
      // Check if this half is actually booked by approved bookings only
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const dayData = calendarData.find((d) => d.date === dateStr)
      
      if (dayData) {
        const bookedHalves = getBookedHalves(dayData)
        
        // Only block hover if this half is booked by approved bookings
        if ((half === "first" && bookedHalves.first) || (half === "second" && bookedHalves.second)) {
          return
        }
      }
      
      const hoveredDate = createLocalDate(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      const hoveredSelection: HalfDaySelection = { date: hoveredDate, half }

      if (dragStart) {
        const rangeSelections = getHalfDaysBetween(dragStart, hoveredSelection)
        // Add to existing selection instead of replacing it during drag
        setSelectedHalfDays(prev => {
          const newSelections = [...prev]
          rangeSelections.forEach(selection => {
            // Only add if not already selected
            const alreadyExists = newSelections.some(s => 
              s.date.getTime() === selection.date.getTime() && s.half === selection.half
            )
            if (!alreadyExists) {
              newSelections.push(selection)
            }
          })
          return newSelections
        })
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
            // Add to existing selection instead of replacing it during drag
            setSelectedHalfDays(prev => {
              const newSelections = [...prev]
              rangeSelections.forEach(selection => {
                // Only add if not already selected
                const alreadyExists = newSelections.some(s => 
                  s.date.getTime() === selection.date.getTime() && s.half === selection.half
                )
                if (!alreadyExists) {
                  newSelections.push(selection)
                }
              })
              return newSelections
            })
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

  // Helper function to get styles for full-day selection (matches half-day styling)
  const getFullDayStyles = (day: number) => {
    if (!day) return ""

    const status = getDateStatus(day)
    const isSelected = selectedHalfDays.some(s => 
      s.date.getDate() === day && 
      s.date.getMonth() === selectedMonth.getMonth() && 
      s.date.getFullYear() === selectedMonth.getFullYear()
    )

    // Check selected state FIRST - this should override all other styling
    if (isSelected) {
      return `border-2`
    }

    // Check for custom legend status
    if (status.startsWith('legend_')) {
      const legendId = status.replace('legend_', '')
      const legend = getLegendByStatus(legendId)
      if (legend) {
        return `cursor-not-allowed opacity-75 border-2`
      }
    }

    if (status === "booked") {
      return "bg-red-100 border-red-200 cursor-not-allowed"
    }

    if (status === "maintenance") {
      return "bg-yellow-100 border-yellow-200 cursor-not-allowed"
    }

    if (status === "unavailable") {
      return "bg-gray-100 border-gray-200 cursor-not-allowed"
    }

    if (status === "partially_booked") {
      // For full-day mode, show partially booked days as available since user can still book the remaining half
      return "bg-green-100 border-green-200 hover:bg-green-200 cursor-pointer"
    }

    if (status === "available") {
      return "bg-green-100 border-green-200 hover:bg-green-200 cursor-pointer"
    }

    return ""
  }

  const getHalfDayStyles = (day: number, half: HalfDay) => {
    if (!day) return ""

    const status = getDateStatus(day)
    const isSelected = isHalfDaySelected(day, half)

    // Check selected state FIRST - this should override all other styling
    if (isSelected) {
      return `border-2`
    }

    // Check for custom legend status
    if (status.startsWith('legend_')) {
      const legendId = status.replace('legend_', '')
      const legend = getLegendByStatus(legendId)
      if (legend) {
        return `cursor-not-allowed opacity-75 border-2`
      }
    }

    if (status === "booked") {
      return "bg-red-100 border-red-200 cursor-not-allowed"
    }

    if (status === "maintenance") {
      return "bg-yellow-100 border-yellow-200 cursor-not-allowed"
    }

    if (status === "unavailable") {
      return "bg-gray-100 border-gray-200 cursor-not-allowed"
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
          return "bg-red-200 border-red-300 cursor-not-allowed"
        } else {
          // This half is available (green, clickable)
          return "bg-green-100 border-green-200 hover:bg-green-200 cursor-pointer"
        }
      }
    }

    if (status === "available") {
      return "bg-green-100 border-green-200 hover:bg-green-200 cursor-pointer"
    }

    return ""
  }

  // Helper function to get inline styles for legend colors
  const getLegendInlineStyles = (day: number) => {
    if (!day) return {}

    const status = getDateStatus(day)
    
    if (status.startsWith('legend_')) {
      const legendId = status.replace('legend_', '')
      const legend = getLegendByStatus(legendId)
      if (legend) {
        return {
          backgroundColor: legend.color,
          borderColor: legend.color
        }
      }
    }
    
    return {}
  }

  // Helper function to get inline styles for selected states
  const getSelectedInlineStyles = (day: number, half?: HalfDay) => {
    if (!day) return {}

    const isSelected = half 
      ? isHalfDaySelected(day, half)
      : selectedHalfDays.some(s => 
          s.date.getDate() === day && 
          s.date.getMonth() === selectedMonth.getMonth() && 
          s.date.getFullYear() === selectedMonth.getFullYear()
        )

    if (isSelected) {
      return {
        backgroundColor: colors.primary,
        borderColor: colors.primaryBorder
      }
    }
    
    return {}
  }

  // Helper function to determine guest affiliation
  const getGuestAffiliation = () => {
    return formData.selectedAffiliations.join(", ")
  }

  // Helper function to format half-day selections for single API call
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

    // Sort dates for processing
    const sortedDates = Array.from(selectionsByDate.keys()).sort()
    
    // Check if this is a continuous date range
    const isContinuousRange = sortedDates.length > 1 && sortedDates.every((date, index) => {
      if (index === 0) return true
      const prevDate = new Date(sortedDates[index - 1])
      const currentDate = new Date(date)
      return (currentDate.getTime() - prevDate.getTime()) === 24 * 60 * 60 * 1000 // 1 day difference
    })

    // Single day booking
    if (sortedDates.length === 1) {
      const date = sortedDates[0]
      const daySelections = selectionsByDate.get(date)!
      
      if (daySelections.length === 2) {
        // Full day
        return {
          ...baseData,
          date: date,
          half: "FULL"
        }
      } else {
        // Single half
        const halfValue = daySelections[0].half === "first" ? "AM" : "PM"
        return {
          ...baseData,
          date: date,
          half: halfValue
        }
      }
    }
    
    // Continuous date range booking
    else if (isContinuousRange) {
      const startDate = sortedDates[0]
      const endDate = sortedDates[sortedDates.length - 1]
      
      // Get start and end halves
      const startDaySelections = selectionsByDate.get(startDate)!
      const endDaySelections = selectionsByDate.get(endDate)!
      
      const startHalf = startDaySelections.some(s => s.half === "first") ? "AM" : "PM"
      const endHalf = endDaySelections.some(s => s.half === "second") ? "PM" : "AM"
      
      return {
        ...baseData,
        startDate: startDate,
        endDate: endDate,
        startHalf: startHalf,
        endHalf: endHalf
      }
    }
    
    // Multi-segment booking (non-continuous dates)
    else {
      const segments = sortedDates.map(date => {
        const daySelections = selectionsByDate.get(date)!
        
        if (daySelections.length === 2) {
          // Full day segment
          return {
            startDate: date,
            endDate: date,
            startHalf: "AM",
            endHalf: "PM"
          }
        } else {
          // Single half segment
          const halfValue = daySelections[0].half === "first" ? "AM" : "PM"
          return {
            startDate: date,
            endDate: date,
            startHalf: halfValue,
            endHalf: halfValue
          }
        }
      })
      
      return {
        ...baseData,
        segments: segments
      }
    }
  }

  // Handle form submission with single API call
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
    info("Behandler bestilling", "Sender bestillingsforespørsel...")

    try {
      const bookingData = formatBookingData()
      if (!bookingData) {
        throw new Error("Kunne ikke formatere bestillingsdata")
      }

      console.log("Submitting booking:", bookingData) // Debug log

      const headers = getAuthHeaders()
      
      // Single API call for all bookings
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/${cabin.slug}/book`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bookingData)
      })

      console.log("Response status:", response.status) // Debug log

      let responseData = null
      const contentType = response.headers.get('content-type')
      
      // Only try to parse JSON if the response has content and is JSON
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await response.json()
          console.log("Response data:", responseData) // Debug log
        } catch (parseError) {
          console.warn("Could not parse JSON response:", parseError)
        }
      } else {
        // For non-JSON responses (like empty 201), just get the text
        const textResponse = await response.text()
        console.log("Response text:", textResponse) // Debug log
      }

      if (response.ok) {
        success(
          "Bestilling vellykket",
          "Din bestilling har blitt sendt inn!",
          5000
        )
        
        // Clear selected dates and form
        setSelectedHalfDays([])
        setFormData({
          name: "",
          address: "",
          postalCode: "",
          city: "",
          phone: "+47 ",
          email: "",
          employer: "",
          selectedAffiliations: [],
        })
        
        // Refresh calendar data
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
        
        console.error("Booking failed:", errorMessage)
        error("Bestilling mislyktes", errorMessage, 8000)
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
      "Januar","Februar","Mars","April","Mai","Juni",
      "Juli","August","September","Oktober","November","Desember",
    ]

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "phone" && typeof value === "string") {
      // Handle Norwegian phone number formatting
      let phoneValue = value;
      
      // Always ensure it starts with +47
      if (!phoneValue.startsWith("+47")) {
        phoneValue = "+47 " + phoneValue.replace(/^\+?47\s?/, "");
      }
      
      // Remove any non-digit characters after +47
      const digitsOnly = phoneValue.replace(/^\+47\s?/, "").replace(/\D/g, "");
      
      // Limit to 8 digits
      const limitedDigits = digitsOnly.slice(0, 8);
      
      // Format as +47 XXXXXXXX
      phoneValue = "+47 " + limitedDigits;
      
      setFormData((prev) => ({ ...prev, [field]: phoneValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
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

  // Function to format selected dates as ranges
  const formatSelectedDatesAsRanges = (selections: HalfDaySelection[]) => {
    if (selections.length === 0) return []
    
    // Sort selections by date and half
    const sorted = [...selections].sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime()
      if (dateCompare !== 0) return dateCompare
      return a.half === "first" ? -1 : 1
    })
    
    const ranges: { start: HalfDaySelection, end: HalfDaySelection }[] = []
    let currentRangeStart = sorted[0]
    let currentRangeEnd = sorted[0]
    
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i]
      const previous = sorted[i - 1]
      
      // Check if current selection is consecutive to the previous one
      const isConsecutive = 
        (current.date.getTime() === previous.date.getTime() && 
         previous.half === "first" && current.half === "second") ||
        (current.date.getTime() === previous.date.getTime() + 24 * 60 * 60 * 1000 && 
         previous.half === "second" && current.half === "first")
      
      if (isConsecutive) {
        // Extend current range
        currentRangeEnd = current
      } else {
        // End current range and start new one
        ranges.push({ start: currentRangeStart, end: currentRangeEnd })
        currentRangeStart = current
        currentRangeEnd = current
      }
    }
    
    // Add the last range
    ranges.push({ start: currentRangeStart, end: currentRangeEnd })
    
    return ranges
  }

  // Loading state for cabin data
  if (cabinLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center justify-center space-x-3">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderBottomColor: colors.primary }}
            ></div>
            <span className="text-lg text-gray-600">Laster hyttedetaljer...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state if cabin not found
  if (!cabin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Hytte ikke funnet</h1>
            <p className="text-gray-600 mb-6">Den forespurte hytta kunne ikke finnes.</p>
          <button 
            onClick={() => router.push('/')}
            className="text-white px-6 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: colors.primary
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button 
                onClick={() => router.back()}
                className="transition-colors mb-2 flex items-center"
                style={{ color: colors.primary }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.primaryHover}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.primary}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tilbake
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bestill {cabin.name}</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{cabin.address}, {cabin.city}</p>
            </div>
            
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Velg datoer</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))
                    }
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
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
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm"
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
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
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
                  <div 
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderBottomColor: colors.primary }}
                  ></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-300">Laster kalender...</span>
                </div>
              )}

              <div className={`grid grid-cols-7 gap-1 mb-4 select-none ${loading ? 'opacity-50' : ''}`} onMouseLeave={handleMouseUp}>
                {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                  <div key={index} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day ? (
                      <div className="h-full relative border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        {cabin?.halfdayAvailability ? (
                          // Half-day availability enabled - show diagonal split interface
                          <>
                            {getDateStatus(day) === "partially_booked" ? (
                              // Render partially booked day - but allow interaction with available halves
                              <>
                                {/* First half (00:00 - 12:00) */}
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
                                    ...getLegendInlineStyles(day),
                                    ...getSelectedInlineStyles(day, "first")
                                  }}
                                />

                                {/* Second half (12:00 - 23:59) */}
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
                                    ...getLegendInlineStyles(day),
                                    ...getSelectedInlineStyles(day, "second")
                                  }}
                                />

                                {/* Day number overlay */}
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900 pointer-events-none z-10">
                                  {day}
                                </div>
                              </>
                            ) : (
                              // Render normal half-day selection interface
                              <>
                                {/* First half (00:00 - 12:00) - Top-left diagonal */}
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
                                    ...getLegendInlineStyles(day),
                                    ...getSelectedInlineStyles(day, "first")
                                  }}
                                />

                                {/* Second half (12:00 - 23:59) - Bottom-right diagonal */}
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
                                    ...getLegendInlineStyles(day),
                                    ...getSelectedInlineStyles(day, "second")
                                  }}
                                />

                                {/* Day number overlay */}
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900 pointer-events-none z-10">
                                  {day}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          // Half-day availability disabled - show full-day selection interface
                          <>
                            <div
                              onMouseDown={() => !loading && handleFullDayMouseDown(day)}
                              onMouseEnter={() => !loading && handleFullDayMouseEnter(day)}
                              onMouseUp={handleMouseUp}
                              className={`
                                absolute inset-0 transition-colors
                                ${getFullDayStyles(day)}
                              `}
                              style={{
                                ...getLegendInlineStyles(day),
                                ...getSelectedInlineStyles(day)
                              }}
                            />

                            {/* Day number overlay */}
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900 pointer-events-none z-10">
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
                  {/* Default Legends */}
                  {activeLegends
                    .filter(legend => legend.isDefault)
                    .map((legend) => {
                      // Special handling for partially booked legend
                      if (legend.id === 'partially_booked') {
                        return (
                          <div key={legend.id} className="flex items-center gap-2">
                            <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded relative overflow-hidden bg-white dark:bg-gray-700">
                              <div className="absolute inset-0 bg-green-200 dark:bg-green-800" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%)' }}></div>
                              <div className="absolute inset-0 bg-red-200 dark:bg-red-800" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%)' }}></div>
                            </div>
                            <span className="text-gray-600 dark:text-gray-300">{legend.name}</span>
                          </div>
                        )
                      }
                      
                      return (
                        <div key={legend.id} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border" 
                            style={{ 
                              backgroundColor: legend.color,
                              borderColor: legend.color
                            }}
                          ></div>
                          <span className="text-gray-600 dark:text-gray-300">{legend.name}</span>
                        </div>
                      )
                    })}
                  
                  {/* Custom Legends */}
                  {activeLegends
                    .filter(legend => !legend.isDefault)
                    .map((legend) => (
                      <div key={legend.id} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border opacity-75" 
                          style={{ 
                            backgroundColor: legend.color,
                            borderColor: legend.color
                          }}
                        ></div>
                        <span className="text-gray-600 dark:text-gray-300">{legend.name}</span>
                      </div>
                    ))}
                </div>
              </div>

              {selectedHalfDays.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">Valgte tidspunkt:</div>
                  <div className="space-y-3 max-h-32 overflow-y-auto">
                    {formatSelectedDatesAsRanges(selectedHalfDays).map((range, index) => {
                      const startTime = range.start.half === "first" ? "00:00" : "12:00"
                      const endTime = range.end.half === "first" ? "12:00" : "23:59"
                      
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400 font-medium">Start dato:</span>
                              <div className="text-blue-700 dark:text-blue-200 font-medium">
                                {range.start.date.toLocaleDateString("nb-NO", { 
                                  day: "numeric", 
                                  month: "short" 
                                })} - {startTime}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400 font-medium">Slutt dato:</span>
                              <div className="text-blue-700 dark:text-blue-200 font-medium">
                                {range.end.date.toLocaleDateString("nb-NO", { 
                                  day: "numeric", 
                                  month: "short" 
                                })} - {endTime}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              // Remove all selections in this range
                              const rangeSelections = selectedHalfDays.filter(selection => {
                                const selectionTime = selection.date.getTime()
                                const startTime = range.start.date.getTime()
                                const endTime = range.end.date.getTime()
                                return selectionTime >= startTime && selectionTime <= endTime
                              })
                              rangeSelections.forEach(selection => removeHalfDaySelection(selection))
                            }}
                            className="ml-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full p-1 transition-colors"
                            title="Fjern dette tidsrommet"
                            disabled={submitting}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Form Section */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Gjesteinformasjon</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Navn *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:border-transparent"
                    style={{
                      '--tw-ring-color': colors.primary
                    } as React.CSSProperties}
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:border-transparent"
                    style={{
                      '--tw-ring-color': colors.primary
                    } as React.CSSProperties}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postnummer *</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:border-transparent"
                      style={{
                        '--tw-ring-color': colors.primary
                      } as React.CSSProperties}
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:border-transparent"
                      style={{
                        '--tw-ring-color': colors.primary
                      } as React.CSSProperties}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:border-transparent"
                    style={{
                      '--tw-ring-color': colors.primary
                    } as React.CSSProperties}
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:border-transparent"
                    style={{
                      '--tw-ring-color': colors.primary
                    } as React.CSSProperties}
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Medlem av:</label>
                  <div className="space-y-2">
                    {cabin?.affiliations && cabin.affiliations.length > 0 ? (
                      cabin.affiliations.map((affiliation) => (
                        <label key={affiliation} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.selectedAffiliations.includes(affiliation)}
                            onChange={(e) => handleAffiliationChange(affiliation, e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2"
                            style={{
                              '--tw-ring-color': colors.primary,
                              color: colors.primary
                            } as React.CSSProperties}
                            disabled={submitting}
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{affiliation}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ingen tilgjengelige medlemskap</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  style={{
                    backgroundColor: colors.primary,
                    '--hover-bg': colors.primaryHover
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    if (!submitting && selectedHalfDays.length > 0) {
                      e.currentTarget.style.backgroundColor = colors.primaryHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting && selectedHalfDays.length > 0) {
                      e.currentTarget.style.backgroundColor = colors.primary
                    }
                  }}
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
                    Vennligst velg minst ett tidspunkt for å aktivere bestilling
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