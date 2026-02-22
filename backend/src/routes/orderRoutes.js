import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createCheckoutSession,
  createOrder,
  getOrders,
  getOrderById,
  updatePaymentStatus,
  updateOrderStatus,
  verifyOrderOtp,
  pollOrderStatus,
} from '../controllers/orderController.js';

const router = Router();

router.post('/checkout-session', authenticate, createCheckoutSession);
router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/payment-status', authenticate, authorize('store_employee'), updatePaymentStatus);
router.patch('/:id/status', authenticate, authorize('store_employee'), updateOrderStatus);
router.post('/:id/verify-otp', authenticate, authorize('store_employee'), verifyOrderOtp);
router.get('/:id/poll-status', authenticate, pollOrderStatus);

export default router;
