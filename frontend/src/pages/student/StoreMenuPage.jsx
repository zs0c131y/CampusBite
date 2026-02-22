import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Search,
  ArrowLeft,
  Store,
  UtensilsCrossed,
  Plus,
  Minus,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { useCart } from '@/contexts/CartContext'
import { formatCurrency } from '@/lib/utils'

function MenuItemSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="h-36 bg-muted" />
      <CardContent className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 bg-muted rounded w-16" />
          <div className="h-9 bg-muted rounded w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function StoreMenuPage() {
  const { id: storeId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const cart = useCart()

  const [store, setStore] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [confirmDialog, setConfirmDialog] = useState({ open: false, item: null })

  useEffect(() => {
    fetchStoreData()
  }, [storeId])

  const fetchStoreData = async () => {
    setLoading(true)
    try {
      const [storeRes, menuRes] = await Promise.all([
        api.get(`/stores/${storeId}`),
        api.get(`/stores/${storeId}/menu`),
      ])
      if (storeRes.data.success) {
        setStore(storeRes.data.data?.store || storeRes.data.data || null)
      }
      if (menuRes.data.success) {
        const menuList = Array.isArray(menuRes.data.data)
          ? menuRes.data.data
          : Array.isArray(menuRes.data.data?.menuItems)
            ? menuRes.data.data.menuItems
            : []
        setMenuItems(menuList)
      }
    } catch (error) {
      toast.error('Failed to load store menu. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((item) => item.category).filter(Boolean))
    return ['All', ...Array.from(cats)]
  }, [menuItems])

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesCategory =
        activeCategory === 'All' || item.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [menuItems, searchQuery, activeCategory])

  const getCartQuantity = (itemId) => {
    const cartItem = cart.items.find((i) => i.id === itemId)
    return cartItem ? cartItem.quantity : 0
  }

  const handleAddToCart = (item) => {
    if (!item.isAvailable) return

    // Check if cart has items from a different store
    if (cart.storeId && cart.storeId !== storeId) {
      setConfirmDialog({ open: true, item })
      return
    }

    const storeInfo = { id: storeId, name: store?.name || '' }
    cart.addItem(
      {
        id: item._id || item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: 1,
      },
      storeInfo
    )
    toast.success(`${item.name} added to cart`)
  }

  const handleConfirmClearCart = () => {
    if (!confirmDialog.item) return
    cart.clearCart()
    const storeInfo = { id: storeId, name: store?.name || '' }
    const item = confirmDialog.item
    cart.addItem(
      {
        id: item._id || item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: 1,
      },
      storeInfo
    )
    toast.success(`${item.name} added to cart`)
    setConfirmDialog({ open: false, item: null })
  }

  const handleUpdateQuantity = (item, newQuantity) => {
    const itemId = item._id || item.id
    if (newQuantity <= 0) {
      cart.updateQuantity(itemId, 0)
    } else {
      const existing = cart.items.find((i) => i.id === itemId)
      if (existing) {
        cart.updateQuantity(itemId, newQuantity)
      } else {
        handleAddToCart(item)
      }
    }
  }

  const cartTotal = cart.getTotal()
  const cartItemCount = cart.getItemCount()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          {/* Header Skeleton */}
          <div className="animate-pulse mb-8">
            <div className="h-8 bg-muted rounded w-32 mb-4" />
            <div className="h-48 bg-muted rounded-xl mb-4" />
            <div className="h-6 bg-muted rounded w-1/2 mb-2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Store not found</h2>
          <p className="text-muted-foreground mb-4">
            The store you are looking for does not exist or has been removed.
          </p>
          <Button onClick={() => navigate('/stores')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stores
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => navigate('/stores')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Stores
        </Button>

        {/* Store Header */}
        <div className="mb-6 sm:mb-8">
          {store.imageUrl ? (
            <div className="h-40 sm:h-56 rounded-xl overflow-hidden mb-4">
              <img
                src={store.imageUrl}
                alt={store.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-40 sm:h-56 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mb-4">
              <Store className="h-16 w-16 text-white/80" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {store.name}
          </h1>
          {store.description && (
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {store.description}
            </p>
          )}
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-orange-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UtensilsCrossed className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No items found
            </h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery
                ? `No menu items match "${searchQuery}".`
                : 'This store has no menu items available.'}
            </p>
          </div>
        )}

        {/* Menu Items Grid */}
        {filteredItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredItems.map((item) => {
              const itemId = item._id || item.id
              const quantity = getCartQuantity(itemId)
              const isUnavailable = item.isAvailable === false

              return (
                <Card
                  key={itemId}
                  className={`overflow-hidden transition-opacity ${
                    isUnavailable ? 'opacity-60' : ''
                  }`}
                >
                  {/* Item Image */}
                  {item.imageUrl ? (
                    <div className="h-36 overflow-hidden relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {isUnavailable && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Badge variant="destructive" className="text-xs">
                            Not Available
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-36 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center relative">
                      <UtensilsCrossed className="h-10 w-10 text-orange-300" />
                      {isUnavailable && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Badge variant="destructive" className="text-xs">
                            Not Available
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-0.5">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">
                        {formatCurrency(item.price)}
                      </span>

                      {isUnavailable ? (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Unavailable
                        </Badge>
                      ) : quantity > 0 ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              handleUpdateQuantity(item, quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              handleUpdateQuantity(item, quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => handleAddToCart(item)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart Summary Floating Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-40">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-full p-2">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} |{' '}
                  {formatCurrency(cartTotal)}
                </p>
                <p className="text-xs text-muted-foreground">{cart.storeName}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/cart')}>
              View Cart
              <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Clear Cart Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog({ open: false, item: null })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace cart items?</DialogTitle>
            <DialogDescription>
              Your cart has items from <strong>{cart.storeName}</strong>. Clear
              cart and add this item from <strong>{store?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, item: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmClearCart}>
              Clear Cart & Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
