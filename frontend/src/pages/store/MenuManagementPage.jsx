import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ImageIcon,
  ArrowLeft,
  UtensilsCrossed,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  category: '',
  is_available: true,
  image: null,
}

export default function MenuManagementPage() {
  const { user } = useAuth()

  const [menuItems, setMenuItems] = useState([])
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Form dialog
  const [formDialog, setFormDialog] = useState({ open: false, editing: null })
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [imagePreview, setImagePreview] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null })
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Toggle loading
  const [toggleLoading, setToggleLoading] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)

      // Find user's store
      const storesRes = await api.get('/stores')
      const stores = storesRes.data.data.stores || []
      const myStore = stores.find(
        (s) => s.owner_id === user?.id || s.owner_name === user?.name
      )

      if (myStore) {
        setStore(myStore)
        const menuRes = await api.get(`/stores/${myStore.id}/menu`)
        setMenuItems(menuRes.data.data.menuItems || [])
      } else {
        toast.error('Store not found. Please contact support.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load menu items.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  // Categories from existing items
  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((item) => item.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [menuItems])

  // Filtered items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !categoryFilter || item.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [menuItems, searchQuery, categoryFilter])

  // Open form for add
  const handleOpenAdd = () => {
    setFormData(EMPTY_FORM)
    setImagePreview(null)
    setFormErrors({})
    setFormDialog({ open: true, editing: null })
  }

  // Open form for edit
  const handleOpenEdit = (item) => {
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      category: item.category || '',
      is_available: item.is_available ?? true,
      image: null,
    })
    setImagePreview(item.image_url || null)
    setFormErrors({})
    setFormDialog({ open: true, editing: item })
  }

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB.')
        return
      }
      setFormData((prev) => ({ ...prev, image: file }))
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required.'
    if (!formData.price || Number(formData.price) < 1)
      errors.price = 'Price must be at least 1.'
    if (isNaN(Number(formData.price))) errors.price = 'Price must be a number.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Save (add or edit)
  const handleSave = async () => {
    if (!validateForm()) return

    setFormLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', formData.name.trim())
      fd.append('description', formData.description.trim())
      fd.append('price', formData.price)
      fd.append('category', formData.category.trim())
      fd.append('is_available', formData.is_available)
      if (formData.image) {
        fd.append('image', formData.image)
      }

      if (formDialog.editing) {
        await api.put(`/menu/${formDialog.editing.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Menu item updated successfully.')
      } else {
        await api.post('/menu', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Menu item added successfully.')
      }

      setFormDialog({ open: false, editing: null })
      setFormData(EMPTY_FORM)
      setImagePreview(null)
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save menu item.')
    } finally {
      setFormLoading(false)
    }
  }

  // Delete
  const handleDelete = async () => {
    if (!deleteDialog.item) return
    setDeleteLoading(true)
    try {
      await api.delete(`/menu/${deleteDialog.item.id}`)
      toast.success('Menu item deleted successfully.')
      setDeleteDialog({ open: false, item: null })
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete menu item.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Toggle availability
  const handleToggleAvailability = async (item) => {
    setToggleLoading(item.id)
    try {
      await api.patch(`/menu/${item.id}/availability`)
      toast.success(
        `${item.name} is now ${item.is_available ? 'unavailable' : 'available'}.`
      )
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle availability.')
    } finally {
      setToggleLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-muted-foreground text-sm">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/store/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Menu Management</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {menuItems.length} item{menuItems.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Item
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Menu Items */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {searchQuery || categoryFilter
                ? 'No items match your search.'
                : 'No menu items yet. Add your first item!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Image */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">
                            {item.name}
                          </h3>
                          {item.category && (
                            <span className="text-xs text-muted-foreground">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-sm whitespace-nowrap">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_available}
                          onCheckedChange={() => handleToggleAvailability(item)}
                          disabled={toggleLoading === item.id}
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteDialog({ open: true, item })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={formDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setFormDialog({ open: false, editing: null })
            setFormData(EMPTY_FORM)
            setImagePreview(null)
            setFormErrors({})
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formDialog.editing ? 'Edit Menu Item' : 'Add New Menu Item'}
            </DialogTitle>
            <DialogDescription>
              {formDialog.editing
                ? 'Update the details of this menu item.'
                : 'Fill in the details to add a new item to your menu.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="item-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item-name"
                placeholder="e.g. Chicken Biryani"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                error={!!formErrors.name}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                placeholder="Brief description of the item..."
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

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="item-price">
                Price (INR) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item-price"
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g. 120"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
                error={!!formErrors.price}
              />
              {formErrors.price && (
                <p className="text-xs text-destructive">{formErrors.price}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="item-category">Category</Label>
              <Input
                id="item-category"
                placeholder="e.g. Main Course, Beverages, Snacks"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                list="category-suggestions"
              />
              {categories.length > 0 && (
                <datalist id="category-suggestions">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              )}
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-md border border-dashed flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
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
                    Max 5MB. JPG, PNG, or WebP.
                  </p>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between">
              <Label htmlFor="item-available">Available for ordering</Label>
              <Switch
                id="item-available"
                checked={formData.is_available}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_available: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFormDialog({ open: false, editing: null })
                setFormData(EMPTY_FORM)
                setImagePreview(null)
                setFormErrors({})
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={formLoading} className="gap-2">
              {formLoading && <Spinner size="sm" />}
              {formDialog.editing ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, item: null })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteDialog.item?.name}&rdquo;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, item: null })}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="gap-2"
            >
              {deleteLoading && <Spinner size="sm" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
