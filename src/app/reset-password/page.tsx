"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "../../hooks/useToast"
import { ToastContainer } from "../../components/ui/Toast"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toasts, success, error, removeToast } = useToast()

  const [token, setToken] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [submitting, setSubmitting] = useState<boolean>(false)

  useEffect(() => {
    const qToken = searchParams.get("token") || ""
    if (qToken) {
      setToken(qToken)
      if (typeof window !== "undefined") localStorage.setItem("resetToken", qToken)
    } else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("resetToken") || ""
      if (stored) setToken(stored)
    }
  }, [searchParams])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      error("Token mangler", "Mangler reset token fra URL")
      return
    }
    if (!password || password.length < 6) {
      error("Ugyldig passord", "Passord må være minst 6 tegn")
      return
    }
    setSubmitting(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
      const res = await fetch(`${backendUrl}/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as any)?.message || "Tilbakestilling feilet")
      }
      success("Passord tilbakestilt", "Vennligst logg inn med nytt passord")
      if (typeof window !== "undefined") localStorage.removeItem("resetToken")
      router.push("/login")
    } catch (err: any) {
      error("Feil", err?.message || "Prøv igjen senere")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">Tilbakestill passord</h1>
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-6">
          Skriv inn nytt passord. Token hentes fra nettleseren.
        </p>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Nytt passord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nytt passord"
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
                Tilbakestiller...
              </>
            ) : (
              "Tilbakestill"
            )}
          </button>
        </form>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}