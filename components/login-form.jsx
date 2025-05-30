"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EyeIcon, EyeOffIcon, LockIcon, UserIcon } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validate form data
    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Please enter both username and password")
      setLoading(false)
      return
    }

    try {
      // Call login and get the user data
      const userData = await login(formData.username.trim(), formData.password.trim())
      
      // Explicit role verification and navigation
      if (userData && userData.role) {
        if (userData.role === "admin") {
          console.log("Admin login detected, redirecting to admin dashboard")
          router.push("/admin")
        } else {
          console.log("Regular user login detected, redirecting to profile")
          router.push("/profile")
        }
      }
    } catch (err) {
      console.error("Login error:", err)
      if (err.message.includes("NetworkError") || err.message.includes("CORS")) {
        setError("Server connection error. Please make sure the backend server is running.")
      } else if (err.message.includes("Invalid credentials")) {
        setError("Invalid username or password")
      } else {
        setError(err.message || "Failed to login. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) {
      setError("")
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4 rounded-md shadow-sm">
        <div>
          <Label htmlFor="username" className="sr-only">
            Username
          </Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <UserIcon className="h-5 w-5 text-[#253BAB]" aria-hidden="true" />
            </div>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
                value={formData.username}
                onChange={handleInputChange}
              className="block w-full rounded-md border-0 py-1.5 pl-10 text-[#0E0E0E] ring-1 ring-inset ring-[#253BAB] placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#253BAB] sm:text-sm sm:leading-6"
              placeholder="Username"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="sr-only">
            Password
          </Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <LockIcon className="h-5 w-5 text-[#253BAB]" aria-hidden="true" />
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
                value={formData.password}
                onChange={handleInputChange}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-[#0E0E0E] ring-1 ring-inset ring-[#253BAB] placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#253BAB] sm:text-sm sm:leading-6"
              placeholder="Password"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#253BAB] hover:text-[#253BAB]/80 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

      <div>
        <Button
          type="submit"
            className="group relative flex w-full justify-center rounded-md bg-[#253BAB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#253BAB]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#253BAB] disabled:opacity-50"
            disabled={loading}
        >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
        </Button>
      </div>
    </form>
    </div>
  )
}