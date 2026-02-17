import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency } from '@/lib/utils'

export default function CartPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const cart = useCart()

  const subtotal = cart.getTotal()
  const totalAmount = subtotal
  const itemCount = cart.getItemCount()

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShoppingCart className="h-9 w-9 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground mb-6 text-sm max-w-xs mx-auto">
            Looks like you haven't added anything to your cart yet. Browse our
            campus stores to get started.
          </p>
          <Button onClick={() => navigate('/stores')}>
            <Store className="h-4 w-4 mr-2" />
            Browse Stores
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => navigate(cart.storeId ? `/stores/${cart.storeId}` : '/stores')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Continue Shopping
        </Button>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Your Cart
          </h1>
          {cart.storeName && (
            <p className="text-muted-foreground mt-1 text-sm">
              Ordering from <span className="font-medium text-foreground">{cart.storeName}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Item Subtotal */}
                      <span className="font-bold text-foreground">
                        {formatCurrency(item.price * item.quantity)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            cart.updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            cart.updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 ml-1"
                          onClick={() => cart.removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Special Instructions */}
            <Card>
              <CardContent className="p-4">
                <label
                  htmlFor="special-instructions"
                  className="text-sm font-medium text-foreground block mb-2"
                >
                  Special Instructions (optional)
                </label>
                <textarea
                  id="special-instructions"
                  rows={3}
                  placeholder="Any special requests? E.g., extra spicy, no onions..."
                  value={cart.specialInstructions}
                  onChange={(e) => cart.setSpecialInstructions(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
                  </span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>

                <Button
                  className="w-full mt-2"
                  size="lg"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </Button>

                <Link
                  to={cart.storeId ? `/stores/${cart.storeId}` : '/stores'}
                  className="block text-center text-sm text-orange-600 hover:text-orange-700 hover:underline mt-2"
                >
                  Continue Shopping
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
