import { Router } from 'express';

import { protect, authorize } from '../middleware/auth.middleware.js';
import { addStudents, create, list } from '../controllers/batch.controller.js';

const router = Router();

// Admin-only batch management.
router.use(protect, authorize('admin'));

router.get('/', list);
router.post('/', create);
router.post('/:id/students', addStudents);

export default router;

