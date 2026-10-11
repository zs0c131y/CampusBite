import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Store, Clock, ArrowRight, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/media'

function StoreCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="h-40 bg-muted" />
      <CardContent className="p-4 space-y-3">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="space-y-1.5">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
        <div className="h-9 bg-muted rounded w-full" />
      </CardContent>
    </Card>
  )
}

const formatOperatingHours = (hours) => {
  if (!hours) return ''
  if (typeof hours === 'string') return hours
  if (typeof hours === 'object') {
    const open = hours.open || hours.opening_time
    const close = hours.close || hours.closing_time
    if (open || close) return `${open || '--'} to ${close || '--'}`
  }
  return ''
}

export default function StoresPage() {
  const { user } = useAuth()

  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeOrders, setActiveOrders] = useState([])
  const restrictionUntil = user?.orderingRestrictedUntil
    ? new Date(user.orderingRestrictedUntil)
    : null
  const isRestricted = Boolean(restrictionUntil && restrictionUntil > new Date())

  useEffect(() => {
    fetchStores()
    fetchActiveOrders()
  }, [])

  const fetchStores = async () => {
    try {
      const { data } = await api.get('/stores')
      if (data.success) {
        const storesList = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.data?.stores)
            ? data.data.stores
            : []
        setStores(storesList)
      }
    } catch {
      toast.error('Failed to load stores. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveOrders = async () => {
    try {
      const { data } = await api.get('/orders', {
        params: { status: 'placed,accepted,processing,ready' },
      })
      if (data.success) {
        setActiveOrders(data.data || [])
      }
    } catch {
      // Silently fail for active orders widget
    }
  }

  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {(isRestricted || user?.trustTier === 'watch') && (
          <div
            className={`mb-4 rounded-xl border px-3.5 py-3 text-sm ${
              isRestricted
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <p className="font-semibold">
              {isRestricted ? 'Ordering temporarily restricted' : 'Reliability policy active'}
            </p>
            <p className="mt-1 text-xs opacity-90">
              {isRestricted
                ? `You can place orders again after ${formatDate(restrictionUntil)}.`
                : `No-show count: ${user?.noShowCount || 0}. Confirm on-the-way quickly to avoid restrictions.`}
            </p>
          </div>
        )}

        {/* Active Orders Banner */}
        {activeOrders.length > 0 && (
          <div className="mb-6 rounded-2xl border bg-secondary p-3.5 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <ShoppingBag className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm sm:text-base text-orange-800 font-medium">
                You have {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Link
              to="/orders"
              className="text-sm font-semibold text-primary hover:text-primary flex items-center gap-1 shrink-0"
            >
              View
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Page Header */}
        <div className="page-heading">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow mb-3 text-primary">Campus outlets</p>
              <h1>
                Browse food outlets
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Browse menus and place an order from your preferred campus outlet.
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stores..."
                aria-label="Search campus stores"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <StoreCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredStores.length === 0 && (
          <div className="text-center py-16 sm:py-24">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              {searchQuery ? (
                <Search className="h-7 w-7 text-muted-foreground" />
              ) : (
                <Store className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {searchQuery ? 'No stores found' : 'No stores available'}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {searchQuery
                ? `No stores match "${searchQuery}". Try a different search term.`
                : 'There are no food outlets available at the moment. Please check back later.'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            )}
          </div>
        )}

        {/* Stores Grid */}
        {!loading && <div className="mb-5 flex items-center justify-between"><h2 className="font-sans text-base font-semibold">All outlets</h2><span className="text-xs text-muted-foreground">{filteredStores.length} outlet{filteredStores.length !== 1 ? 's' : ''}</span></div>}
        {!loading && filteredStores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredStores.map((store) => {
              const operatingHoursLabel = formatOperatingHours(
                store.operatingHours || store.operating_hours
              )
              const storeImage = resolveMediaUrl(store.imageUrl || store.image_url || '')

              return (
                <Link
                  key={store._id || store.id}
                  to={`/stores/${store._id || store.id}`}
                  className="group block overflow-hidden rounded-2xl border bg-card transition-colors hover:border-foreground/40"
                >
                  {/* Store Image */}
                  {storeImage ? (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={storeImage}
                        alt={store.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="store-placeholder aspect-[16/10] flex flex-col items-center justify-center gap-3">
                      <Store className="h-12 w-12" /><span className="eyebrow">{store.name}</span>
                    </div>
                  )}

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                      {store.name}
                    </h3>

                    {store.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {store.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 border-t pt-4 mt-4">
                      {operatingHoursLabel && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          <Clock className="h-3 w-3 mr-1" />
                          {operatingHoursLabel}
                        </Badge>
                      )}

                      <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Explore menu
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </span>
                    </div>
                  </CardContent>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
