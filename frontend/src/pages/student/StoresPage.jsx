import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Store, Clock, ArrowRight, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'

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
  const navigate = useNavigate()
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
    } catch (error) {
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
          <div className="mb-6 rounded-2xl border border-orange-200/80 bg-linear-to-r from-orange-50 to-amber-50 p-3.5 shadow-sm sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <ShoppingBag className="h-5 w-5 text-orange-600 shrink-0" />
              <span className="text-sm sm:text-base text-orange-800 font-medium">
                You have {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Link
              to="/orders"
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 shrink-0"
            >
              View
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-6 sm:mb-8 rounded-2xl border border-border/80 bg-card/85 p-5 shadow-[0_16px_30px_-24px_rgba(32,23,15,0.7)] backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Campus Food Outlets
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Browse and order from your favorite campus stores
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stores..."
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
        {!loading && filteredStores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredStores.map((store) => {
              const operatingHoursLabel = formatOperatingHours(
                store.operatingHours || store.operating_hours
              )

              return (
                <Card
                  key={store._id || store.id}
                  className="overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_34px_-24px_rgba(32,23,15,0.65)]"
                  onClick={() => navigate(`/stores/${store._id || store.id}`)}
                >
                  {/* Store Image */}
                  {store.imageUrl ? (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={store.imageUrl}
                        alt={store.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                      <Store className="h-12 w-12 text-white/80" />
                    </div>
                  )}

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-orange-600 transition-colors">
                      {store.name}
                    </h3>

                    {store.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {store.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      {operatingHoursLabel && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          <Clock className="h-3 w-3 mr-1" />
                          {operatingHoursLabel}
                        </Badge>
                      )}

                      <Button
                        size="sm"
                        className="ml-auto"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/stores/${store._id || store.id}`)
                        }}
                      >
                        View Menu
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
