import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { addMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability } from '../controllers/menuController.js';

const router = Router();

router.post('/', authenticate, authorize('store_employee'), upload.single('image'), addMenuItem);
router.put('/:id', authenticate, authorize('store_employee'), upload.single('image'), updateMenuItem);
router.delete('/:id', authenticate, authorize('store_employee'), deleteMenuItem);
router.patch('/:id/availability', authenticate, authorize('store_employee'), toggleAvailability);

export default router;
