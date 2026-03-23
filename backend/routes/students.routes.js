import { Router } from 'express';

import { protect, authorize } from '../middleware/auth.middleware.js';
import { create, list, remove, resetPassword, update } from '../controllers/student.controller.js';

const router = Router();

// Admin-only student management.
router.use(protect, authorize('admin'));

router.get('/', list);
router.post('/', create);
router.post('/:id/reset-password', resetPassword);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;

