import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Package,
  Clock,
  ShoppingBag,
  ArrowRight,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import api from '@/lib/api'
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'

const ACTIVE_STATUSES = ['placed', 'accepted', 'processing', 'ready']
const COMPLETED_STATUSES = ['picked_up', 'cancelled']
const PAGE_SIZE = 10

function OrderCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-5 bg-muted rounded w-20" />
        </div>
        <div className="h-3 bg-muted rounded w-32" />
        <div className="h-3 bg-muted rounded w-48" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-9 bg-muted rounded w-28" />
        </div>
      </CardContent>
    </Card>
  )
}

function OrderCard({ order }) {
  const navigate = useNavigate()
  const orderId = order._id || order.id
  const orderStatus = order.orderStatus || order.status
  const isActive = ACTIVE_STATUSES.includes(orderStatus)

  const itemsSummary = (order.items || [])
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(', ')

  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-24px_rgba(32,23,15,0.6)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-foreground text-sm">
              Order #{order.orderNumber || orderId}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(order.createdAt || order.created_at)}
            </p>
          </div>
          <Badge className={getStatusColor(orderStatus)}>
            {getStatusLabel(orderStatus)}
          </Badge>
        </div>

        {order.storeName && (
          <p className="text-sm text-muted-foreground mb-1">
            From <span className="font-medium text-foreground">{order.storeName}</span>
          </p>
        )}

        {itemsSummary && (
          <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
            {itemsSummary}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="font-semibold text-foreground">
            {formatCurrency(order.totalAmount || order.total_amount)}
          </span>

          {isActive ? (
            <Button
              size="sm"
              onClick={() => navigate(`/orders/${orderId}`)}
            >
              Track Order
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/orders/${orderId}`)}
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ tab }) {
  const messages = {
    all: {
      icon: ShoppingBag,
      title: 'No orders yet',
      description:
        "You haven't placed any orders yet. Browse campus stores to get started.",
    },
    active: {
      icon: Clock,
      title: 'No active orders',
      description: 'You have no orders in progress right now.',
    },
    completed: {
      icon: Package,
      title: 'No completed orders',
      description: "You don't have any completed or cancelled orders.",
    },
  }

  const msg = messages[tab] || messages.all
  const Icon = msg.icon

  return (
    <div className="text-center py-16">
      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{msg.title}</h3>
      <p className="text-muted-foreground text-sm max-w-xs mx-auto">
        {msg.description}
      </p>
      {tab === 'all' && (
        <Button className="mt-4" asChild>
          <Link to="/stores">Browse Stores</Link>
        </Button>
      )}
    </div>
  )
}

export default function OrderHistoryPage() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('all')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchOrders = useCallback(
    async (pageNum = 1, append = false) => {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = { page: pageNum, limit: PAGE_SIZE }

        if (activeTab === 'active') {
          params.status = ACTIVE_STATUSES.join(',')
        } else if (activeTab === 'completed') {
          params.status = COMPLETED_STATUSES.join(',')
        }

        const { data } = await api.get('/orders', { params })
        if (data.success) {
          const fetched = data.data || []
          if (append) {
            setOrders((prev) => [...prev, ...fetched])
          } else {
            setOrders(fetched)
          }
          // Determine if there are more orders
          const total = data.pagination?.total || data.total
          if (total !== undefined) {
            setHasMore(pageNum * PAGE_SIZE < total)
          } else {
            setHasMore(fetched.length === PAGE_SIZE)
          }
        }
      } catch (error) {
        toast.error('Failed to load orders.')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [activeTab]
  )

  useEffect(() => {
    setPage(1)
    fetchOrders(1, false)
  }, [activeTab, fetchOrders])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchOrders(nextPage, true)
  }

  // Sort by most recent
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_at)
    const dateB = new Date(b.createdAt || b.created_at)
    return dateB - dateA
  })

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 rounded-2xl border border-border/80 bg-card/90 p-5 shadow-[0_16px_30px_-24px_rgba(32,23,15,0.66)] backdrop-blur-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            My Orders
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track active orders and review completed purchases.
          </p>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 rounded-xl border border-border/80 bg-card/80 p-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <OrderList
              orders={sortedOrders}
              loading={loading}
              tab="all"
            />
          </TabsContent>

          <TabsContent value="active">
            <OrderList
              orders={sortedOrders}
              loading={loading}
              tab="active"
            />
          </TabsContent>

          <TabsContent value="completed">
            <OrderList
              orders={sortedOrders}
              loading={loading}
              tab="completed"
            />
          </TabsContent>
        </Tabs>

        {/* Load More */}
        {!loading && hasMore && (
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Loading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4" />
                  Load More
                </span>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function OrderList({ orders, loading, tab }) {
  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return <EmptyState tab={tab} />
  }

  return (
    <div className="space-y-3 mt-4">
      {orders.map((order) => (
        <OrderCard key={order._id || order.id} order={order} />
      ))}
    </div>
  )
}
