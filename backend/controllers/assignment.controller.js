import { AppError } from '../utils/appError.js';
import { createAssignment, listAssignmentsByBatch } from '../services/assignment.service.js';

export async function create(req, res, next) {
  try {
    const assignment = await createAssignment(req.body);
    return res.status(201).json({ assignment });
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(err);
  }
}

export async function listByBatch(req, res, next) {
  try {
    const { id } = req.params ?? {};
    if (!id) throw new AppError('Missing batch id parameter.', { statusCode: 400 });
    const result = await listAssignmentsByBatch(id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

