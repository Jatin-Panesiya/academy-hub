import { AppError } from '../utils/appError.js';
import { assignStudents, createBatch, listBatches } from '../services/batch.service.js';

export async function list(req, res, next) {
  try {
    const { page, limit, search } = req.query ?? {};
    const result = await listBatches({ page, limit, search });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function create(req, res, next) {
  try {
    const batch = await createBatch(req.body);
    return res.status(201).json({ batch });
  } catch (err) {
    return next(err);
  }
}

export async function addStudents(req, res, next) {
  try {
    const { id } = req.params ?? {};
    if (!id) throw new AppError('Missing batch id parameter.', { statusCode: 400 });

    const { studentIds } = req.body ?? {};
    if (!Array.isArray(studentIds)) {
      throw new AppError('Missing or invalid required field: studentIds', { statusCode: 400 });
    }

    const batch = await assignStudents(id, studentIds);
    return res.status(200).json({ batch });
  } catch (err) {
    return next(err);
  }
}

