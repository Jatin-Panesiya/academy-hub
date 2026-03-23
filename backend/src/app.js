import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { env } from '../config/env.js';
import apiRoutes from '../routes/index.js';
import studentsRoutes from '../routes/students.routes.js';
import coursesRoutes from '../routes/courses.routes.js';
import batchesRoutes from '../routes/batches.routes.js';
import attendanceRoutes from '../routes/attendance.routes.js';
import paymentRoutes from '../routes/payments.routes.js';
import assignmentsRoutes from '../routes/assignments.routes.js';
import submissionsRoutes from '../routes/submissions.routes.js';
import notFound from '../middleware/notFound.js';
import errorHandler from '../middleware/errorHandler.js';

const app = express();

// Basic hardening for Express.
app.disable('x-powered-by');

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api', apiRoutes);
// Provide endpoints without the `/api` prefix (e.g. `GET /students`).
app.use('/students', studentsRoutes);
app.use('/courses', coursesRoutes);
app.use('/batches', batchesRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/payments', paymentRoutes);
app.use('/assignments', assignmentsRoutes);
app.use('/submissions', submissionsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

