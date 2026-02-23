import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Store,
  ImageIcon,
  QrCode,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { DesktopHint } from '@/components/shared/DesktopHint'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { validateUpiId } from '@/lib/validators'
import { resolveMediaUrl } from '@/lib/media'

export default function StoreSettingsPage() {
  const { user } = useAuth()

  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    upi_id: '',
    opening_time: '',
    closing_time: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [qrFile, setQrFile] = useState(null)
  const [qrPreview, setQrPreview] = useState(null)

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true)
        setError(null)

        const storesRes = await api.get('/stores')
        const stores = storesRes.data.data.stores || []
        const myStore = stores.find(
          (s) => s.owner_id === user?.id || s.owner_name === user?.name
        )

        if (myStore) {
          const storeId = myStore.id || myStore._id
          // Fetch full store details
          const storeRes = await api.get(`/stores/${storeId}`)
          const storeData = storeRes.data.data.store || myStore
          setStore(storeData)

          // Parse operating hours
          let openTime = ''
          let closeTime = ''
          if (storeData.operating_hours) {
            const hours =
              typeof storeData.operating_hours === 'string'
                ? JSON.parse(storeData.operating_hours)
                : storeData.operating_hours
            openTime = hours.open || hours.opening_time || ''
            closeTime = hours.close || hours.closing_time || ''
          }

          setFormData({
            name: storeData.name || '',
            description: storeData.description || '',
            upi_id: storeData.upi_id || '',
            opening_time: openTime,
            closing_time: closeTime,
          })
          setImagePreview(resolveMediaUrl(storeData.image_url || storeData.imageUrl || ''))
          setQrPreview(resolveMediaUrl(storeData.qr_code_url || storeData.qrCodeUrl || ''))
        } else {
          setError('Store not found. Please contact support.')
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load store settings.')
      } finally {
        setLoading(false)
      }
    }

    fetchStore()
  }, [user])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB.')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleQrChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('QR image size must be less than 5MB.')
        return
      }
      setQrFile(file)
      setQrPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()

    if (!store) return

    if (!formData.name.trim()) {
      toast.error('Store name is required.')
      return
    }

    const normalizedUpiId = formData.upi_id.trim().toLowerCase()
    const upiValidation = validateUpiId(normalizedUpiId)
    if (!upiValidation.valid) {
      toast.error(upiValidation.error)
      return
    }

    setSaving(true)
    try {
      const operatingHours = {
        open: formData.opening_time,
        close: formData.closing_time,
      }

      if (imageFile || qrFile) {
        const fd = new FormData()
        fd.append('name', formData.name.trim())
        fd.append('description', formData.description.trim())
        fd.append('upi_id', normalizedUpiId)
        fd.append('operating_hours', JSON.stringify(operatingHours))
        if (imageFile) {
          fd.append('image', imageFile)
        }
        if (qrFile) {
          fd.append('qr_code', qrFile)
        }

        const res = await api.put(`/stores/${store.id || store._id}`, fd)
        const updatedStore = res.data.data.store
        setStore(updatedStore)
        setImagePreview(resolveMediaUrl(updatedStore.image_url || updatedStore.imageUrl || ''))
        setQrPreview(resolveMediaUrl(updatedStore.qr_code_url || updatedStore.qrCodeUrl || ''))
        setImageFile(null)
        setQrFile(null)
        toast.success('Store settings saved successfully.')
        return
      }

      // JSON update (without image)
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        upi_id: normalizedUpiId,
        operating_hours: operatingHours,
      }

      const res = await api.put(`/stores/${store.id || store._id}`, payload)
      const updatedStore = res.data.data.store
      setStore(updatedStore)
      setImagePreview(resolveMediaUrl(updatedStore.image_url || updatedStore.imageUrl || ''))
      setQrPreview(resolveMediaUrl(updatedStore.qr_code_url || updatedStore.qrCodeUrl || ''))
      toast.success('Store settings saved successfully.')
      setImageFile(null)
      setQrFile(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save store settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-muted-foreground text-sm">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-center text-muted-foreground">{error}</p>
            <Button asChild>
              <Link to="/store/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <DesktopHint />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/store/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your store information and preferences
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Store Name */}
            <div className="space-y-2">
              <Label htmlFor="store-name">
                Store Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store-name"
                placeholder="Your store name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="store-desc">Description</Label>
              <Textarea
                id="store-desc"
                placeholder="Brief description of your store..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* UPI ID */}
            <div className="space-y-2">
              <Label htmlFor="store-upi">UPI ID</Label>
              <Input
                id="store-upi"
                placeholder="yourname@upi"
                value={formData.upi_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, upi_id: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Format: yourname@upi (e.g., store@paytm, 9876543210@ybl)
              </p>
            </div>

            <Separator />

            {/* Operating Hours */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Operating Hours</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opening-time">Opening Time</Label>
                  <Input
                    id="opening-time"
                    type="time"
                    value={formData.opening_time}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        opening_time: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing-time">Closing Time</Label>
                  <Input
                    id="closing-time"
                    type="time"
                    value={formData.closing_time}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        closing_time: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Store Image */}
            <div className="space-y-3">
              <Label>Store Image</Label>
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Store"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border border-dashed flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 5MB. JPG, PNG, or WebP recommended.
                  </p>
                </div>
              </div>
            </div>

            {/* Store QR Code */}
            <div className="space-y-3">
              <Label>Store UPI QR Code</Label>
              <div className="flex items-start gap-4">
                {qrPreview ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border bg-white">
                    <img
                      src={qrPreview}
                      alt="Store QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border border-dashed flex items-center justify-center">
                    <QrCode className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleQrChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional. Shown to students on checkout. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2 min-w-[120px]">
                {saving ? (
                  <Spinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
