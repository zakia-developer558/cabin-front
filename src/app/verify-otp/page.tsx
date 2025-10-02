"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "../../hooks/useToast"
import { ToastContainer } from "../../components/ui/Toast"

function VerifyOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toasts, success, error, removeToast } = useToast()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const qEmail = searchParams.get("email") || ""
    if (qEmail) {
      setEmail(qEmail)
      // Persist for fallback
      if (typeof window !== "undefined") {
        localStorage.setItem("pendingEmail", qEmail)
      }
    } else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pendingEmail") || localStorage.getItem("email") || ""
      if (stored) setEmail(stored)
    }
  }, [searchParams])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      error("E-post mangler", "Kan ikke verifisere uten e-post")
      return
    }
    if (!/^[0-9]{6}$/.test(otp)) {
      error("Ugyldig OTP", "OTP må være 6 sifre")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || "Verifisering feilet")
      }
      success("OTP verifisert", "Velkommen!")
      // Clear pending email
      if (typeof window !== "undefined") {
        localStorage.removeItem("pendingEmail")
      }
      // Redirect to login page after successful verification with a flag
      router.push("/login?verified=1")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Prøv igjen"
      error("Verifisering feilet", msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">Bekreft OTP</h1>
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-6">
          Vi har sendt en 6-sifret kode til {email || "din e-post"}.
        </p>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">OTP-kode</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Skriv inn 6-sifret kode"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-gray-300 focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifiserer...
              </>
            ) : (
              "Bekreft"
            )}
          </button>
        </form>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpContent />
    </Suspense>
  )
}