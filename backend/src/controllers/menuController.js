import Store from '../models/Store.js'
import MenuItem from '../models/MenuItem.js'
import { formatMenuItem } from '../utils/formatters.js'

export const addMenuItem = async (req, res, next) => {
  try {
    const userId = req.user.id

    const store = await Store.findOne({ owner_id: userId })
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'You do not own a store.',
      })
    }

    const { name, description, price, category } = req.body
    let imageUrl = null
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`
    }

    const menuItem = await MenuItem.create({
      store_id: store._id,
      name,
      description: description || null,
      price: Number(price),
      image_url: imageUrl,
      category: category || null,
    })

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully.',
      data: { menuItem: formatMenuItem(menuItem) },
    })
  } catch (error) {
    next(error)
  }
}

export const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const item = await MenuItem.findById(id).populate('store_id', 'owner_id')

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      })
    }

    if (item.store_id.owner_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this menu item.',
      })
    }

    const { name, description, price, category, is_available } = req.body

    if (name) item.name = name
    if (description !== undefined) item.description = description
    if (price !== undefined) item.price = Number(price)
    if (category !== undefined) item.category = category
    if (is_available !== undefined) item.is_available = is_available === true || is_available === 'true'

    if (req.file) {
      item.image_url = `/uploads/${req.file.filename}`
    }

    await item.save()

    res.json({
      success: true,
      message: 'Menu item updated successfully.',
      data: { menuItem: formatMenuItem(item) },
    })
  } catch (error) {
    next(error)
  }
}

export const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const item = await MenuItem.findById(id).populate('store_id', 'owner_id')

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      })
    }

    if (item.store_id.owner_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this menu item.',
      })
    }

    await MenuItem.deleteOne({ _id: id })

    res.json({
      success: true,
      message: 'Menu item deleted successfully.',
    })
  } catch (error) {
    next(error)
  }
}

export const toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const item = await MenuItem.findById(id).populate('store_id', 'owner_id')

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      })
    }

    if (item.store_id.owner_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this menu item.',
      })
    }

    item.is_available = !item.is_available
    await item.save()

    res.json({
      success: true,
      message: `Menu item is now ${item.is_available ? 'available' : 'unavailable'}.`,
      data: { menuItem: formatMenuItem(item) },
    })
  } catch (error) {
    next(error)
  }
}
