"use client";
import { useState, FormEvent, useEffect, Suspense } from "react";
import Link from "next/link";
import Header from "../../components/general/header";
import { useSearchParams } from "next/navigation";
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../../components/ui/Toast";

// Define the user type based on your API response
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyName: string;
  slug?: string; // User slug
  companySlug?: string; // Company slug
}

// Define the API response type
interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

function LoginContent() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const searchParams = useSearchParams();
  const { toasts, success, error: toastError, removeToast } = useToast();
  const [forgotOpen, setForgotOpen] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);

  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "1") {
      success("OTP verifisert", "Vennligst logg inn.");
    }
  }, [searchParams, success]);

  const handleForgotSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailTrimmed = forgotEmail.trim();
    if (!emailTrimmed) {
      toastError("E-post mangler", "Vennligst oppgi e-post.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      toastError("Ugyldig e-post", "Skriv inn en gyldig e-postadresse.");
      return;
    }
    setForgotLoading(true);
    try {
      //const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed })
      });
      type ApiResponse = { message?: string }
      const data: ApiResponse = await res.json().catch(() => ({} as ApiResponse));
      if (!res.ok) {
        throw new Error(data.message || "Kunne ikke sende e-post");
      }
      success("E-post sendt", "Sjekk innboksen for videre instruksjoner.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Prøv igjen senere.";
      toastError("Feil ved forespørsel", msg);
    } finally {
      setForgotLoading(false);
    }
  };
  
  // Always call hooks unconditionally
  

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use environment variable for the backend URL
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ;
      const response = await fetch(`${backendUrl}/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (data.success) {
        // Save token and user data to localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Save company slug separately if available
        if (data.user.companySlug) {
          localStorage.setItem("companySlug", data.user.companySlug);
        } else if (data.user.slug) {
          // Fallback: use user slug as company slug if no company slug is provided
          localStorage.setItem("companySlug", data.user.slug);
        }
        
        // Navigate based on role
        if (data.user.role === "owner") {
          window.location.href = "/dashboard/owner";
        } else {
          window.location.href = "/dashboard/user";
        }
      } else {
        setError(data.message || "Innlogging feilet. Vennligst sjekk dine innloggingsopplysninger.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("En feil oppstod under innlogging. Vennligst prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Header */}
      <Header />


      {/* Login Section */}
      <main className="relative min-h-[calc(100vh-80px)] flex items-center justify-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-purple-100 via-transparent to-transparent dark:from-gray-900 dark:via-transparent dark:to-transparent transition-colors duration-200"></div>

        {/* Login Card */}
        <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 transition-colors duration-200">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">Logg inn</h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-sm">Logg inn på din konto</p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
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
                placeholder="E-post"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
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
                type="password"
                placeholder="Passord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Glemt passord?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logger inn...
                </>
              ) : "Logg inn"}
            </button>
          </form>

          {/* Sign Up Option */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Har du ikke en konto?{" "}
            <Link href="/sign-up" className="text-gray-800 dark:text-gray-200 font-semibold hover:underline hover:text-gray-900 dark:hover:text-white">
              Registrer deg
            </Link>
          </p>

          {/* Divider */}
          <div className="mt-6 mb-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      {/* Toasts */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !forgotLoading && setForgotOpen(false)}></div>
          <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Tilbakestill passord</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Oppgi e-postadressen din for å motta en tilbakestillingslenke.</p>
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="E-post"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-gray-300 focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  disabled={forgotLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold disabled:opacity-70"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {forgotLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sender...
                    </>
                  ) : (
                    "Send lenke"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}