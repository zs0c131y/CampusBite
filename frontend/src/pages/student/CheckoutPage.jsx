import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Smartphone,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { usePolling } from '@/hooks/usePolling'
import { formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'

const UPI_APPS = [
  { name: 'GPay', icon: '💳', scheme: 'tez://upi/' },
  { name: 'PhonePe', icon: '📱', scheme: 'phonepe://pay' },
  { name: 'Paytm', icon: '💰', scheme: 'paytmmp://upi/' },
  { name: 'BHIM', icon: '🏦', scheme: 'upi://pay' },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const cart = useCart()

  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [timeElapsed, setTimeElapsed] = useState(0)
  const timerRef = useRef(null)

  const totalAmount = cart.getTotal()
  const itemCount = cart.getItemCount()

  // Start elapsed timer after order is placed
  useEffect(() => {
    if (order && paymentStatus === 'pending') {
      const start = Date.now()
      timerRef.current = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - start) / 1000))
      }, 1000)
      return () => clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [order, paymentStatus])

  // Poll for payment status
  const pollPaymentStatus = useCallback(async () => {
    if (!order) return
    try {
      const orderId = order._id || order.id
      const { data } = await api.get(`/orders/${orderId}/poll-status`)
      if (data.success) {
        const status = data.data?.paymentStatus || data.data?.payment_status
        if (status) {
          setPaymentStatus(status)
        }
        if (status === 'success') {
          toast.success('Payment confirmed! Your order is being prepared.')
          cart.clearCart()
        }
      }
    } catch {
      // Silently fail polling
    }
  }, [order, cart])

  usePolling(pollPaymentStatus, 3000, !!order && paymentStatus === 'pending')

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setPlacing(true)
    try {
      const orderPayload = {
        storeId: cart.storeId,
        items: cart.items.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        specialInstructions: cart.specialInstructions || undefined,
      }

      const { data } = await api.post('/orders', orderPayload)
      if (data.success) {
        setOrder(data.data)
        toast.success('Order placed! Please complete payment.')
      }
    } catch (error) {
      const msg =
        error.response?.data?.message || 'Failed to place order. Please try again.'
      toast.error(msg)
    } finally {
      setPlacing(false)
    }
  }

  const buildUpiLink = (appScheme) => {
    if (!order) return '#'
    const upiId = order.upiId || order.store?.upiId || ''
    const storeName = encodeURIComponent(order.storeName || cart.storeName || '')
    const amount = order.totalAmount || totalAmount
    const orderNum = order.orderNumber || order._id || order.id

    return `upi://pay?pa=${upiId}&pn=${storeName}&am=${amount}&cu=INR&tn=Order${orderNum}`
  }

  const handleUpiPayment = (app) => {
    const link = buildUpiLink(app.scheme)
    // On mobile, open UPI app directly
    window.location.href = link
  }

  // Redirect to cart if empty and no order placed
  if (!order && cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nothing to checkout</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Your cart is empty. Add some items before checking out.
          </p>
          <Button onClick={() => navigate('/stores')}>Browse Stores</Button>
        </div>
      </div>
    )
  }

  // Payment success state
  if (paymentStatus === 'success') {
    const orderId = order._id || order.id
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Payment Confirmed!
          </h2>
          <p className="text-muted-foreground mb-2">
            Order #{order.orderNumber || orderId}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Your order has been placed successfully. You can track its progress
            in real time.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate(`/orders/${orderId}`)}
          >
            Track Order
          </Button>
          <Button
            variant="ghost"
            className="w-full mt-2"
            onClick={() => navigate('/orders')}
          >
            View All Orders
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* Back Button */}
        {!order && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2"
            onClick={() => navigate('/cart')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Cart
          </Button>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
          {order ? 'Complete Payment' : 'Checkout'}
        </h1>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Items */}
            <div className="space-y-2 mb-4">
              {(order ? order.items : cart.items).map((item, idx) => (
                <div key={item.id || item.menuItemId || idx} className="flex justify-between text-sm">
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
              <span>{formatCurrency(order?.totalAmount || totalAmount)}</span>
            </div>

            {/* Special Instructions */}
            {(cart.specialInstructions || order?.specialInstructions) && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Special Instructions
                </p>
                <p className="text-sm">
                  {order?.specialInstructions || cart.specialInstructions}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Place Order Button (before order is placed) */}
        {!order && (
          <Button
            className="w-full"
            size="lg"
            disabled={placing}
            onClick={handlePlaceOrder}
          >
            {placing ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" className="border-white border-t-transparent" />
                Placing Order...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Place Order - {formatCurrency(totalAmount)}
              </span>
            )}
          </Button>
        )}

        {/* UPI Payment Section (after order is placed) */}
        {order && paymentStatus === 'pending' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Complete Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Amount */}
              <div className="text-center py-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(order.totalAmount || totalAmount)}
                </p>
              </div>

              {/* UPI App Buttons */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Pay using UPI
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {UPI_APPS.map((app) => (
                    <Button
                      key={app.name}
                      variant="outline"
                      className="h-14 flex items-center justify-center gap-2 text-sm font-medium"
                      onClick={() => handleUpiPayment(app)}
                    >
                      <span className="text-lg">{app.icon}</span>
                      {app.name}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* UPI Link (fallback) */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  Or copy UPI payment link
                </p>
                <button
                  className="text-xs text-orange-600 hover:underline break-all"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(buildUpiLink('upi://pay'))
                      .then(() => toast.success('UPI link copied!'))
                      .catch(() => toast.error('Failed to copy'))
                  }}
                >
                  Tap to copy UPI link
                </button>
              </div>

              <Separator />

              {/* Payment Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />
                  <span className="text-sm text-muted-foreground">
                    Waiting for payment...
                  </span>
                </div>
                <Badge className={getStatusColor('pending')}>
                  {getStatusLabel('pending')}
                </Badge>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Complete the payment in your UPI app. This page will update
                automatically.
              </p>

              {/* Timeout Warning */}
              {timeElapsed >= 300 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Payment taking too long? Contact the store directly for
                    assistance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
