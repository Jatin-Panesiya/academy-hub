import { Router } from 'express';

import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import studentRoutes from './students.routes.js';
import courseRoutes from './courses.routes.js';
import attendanceRoutes from './attendance.routes.js';
import paymentRoutes from './payments.routes.js';
import assignmentsRoutes from './assignments.routes.js';
import submissionsRoutes from './submissions.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/courses', courseRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/payments', paymentRoutes);
router.use('/assignments', assignmentsRoutes);
router.use('/submissions', submissionsRoutes);

export default router;

