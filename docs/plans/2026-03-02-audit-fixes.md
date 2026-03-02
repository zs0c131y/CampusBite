# Audit Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all confirmed security, performance, and UX issues from the March 2026 audit.

**Architecture:** Targeted fixes across backend models, controllers, services, and frontend components. No new dependencies needed — all fixes use Node.js built-ins and existing packages.

**Tech Stack:** Node.js/Express backend (ESM), Mongoose, React/Vite frontend, Fly.io deployment.

---

## Task 1: Fix `pollOrderStatus` — Missing Authorization

**File:** `backend/src/controllers/orderController.js:948-969`

**Problem:** Any authenticated user can poll any order's status. No check that the requesting user owns the order or owns the store that the order belongs to.

**Step 1: Add ownership check**

Replace `pollOrderStatus` (line 948):

```js
export const pollOrderStatus = async (req, res, next) => {
  try {
    await runOrderTimeoutSweep()
    const { id } = req.params
    const userId = req.user.id
    const role = req.user.role

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    const order = await Order.findById(id).lean()

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    if (role === 'store_employee') {
      const store = await Store.findOne({ owner_id: userId }).lean()
      if (!store || store._id.toString() !== order.store_id.toString()) {
        return res.status(403).json({ success: false, message: 'You are not authorized to view this order.' })
      }
    } else if (order.user_id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this order.' })
    }

    res.json({ success: true, data: formatOrder(order) })
  } catch (error) {
    next(error)
  }
}
```

**Step 2: Commit**
```bash
git add backend/src/controllers/orderController.js
git commit -m "fix: add authorization check to pollOrderStatus endpoint"
```

---

## Task 2: Fix OTP Timing Attack

**File:** `backend/src/services/otpService.js:23`

**Problem:** `storedOtp === inputOtp` leaks timing information. An attacker can measure response time to guess OTP character by character.

**Step 1: Replace comparison in `validateOtp`**

Change line 23 from:
```js
return storedOtp === inputOtp;
```
To:
```js
const a = Buffer.from(String(storedOtp))
const b = Buffer.from(String(inputOtp))
if (a.length !== b.length) return false
return crypto.timingSafeEqual(a, b)
```
`crypto` is already imported at line 1.

**Step 2: Commit**
```bash
git add backend/src/services/otpService.js
git commit -m "fix: use constant-time comparison for OTP validation"
```

---

## Task 3: Fix XSS in Email Templates

**File:** `backend/src/services/emailService.js`

**Problem:** User-controlled values (`name`, `order.order_number`, `orderNumber`) are interpolated raw into HTML. A name like `</h2><img src=x onerror=alert(1)>` would break the HTML structure in the recipient's email client.

**Step 1: Add `escapeHtml` helper at top of file (after line 1)**

```js
const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
```

**Step 2: Wrap every user-supplied value in `escapeHtml()`**

In `sendVerificationEmail` (line 73): `Welcome, ${name}!` → `Welcome, ${escapeHtml(name)}!`
In `sendPasswordResetEmail` (line 99): `Hi ${name},` → `Hi ${escapeHtml(name)},`
In `sendOrderConfirmation` (line 132): `Hi ${name},` → `Hi ${escapeHtml(name)},`
In `sendOrderStatusUpdate` (line 185): `Hi ${name},` → `Hi ${escapeHtml(name)},`
In `sendOtpEmail` (line 206): `Hi ${name}, your order <strong>${orderNumber}</strong>` → `Hi ${escapeHtml(name)}, your order <strong>${escapeHtml(orderNumber)}</strong>`

Also wrap `order.order_number` and `order.store_name` in `sendOrderConfirmation` and `sendOrderStatusUpdate` where they appear in HTML.

**Step 3: Commit**
```bash
git add backend/src/services/emailService.js
git commit -m "fix: escape HTML in email templates to prevent XSS"
```

---

## Task 4: Add Missing Database Indexes

**Files:**
- `backend/src/models/Store.js`
- `backend/src/models/MenuItem.js`
- `backend/src/models/Order.js`

**Problem:** `Order.find({ user_id })`, `Order.find({ store_id })`, and `Store.findOne({ owner_id })` are the most frequent queries in the app. None of these fields are indexed, causing full collection scans as data grows.

**Step 1: Add index to `Store.owner_id`**

In `backend/src/models/Store.js`, change:
```js
owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
```
To:
```js
owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
```

**Step 2: Add index to `MenuItem.store_id`**

In `backend/src/models/MenuItem.js`, change:
```js
store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
```
To:
```js
store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
```

**Step 3: Add indexes to `Order.user_id` and `Order.store_id`**

In `backend/src/models/Order.js`, change:
```js
user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
```
To:
```js
user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
```

**Step 4: Commit**
```bash
git add backend/src/models/Store.js backend/src/models/MenuItem.js backend/src/models/Order.js
git commit -m "perf: add database indexes for common query fields"
```

---

## Task 5: Add TTL Index to RefreshToken

**File:** `backend/src/models/RefreshToken.js`

**Problem:** Expired refresh tokens accumulate in the database forever. There is no cleanup job or TTL index.

**Step 1: Add TTL index to `expires_at`**

Change:
```js
expires_at: { type: Date, required: true, index: true },
```
To:
```js
expires_at: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
```

MongoDB will automatically delete documents when `expires_at` is in the past.

**Step 2: Commit**
```bash
git add backend/src/models/RefreshToken.js
git commit -m "fix: add TTL index to RefreshToken for automatic cleanup"
```

---

## Task 6: Clear Email Verification Token After Use

**File:** `backend/src/controllers/authController.js:287-290`

**Problem:** After email verification, `email_verification_token` stays in the database. A stolen token could theoretically be replayed (although the second call is a no-op, leaving the token alive is unnecessary data exposure).

**Step 1: Null out the token after verifying**

Change `verifyEmail` (lines 287-290) from:
```js
if (!user.is_email_verified) {
  user.is_email_verified = true
  await user.save()
}
```
To:
```js
user.is_email_verified = true
user.email_verification_token = null
await user.save()
```

**Step 2: Commit**
```bash
git add backend/src/controllers/authController.js
git commit -m "fix: clear email verification token after successful verification"
```

---

## Task 7: Fix Store Creation Race Condition

**File:** `backend/src/controllers/authController.js:192-198`

**Problem:** If `Store.create()` fails (DB error, validation), the user was already created and persists without a store. This orphans the user account — they can't log in usefully (no store) but the email is blocked for re-registration.

**Step 1: Wrap store creation with cleanup on failure**

Change:
```js
const user = await User.create({
  name: name.trim(),
  email: normalizedEmail,
  password: hashedPassword,
  role,
  register_number: registerNumber || null,
  employee_id: employeeId || null,
  phone_number: phoneNumber || null,
  email_verification_token: emailVerificationToken,
})

if (role === 'store_employee') {
  await Store.create({
    name: storeName.trim(),
    upi_id: storeUpiId.trim().toLowerCase(),
    owner_id: user._id,
  })
}
```
To:
```js
const user = await User.create({
  name: name.trim(),
  email: normalizedEmail,
  password: hashedPassword,
  role,
  register_number: registerNumber || null,
  employee_id: employeeId || null,
  phone_number: phoneNumber || null,
  email_verification_token: emailVerificationToken,
})

if (role === 'store_employee') {
  try {
    await Store.create({
      name: storeName.trim(),
      upi_id: storeUpiId.trim().toLowerCase(),
      owner_id: user._id,
    })
  } catch (storeError) {
    await User.deleteOne({ _id: user._id })
    throw storeError
  }
}
```

**Step 2: Commit**
```bash
git add backend/src/controllers/authController.js
git commit -m "fix: delete orphaned user if store creation fails during registration"
```

---

## Task 8: Reduce JSON Body Parser Limit

**File:** `backend/src/index.js:92`

**Problem:** `10mb` JSON body limit is excessive for an API that only receives text/IDs. This allows memory exhaustion attacks. 1mb covers all real use cases.

**Step 1: Change limit**

Change:
```js
app.use(express.json({ limit: "10mb" }));
```
To:
```js
app.use(express.json({ limit: "1mb" }));
```

**Step 2: Commit**
```bash
git add backend/src/index.js
git commit -m "fix: reduce JSON body parser limit from 10mb to 1mb"
```

---

## Task 9: Validate JWT_SECRET Minimum Length in Preflight

**File:** `backend/src/config/preflight.js`

**Problem:** A short `JWT_SECRET` (e.g., `"secret"`) is accepted and allows practical brute-force attacks on tokens. The preflight only checks for presence, not strength.

**Step 1: Add length validation after the missing-var check**

After the `if (missingRequired.length > 0)` block, add:
```js
const jwtSecret = process.env.JWT_SECRET || ''
if (jwtSecret.length < 32) {
  throw new Error('[Startup] JWT_SECRET must be at least 32 characters long.')
}

const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || ''
if (jwtRefreshSecret.length < 32) {
  throw new Error('[Startup] JWT_REFRESH_SECRET must be at least 32 characters long.')
}
```

**Step 2: Commit**
```bash
git add backend/src/config/preflight.js
git commit -m "fix: require minimum 32-character length for JWT secrets"
```

---

## Task 10: Sanitize `specialInstructions` Before Storing

**File:** `backend/src/controllers/orderController.js:238`

**Problem:** `specialInstructions` is only `.trim()`'d before being stored. If it ever appears in an email or UI without escaping, it's an XSS vector. Strip HTML tags at the persistence layer.

**Step 1: Strip HTML tags in `buildOrderDraft`**

Change line 238:
```js
specialInstructions: specialInstructions?.trim() || null,
```
To:
```js
specialInstructions: specialInstructions
  ? specialInstructions.trim().replace(/<[^>]*>/g, '').slice(0, 500) || null
  : null,
```
This strips any HTML tags and caps the field at 500 characters.

**Step 2: Commit**
```bash
git add backend/src/controllers/orderController.js
git commit -m "fix: strip HTML tags from specialInstructions before storing"
```

---

## Task 11: Fix fly.toml Conflicting Memory Settings

**File:** `fly.toml:22-26`

**Problem:** Both `memory = '1gb'` and `memory_mb = 512` are set. These conflict — `memory_mb = 512` overrides `memory = '1gb'`, giving the machine only 512MB instead of 1GB.

**Step 1: Remove the redundant `memory_mb` line**

Change:
```toml
[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
  memory_mb = 512
```
To:
```toml
[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
```

**Step 2: Commit**
```bash
git add fly.toml
git commit -m "fix: remove conflicting memory_mb setting in fly.toml"
```

---

## Task 12: Add React Error Boundary

**Files:**
- Create: `frontend/src/components/shared/ErrorBoundary.jsx`
- Modify: `frontend/src/main.jsx`

**Problem:** No React Error Boundary exists. Any unhandled render error in any component crashes the entire app with a blank white screen.

**Step 1: Create `ErrorBoundary.jsx`**

```jsx
import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-4">
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

**Step 2: Wrap app in `main.jsx`**

Import and wrap:
```jsx
import { ErrorBoundary } from './components/shared/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
```

**Step 3: Commit**
```bash
git add frontend/src/components/shared/ErrorBoundary.jsx frontend/src/main.jsx
git commit -m "feat: add React Error Boundary to prevent blank screen on render errors"
```

---

## Task 13: Replace `window.confirm` in CartContext

**File:** `frontend/src/contexts/CartContext.jsx:40-48`

**Problem:** `window.confirm()` is a blocking native browser dialog. It's not mobile-friendly, can't be styled, and is blocked by some browsers in iframes/PWA contexts.

**Strategy:** Lift the confirmation out of the context into the caller. The context's `addItem` should return a special signal when it detects a store conflict, and the UI layer handles showing a proper dialog.

**Step 1: Change `addItem` to return a conflict descriptor instead of confirming inline**

Replace `addItem` in `CartContext.jsx`:
```jsx
const addItem = useCallback(
  (item, store) => {
    if (storeId && storeId !== store.id) {
      // Return conflict info — caller must handle confirmation
      return { conflict: true, currentStoreName: storeName, newStore: store, item }
    }

    setStoreId(store.id)
    setStoreName(store.name)

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + (item.quantity || 1),
        }
        return updated
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          imageUrl: item.imageUrl || null,
          notes: item.notes || '',
        },
      ]
    })
    return { conflict: false }
  },
  [storeId, storeName]
)

// New helper: force-replace cart (called after user confirms conflict dialog)
const replaceCart = useCallback(
  (item, store) => {
    setItems([])
    setStoreId(store.id)
    setStoreName(store.name)
    setSpecialInstructions('')
    setItems([
      {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        imageUrl: item.imageUrl || null,
        notes: item.notes || '',
      },
    ])
  },
  []
)
```

Export `replaceCart` in the context value object.

**Step 2: Create a `CartConflictDialog` component**

Create `frontend/src/components/shared/CartConflictDialog.jsx`:
```jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function CartConflictDialog({ open, currentStoreName, newStoreName, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace cart?</DialogTitle>
          <DialogDescription>
            Your cart has items from <strong>{currentStoreName}</strong>. Adding from{' '}
            <strong>{newStoreName}</strong> will clear your current cart.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={onCancel}>Keep current cart</Button>
          <Button variant="destructive" onClick={onConfirm}>Clear and add</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 3: Use dialog in `StoreMenuPage.jsx`**

In `frontend/src/pages/student/StoreMenuPage.jsx`, wherever `addItem` is called:
- Import `CartConflictDialog` and add state: `const [cartConflict, setCartConflict] = useState(null)`
- After calling `addItem(item, store)`:
  ```jsx
  const result = addItem(item, store)
  if (result?.conflict) {
    setCartConflict({ item, store, currentStoreName: result.currentStoreName })
  }
  ```
- Render dialog at bottom of component:
  ```jsx
  <CartConflictDialog
    open={!!cartConflict}
    currentStoreName={cartConflict?.currentStoreName}
    newStoreName={cartConflict?.store?.name}
    onConfirm={() => {
      replaceCart(cartConflict.item, cartConflict.store)
      setCartConflict(null)
    }}
    onCancel={() => setCartConflict(null)}
  />
  ```

**Step 4: Commit**
```bash
git add frontend/src/contexts/CartContext.jsx \
        frontend/src/components/shared/CartConflictDialog.jsx \
        frontend/src/pages/student/StoreMenuPage.jsx
git commit -m "fix: replace window.confirm with accessible dialog for cart store conflict"
```

---

## Task 14: Notify User When Cart Data Is Corrupted

**File:** `frontend/src/contexts/CartContext.jsx:19-22`

**Problem:** When localStorage cart data is corrupt/malformed, the error is silently swallowed. The user loses their cart with no feedback.

**Step 1: Return a flag from `loadCartFromStorage`**

Change the function:
```js
function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        items: parsed.items || [],
        storeId: parsed.storeId || null,
        storeName: parsed.storeName || '',
        specialInstructions: parsed.specialInstructions || '',
        wasCorrupt: false,
      }
    }
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY)
    return {
      items: [],
      storeId: null,
      storeName: '',
      specialInstructions: '',
      wasCorrupt: true,
    }
  }
  return { items: [], storeId: null, storeName: '', specialInstructions: '', wasCorrupt: false }
}
```

**Step 2: Expose `wasCorrupt` and show toast/message**

In `CartProvider`, initialize state and expose:
```jsx
const [cartWasCorrupt, setCartWasCorrupt] = useState(() => loadCartFromStorage().wasCorrupt)
```
Add `cartWasCorrupt` to the context value. In `StoreMenuPage` or `CartPage`, check `cartWasCorrupt` on mount and show a one-time informational toast:
```jsx
useEffect(() => {
  if (cartWasCorrupt) {
    // Show a small toast or inline notice — use whatever toast library is available,
    // or just a console.warn if no toast system exists.
    console.warn('Your cart data was corrupted and has been cleared.')
  }
}, [cartWasCorrupt])
```

**Step 3: Commit**
```bash
git add frontend/src/contexts/CartContext.jsx
git commit -m "fix: detect and signal cart data corruption instead of silently failing"
```

---

## Summary of Changes

| # | File | Type | Impact |
|---|------|------|--------|
| 1 | `orderController.js` | Security | Prevent order snooping |
| 2 | `otpService.js` | Security | Stop timing attack on OTP |
| 3 | `emailService.js` | Security | Prevent XSS in emails |
| 4 | `Store.js`, `MenuItem.js`, `Order.js` | Performance | Fix O(n) scans on common queries |
| 5 | `RefreshToken.js` | Data hygiene | Auto-delete expired tokens |
| 6 | `authController.js` | Security | Don't leave verification tokens live |
| 7 | `authController.js` | Data integrity | No orphaned users on store creation failure |
| 8 | `index.js` | Security | Block large payload attacks |
| 9 | `preflight.js` | Security | Reject weak JWT secrets at startup |
| 10 | `orderController.js` | Security | Strip HTML from user-supplied instruction |
| 11 | `fly.toml` | Infrastructure | Machine actually gets 1GB RAM |
| 12 | `ErrorBoundary.jsx`, `main.jsx` | UX | App doesn't blank-screen on errors |
| 13 | `CartContext.jsx`, `CartConflictDialog.jsx`, `StoreMenuPage.jsx` | UX | Accessible cart conflict dialog |
| 14 | `CartContext.jsx` | UX | User knows if cart was cleared due to corruption |
