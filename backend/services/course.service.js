import mongoose from 'mongoose';

import { AppError } from '../utils/appError.js';
import { Course } from '../models/index.js';

const MAX_LIMIT = 100;

function parsePagination(pageRaw, limitRaw) {
  const page = Number(pageRaw ?? 1);
  const limit = Number(limitRaw ?? 10);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError('Invalid "page". Must be an integer >= 1.', { statusCode: 400 });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new AppError(`Invalid "limit". Must be an integer between 1 and ${MAX_LIMIT}.`, { statusCode: 400 });
  }

  return { page, limit, skip: (page - 1) * limit };
}

function normalizeSearch(searchRaw) {
  const search = String(searchRaw ?? '').trim();
  return search.length > 0 ? search : '';
}

function buildSearchFilter(search) {
  if (!search) return {};
  return {
    $or: [{ courseName: { $regex: search, $options: 'i' } }],
  };
}

function validateObjectId(id, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid "${fieldName}". Must be a valid ObjectId.`, { statusCode: 400 });
  }
}

const createRequiredFields = ['courseName', 'duration', 'fees'];
const allowedUpdateFields = new Set(createRequiredFields);

export async function listCourses({ page, limit, search }) {
  const { page: pageNum, limit: limitNum, skip } = parsePagination(page, limit);
  const normalizedSearch = normalizeSearch(search);
  const filter = buildSearchFilter(normalizedSearch);

  const [total, items] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec(),
  ]);

  return {
    items,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.max(1, Math.ceil(total / limitNum)),
  };
}

export async function createCourse(payload) {
  const missing = createRequiredFields.filter((f) => payload?.[f] === undefined || payload?.[f] === null || payload?.[f] === '');
  if (missing.length > 0) {
    throw new AppError(`Missing required fields: ${missing.join(', ')}`, { statusCode: 400 });
  }

  try {
    const course = await Course.create({
      courseName: String(payload.courseName).trim(),
      duration: payload.duration,
      fees: payload.fees,
    });

    return course;
  } catch (err) {
    if (err?.name === 'ValidationError') {
      throw new AppError(err.message ?? 'Invalid input', { statusCode: 400 });
    }
    throw err;
  }
}

export async function updateCourse(courseId, payload) {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new AppError('Invalid course id.', { statusCode: 400 });
  }

  const updateKeys = Object.keys(payload ?? {});
  if (updateKeys.length === 0) {
    throw new AppError('No fields provided for update.', { statusCode: 400 });
  }

  const invalidKeys = updateKeys.filter((k) => !allowedUpdateFields.has(k));
  if (invalidKeys.length > 0) {
    throw new AppError(`Invalid fields for update: ${invalidKeys.join(', ')}`, { statusCode: 400 });
  }

  const update = {};
  if (payload.courseName !== undefined) update.courseName = String(payload.courseName).trim();
  if (payload.duration !== undefined) update.duration = payload.duration;
  if (payload.fees !== undefined) update.fees = payload.fees;

  try {
    const course = await Course.findByIdAndUpdate(courseId, update, {
      new: true,
      runValidators: true,
    })
      .exec();

    if (!course) {
      throw new AppError('Course not found', { statusCode: 404 });
    }

    return course;
  } catch (err) {
    if (err?.name === 'ValidationError') {
      throw new AppError(err.message ?? 'Invalid input', { statusCode: 400 });
    }
    throw err;
  }
}

export async function deleteCourse(courseId) {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new AppError('Invalid course id.', { statusCode: 400 });
  }

  const course = await Course.findByIdAndDelete(courseId).exec();
  if (!course) {
    throw new AppError('Course not found', { statusCode: 404 });
  }

  return { deleted: true };
}

