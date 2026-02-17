import { useState, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Clock,
  ChefHat,
  CheckCircle2,
  PackageCheck,
  XCircle,
  RefreshCcw,
  Eye,
  CreditCard,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { usePolling } from '@/hooks/usePolling'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'placed', label: 'New' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'processing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'picked_up', label: 'Completed' },
]

export default function StoreOrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)

  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState({ open: false, order: null })
  const [transactionId, setTransactionId] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)

  // OTP dialog
  const [otpDialog, setOtpDialog] = useState({ open: false, order: null })
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const otpRefs = useRef([])

  // New orders indicator
  const prevPlacedCountRef = useRef(0)
  const [hasNewOrders, setHasNewOrders] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders')
      const allOrders = res.data.data.orders || res.data.data || []
      const orderList = Array.isArray(allOrders) ? allOrders : []

      // Check for new orders
      const placedCount = orderList.filter((o) => o.status === 'placed').length
      if (prevPlacedCountRef.current > 0 && placedCount > prevPlacedCountRef.current) {
        setHasNewOrders(true)
        toast.info('New order received!', { duration: 5000 })
      }
      prevPlacedCountRef.current = placedCount

      setOrders(orderList)
      setLoading(false)
    } catch (err) {
      if (loading) {
        toast.error(err.response?.data?.message || 'Failed to load orders.')
        setLoading(false)
      }
    }
  }, [loading])

  // Poll every 10 seconds
  usePolling(fetchOrders, 10000)

  // Filter orders by active tab
  const filteredOrders =
    activeTab === 'all'
      ? orders
      : orders.filter((o) => o.status === activeTab)

  // Sort by most recent first
  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  // Status update handler
  const handleStatusUpdate = async (orderId, newStatus) => {
    setActionLoading(orderId)
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus })
      toast.success(`Order status updated to ${newStatus}.`)
      const res = await api.get('/orders')
      const allOrders = res.data.data.orders || res.data.data || []
      setOrders(Array.isArray(allOrders) ? allOrders : [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status.')
    } finally {
      setActionLoading(null)
    }
  }

  // Payment confirmation
  const handlePaymentConfirm = async (status) => {
    if (!paymentDialog.order) return
    setPaymentLoading(true)
    try {
      await api.patch(`/orders/${paymentDialog.order.id}/payment-status`, {
        paymentStatus: status,
        transactionId: transactionId || undefined,
      })
      toast.success(
        status === 'success'
          ? 'Payment confirmed successfully.'
          : 'Payment marked as failed.'
      )
      setPaymentDialog({ open: false, order: null })
      setTransactionId('')
      const res = await api.get('/orders')
      const allOrders = res.data.data.orders || res.data.data || []
      setOrders(Array.isArray(allOrders) ? allOrders : [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment status.')
    } finally {
      setPaymentLoading(false)
    }
  }

  // OTP handling
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }
    if (value && !/^\d$/.test(value)) return

    const newDigits = [...otpDigits]
    newDigits[index] = value
    setOtpDigits(newDigits)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const newDigits = [...otpDigits]
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || ''
      }
      setOtpDigits(newDigits)
      const focusIdx = Math.min(pasted.length, 5)
      otpRefs.current[focusIdx]?.focus()
    }
  }

  const handleOtpVerify = async () => {
    if (!otpDialog.order) return
    const otp = otpDigits.join('')
    if (otp.length !== 6) {
      toast.error('Please enter all 6 digits of the OTP.')
      return
    }

    setOtpLoading(true)
    try {
      await api.post(`/orders/${otpDialog.order.id}/verify-otp`, { otp })
      toast.success('OTP verified! Order completed successfully.')
      setOtpDialog({ open: false, order: null })
      setOtpDigits(['', '', '', '', '', ''])
      const res = await api.get('/orders')
      const allOrders = res.data.data.orders || res.data.data || []
      setOrders(Array.isArray(allOrders) ? allOrders : [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed.')
    } finally {
      setOtpLoading(false)
    }
  }

  // Render action buttons based on status
  const renderActions = (order) => {
    const isLoading = actionLoading === order.id
    const isPaid = order.payment_status === 'success'

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {order.payment_status === 'pending' && (
          <Button
            size="sm"
            variant="warning"
            onClick={() => setPaymentDialog({ open: true, order })}
            disabled={isLoading}
            className="gap-1.5"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Confirm Payment
          </Button>
        )}

        {order.status === 'placed' && isPaid && (
          <Button
            size="sm"
            onClick={() => handleStatusUpdate(order.id, 'accepted')}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? <Spinner size="sm" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Accept Order
          </Button>
        )}

        {order.status === 'accepted' && (
          <Button
            size="sm"
            onClick={() => handleStatusUpdate(order.id, 'processing')}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? <Spinner size="sm" /> : <ChefHat className="h-3.5 w-3.5" />}
            Start Preparing
          </Button>
        )}

        {order.status === 'processing' && (
          <Button
            size="sm"
            variant="success"
            onClick={() => handleStatusUpdate(order.id, 'ready')}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? <Spinner size="sm" /> : <PackageCheck className="h-3.5 w-3.5" />}
            Mark Ready
          </Button>
        )}

        {order.status === 'ready' && (
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              setOtpDigits(['', '', '', '', '', ''])
              setOtpDialog({ open: true, order })
            }}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? <Spinner size="sm" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Verify OTP & Complete
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/store/orders/${order.id}`)}
          className="gap-1.5"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-muted-foreground text-sm">Loading orders...</p>
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
            <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {orders.length} total order{orders.length !== 1 ? 's' : ''}
              {hasNewOrders && (
                <span className="ml-2 inline-flex items-center gap-1 text-orange-600 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                  </span>
                  New orders!
                </span>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setHasNewOrders(false)
            fetchOrders()
          }}
          className="gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v)
          setHasNewOrders(false)
        }}
      >
        <TabsList className="w-full flex overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.value === 'all'
                ? orders.length
                : orders.filter((o) => o.status === tab.value).length
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex-1 gap-1.5">
                {tab.label}
                {count > 0 && (
                  <span className="ml-1 rounded-full bg-muted-foreground/10 px-1.5 py-0.5 text-xs">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {sortedOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    No {tab.value === 'all' ? '' : tab.label.toLowerCase() + ' '}orders found
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sortedOrders.map((order) => {
                  const items = order.items || []
                  return (
                    <Card key={order.id} className="overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        {/* Header row */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-base">
                                #{order.order_number || order.id?.slice(0, 8)}
                              </span>
                              <StatusBadge status={order.status} />
                              <StatusBadge status={order.payment_status} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {formatCurrency(order.total_amount || 0)}
                            </p>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        {/* Customer name */}
                        <p className="text-sm">
                          <span className="text-muted-foreground">Customer: </span>
                          <span className="font-medium">
                            {order.customer_name || order.user_name || 'N/A'}
                          </span>
                        </p>

                        {/* Items list */}
                        {items.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>
                                  {item.quantity}x {item.name || item.menu_item_name}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatCurrency(
                                    (item.price_at_order || item.price) * item.quantity
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Special instructions */}
                        {order.special_instructions && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-xs font-medium text-yellow-800">
                              Special Instructions:
                            </p>
                            <p className="text-sm text-yellow-700">
                              {order.special_instructions}
                            </p>
                          </div>
                        )}

                        {/* OTP Display when ready */}
                        {order.status === 'ready' && order.pickup_otp && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md text-center">
                            <p className="text-xs font-medium text-green-800 mb-1">
                              Pickup OTP
                            </p>
                            <p className="text-2xl font-mono font-bold tracking-[0.3em] text-green-700">
                              {order.pickup_otp}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Ask customer to show this OTP to verify pickup
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        {order.status !== 'picked_up' &&
                          order.status !== 'cancelled' &&
                          renderActions(order)}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Payment Confirmation Dialog */}
      <Dialog
        open={paymentDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentDialog({ open: false, order: null })
            setTransactionId('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Order #{paymentDialog.order?.order_number || paymentDialog.order?.id?.slice(0, 8)}
              {' - '}
              {formatCurrency(paymentDialog.order?.total_amount || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm">Has the customer completed the UPI payment?</p>
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID (optional)</Label>
              <Input
                id="transactionId"
                placeholder="Enter UPI transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => handlePaymentConfirm('failed')}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <Spinner size="sm" />
              ) : (
                <XCircle className="h-4 w-4 mr-1.5" />
              )}
              Mark Failed
            </Button>
            <Button
              onClick={() => handlePaymentConfirm('success')}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <Spinner size="sm" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
              )}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog
        open={otpDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setOtpDialog({ open: false, order: null })
            setOtpDigits(['', '', '', '', '', ''])
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Pickup OTP</DialogTitle>
            <DialogDescription>
              Order #{otpDialog.order?.order_number || otpDialog.order?.id?.slice(0, 8)}
              {' - '}
              Ask the customer for their 6-digit pickup code.
            </DialogDescription>
          </DialogHeader>

          {/* Show the store's OTP for comparison */}
          {otpDialog.order?.pickup_otp && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-center">
              <p className="text-xs font-medium text-blue-800 mb-1">
                Expected OTP (shown to customer)
              </p>
              <p className="text-2xl font-mono font-bold tracking-[0.3em] text-blue-700">
                {otpDialog.order.pickup_otp}
              </p>
            </div>
          )}

          <div className="space-y-4 py-2">
            <Label>Enter Customer's OTP</Label>
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <Input
                  key={idx}
                  ref={(el) => {
                    otpRefs.current[idx] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-xl font-bold"
                  autoFocus={idx === 0}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleOtpVerify}
              disabled={otpLoading || otpDigits.join('').length !== 6}
              className="w-full gap-2"
            >
              {otpLoading ? (
                <Spinner size="sm" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Verify & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
