import { AppError } from '../utils/appError.js';
import { submitAssignmentForUser } from '../services/submission.service.js';

export async function submit(req, res, next) {
  try {
    const { assignmentId, fileUrl } = req.body ?? {};
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId) {
      throw new AppError('Authenticated student id missing from token.', { statusCode: 401 });
    }

    const submission = await submitAssignmentForUser({ assignmentId, userId, userEmail, fileUrl });
    return res.status(201).json({ submission });
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(err);
  }
}

