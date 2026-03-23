import { AppError } from '../utils/appError.js';
import { createCourse, deleteCourse, listCourses, updateCourse } from '../services/course.service.js';

export async function list(req, res, next) {
  try {
    const { page, limit, search } = req.query ?? {};
    const result = await listCourses({ page, limit, search });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function create(req, res, next) {
  try {
    const course = await createCourse(req.body);
    return res.status(201).json({ course });
  } catch (err) {
    return next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params ?? {};
    if (!id) throw new AppError('Missing course id parameter.', { statusCode: 400 });
    const course = await updateCourse(id, req.body);
    return res.status(200).json({ course });
  } catch (err) {
    return next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params ?? {};
    if (!id) throw new AppError('Missing course id parameter.', { statusCode: 400 });
    const result = await deleteCourse(id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

