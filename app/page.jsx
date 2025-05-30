"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/login-form"
import { useAuth } from "@/app/context/AuthContext"

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      if (user.role === "admin") {
        console.log("Admin user detected at login page, redirecting to admin");
        router.push("/admin");
      } else {
        console.log("Regular user detected at login page, redirecting to profile");
        router.push("/profile");
      }
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#253BAB] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-[#0E0E0E]">Sign in to WebScraperPro</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your credentials to access your scraping dashboard</p>
        </div>
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#253BAB]"></div>
          </div>
        ) : (
        <LoginForm />
        )}
      </div>
    </div>
  )
}
