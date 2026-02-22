import mongoose from 'mongoose'

const refreshTokenSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, index: true },
    expires_at: { type: Date, required: true, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
)

export default mongoose.model('RefreshToken', refreshTokenSchema)
