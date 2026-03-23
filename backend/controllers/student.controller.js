import { AppError } from '../utils/appError.js';
import { createStudent, deleteStudent, listStudents, resetStudentPassword, updateStudent } from '../services/student.service.js';

export async function list(req, res, next) {
  try {
    const { page, limit, search } = req.query ?? {};
    const result = await listStudents({ page, limit, search });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function create(req, res, next) {
  try {
    const result = await createStudent(req.body);
    return res.status(201).json(result);
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params ?? {};
    if (!id) throw new AppError('Missing student id parameter.', { statusCode: 400 });
    const student = await updateStudent(id, req.body);
    return res.status(200).json({ student });
  } catch (err) {
    return next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params ?? {};
    if (!id) throw new AppError('Missing student id parameter.', { statusCode: 400 });
    const result = await deleteStudent(id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { id } = req.params ?? {};
    if (!id) throw new AppError('Missing student id parameter.', { statusCode: 400 });
    const onboarding = await resetStudentPassword(id);
    return res.status(200).json({
      message: 'Temporary password generated',
      onboarding,
    });
  } catch (err) {
    return next(err);
  }
}

