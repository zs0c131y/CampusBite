import Store from '../models/Store.js'
import MenuItem from '../models/MenuItem.js'
import { formatStore, formatMenuItem } from '../utils/formatters.js'
import { resolveUploadedFilePath } from '../config/uploads.js'

const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/

const parseOperatingHours = (value) => {
  if (!value) return undefined
  if (typeof value === 'object') return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }
  return undefined
}

export const getAllStores = async (req, res, next) => {
  try {
    const stores = await Store.find({ is_active: true })
      .populate('owner_id', 'name')
      .sort({ created_at: -1 })

    const formatted = stores.map((store) =>
      formatStore(store, { name: store.owner_id?.name })
    )

    res.json({
      success: true,
      data: { stores: formatted },
    })
  } catch (error) {
    next(error)
  }
}

export const getStoreById = async (req, res, next) => {
  try {
    const { id } = req.params

    const store = await Store.findById(id).populate(
      'owner_id',
      'name email phone_number'
    )

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.',
      })
    }

    res.json({
      success: true,
      data: {
        store: formatStore(store, {
          name: store.owner_id?.name,
          email: store.owner_id?.email,
          phone_number: store.owner_id?.phone_number,
        }),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const updateStore = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const store = await Store.findById(id)

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.',
      })
    }

    if (store.owner_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this store.',
      })
    }

    const {
      name,
      description,
      upi_id,
      is_active,
      operating_hours,
      image_url,
      qr_code_url,
    } = req.body

    if (name) store.name = name
    if (description !== undefined) store.description = description
    if (upi_id) {
      const normalizedUpiId = upi_id.trim().toLowerCase()
      if (!UPI_ID_REGEX.test(normalizedUpiId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid UPI ID format.',
        })
      }
      store.upi_id = normalizedUpiId
    }
    if (is_active !== undefined) store.is_active = is_active

    const parsedHours = parseOperatingHours(operating_hours)
    if (parsedHours !== undefined) {
      store.operating_hours = parsedHours
    }

    const uploadedStoreImage = req.files?.image?.[0] || req.file
    const uploadedQrCode = req.files?.qr_code?.[0]

    if (uploadedStoreImage) {
      store.image_url = resolveUploadedFilePath(uploadedStoreImage.filename)
    } else if (image_url !== undefined) {
      store.image_url = image_url
    }

    if (uploadedQrCode) {
      store.qr_code_url = resolveUploadedFilePath(uploadedQrCode.filename)
    } else if (qr_code_url !== undefined) {
      store.qr_code_url = qr_code_url
    }

    await store.save()

    res.json({
      success: true,
      message: 'Store updated successfully.',
      data: { store: formatStore(store) },
    })
  } catch (error) {
    next(error)
  }
}

export const getStoreMenu = async (req, res, next) => {
  try {
    const { id } = req.params
    const { category, search } = req.query

    const store = await Store.findById(id).lean()
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.',
      })
    }

    const filter = { store_id: id }

    if (category) {
      filter.category = category
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' }
    }

    const menuItems = await MenuItem.find(filter).sort({ category: 1, name: 1 })

    res.json({
      success: true,
      data: { menuItems: menuItems.map(formatMenuItem) },
    })
  } catch (error) {
    next(error)
  }
}
