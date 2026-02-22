import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  User,
  Mail,
  Phone,
  CreditCard,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { DesktopHint } from '@/components/shared/DesktopHint'
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
import { formatCurrency, formatDate, getCancellationReasonLabel } from '@/lib/utils'

const ORDER_TIMELINE = [
  { status: 'placed', label: 'Order Placed', icon: Clock },
  { status: 'accepted', label: 'Accepted', icon: CheckCircle2 },
  { status: 'processing', label: 'Preparing', icon: ChefHat },
  { status: 'ready', label: 'Ready for Pickup', icon: PackageCheck },
  { status: 'picked_up', label: 'Picked Up', icon: CheckCircle2 },
]

const STATUS_ORDER = ['placed', 'accepted', 'processing', 'ready', 'picked_up']

export default function OrderDetailPage() {
  const { id } = useParams()
  const hasLoadedRef = useRef(false)

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)

  // OTP dialog
  const [otpDialog, setOtpDialog] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  const fetchOrder = useCallback(async ({ silent = false } = {}) => {
    const shouldShowLoader = !silent && !hasLoadedRef.current
    try {
      if (shouldShowLoader) {
        setLoading(true)
      }
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data.data.order || res.data.data)
      setError(null)
    } catch (err) {
      if (!hasLoadedRef.current) {
        setError(err.response?.data?.message || 'Failed to load order details.')
      }
    } finally {
      if (!hasLoadedRef.current) {
        setLoading(false)
        hasLoadedRef.current = true
      }
    }
  }, [id])

  useEffect(() => {
    hasLoadedRef.current = false
    setLoading(true)
    setError(null)
    setOrder(null)
  }, [id])

  const isPollingEnabled =
    Boolean(id) && !['picked_up', 'cancelled'].includes(order?.status)
  usePolling(() => fetchOrder({ silent: hasLoadedRef.current }), 2000, isPollingEnabled)

  // Status update
  const handleStatusUpdate = async (newStatus) => {
    setActionLoading(true)
    try {
      const { data } = await api.patch(`/orders/${id}/status`, { status: newStatus })
      toast.success(`Order status updated to ${newStatus}.`)
      const updatedOrder = data?.data?.order
      if (updatedOrder) {
        setOrder(updatedOrder)
      } else {
        await fetchOrder({ silent: true })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.')
    } finally {
      setActionLoading(false)
    }
  }

  // Payment confirmation
  const handlePaymentConfirm = async (status) => {
    setPaymentLoading(true)
    try {
      const { data } = await api.patch(`/orders/${id}/payment-status`, {
        paymentStatus: status,
        transactionId: transactionId || undefined,
      })
      toast.success(
        status === 'success' ? 'Payment confirmed.' : 'Payment marked as failed.'
      )
      setPaymentDialog(false)
      setTransactionId('')
      const updatedOrder = data?.data?.order
      if (updatedOrder) {
        setOrder(updatedOrder)
      } else {
        await fetchOrder({ silent: true })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment.')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleOtpVerify = async () => {
    setOtpLoading(true)
    try {
      const { data } = await api.post(`/orders/${id}/verify-otp`, { manualConfirm: true })
      toast.success('Pickup confirmed. Order completed.')
      setOtpDialog(false)
      const updatedOrder = data?.data?.order
      if (updatedOrder) {
        setOrder(updatedOrder)
      } else {
        await fetchOrder({ silent: true })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed.')
    } finally {
      setOtpLoading(false)
    }
  }

  // Timeline step state
  const getStepState = (stepStatus) => {
    if (!order) return 'upcoming'
    if (order.status === 'cancelled') {
      return stepStatus === 'placed' ? 'completed' : 'upcoming'
    }
    const currentIdx = STATUS_ORDER.indexOf(order.status)
    const stepIdx = STATUS_ORDER.indexOf(stepStatus)
    if (stepIdx < currentIdx) return 'completed'
    if (stepIdx === currentIdx) return 'current'
    return 'upcoming'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-muted-foreground text-sm">Loading order...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-center text-muted-foreground">
              {error || 'Order not found.'}
            </p>
            <Button asChild>
              <Link to="/store/orders">Back to Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const items = order.items || []
  const isPaid = order.payment_status === 'success'
  const isTerminal = order.status === 'picked_up' || order.status === 'cancelled'
  const customerRole = order.customer_role || order.customerRole || null
  const customerIdentityLabel =
    customerRole === 'student'
      ? 'Register Number'
      : customerRole === 'faculty'
      ? 'Employee ID'
      : null
  const customerIdentityValue =
    customerRole === 'student'
      ? order.customer_register_number || order.customerRegisterNumber
      : customerRole === 'faculty'
      ? order.customer_employee_id || order.customerEmployeeId
      : null
  const cancellationReason = order.cancellationReason || order.cancellation_reason
  const currentTimelineIdx = STATUS_ORDER.indexOf(order.status)
  const timelineProgressPercent =
    order.status === 'cancelled' || currentTimelineIdx < 0
      ? 0
      : (currentTimelineIdx / (STATUS_ORDER.length - 1)) * 80

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <DesktopHint />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/store/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              Order #{order.order_number || order.id?.slice(0, 8)}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      {/* Order Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 sm:hidden">
            {ORDER_TIMELINE.map((step, index) => {
              const state = getStepState(step.status)
              const Icon = step.icon
              const showLine = index < ORDER_TIMELINE.length - 1

              return (
                <div key={step.status} className="relative flex items-start gap-3">
                  {showLine && (
                    <div className="absolute left-4 top-8 h-8 w-0.5 bg-muted" />
                  )}
                  <div
                    className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      state === 'completed'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : state === 'current'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/30 bg-background text-muted-foreground/50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p
                      className={`text-sm ${
                        state === 'upcoming'
                          ? 'text-muted-foreground/70'
                          : 'font-medium text-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="relative hidden sm:block">
            <div className="absolute left-[10%] right-[10%] top-5 h-0.5 bg-muted" />
            <div
              className="absolute left-[10%] top-5 h-0.5 bg-primary transition-all duration-500"
              style={{ width: `${timelineProgressPercent}%` }}
            />

            <div className="grid grid-cols-5">
              {ORDER_TIMELINE.map((step) => {
                const state = getStepState(step.status)
                const Icon = step.icon
                return (
                  <div
                    key={step.status}
                    className="relative z-10 flex flex-col items-center px-1"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        state === 'completed'
                          ? 'border-primary bg-primary text-primary-foreground'
                          : state === 'current'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted-foreground/30 bg-background text-muted-foreground/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`mt-1.5 min-h-8 text-center text-[11px] leading-tight ${
                        state === 'upcoming'
                          ? 'text-muted-foreground/60'
                          : 'font-medium text-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {order.status === 'cancelled' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-center">
              <p className="text-sm font-medium text-red-800">
                This order has been cancelled.
              </p>
              {cancellationReason && (
                <p className="text-xs text-red-700 mt-1">
                  {getCancellationReasonLabel(cancellationReason)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* OTP Display when ready */}
      {order.status === 'ready' && order.pickup_otp && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="py-6 text-center">
            <p className="text-sm font-medium text-green-800 mb-2">
              Pickup OTP - Verify with customer
            </p>
            <p className="text-4xl font-bold tracking-[0.4em] text-green-700">
              {order.pickup_otp}
            </p>
            <p className="text-xs text-green-600 mt-2">
              The customer must present this OTP to collect their order.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {order.customer_name || order.user_name || 'N/A'}
              </span>
            </div>
            {(order.customer_email || order.user_email) && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {order.customer_email || order.user_email}
                </span>
              </div>
            )}
            {(order.customer_phone || order.user_phone) && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {order.customer_phone || order.user_phone}
                </span>
              </div>
            )}
            {customerIdentityLabel && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="text-muted-foreground">{customerIdentityLabel}: </span>
                  <span className="font-medium">{customerIdentityValue || 'N/A'}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="text-muted-foreground">Commitment: </span>
                <span className="font-medium">
                  {order.isCommitmentConfirmed || order.is_commitment_confirmed
                    ? 'Confirmed on the way'
                    : 'Pending confirmation'}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Ref</span>
              <span className="text-sm font-semibold break-all ml-3 text-right">
                {order.paymentReference || order.payment_reference || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={order.payment_status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Method</span>
              <span className="text-sm font-medium capitalize">
                {order.payment_method || 'UPI'}
              </span>
            </div>
            {order.transaction_id && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transaction ID</span>
                <span className="text-sm tracking-wide break-all ml-3 text-right">{order.transaction_id}</span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold">
                {formatCurrency(order.total_amount || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No items information available.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold leading-none">
                        {item.quantity}x
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {item.name || item.menu_item_name}
                        </p>
                        {item.special_instructions && (
                          <p className="text-xs text-muted-foreground">
                            Note: {item.special_instructions}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(
                        (item.price_at_order || item.price) * item.quantity
                      )}
                    </span>
                  </div>
                  {idx < items.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Special Instructions */}
      {order.special_instructions && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="py-4">
            <p className="text-xs font-medium text-yellow-800 mb-1">
              Special Instructions
            </p>
            <p className="text-sm text-yellow-700">{order.special_instructions}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!isTerminal && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-3 justify-end">
              {order.payment_status === 'pending' && (
                <Button
                  variant="warning"
                  onClick={() => setPaymentDialog(true)}
                  disabled={actionLoading}
                  className="gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Confirm Payment
                </Button>
              )}

              {order.status === 'placed' && isPaid && (
                <Button
                  onClick={() => handleStatusUpdate('accepted')}
                  disabled={actionLoading}
                  className="gap-2"
                >
                  {actionLoading ? (
                    <Spinner size="sm" className="border-current border-t-transparent" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Accept Order
                </Button>
              )}

              {order.status === 'accepted' && (
                <Button
                  onClick={() => handleStatusUpdate('processing')}
                  disabled={actionLoading}
                  className="gap-2"
                >
                  {actionLoading ? (
                    <Spinner size="sm" className="border-current border-t-transparent" />
                  ) : (
                    <ChefHat className="h-4 w-4" />
                  )}
                  Start Preparing
                </Button>
              )}

              {order.status === 'processing' && (
                <Button
                  variant="success"
                  onClick={() => handleStatusUpdate('ready')}
                  disabled={actionLoading}
                  className="gap-2"
                >
                  {actionLoading ? (
                    <Spinner size="sm" className="border-current border-t-transparent" />
                  ) : (
                    <PackageCheck className="h-4 w-4" />
                  )}
                  Mark Ready
                </Button>
              )}

              {order.status === 'ready' && (
                <Button
                  variant="success"
                  onClick={() => {
                    setOtpDialog(true)
                  }}
                  disabled={actionLoading}
                  className="gap-2"
                >
                  {actionLoading ? (
                    <Spinner size="sm" className="border-current border-t-transparent" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Verify OTP & Complete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialog}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentDialog(false)
            setTransactionId('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Order #{order.order_number || order.id?.slice(0, 8)} -{' '}
              {formatCurrency(order.total_amount || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm">Has the customer completed the UPI payment?</p>
            <div className="space-y-2">
              <Label htmlFor="detail-txn-id">Transaction ID (optional)</Label>
              <Input
                id="detail-txn-id"
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
              className="gap-1.5"
            >
              {paymentLoading ? (
                <Spinner size="sm" className="border-current border-t-transparent" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Mark Failed
            </Button>
            <Button
              onClick={() => handlePaymentConfirm('success')}
              disabled={paymentLoading}
              className="gap-1.5"
            >
              {paymentLoading ? (
                <Spinner size="sm" className="border-current border-t-transparent" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Dialog */}
      <Dialog
        open={otpDialog}
        onOpenChange={(open) => {
          if (!open) {
            setOtpDialog(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Pickup OTP</DialogTitle>
            <DialogDescription>
              Ask the customer for their 6-digit pickup code.
            </DialogDescription>
          </DialogHeader>

          {order.pickup_otp && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-center">
              <p className="text-xs font-medium text-blue-800 mb-1">
                Expected OTP (shown to customer)
              </p>
              <p className="text-2xl font-bold tracking-[0.3em] text-blue-700">
                {order.pickup_otp}
              </p>
            </div>
          )}

          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Ask the student/faculty to show or say the OTP, then confirm pickup.
            </p>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No typing required. This will mark the order as picked up immediately.
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleOtpVerify}
              disabled={otpLoading}
              className="w-full gap-2"
            >
              {otpLoading ? (
                <Spinner size="sm" className="border-current border-t-transparent" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirm OTP Checked & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
