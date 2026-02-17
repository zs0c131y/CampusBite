import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { validateEmail } from '@/lib/validators'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const emailResult = validateEmail(email)
    if (!emailResult.valid) {
      setError(emailResult.error)
      return
    }

    setIsLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
    } catch {
      // We intentionally do not show backend errors to prevent email enumeration
    } finally {
      setIsLoading(false)
      setIsSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 tracking-tight">CampusBite</h1>
          <p className="text-muted-foreground mt-1 text-sm">Reset your password</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Forgot Password</CardTitle>
            <CardDescription>
              {isSubmitted
                ? 'Check your email inbox'
                : 'Enter your email and we will send you a reset link'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSubmitted ? (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed px-4">
                  If an account exists with this email, you will receive a password reset link.
                  Please check your inbox and spam folder.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setIsSubmitted(false)
                    setEmail('')
                  }}
                >
                  Try another email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={handleChange}
                      error={!!error}
                      className="pl-10"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send Reset Link
                    </span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <Link
              to="/login"
              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
