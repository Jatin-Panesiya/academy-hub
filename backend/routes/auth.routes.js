import { Router } from 'express';

import { createAdmin, login, changePassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/create-admin', createAdmin);
router.post('/change-password', protect, changePassword);

export default router;

