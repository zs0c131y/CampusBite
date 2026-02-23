import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { getAllStores, getStoreById, updateStore, getStoreMenu } from '../controllers/storeController.js';

const router = Router();

router.get('/', getAllStores);
router.get('/:id', getStoreById);
router.put(
  '/:id',
  authenticate,
  authorize('store_employee'),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'qr_code', maxCount: 1 },
  ]),
  updateStore
);
router.get('/:id/menu', getStoreMenu);

export default router;
