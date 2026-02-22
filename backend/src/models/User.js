import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'faculty', 'store_employee'],
      required: true,
    },
    register_number: { type: String, default: null },
    employee_id: { type: String, default: null },
    phone_number: { type: String, default: null },
    is_email_verified: { type: Boolean, default: false },
    email_verification_token: { type: String, default: null },
    password_reset_token: { type: String, default: null },
    password_reset_expires: { type: Date, default: null },
    no_show_count: { type: Number, default: 0, min: 0 },
    trust_tier: {
      type: String,
      enum: ['good', 'watch', 'restricted'],
      default: 'good',
    },
    ordering_restricted_until: { type: Date, default: null },
    last_no_show_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
)

export default mongoose.model('User', userSchema)
