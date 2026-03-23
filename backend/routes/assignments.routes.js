import { Router } from 'express';

import { protect, authorize } from '../middleware/auth.middleware.js';
import { create, listByBatch } from '../controllers/assignment.controller.js';

const router = Router();

router.use(protect);

// Admin creates assignments.
router.post('/', authorize('admin'), create);

// Admin and student can fetch assignments for a batch.
router.get('/batch/:id', authorize('admin', 'student'), listByBatch);

export default router;

