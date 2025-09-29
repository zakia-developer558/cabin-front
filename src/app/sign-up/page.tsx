"use client"
import Header from "../../components/general/header" 
import { useState } from "react"
import Link from "next/link"
import { useToast } from "../../hooks/useToast"
import { ToastContainer } from "../../components/ui/Toast"

export default function SignupPage() {
  const [userType] = useState<"user" | "owner">("owner")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    companyName: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toasts, success, error, removeToast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      error("Validering feilet", "Fornavn er påkrevd")
      return false
    }
    if (!formData.lastName.trim()) {
      error("Validering feilet", "Etternavn er påkrevd")
      return false
    }
    if (!formData.email.trim()) {
      error("Validering feilet", "E-post er påkrevd")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      error("Validering feilet", "Vennligst oppgi en gyldig e-postadresse")
      return false
    }
    if (!formData.password) {
      error("Validering feilet", "Passord er påkrevd")
      return false
    }
    if (formData.password.length < 6) {
      error("Validering feilet", "Passordet må være minst 6 tegn langt")
      return false
    }
    if (!formData.companyName.trim()) {
      error("Validering feilet", "Firmanavn er påkrevd")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          role: userType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registrering feilet")
      }

      success("Registrering vellykket!", "Konto opprettet! Du kan nå logge inn med dine nye legitimasjoner.")
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        companyName: ""
      })
      
      // Optionally redirect to login page after successful registration
      // window.location.href = "/login"
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Noe gikk galt. Vennligst prøv igjen."
      error("Registrering feilet", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Signup Section */}
      <main className="relative min-h-[calc(100vh-80px)] flex items-center justify-center">
        {/* Background gradient matching landing page theme */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>

        {/* Signup Card */}
        <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
          {/* Signup Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">Opprett din konto</h1>
          {/* <p className="text-center text-gray-600 mb-6 text-sm">
            Join our platform to
            <br />
            list your own property
          </p> */}

          {/* User Type Slider - Commented out for more concise form */}
          {/* <div className="mb-6">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                type="button"
                onClick={() => setUserType("user")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  userType === "user" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                } hidden`}
              >
                Book a Cabin
              </button>
              <button
                type="button"
                onClick={() => setUserType("owner")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  userType === "owner" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                List My Cabin
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {userType === "user"
                ? "Sign up as a guest to book amazing cabins"
                : "Sign up as an owner to list your cabin"}
            </p>
          </div> */}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Fornavn"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-gray-300 focus:outline-none text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Etternavn"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-gray-300 focus:outline-none text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="E-post"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-gray-300 focus:outline-none text-gray-900 placeholder-gray-500"
                required
              />
            </div>

            {/* Company Name Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Firmanavn"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-gray-300 focus:outline-none text-gray-900 placeholder-gray-500"
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Passord"
                className="w-full pl-10 pr-12 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-gray-300 focus:outline-none text-gray-900 placeholder-gray-500"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                >
                  <svg
                    className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    ) : (
                      <>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Oppretter konto...
                </>
              ) : (
                "Opprett konto"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Eller</span>
              </div>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Har du allerede en konto?{" "}
              <Link href="/login" className="text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-semibold">
                Logg inn
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}