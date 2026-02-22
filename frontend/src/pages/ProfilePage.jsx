import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  ClipboardList,
  GraduationCap,
  Mail,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import {
  isChristUniversityEmail,
  validateName,
  validatePhone,
} from '@/lib/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

const ROLE_META = {
  student: {
    label: 'Student',
    icon: GraduationCap,
    gradient: 'from-orange-600 to-amber-500',
    description:
      'Manage your student profile and keep your campus account details up to date.',
    idLabel: 'Register Number',
    idField: 'registerNumber',
  },
  faculty: {
    label: 'Faculty',
    icon: Briefcase,
    gradient: 'from-sky-600 to-indigo-500',
    description:
      'Review and update your faculty profile details for a smoother ordering experience.',
    idLabel: 'Employee ID',
    idField: 'employeeId',
  },
  store_employee: {
    label: 'Store Employee',
    icon: Store,
    gradient: 'from-emerald-600 to-teal-500',
    description:
      'Maintain your profile and quickly access store operations from one place.',
    idLabel: 'Employee ID',
    idField: 'employeeId',
  },
}

const STUDENT_FACULTY_ACTIONS = [
  { label: 'Browse Stores', to: '/stores', icon: Store },
  { label: 'My Orders', to: '/orders', icon: ClipboardList },
  { label: 'My Cart', to: '/cart', icon: ShoppingCart },
]

const STORE_ACTIONS = [
  { label: 'Dashboard', to: '/store/dashboard', icon: Store },
  { label: 'Manage Orders', to: '/store/orders', icon: ClipboardList },
  { label: 'Store Settings', to: '/store/settings', icon: Settings },
]

const formatOperatingHours = (hours) => {
  if (!hours) return 'Not set'
  if (typeof hours === 'string') return hours
  if (typeof hours === 'object') {
    const open = hours.open || hours.opening_time
    const close = hours.close || hours.closing_time
    if (open || close) return `${open || '--'} to ${close || '--'}`
  }
  return 'Not set'
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', phoneNumber: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/users/profile')
        if (data.success) {
          setProfile(data.data)
          setFormData({
            name: data.data.name || '',
            phoneNumber: data.data.phoneNumber || '',
          })
        }
      } catch {
        if (user) {
          setProfile(user)
          setFormData({
            name: user.name || '',
            phoneNumber: user.phoneNumber || '',
          })
        } else {
          toast.error('Unable to load your profile right now.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const currentUser = profile || user
  const roleMeta = ROLE_META[currentUser?.role] || ROLE_META.student
  const isStudentOrFaculty =
    currentUser?.role === 'student' || currentUser?.role === 'faculty'

  const quickActions = useMemo(
    () => (currentUser?.role === 'store_employee' ? STORE_ACTIONS : STUDENT_FACULTY_ACTIONS),
    [currentUser?.role]
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const nextErrors = {}

    const nameValidation = validateName(formData.name)
    if (!nameValidation.valid) {
      nextErrors.name = nameValidation.error
    }

    const trimmedPhone = formData.phoneNumber.trim()
    if (currentUser?.role === 'store_employee') {
      const phoneValidation = validatePhone(trimmedPhone)
      if (!phoneValidation.valid) {
        nextErrors.phoneNumber = phoneValidation.error
      }
    } else if (trimmedPhone) {
      const phoneValidation = validatePhone(trimmedPhone)
      if (!phoneValidation.valid) {
        nextErrors.phoneNumber = phoneValidation.error
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      const payload = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim() || null,
      }
      const response = await updateProfile(payload)
      if (response.success) {
        setProfile(response.data)
        toast.success('Profile updated successfully.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Profile data is not available.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const RoleIcon = roleMeta.icon
  const storeData = currentUser.store || null
  const roleIdValue = currentUser[roleMeta.idField]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className={`bg-linear-to-r ${roleMeta.gradient} p-6 text-white`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RoleIcon className="h-5 w-5" />
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/20">
                  {roleMeta.label}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">{currentUser.name}</h1>
              <p className="text-white/90 max-w-xl text-sm sm:text-base">
                {roleMeta.description}
              </p>
            </div>
            <div className="rounded-xl bg-white/15 p-4 backdrop-blur-sm min-w-55">
              <p className="text-xs uppercase tracking-wide text-white/80">Member Since</p>
              <p className="font-semibold mt-1 text-sm">
                {currentUser.createdAt ? formatDate(currentUser.createdAt) : 'N/A'}
              </p>
              {isStudentOrFaculty && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    {isChristUniversityEmail(currentUser.email)
                      ? 'Christ University domain verified'
                      : 'Domain check pending'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>
              Update your display name and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!errors.name}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input id="email" value={currentUser.email || ''} disabled readOnly />
                {isStudentOrFaculty && (
                  <p className="text-xs text-muted-foreground">
                    Student and faculty accounts use the
                    <span className="font-medium"> christuniversity.in</span> domain.
                  </p>
                )}
              </div>

              {roleIdValue && (
                <div className="space-y-2">
                  <Label htmlFor="role-id">{roleMeta.idLabel}</Label>
                  <Input id="role-id" value={roleIdValue} disabled readOnly />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number {currentUser.role === 'store_employee' ? '*' : '(Optional)'}
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="10-digit Indian mobile number"
                  error={!!errors.phoneNumber}
                  maxLength={10}
                />
                {errors.phoneNumber && (
                  <p className="text-xs text-destructive">{errors.phoneNumber}</p>
                )}
              </div>

              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Snapshot</CardTitle>
              <CardDescription>Overview based on your account type.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{roleMeta.label}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Email Verified</span>
                <span className="font-medium">
                  {currentUser.isEmailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              {roleIdValue && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{roleMeta.idLabel}</span>
                  <span className="font-medium">{roleIdValue}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {currentUser.role === 'store_employee' && (
            <Card>
              <CardHeader>
                <CardTitle>Store Details</CardTitle>
                <CardDescription>Linked to your owner account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Store Name</span>
                  <span className="font-medium">{storeData?.name || 'Not available'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">UPI ID</span>
                  <span className="font-medium">
                    {storeData?.upi_id || storeData?.upiId || 'Not available'}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">
                    {storeData?.is_active || storeData?.isActive ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Hours</span>
                  <span className="font-medium text-right">
                    {formatOperatingHours(storeData?.operating_hours || storeData?.operatingHours)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump directly to your common tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => {
                const ActionIcon = action.icon
                return (
                  <Button
                    key={action.to}
                    variant="outline"
                    className="w-full justify-between"
                    asChild
                  >
                    <Link to={action.to}>
                      <span className="flex items-center gap-2">
                        <ActionIcon className="h-4 w-4" />
                        {action.label}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
