import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  ChefHat,
  Bell,
  ShoppingBag,
  XCircle,
  AlertTriangle,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { usePolling } from '@/hooks/usePolling'
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'

const ORDER_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: ShoppingBag },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle2 },
  { key: 'processing', label: 'Preparing', icon: ChefHat },
  { key: 'ready', label: 'Ready for Pickup', icon: Bell },
  { key: 'picked_up', label: 'Picked Up', icon: Package },
]

function OrderTimeline({ currentStatus }) {
  const stepIndex = ORDER_STEPS.findIndex((s) => s.key === currentStatus)
  const isCancelled = currentStatus === 'cancelled'

  return (
    <div className="relative">
      {ORDER_STEPS.map((step, idx) => {
        const isCompleted = !isCancelled && idx <= stepIndex
        const isCurrent = !isCancelled && idx === stepIndex
        const StepIcon = step.icon

        return (
          <div key={step.key} className="flex items-start gap-3 relative">
            {/* Vertical line */}
            {idx < ORDER_STEPS.length - 1 && (
              <div
                className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-8px)] ${
                  isCompleted && idx < stepIndex
                    ? 'bg-green-500'
                    : 'bg-muted'
                }`}
              />
            )}

            {/* Icon */}
            <div
              className={`shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center z-10 ${
                isCurrent
                  ? 'bg-orange-600 text-white ring-4 ring-orange-100'
                  : isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isCompleted && !isCurrent ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <StepIcon className="h-4 w-4" />
              )}
            </div>

            {/* Label */}
            <div className={`pb-8 ${idx === ORDER_STEPS.length - 1 ? 'pb-0' : ''}`}>
              <p
                className={`text-sm font-medium ${
                  isCurrent
                    ? 'text-orange-600'
                    : isCompleted
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </p>
              {isCurrent && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current status
                </p>
              )}
            </div>
          </div>
        )
      })}

      {/* Cancelled state */}
      {isCancelled && (
        <div className="flex items-start gap-3 mt-2">
          <div className="shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center bg-red-500 text-white ring-4 ring-red-100">
            <XCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-600">Cancelled</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              This order has been cancelled
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function OtpDisplay({ otp, expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('')
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!expiresAt) return

    const updateTimer = () => {
      const now = new Date()
      const expiry = new Date(expiresAt)
      const diff = Math.max(0, Math.floor((expiry - now) / 1000))

      if (diff <= 0) {
        setTimeLeft('Expired')
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }

      const minutes = Math.floor(diff / 60)
      const seconds = diff % 60
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    intervalRef.current = setInterval(updateTimer, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [expiresAt])

  if (!otp) return null

  const digits = otp.toString().split('')

  return (
    <Card className="border-2 border-orange-200 bg-orange-50/50">
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Bell className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-orange-800">Pickup OTP</h3>
        </div>

        {/* OTP Digits */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
          {digits.map((digit, idx) => (
            <div
              key={idx}
              className="w-10 h-12 sm:w-12 sm:h-14 rounded-lg bg-white border-2 border-orange-300 flex items-center justify-center text-xl sm:text-2xl font-bold text-orange-700 shadow-sm"
            >
              {digit}
            </div>
          ))}
        </div>

        <p className="text-sm text-orange-700 mb-2">
          Show this OTP to the store to collect your order
        </p>

        {/* Timer */}
        {expiresAt && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {timeLeft === 'Expired' ? 'OTP expired' : `Expires in ${timeLeft}`}
            </span>
          </div>
        )}

        {/* Copy OTP */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-xs"
          onClick={() => {
            navigator.clipboard
              .writeText(otp.toString())
              .then(() => toast.success('OTP copied!'))
              .catch(() => toast.error('Failed to copy'))
          }}
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy OTP
        </Button>
      </CardContent>
    </Card>
  )
}

export default function OrderTrackingPage() {
  const { id: orderId } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [commitmentLoading, setCommitmentLoading] = useState(false)
  const hasLoadedOrderRef = useRef(false)

  const isActive =
    !order || !['picked_up', 'cancelled'].includes(order.orderStatus || order.status)

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`)
      if (data.success) {
        setOrder(data.data)
        setError(null)
        hasLoadedOrderRef.current = true
      }
    } catch (err) {
      if (!hasLoadedOrderRef.current) {
        setError('Failed to load order details.')
      }
    } finally {
      setLoading(false)
    }
  }, [orderId])

  // Poll for updates on active orders
  usePolling(fetchOrder, 2500, isActive)

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            {error || 'The order you are looking for could not be found.'}
          </p>
          <Button onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  const orderStatus = order.orderStatus || order.status
  const paymentStatus = order.paymentStatus || order.payment_status
  const needsCommitmentConfirmation =
    paymentStatus === 'success' &&
    orderStatus === 'placed' &&
    !order.isCommitmentConfirmed &&
    !order.is_commitment_confirmed

  const handleConfirmCommitment = async () => {
    setCommitmentLoading(true)
    try {
      const { data } = await api.post(`/orders/${orderId}/confirm-commitment`)
      if (data.success) {
        setOrder(data.data.order || data.data)
        toast.success(data.message || 'Commitment confirmed.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to confirm commitment right now.')
    } finally {
      setCommitmentLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => navigate('/orders')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </Button>

        {/* Order Header */}
        <div className="mb-6 rounded-2xl border border-border/80 bg-card/90 p-5 shadow-[0_16px_30px_-24px_rgba(32,23,15,0.66)] backdrop-blur-sm">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Order #{order.orderNumber || orderId}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(order.createdAt || order.created_at)}
              </p>
            </div>
            <Badge className={getStatusColor(orderStatus)}>
              {getStatusLabel(orderStatus)}
            </Badge>
          </div>
          {order.storeName && (
            <p className="text-muted-foreground mt-1 text-sm">
              From <span className="font-medium text-foreground">{order.storeName}</span>
            </p>
          )}
        </div>

        {/* OTP Section (when order is ready) */}
        {orderStatus === 'ready' && (
          <div className="mb-6">
            <OtpDisplay
              otp={order.otp || order.pickupOtp || order.pickup_otp}
              expiresAt={order.otpExpiresAt || order.otp_expires_at}
            />
          </div>
        )}

        {/* Order Timeline */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Order Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline currentStatus={orderStatus} />
          </CardContent>
        </Card>

        {needsCommitmentConfirmation && (
          <Card className="mb-6 border-orange-200 bg-orange-50/60">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium text-orange-900">
                Confirm you are on the way
              </p>
              <p className="text-xs text-orange-800">
                This helps the store avoid no-show waste. Your order may not be accepted until confirmed.
              </p>
              <Button
                onClick={handleConfirmCommitment}
                disabled={commitmentLoading}
                className="w-full gap-2"
              >
                {commitmentLoading ? (
                  <Spinner size="sm" className="border-current border-t-transparent" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                I Am On The Way
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(order.items || []).map((item, idx) => (
                <div
                  key={item.id || item.menuItemId || idx}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="my-3" />

            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount || order.total_amount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Status</span>
              <Badge className={getStatusColor(paymentStatus)}>
                {getStatusLabel(paymentStatus)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Special Instructions
              </p>
              <p className="text-sm">{order.specialInstructions}</p>
            </CardContent>
          </Card>
        )}

        {/* Back to Orders */}
        <div className="text-center">
          <Link
            to="/orders"
            className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
          >
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  )
}
