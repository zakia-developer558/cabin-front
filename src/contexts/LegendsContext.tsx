"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export interface Legend {
  id: string
  name: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  isActive: boolean
  isDefault: boolean
  description?: string
  companySlug?: string
}

interface LegendsContextType {
  legends: Legend[]
  activeLegends: Legend[]
  addLegend: (legend: Omit<Legend, 'id' | 'isDefault'>) => void
  updateLegend: (id: string, updates: Partial<Legend>) => void
  deleteLegend: (id: string) => void
  toggleLegendActive: (id: string) => void
  getLegendByStatus: (status: string) => Legend | undefined
  loading: boolean
  error: string | null
}

const LegendsContext = createContext<LegendsContextType | undefined>(undefined)

// Default legends that match the current hardcoded system
const defaultLegends: Legend[] = [
  {
    id: 'available',
    name: 'Tilgjengelig',
    color: '#10b981',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    isActive: true,
    isDefault: true,
    description: 'Tilgjengelig for bestilling'
  },
  {
    id: 'booked',
    name: 'Opptatt',
    color: '#ef4444',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    isActive: true,
    isDefault: true,
    description: 'Fullstendig booket'
  },
  {
    id: 'partially_booked',
    name: 'Delvis opptatt',
    color: '#f59e0b',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    isActive: true,
    isDefault: true,
    description: 'Delvis booket (halv dag)'
  },
  {
    id: 'maintenance',
    name: 'Vedlikehold',
    color: '#eab308',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    isActive: true,
    isDefault: true,
    description: 'Under vedlikehold'
  },
  {
    id: 'unavailable',
    name: 'Ikke tilgjengelig',
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-500',
    isActive: true,
    isDefault: true,
    description: 'Ikke tilgjengelig for bestilling'
  }
]

interface LegendsProviderProps {
  children: ReactNode
  selectedCabin?: string | null
}

export function LegendsProvider({ children }: LegendsProviderProps) {
  const [legends, setLegends] = useState<Legend[]>(defaultLegends)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null

  const loadCustomLegends = useCallback(async () => {
    if (!token) {
      console.log("No token available, skipping legend loading")
      return
    }

    console.log("Loading custom legends with token:", token?.substring(0, 10) + "...")
    console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL)

    setLoading(true)
    setError(null)

    try {
      // Get active legends only
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/legends?active=true`
      console.log("Fetching from URL:", url)
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log("Response data:", data)

      if (data.success && data.data) {
        // Map all API legends and mark default ones appropriately
        const apiLegends = data.data.map((legend: Legend) => {
          // Check if this is a default legend by name
          const isDefaultLegend = defaultLegends.some(dl => 
            dl.name.toLowerCase() === legend.name.toLowerCase()
          )
          
          return {
            id: legend.id,
            name: legend.name,
            color: legend.color,
            bgColor: legend.bgColor || `bg-[${legend.color}]/10`,
            borderColor: legend.borderColor || `border-[${legend.color}]/20`,
            textColor: legend.textColor || `text-[${legend.color}]`,
            isActive: legend.isActive !== false,
            isDefault: isDefaultLegend,
            description: legend.description || ''
          }
        })
        
        // Use only API legends (no hardcoded defaults)
        const mergedLegends = apiLegends
        
        setLegends(mergedLegends)
      } else {
        console.log("API response indicates failure:", data)
        setError("Failed to load custom legends")
      }
    } catch (err) {
      console.error("Error loading custom legends:", err)
      setError("Failed to load custom legends")
    } finally {
      setLoading(false)
    }
  }, [token])

  // Load custom legends on component mount
  useEffect(() => {
    if (token) {
      loadCustomLegends()
    }
  }, [token, loadCustomLegends])

  const addLegend = async (legendData: Omit<Legend, 'id' | 'isDefault'>) => {
    if (!token) return

    // Get company slug from localStorage
    const userCompanySlug = localStorage.getItem('companySlug') || ''

    const newLegend: Legend = {
      ...legendData,
      id: `custom_${Date.now()}`,
      isDefault: false,
      companySlug: userCompanySlug
    }

    const payload = {
      name: legendData.name,
      color: legendData.color,
      bgColor: legendData.bgColor,
      borderColor: legendData.borderColor,
      textColor: legendData.textColor,
      isActive: legendData.isActive,
      description: legendData.description,
      userCompanySlug
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/legends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        setLegends(prev => [...prev, { ...newLegend, id: data.data.id }])
      } else {
        setError("Failed to add legend")
      }
    } catch (err) {
      console.error("Error adding legend:", err)
      setError("Failed to add legend")
      // Add locally for now
      setLegends(prev => [...prev, newLegend])
    }
  }

  const updateLegend = async (id: string, updates: Partial<Legend>) => {
    if (!token) return

    try {
      // Remove id from the payload as it should not be sent to the backend
      const { id: _, ...updatePayload } = updates
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/legends/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      })

      const data = await response.json()

      if (data.success) {
        setLegends(prev => prev.map(legend => 
          legend.id === id ? { ...legend, ...updates } : legend
        ))
      } else {
        setError("Failed to update legend")
      }
    } catch (err) {
      console.error("Error updating legend:", err)
      setError("Failed to update legend")
      // Update locally for now
      setLegends(prev => prev.map(legend => 
        legend.id === id ? { ...legend, ...updates } : legend
      ))
    }
  }

  const deleteLegend = async (id: string) => {
    if (!token) return

    const legend = legends.find(l => l.id === id)
    if (legend?.isDefault) {
      setError("Cannot delete default legends")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/legends/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setLegends(prev => prev.filter(legend => legend.id !== id))
      } else {
        setError("Failed to delete legend")
      }
    } catch (err) {
      console.error("Error deleting legend:", err)
      setError("Failed to delete legend")
      // Delete locally for now
      setLegends(prev => prev.filter(legend => legend.id !== id))
    }
  }

  const toggleLegendActive = async (id: string) => {
    const legend = legends.find(l => l.id === id)
    if (!legend) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/legends/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setLegends(prev => prev.map(l => 
          l.id === id ? { ...l, isActive: !l.isActive } : l
        ))
      } else {
        setError("Failed to toggle legend")
      }
    } catch (err) {
      console.error("Error toggling legend:", err)
      setError("Failed to toggle legend")
      // Toggle locally for now
      setLegends(prev => prev.map(l => 
        l.id === id ? { ...l, isActive: !l.isActive } : l
      ))
    }
  }

  const getLegendByStatus = (status: string): Legend | undefined => {
    return legends.find(legend => legend.id === status || legend.name.toLowerCase().replace(/\s+/g, '_') === status)
  }

  const activeLegends = legends.filter(legend => legend.isActive)

  const value: LegendsContextType = {
    legends,
    activeLegends,
    addLegend,
    updateLegend,
    deleteLegend,
    toggleLegendActive,
    getLegendByStatus,
    loading,
    error
  }

  return (
    <LegendsContext.Provider value={value}>
      {children}
    </LegendsContext.Provider>
  )
}

export function useLegends() {
  const context = useContext(LegendsContext)
  if (context === undefined) {
    throw new Error('useLegends must be used within a LegendsProvider')
  }
  return context
}