const toObject = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc)

const toId = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    if (typeof value.toHexString === 'function') return value.toHexString()
    if (value._id && value._id !== value) return toId(value._id)
  }
  return value.toString()
}

export const formatUser = (userDoc) => {
  const user = toObject(userDoc)
  if (!user) return null

  return {
    ...user,
    id: toId(user._id),
    _id: toId(user._id),
    registerNumber: user.register_number,
    employeeId: user.employee_id,
    phoneNumber: user.phone_number,
    isEmailVerified: user.is_email_verified,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

export const formatStore = (storeDoc, owner = null) => {
  const store = toObject(storeDoc)
  if (!store) return null

  return {
    ...store,
    id: toId(store._id),
    _id: toId(store._id),
    owner_id: toId(store.owner_id),
    ownerId: toId(store.owner_id),
    isActive: store.is_active,
    operatingHours: store.operating_hours,
    imageUrl: store.image_url,
    createdAt: store.created_at,
    updatedAt: store.updated_at,
    owner_name: owner?.name || store.owner_name,
    owner_email: owner?.email || store.owner_email,
    owner_phone: owner?.phone_number || store.owner_phone,
  }
}

export const formatMenuItem = (itemDoc) => {
  const item = toObject(itemDoc)
  if (!item) return null

  return {
    ...item,
    id: toId(item._id),
    _id: toId(item._id),
    store_id: toId(item.store_id),
    storeId: toId(item.store_id),
    isAvailable: item.is_available,
    imageUrl: item.image_url,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }
}

export const formatOrder = (orderDoc, extras = {}) => {
  const order = toObject(orderDoc)
  if (!order) return null

  const store = extras.store || null
  const customer = extras.customer || null

  const formattedItems = (order.items || []).map((item) => ({
    ...item,
    menuItemId: toId(item.menuItemId),
  }))

  return {
    ...order,
    id: toId(order._id),
    _id: toId(order._id),
    user_id: toId(order.user_id),
    userId: toId(order.user_id),
    store_id: toId(order.store_id),
    storeId: toId(order.store_id),
    orderNumber: order.order_number,
    paymentReference: order.payment_reference,
    totalAmount: order.total_amount,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    status: order.order_status,
    transactionId: order.transaction_id,
    specialInstructions: order.special_instructions,
    pickup_otp: order.otp,
    pickupOtp: order.otp,
    otpExpiresAt: order.otp_expires_at,
    isOtpVerified: order.is_otp_verified,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: formattedItems,
    store_name: store?.name || order.store_name,
    storeName: store?.name || order.store_name,
    store_upi_id: store?.upi_id || order.store_upi_id,
    storeUpiId: store?.upi_id || order.store_upi_id,
    customer_name: customer?.name || order.customer_name,
    customer_email: customer?.email || order.customer_email,
    customer_phone: customer?.phone_number || order.customer_phone,
    customer_role: customer?.role || order.customer_role,
    customerRole: customer?.role || order.customer_role,
    customer_register_number:
      customer?.register_number || order.customer_register_number,
    customerRegisterNumber:
      customer?.register_number || order.customer_register_number,
    customer_employee_id: customer?.employee_id || order.customer_employee_id,
    customerEmployeeId: customer?.employee_id || order.customer_employee_id,
  }
}
