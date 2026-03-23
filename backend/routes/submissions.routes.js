import { Router } from 'express';

import { protect, authorize } from '../middleware/auth.middleware.js';
import { submit } from '../controllers/submission.controller.js';

const router = Router();

router.use(protect);

// Student submits assignment.
router.post('/', authorize('student'), submit);

export default router;

