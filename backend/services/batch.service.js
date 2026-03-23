import mongoose from 'mongoose';

import { AppError } from '../utils/appError.js';
import { Batch, Course, Student } from '../models/index.js';

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
    $or: [{ batchName: { $regex: search, $options: 'i' } }],
  };
}

function validateObjectId(id, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid "${fieldName}". Must be a valid ObjectId.`, { statusCode: 400 });
  }
}

const createRequiredFields = ['batchName', 'courseId', 'schedule', 'startDate'];
const allowedUpdateFields = new Set(createRequiredFields);

export async function listBatches({ page, limit, search }) {
  const { page: pageNum, limit: limitNum, skip } = parsePagination(page, limit);
  const normalizedSearch = normalizeSearch(search);
  const filter = buildSearchFilter(normalizedSearch);

  const [total, items] = await Promise.all([
    Batch.countDocuments(filter),
    Batch.find(filter)
      .populate({ path: 'courseId', select: 'courseName duration fees' })
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

export async function createBatch(payload) {
  const missing = createRequiredFields.filter((f) => payload?.[f] === undefined || payload?.[f] === null || payload?.[f] === '');
  if (missing.length > 0) {
    throw new AppError(`Missing required fields: ${missing.join(', ')}`, { statusCode: 400 });
  }

  validateObjectId(payload.courseId, 'courseId');

  let startDate;
  try {
    startDate = payload.startDate instanceof Date ? payload.startDate : new Date(payload.startDate);
  } catch {
    startDate = NaN;
  }
  if (Number.isNaN(startDate.getTime())) {
    throw new AppError('Invalid "startDate". Must be a valid date.', { statusCode: 400 });
  }

  const course = await Course.findById(payload.courseId).exec();
  if (!course) {
    throw new AppError('Course not found', { statusCode: 404 });
  }

  try {
    const created = await Batch.create({
      batchName: String(payload.batchName).trim(),
      courseId: payload.courseId,
      schedule: String(payload.schedule).trim(),
      startDate,
    });

    return Batch.findById(created._id)
      .populate({ path: 'courseId', select: 'courseName duration fees' })
      .exec();
  } catch (err) {
    if (err?.name === 'ValidationError') {
      throw new AppError(err.message ?? 'Invalid input', { statusCode: 400 });
    }
    throw err;
  }
}

export async function assignStudents(batchId, studentIds) {
  if (!mongoose.Types.ObjectId.isValid(batchId)) {
    throw new AppError('Invalid batch id.', { statusCode: 400 });
  }
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new AppError('"studentIds" must be a non-empty array.', { statusCode: 400 });
  }
  studentIds.forEach((id, idx) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(`Invalid "studentIds"[${idx}]. Must be a valid ObjectId.`, { statusCode: 400 });
    }
  });

  const batch = await Batch.findById(batchId).exec();
  if (!batch) {
    throw new AppError('Batch not found', { statusCode: 404 });
  }

  const courseId = batch.courseId;

  const uniqueIds = [...new Set(studentIds)];
  const existingCount = await Student.countDocuments({ _id: { $in: uniqueIds } }).exec();
  if (existingCount !== uniqueIds.length) {
    throw new AppError('One or more students not found', { statusCode: 404 });
  }

  await Student.updateMany(
    { _id: { $in: uniqueIds } },
    {
      $set: {
        batchId: batchId,
        courseId,
      },
    }
  ).exec();

  return Batch.findById(batchId)
    .populate({ path: 'courseId', select: 'courseName duration fees' })
    .exec();
}

