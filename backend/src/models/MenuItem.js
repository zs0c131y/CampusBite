import mongoose from 'mongoose'

const menuItemSchema = new mongoose.Schema(
  {
    store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    price: { type: Number, required: true, min: 0 },
    image_url: { type: String, default: null },
    category: { type: String, default: null },
    is_available: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
)

export default mongoose.model('MenuItem', menuItemSchema)
