import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency } from '@/lib/utils'

const UPI_APPS = [
  { key: 'gpay', name: 'Google Pay', short: 'G' },
  { key: 'phonepe', name: 'PhonePe', short: 'P' },
  { key: 'paytm', name: 'Paytm', short: 'T' },
  { key: 'bhim', name: 'BHIM', short: 'B' },
]

const normalizeOrderItems = (items = []) =>
  items.map((item, idx) => ({
    id: item.menuItemId || item.id || `${idx}`,
    name: item.name,
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 0),
  }))

const buildCrossCheckText = (order) => {
  const orderId = order.id || order._id
  return [
    'CampusBite Payment Cross-Check',
    `Order ID: ${orderId}`,
    `Order Number: ${order.orderNumber || order.order_number || 'N/A'}`,
    `Payment Reference: ${order.paymentReference || order.payment_reference || 'N/A'}`,
    `Transaction ID: ${order.transactionId || order.transaction_id || 'N/A'}`,
    `Amount: ${formatCurrency(order.totalAmount || order.total_amount || 0)}`,
  ].join('\n')
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const cart = useCart()

  const [sessionLoading, setSessionLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [paymentSession, setPaymentSession] = useState(null)
  const [paymentState, setPaymentState] = useState('idle')
  const [transactionId, setTransactionId] = useState('')
  const [orderResult, setOrderResult] = useState(null)

  const cartItems = cart.items
  const totalAmount = cart.getTotal()

  const displayItems = useMemo(() => {
    if (orderResult) return normalizeOrderItems(orderResult.items)
    if (paymentSession?.items?.length) return normalizeOrderItems(paymentSession.items)
    return normalizeOrderItems(cartItems)
  }, [orderResult, paymentSession, cartItems])

  const handleInitiatePayment = async () => {
    if (cartItems.length === 0 || !cart.storeId) {
      toast.error('Your cart is empty')
      return
    }

    setSessionLoading(true)
    setPaymentState('idle')

    try {
      const payload = {
        storeId: cart.storeId,
        items: cartItems.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
        specialInstructions: cart.specialInstructions || undefined,
      }

      const { data } = await api.post('/orders/checkout-session', payload)
      if (data.success) {
        setPaymentSession(data.data)
        toast.success('Payment session ready. Complete payment and submit transaction ID.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to start payment.')
    } finally {
      setSessionLoading(false)
    }
  }

  const handleOpenUpi = (appKey = 'generic') => {
    const appLink = paymentSession?.payment?.upiAppLinks?.[appKey]
    if (!appLink) {
      toast.error('UPI link unavailable right now.')
      return
    }

    window.location.href = appLink
  }

  const handleCopy = async (value, successMessage) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(successMessage)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleConfirmPaid = async () => {
    if (!paymentSession?.checkoutToken) {
      toast.error('Payment session missing. Please start again.')
      return
    }

    const normalizedTxnId = transactionId.trim().toUpperCase()
    if (!/^[A-Z0-9]{8,40}$/.test(normalizedTxnId)) {
      toast.error('Enter a valid transaction ID (8-40 letters/numbers).')
      return
    }

    setConfirmLoading(true)
    try {
      const { data } = await api.post('/orders', {
        checkoutToken: paymentSession.checkoutToken,
        transactionId: normalizedTxnId,
      })

      if (data.success) {
        setOrderResult(data.data)
        setPaymentSession(null)
        cart.clearCart()
        toast.success(data.message || 'Order submitted successfully.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit payment confirmation.')
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleMarkPaymentFailed = () => {
    setPaymentState('failed')
    toast.error('Payment marked as failed. You can retry payment.')
  }

  const handleRetryPayment = () => {
    setPaymentState('idle')
    setTransactionId('')
  }

  if (!orderResult && cartItems.length === 0 && !paymentSession) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nothing to checkout</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Your cart is empty. Add items before checkout.
          </p>
          <Button onClick={() => navigate('/stores')}>Browse Stores</Button>
        </div>
      </div>
    )
  }

  if (orderResult) {
    const orderId = orderResult.id || orderResult._id
    const crossCheckText = buildCrossCheckText(orderResult)

    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <Card className="border-green-200 shadow-lg">
            <CardContent className="p-6 space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-9 w-9 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Order Submitted</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Payment received from your side and order placed. Store verification is pending.
                </p>
              </div>

              <div className="rounded-xl border bg-background p-4 text-sm space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-semibold">#{orderResult.orderNumber || orderId}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Payment Reference</span>
                  <span className="font-semibold">
                    {orderResult.paymentReference || orderResult.payment_reference}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-semibold tracking-wide">
                    {orderResult.transactionId || orderResult.transaction_id}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(orderResult.totalAmount || orderResult.total_amount || 0)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  Share Order Number + Payment Reference + Transaction ID with the store for cross-check.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopy(crossCheckText, 'Cross-check details copied')}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Details
                </Button>
                <Button onClick={() => navigate(`/orders/${orderId}`)} className="gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Track Order
                </Button>
              </div>

              <Button variant="ghost" className="w-full" onClick={() => navigate('/orders')}>
                View All Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const summaryStoreName = paymentSession?.store?.name || cart.storeName || 'Campus Store'
  const summaryAmount = paymentSession?.totalAmount || totalAmount

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => navigate('/cart')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Cart
        </Button>

        <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b bg-card/70">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5" />
                Checkout Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-background px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Ordering From</p>
                  <p className="font-semibold">{summaryStoreName}</p>
                </div>
                <Badge variant="secondary">{displayItems.length} item{displayItems.length !== 1 ? 's' : ''}</Badge>
              </div>

              <div className="space-y-2">
                {displayItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2.5">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {cart.specialInstructions && (
                <div className="rounded-lg border bg-muted/35 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    Special Instructions
                  </p>
                  <p className="text-sm">{cart.specialInstructions}</p>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <p className="text-base font-semibold">Total Payable</p>
                <p className="text-2xl font-bold">{formatCurrency(summaryAmount)}</p>
              </div>

              {!paymentSession ? (
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleInitiatePayment}
                  disabled={sessionLoading}
                >
                  {sessionLoading ? (
                    <>
                      <Spinner size="sm" className="border-white border-t-transparent" />
                      Preparing Payment...
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4" />
                      Continue to Payment
                    </>
                  )}
                </Button>
              ) : (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                  Payment session active. Complete UPI payment and submit transaction ID.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment Desk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!paymentSession ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Start payment from the summary panel to view UPI options.
                </div>
              ) : (
                <>
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold">{formatCurrency(paymentSession.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Reference</span>
                      <span className="font-semibold">{paymentSession.paymentReference}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Pay with UPI App</p>
                    <div className="grid grid-cols-2 gap-2">
                      {UPI_APPS.map((app) => (
                        <Button
                          key={app.key}
                          variant="outline"
                          className="h-12 justify-start gap-2"
                          onClick={() => handleOpenUpi(app.key)}
                        >
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                            {app.short}
                          </span>
                          <span className="text-xs">{app.name}</span>
                          <ExternalLink className="ml-auto h-3 w-3 opacity-70" />
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="ghost"
                      className="justify-start text-sm"
                      onClick={() =>
                        handleCopy(
                          paymentSession.payment?.upiLink || '',
                          'UPI payment link copied'
                        )
                      }
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy UPI Link
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-sm"
                      onClick={() =>
                        handleCopy(
                          paymentSession.paymentReference,
                          'Payment reference copied'
                        )
                      }
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Payment Reference
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="transactionId">UPI Transaction ID (after payment)</Label>
                    <Input
                      id="transactionId"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                      placeholder="e.g. T20260222ABCD1234"
                      maxLength={40}
                    />
                  </div>

                  {paymentState === 'failed' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>
                        Payment failed or not completed. Retry payment before submitting transaction ID.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleMarkPaymentFailed}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Payment Failed
                    </Button>
                    <Button
                      onClick={handleConfirmPaid}
                      className="gap-2"
                      disabled={confirmLoading}
                    >
                      {confirmLoading ? <Spinner size="sm" className="border-white border-t-transparent" /> : <CheckCircle2 className="h-4 w-4" />}
                      I Paid Successfully
                    </Button>
                  </div>

                  {paymentState === 'failed' && (
                    <Button variant="outline" className="w-full" onClick={handleRetryPayment}>
                      Retry Payment
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
