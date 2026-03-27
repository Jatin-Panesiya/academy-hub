import { AppError } from '../utils/appError.js';
import { createAssignment, deleteAssignment, listAssignments } from '../services/assignment.service.js';

export async function create(req, res, next) {
  try {
    const assignment = await createAssignment(req.body);
    return res.status(201).json({ assignment });
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(err);
  }
}

export async function list(req, res, next) {
  try {
    const result = await listAssignments(req.user ?? null);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params ?? {};
    if (!id) throw new AppError('Missing assignment id parameter.', { statusCode: 400 });
    const result = await deleteAssignment(id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

