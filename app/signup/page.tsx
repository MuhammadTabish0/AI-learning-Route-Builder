"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

// Validation schema
const signupSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  username: z
    .string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const usernameValue = watch("username")
  const usernameLength = usernameValue?.length || 0

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Registration failed")
      }

      toast.success("Registration successful! Welcome to SwiftEd!")
      
      // Reset form after successful submission
      setTimeout(() => {
        window.location.href = "/login"
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during registration"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SwiftEd</h1>
            <p className="text-sm text-gray-600">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your Email Address"
                {...register("email")}
                className={`w-full px-4 py-3 rounded-full border-2 focus:outline-none placeholder-gray-400 ${
                  errors.email
                    ? "border-red-500 focus:border-red-500"
                    : "border-teal-200 focus:border-teal-500"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-900 mb-2">
                Username <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">({usernameLength}/20)</span>
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your Username"
                {...register("username")}
                maxLength={20}
                className={`w-full px-4 py-3 rounded-full border-2 focus:outline-none placeholder-gray-400 ${
                  errors.username
                    ? "border-red-500 focus:border-red-500"
                    : "border-teal-200 focus:border-teal-500"
                }`}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your Password"
                  {...register("password")}
                  className={`w-full px-4 py-3 rounded-full border-2 focus:outline-none placeholder-gray-400 ${
                    errors.password
                      ? "border-red-500 focus:border-red-500"
                      : "border-teal-200 focus:border-teal-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 disabled:bg-teal-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  )
}
