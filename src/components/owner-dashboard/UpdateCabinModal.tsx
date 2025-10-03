"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { uploadImageToFirebase } from "@/utils/imageUpload"

export interface CabinData {
  name: string
  address: string
  postal_code: string
  city: string
  phone: string
  email: string
  contact_person_name: string
  halfdayAvailability: boolean
  image?: string
  color: string
  affiliations: string[]
}

interface UpdateCabinModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (cabinData: CabinData) => void
  cabinSlug: string | null
  initialData?: CabinData | null
}

export default function UpdateCabinModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  cabinSlug, 
  initialData 
}: UpdateCabinModalProps) {
  const [formData, setFormData] = useState<CabinData>({
    name: "",
    address: "",
    postal_code: "",
    city: "",
    phone: "",
    email: "",
    contact_person_name: "",
    halfdayAvailability: false,
    image: "",
    color: "#4ECDC4",
    affiliations: [],
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newAffiliation, setNewAffiliation] = useState("")

  // Fetch cabin data when modal opens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen && cabinSlug && !initialData) {
      fetchCabinData()
    } else if (initialData) {
      setFormData(initialData)
      if (initialData.image) {
        setImagePreview(initialData.image)
      }
    }
  }, [isOpen, cabinSlug, initialData])

  const fetchCabinData = async () => {
    if (!cabinSlug) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("Unauthorized: No token found")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/cabins/${cabinSlug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error(`Error: ${response.status}`)

      const result = await response.json()
      if (result.success && result.data) {
        const cabinData = result.data
        setFormData({
          name: cabinData.name || "",
          address: cabinData.address || "",
          postal_code: cabinData.postal_code || "",
          city: cabinData.city || "",
          phone: cabinData.phone || "",
          email: cabinData.email || "",
          contact_person_name: cabinData.contact_person_name || "",
          halfdayAvailability: cabinData.halfdayAvailability || false,
          image: cabinData.image || "",
          color: cabinData.color || "#4ECDC4",
          affiliations: cabinData.affiliations || [],
        })
        if (cabinData.image) {
          setImagePreview(cabinData.image)
        }
      }
    } catch (error) {
      console.error("Feil ved henting av kabindata:", error)
      alert("Kunne ikke hente hyttedata. Prøv på nytt.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    
    try {
      let imageUrl = formData.image
      
      // Upload new image if selected
      if (selectedImage) {
        imageUrl = await uploadImageToFirebase(selectedImage)
      }
      
      // Submit form data with image URL
      const cabinDataWithImage = {
        ...formData,
        image: imageUrl
      }
      
      onSubmit(cabinDataWithImage)
      
      // Reset form
      setFormData({
        name: "",
        address: "",
        postal_code: "",
        city: "",
        phone: "",
        email: "",
        contact_person_name: "",
        halfdayAvailability: false,
        image: "",
        color: "#4ECDC4",
        affiliations: [],
      })
      setSelectedImage(null)
      setImagePreview(null)
      setNewAffiliation("")
      onClose()
    } catch (error) {
      console.error("Feil ved innsending av skjema:", error)
      alert("Kunne ikke laste opp bildet. Prøv på nytt.")
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const target = e.target as HTMLInputElement
    setFormData((prev) => ({
      ...prev,
      [name]: target.type === "checkbox" ? target.checked : value,
    }))
  }

  const addAffiliation = () => {
    if (newAffiliation.trim() && !formData.affiliations.includes(newAffiliation.trim())) {
      setFormData((prev) => ({
        ...prev,
        affiliations: [...prev.affiliations, newAffiliation.trim()],
      }))
      setNewAffiliation("")
    }
  }

  const removeAffiliation = (affiliationToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      affiliations: prev.affiliations.filter(affiliation => affiliation !== affiliationToRemove),
    }))
  }

  const handleAffiliationKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addAffiliation()
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Oppdater hytte</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Laster hyttedata...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hyttenavn</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Skriv inn hyttenavn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Skriv inn adresse"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postnummer</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">By</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Skriv inn by"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="12345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-post</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="hytte@eksempel.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kontaktperson navn</label>
              <input
                type="text"
                name="contact_person_name"
                value={formData.contact_person_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Skriv inn kontaktperson navn"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="halfdayAvailability"
                checked={formData.halfdayAvailability}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Halvdags tilgjengelighet</label>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hyttens farge</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{formData.color}</span>
              </div>
            </div>

            {/* Affiliations Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tilknytninger</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newAffiliation}
                  onChange={(e) => setNewAffiliation(e.target.value)}
                  onKeyPress={handleAffiliationKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Legg til tilknytning"
                />
                <button
                  type="button"
                  onClick={addAffiliation}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Legg til
                </button>
              </div>
              {formData.affiliations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.affiliations.map((affiliation, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    >
                      {affiliation}
                      <button
                        type="button"
                        onClick={() => removeAffiliation(affiliation)}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hyttebilde</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-red-400 dark:hover:border-red-500 transition-colors">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={128}
                        height={128}
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null)
                          setImagePreview(null)
                          setFormData(prev => ({ ...prev, image: "" }))
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500"
                        >
                          <span>Last opp en fil</span>
                          <input
                            id="image-upload"
                            name="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">eller dra og slipp</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF opptil 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={uploading}
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading}
              >
                {uploading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Oppdaterer...
                  </div>
                ) : (
                  "Oppdater hytte"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}