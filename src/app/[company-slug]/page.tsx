"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"

interface Cabin {
  _id: string
  id: number
  name: string
  address: string
  city: string
  postal_code: string
  phone: string
  email: string
  contact_person_name: string
  contact_person_employer?: string
  is_member?: boolean
  createdAt?: string
  updatedAt?: string
  image?: string
}



export default function CompanyCabinsPage() {
  const params = useParams()
  const router = useRouter()
  const companySlug = params['company-slug'] as string
  
  const [cabins, setCabins] = useState<Cabin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")

  useEffect(() => {
    const fetchCompanyCabins = async () => {
      if (!companySlug) return
      
      try {
        setLoading(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/company/${companySlug}/cabins`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch cabins: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Clean image URLs similar to CabinTable
        const cleanImageUrl = (imageUrl?: string): string | null => {
          if (!imageUrl) return null
          
          // Remove leading/trailing spaces and backticks
          const cleaned = imageUrl.trim().replace(/^`+|`+$/g, '')
          
          // Check if it's a valid URL
          try {
            new URL(cleaned)
            return cleaned
          } catch {
            return null
          }
        }
        
        const cleanedCabins = (data.data || []).map((cabin: Cabin) => ({
          ...cabin,
          image: cleanImageUrl(cabin.image)
        }))
        
        console.log('Company cabins with cleaned images:', cleanedCabins.map((c: Cabin) => ({ name: c.name, image: c.image })))
        
        setCabins(cleanedCabins)
      } catch (err) {
        console.error('Error fetching company cabins:', err)
        setError(err instanceof Error ? err.message : 'Failed to load cabins')
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyCabins()
  }, [companySlug])

  // Navigate to cabin booking page
  const handleViewDetails = (cabin: Cabin) => {
    const cabinSlug = cabin.name.toLowerCase().replace(/\s+/g, '-')
    router.push(`/${companySlug}/${cabinSlug}`)
  }

  // Filter cabins based on search and city
  const filteredCabins = cabins.filter(cabin => {
    const matchesSearch = cabin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cabin.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cabin.contact_person_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCity = selectedCity === "all" || cabin.city === selectedCity
    return matchesSearch && matchesCity
  })

  // Get unique cities for filter
  const cities = Array.from(new Set(cabins.map(cabin => cabin.city))).sort()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Laster hytter...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Feil ved lasting av hytter</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Prøv igjen
          </button>
        </div>
      </div>
    )
  }

  if (cabins.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-white mb-2">Ingen hytter funnet</h1>
          <p className="text-gray-300">Dette firmaet har ikke lagt til noen hytter ennå.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Tilgjengelige hytter
          </h1>
          <p className="text-gray-300 text-lg">
            Bla gjennom og bestill hytter fra {companySlug}
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Søk etter hytter ved navn, adresse eller kontaktperson..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-48">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">Alle byer</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Viser {filteredCabins.length} av {cabins.length} hytter
          </div>
        </div>

        {/* Cabins Table */}
        {filteredCabins.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-gray-300 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ingen hytter funnet</h3>
            <p className="text-gray-600">Prøv å justere søke- eller filterkriteriene dine.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Bilde
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Hyttenavn
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Kontaktperson
                    </th>

                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Handlinger
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCabins.map((cabin) => (
                    <tr key={cabin._id} className="hover:bg-gray-50 transition-colors duration-200">
                      {/* Image Column */}
                      <td className="px-6 py-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative">
                          {cabin.image ? (
                            <>
                              <Image
                                src={cabin.image}
                                alt={`${cabin.name} cabin`}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log('Image failed to load:', cabin.image);
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                                  if (fallback) {
                                    fallback.style.display = 'block';
                                  }
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully:', cabin.image);
                                }}
                              />
                              <svg
                                className="fallback-icon w-8 h-8 text-gray-400 absolute inset-0 m-auto hidden"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </>
                          ) : (
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100"
                          >
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">{cabin.name}</p>
                            {cabin.is_member && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✅ Member
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{cabin.contact_person_name}</p>
                            {cabin.contact_person_employer && (
                              <p className="text-sm text-gray-600">{cabin.contact_person_employer}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewDetails(cabin)}
                          className="px-6 py-2 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                        >
                          Bestill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>


    </div>
  )
}