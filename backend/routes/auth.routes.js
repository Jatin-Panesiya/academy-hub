import { Router } from 'express';

import { createAdmin, login, changePassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
// Postman-friendly alias for admin onboarding (requires x-admin-key header).
router.post('/register', createAdmin);
router.post('/create-admin', createAdmin);
router.post('/change-password', protect, changePassword);

export default router;

