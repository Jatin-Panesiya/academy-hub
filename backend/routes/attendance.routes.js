import { Router } from 'express';

import { protect, authorize } from '../middleware/auth.middleware.js';
import { byBatch, byStudent, mark } from '../controllers/attendance.controller.js';

const router = Router();

// Protect all attendance endpoints; only admin can mark attendance.
router.use(protect);

router.post('/', authorize('admin'), mark);
router.get('/batch/:id', byBatch);
router.get('/student/:id', byStudent);

export default router;

