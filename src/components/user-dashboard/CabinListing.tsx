"use client"

interface Cabin {
  id: string
  name: string
  address: string
  city: string
  postal_code: string
  phone: string
  email: string
  contact_person_name: string
  price_per_night: number
  max_guests: number
  amenities: string[]
  image_url?: string
}

interface CabinListingProps {
  onBookCabin: (cabin: Cabin) => void
}

export default function CabinListing({ onBookCabin }: CabinListingProps) {
  const cabins: Cabin[] = [
    {
      id: "1",
      name: "Havro Mountain Cabin",
      address: "Snarvelen 12",
      city: "Storby",
      postal_code: "4321",
      phone: "12345678",
      email: "havro@example.com",
      contact_person_name: "Ola Nordmann",
      price_per_night: 1200,
      max_guests: 6,
      amenities: ["WiFi", "Kitchen", "Fireplace", "Parking", "Mountain View"],
    },
    {
      id: "2",
      name: "Lakeside Retreat",
      address: "Vannveien 45",
      city: "Laketown",
      postal_code: "5432",
      phone: "87654321",
      email: "lakeside@example.com",
      contact_person_name: "Kari Hansen",
      price_per_night: 1500,
      max_guests: 8,
      amenities: ["WiFi", "Kitchen", "Sauna", "Boat Access", "Lake View"],
    },
    {
      id: "3",
      name: "Forest Lodge",
      address: "Skogstien 78",
      city: "Woodland",
      postal_code: "6543",
      phone: "11223344",
      email: "forest@example.com",
      contact_person_name: "Erik Olsen",
      price_per_night: 900,
      max_guests: 4,
      amenities: ["WiFi", "Kitchen", "Hiking Trails", "BBQ Area"],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Oppdag fantastiske hytter</h2>
            <p className="text-gray-300 text-lg">Finn din perfekte fjellferie</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Søk hytter..."
                className="pl-10 pr-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
              />
            </div>
            <select className="px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all">
              <option className="text-gray-900">Alle steder</option>
              <option className="text-gray-900">Storby</option>
              <option className="text-gray-900">Laketown</option>
              <option className="text-gray-900">Woodland</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cabins.map((cabin, index) => (
          <div
            key={cabin.id}
            className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
          >
            <div
              className={`h-2 ${index % 3 === 0 ? "bg-gradient-to-r from-red-400 to-pink-500" : index % 3 === 1 ? "bg-gradient-to-r from-blue-400 to-cyan-500" : "bg-gradient-to-r from-green-400 to-emerald-500"}`}
            ></div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${index % 3 === 0 ? "bg-red-100" : index % 3 === 1 ? "bg-blue-100" : "bg-green-100"}`}
                >
                  <svg
                    className={`w-6 h-6 ${index % 3 === 0 ? "text-red-600" : index % 3 === 1 ? "text-blue-600" : "text-green-600"}`}
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
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                  {cabin.name}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
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
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Kontaktperson</p>
                    <p className="text-lg font-semibold text-gray-900">{cabin.contact_person_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Adresse</p>
                    <p className="text-gray-900 font-medium">{cabin.address}</p>
                    <p className="text-gray-700">
                      {cabin.postal_code} {cabin.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Email</p>
                    <p className="text-gray-900 font-medium break-all">{cabin.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Telefon</p>
                    <p className="text-gray-900 font-medium">{cabin.phone}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onBookCabin(cabin)}
                className={`w-full mt-8 py-4 px-6 rounded-2xl font-bold text-white transition-all duration-300 transform group-hover:scale-105 shadow-lg hover:shadow-xl ${
                  index % 3 === 0
                    ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                    : index % 3 === 1
                      ? "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                }`}
              >
                Bestill denne hytta
              </button>
            </div>
          </div>
        ))}
      </div>

      {cabins.length === 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-xl p-16 text-center">
          <div className="text-gray-300 mb-6">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Ingen hytter tilgjengelig</h3>
          <p className="text-gray-600 text-lg">Sjekk tilbake senere for nye fantastiske oppføringer.</p>
        </div>
      )}
    </div>
  )
}
