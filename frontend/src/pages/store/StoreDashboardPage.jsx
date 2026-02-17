import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Clock,
  ShoppingBag,
  IndianRupee,
  UtensilsCrossed,
  Eye,
  ClipboardList,
  Settings,
  AlertCircle,
  Store,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function StoreDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [store, setStore] = useState(null)
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch stores to find the one owned by current user
        const storesRes = await api.get('/stores')
        const stores = storesRes.data.data.stores || []
        const myStore = stores.find(
          (s) => s.owner_id === user?.id || s.owner_name === user?.name
        )

        if (myStore) {
          setStore(myStore)

          // Fetch menu items for this store
          const menuRes = await api.get(`/stores/${myStore.id}/menu`)
          setMenuItems(menuRes.data.data.menuItems || [])
        }

        // Fetch orders (backend scopes to store employee's store)
        const ordersRes = await api.get('/orders')
        const allOrders = ordersRes.data.data.orders || ordersRes.data.data || []
        setOrders(Array.isArray(allOrders) ? allOrders : [])
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load dashboard data.'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  // Derive stats
  const today = new Date().toDateString()
  const todaysOrders = orders.filter(
    (o) => new Date(o.created_at).toDateString() === today
  )
  const pendingOrders = orders.filter(
    (o) => o.status === 'placed' || o.status === 'accepted'
  )
  const todaysRevenue = todaysOrders
    .filter((o) => o.payment_status === 'success')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  const activeMenuItems = menuItems.filter((item) => item.is_available)

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
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
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Store className="h-4 w-4" />
            {store?.name || 'Your Store'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Orders */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Orders
                </p>
                <p className="text-3xl font-bold mt-1">{pendingOrders.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Orders */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Today's Orders
                </p>
                <p className="text-3xl font-bold mt-1">{todaysOrders.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Revenue */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Today's Revenue
                </p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(todaysRevenue)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Menu Items */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Menu Items
                </p>
                <p className="text-3xl font-bold mt-1">{activeMenuItems.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <UtensilsCrossed className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/store/orders">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ShoppingBag className="h-10 w-10 mb-2 opacity-50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const itemCount = order.items
                    ? order.items.length
                    : order.item_count || 0

                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            #{order.order_number || order.id?.slice(0, 8)}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{order.customer_name || 'Customer'}</span>
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatCurrency(order.total_amount || 0)}
                          </p>
                          {itemCount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {itemCount} item{itemCount !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/store/orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-3" asChild>
              <Link to="/store/orders">
                <ClipboardList className="h-5 w-5" />
                Manage Orders
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              asChild
            >
              <Link to="/store/menu">
                <UtensilsCrossed className="h-5 w-5" />
                Manage Menu
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              asChild
            >
              <Link to="/store/settings">
                <Settings className="h-5 w-5" />
                Store Settings
              </Link>
            </Button>

            <Separator className="my-4" />

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium">Store Status:</span>{' '}
                {store?.is_active ? (
                  <span className="text-green-600">Open</span>
                ) : (
                  <span className="text-red-600">Closed</span>
                )}
              </p>
              {store?.upi_id && (
                <p>
                  <span className="font-medium">UPI:</span> {store.upi_id}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
