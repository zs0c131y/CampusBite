import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    order_number: { type: String, required: true, unique: true, index: true },
    payment_reference: { type: String, required: true, unique: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    items: { type: [orderItemSchema], default: [] },
    total_amount: { type: Number, required: true },
    payment_status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    order_status: {
      type: String,
      enum: ['placed', 'accepted', 'processing', 'ready', 'picked_up', 'cancelled'],
      default: 'placed',
    },
    payment_method: { type: String, default: 'upi' },
    transaction_id: { type: String, default: null, index: true },
    special_instructions: { type: String, default: null },
    otp: { type: String, default: null },
    otp_expires_at: { type: Date, default: null },
    is_otp_verified: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
)

export default mongoose.model('Order', orderSchema)
