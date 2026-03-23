import { AppError } from '../utils/appError.js';
import { getAttendanceByBatch, getAttendanceByStudent, markAttendance } from '../services/attendance.service.js';

export async function mark(req, res, next) {
  try {
    const attendance = await markAttendance(req.body);
    return res.status(200).json({ attendance });
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(err);
  }
}

export async function byBatch(req, res, next) {
  try {
    const { id } = req.params ?? {};
    if (!id) throw new AppError('Missing batch id parameter.', { statusCode: 400 });
    const result = await getAttendanceByBatch(id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function byStudent(req, res, next) {
  try {
    const { id } = req.params ?? {};
    if (!id) throw new AppError('Missing student id parameter.', { statusCode: 400 });
    const result = await getAttendanceByStudent(id, req.user ?? null);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

