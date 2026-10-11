import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { getOverview, listUsers, updateUser, deleteUser, updateUserSchema, listStores, setStoreStatus, listOrders, updateAccount, accountSchema, validId } from '../controllers/adminController.js'

const router = Router()
router.use(authenticate, authorize('admin'))
router.get('/overview', getOverview)
router.get('/users', listUsers)
router.patch('/users/:id', validId, validate(updateUserSchema), updateUser)
router.delete('/users/:id', validId, deleteUser)
router.get('/stores', listStores)
router.patch('/stores/:id', validId, validate(z.object({ isActive: z.boolean() }).strict()), setStoreStatus)
router.get('/orders', listOrders)
router.put('/account', validate(accountSchema), updateAccount)
export default router
