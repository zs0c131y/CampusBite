import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PasswordRequirements } from '@/components/shared/PasswordRequirements'
import api from '@/lib/api'
import { validatePassword } from '@/lib/validators'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    const passwordResult = validatePassword(formData.password)
    if (!passwordResult.valid) newErrors.password = passwordResult.error

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await api.post(`/auth/reset-password/${token}`, {
        password: formData.password,
      })
      toast.success('Password reset successful! You can now login with your new password.')
      navigate('/login', { replace: true })
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to reset password. The link may have expired. Please request a new one.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-[8%] h-56 w-56 rounded-full bg-orange-200/16 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[12%] h-64 w-64 rounded-full bg-amber-300/16 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center">
      <div className="w-full">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-orange-700 tracking-tight">CampusBite</h1>
          <p className="text-muted-foreground mt-1 text-sm">Set a new password</p>
        </div>

        <Card className="border border-border/80 bg-card/90 shadow-[0_20px_34px_-26px_rgba(32,23,15,0.66)] backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mb-3">
              <KeyRound className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="font-display text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your new password below. It must be at least 8 characters with uppercase,
              lowercase, and a number.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={handleChange}
                    error={!!errors.password}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
                <PasswordRequirements password={formData.password} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={!!errors.confirmPassword}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
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
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <Link
              to="/login"
              className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline"
            >
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
      </div>
    </div>
  )
}
