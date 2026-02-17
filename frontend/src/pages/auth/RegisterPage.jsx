import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Briefcase, Store, ArrowLeft, ArrowRight, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
} from '@/lib/validators'

const ROLES = [
  {
    value: 'student',
    label: 'Student',
    icon: GraduationCap,
    description: 'Order food from campus canteens as a student',
  },
  {
    value: 'faculty',
    label: 'Faculty',
    icon: Briefcase,
    description: 'Order food from campus canteens as faculty',
  },
  {
    value: 'store_employee',
    label: 'Store Employee',
    icon: Store,
    description: 'Manage your store and fulfill orders',
  },
]

function getPasswordStrength(password) {
  if (!password) return { level: '', color: '', width: '0%' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { level: 'Weak', color: 'bg-red-500', width: '33%' }
  if (score <= 3) return { level: 'Medium', color: 'bg-yellow-500', width: '66%' }
  return { level: 'Strong', color: 'bg-green-500', width: '100%' }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    registerNumber: '',
    employeeId: '',
    phoneNumber: '',
    storeName: '',
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const passwordStrength = getPasswordStrength(formData.password)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setErrors({})
  }

  const goToStep2 = () => {
    if (!selectedRole) {
      toast.error('Please select a role to continue')
      return
    }
    setStep(2)
  }

  const goBack = () => {
    setStep(1)
    setErrors({})
  }

  const validate = () => {
    const newErrors = {}

    const nameResult = validateName(formData.name)
    if (!nameResult.valid) newErrors.name = nameResult.error

    const emailResult = validateEmail(formData.email)
    if (!emailResult.valid) newErrors.email = emailResult.error

    const passwordResult = validatePassword(formData.password)
    if (!passwordResult.valid) newErrors.password = passwordResult.error

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (selectedRole === 'student') {
      const regResult = validateRequired(formData.registerNumber, 'Register number')
      if (!regResult.valid) {
        newErrors.registerNumber = regResult.error
      } else if (!/^[a-zA-Z0-9]+$/.test(formData.registerNumber)) {
        newErrors.registerNumber = 'Register number must be alphanumeric'
      }
    }

    if (selectedRole === 'faculty' || selectedRole === 'store_employee') {
      const empResult = validateRequired(formData.employeeId, 'Employee ID')
      if (!empResult.valid) {
        newErrors.employeeId = empResult.error
      } else if (!/^[a-zA-Z0-9]+$/.test(formData.employeeId)) {
        newErrors.employeeId = 'Employee ID must be alphanumeric'
      }
    }

    if (selectedRole === 'store_employee') {
      const phoneResult = validatePhone(formData.phoneNumber)
      if (!phoneResult.valid) newErrors.phoneNumber = phoneResult.error

      const storeResult = validateName(formData.storeName)
      if (!storeResult.valid) newErrors.storeName = 'Store name must be at least 2 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: selectedRole,
      }

      if (selectedRole === 'student') {
        payload.registerNumber = formData.registerNumber.trim()
      }
      if (selectedRole === 'faculty') {
        payload.employeeId = formData.employeeId.trim()
      }
      if (selectedRole === 'store_employee') {
        payload.employeeId = formData.employeeId.trim()
        payload.phoneNumber = formData.phoneNumber.trim()
        payload.storeName = formData.storeName.trim()
      }

      await register(payload)
      toast.success('Registration successful! Please check your email to verify your account.')
      navigate('/login', { replace: true })
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Registration failed. Please try again.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 tracking-tight">CampusBite</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create your account</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">
              {step === 1 ? 'Choose your role' : 'Fill in your details'}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Select how you will use CampusBite'
                : `Registering as ${ROLES.find((r) => r.value === selectedRole)?.label}`}
            </CardDescription>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <div
                className={`h-2 w-16 rounded-full transition-colors ${
                  step >= 1 ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              />
              <div
                className={`h-2 w-16 rounded-full transition-colors ${
                  step >= 2 ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              />
            </div>
          </CardHeader>

          <CardContent>
            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  {ROLES.map((role) => {
                    const Icon = role.icon
                    const isSelected = selectedRole === role.value
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => handleRoleSelect(role.value)}
                        className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50 shadow-sm'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                            isSelected
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{role.label}</p>
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  onClick={goToStep2}
                  disabled={!selectedRole}
                >
                  <span className="flex items-center gap-2">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            )}

            {/* Step 2: Registration Form */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    autoComplete="name"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    error={!!errors.password}
                    autoComplete="new-password"
                  />
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <p
                        className={`text-xs ${
                          passwordStrength.level === 'Weak'
                            ? 'text-red-600'
                            : passwordStrength.level === 'Medium'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        Password strength: {passwordStrength.level}
                      </p>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={!!errors.confirmPassword}
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Student: Register Number */}
                {selectedRole === 'student' && (
                  <div className="space-y-2">
                    <Label htmlFor="registerNumber">Register Number</Label>
                    <Input
                      id="registerNumber"
                      name="registerNumber"
                      placeholder="Enter your register number"
                      value={formData.registerNumber}
                      onChange={handleChange}
                      error={!!errors.registerNumber}
                    />
                    {errors.registerNumber && (
                      <p className="text-xs text-destructive">{errors.registerNumber}</p>
                    )}
                  </div>
                )}

                {/* Faculty: Employee ID */}
                {selectedRole === 'faculty' && (
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      name="employeeId"
                      placeholder="Enter your employee ID"
                      value={formData.employeeId}
                      onChange={handleChange}
                      error={!!errors.employeeId}
                    />
                    {errors.employeeId && (
                      <p className="text-xs text-destructive">{errors.employeeId}</p>
                    )}
                  </div>
                )}

                {/* Store Employee: Employee ID, Phone, Store Name */}
                {selectedRole === 'store_employee' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input
                        id="employeeId"
                        name="employeeId"
                        placeholder="Enter your employee ID"
                        value={formData.employeeId}
                        onChange={handleChange}
                        error={!!errors.employeeId}
                      />
                      {errors.employeeId && (
                        <p className="text-xs text-destructive">{errors.employeeId}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        error={!!errors.phoneNumber}
                        maxLength={10}
                      />
                      {errors.phoneNumber && (
                        <p className="text-xs text-destructive">{errors.phoneNumber}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        name="storeName"
                        placeholder="Enter your store name"
                        value={formData.storeName}
                        onChange={handleChange}
                        error={!!errors.storeName}
                      />
                      {errors.storeName && (
                        <p className="text-xs text-destructive">{errors.storeName}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
                    <span className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </span>
                  </Button>
                  <Button type="submit" className="flex-1" size="lg" disabled={isLoading}>
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
                        Creating account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Register
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
              >
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
