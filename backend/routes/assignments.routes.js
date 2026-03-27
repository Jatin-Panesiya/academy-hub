import { Router } from 'express';

import { protect, authorize } from '../middleware/auth.middleware.js';
import { create, list, remove } from '../controllers/assignment.controller.js';

const router = Router();

router.use(protect);

// Admin creates assignments.
router.post('/', authorize('admin'), create);

// Admin can fetch all assignments; student receives course-specific assignments.
router.get('/', authorize('admin', 'student'), list);
router.delete('/:id', authorize('admin'), remove);

export default router;

