import { Router } from 'express';

import { protect, authorize } from '../middleware/auth.middleware.js';
import { create, list, remove, update } from '../controllers/course.controller.js';

const router = Router();

// Admin-only course management.
router.use(protect, authorize('admin'));

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;

