import mongoose from 'mongoose'

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    upi_id: { type: String, required: true, trim: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    is_active: { type: Boolean, default: true },
    operating_hours: { type: mongoose.Schema.Types.Mixed, default: {} },
    image_url: { type: String, default: null },
    qr_code_url: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
)

export default mongoose.model('Store', storeSchema)
