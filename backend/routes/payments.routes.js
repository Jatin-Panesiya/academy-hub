import { Router } from 'express';

import { protect, authorize } from '../middleware/auth.middleware.js';
import { add, historyByStudent } from '../controllers/payment.controller.js';

const router = Router();

router.use(protect);

// Admin can add payment.
router.post('/', authorize('admin'), add);

// Any authenticated role can view a student's payment history.
router.get('/student/:id', historyByStudent);

export default router;

