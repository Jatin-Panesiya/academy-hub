import mongoose from 'mongoose';

import { AppError } from '../utils/appError.js';
import { Attendance, Batch, Student } from '../models/index.js';

function validateObjectId(id, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid "${fieldName}". Must be a valid ObjectId.`, { statusCode: 400 });
  }
}

function normalizeDate(dateRaw) {
  const d = dateRaw instanceof Date ? dateRaw : new Date(dateRaw);
  if (Number.isNaN(d.getTime())) {
    throw new AppError('Invalid "date". Must be a valid date.', { statusCode: 400 });
  }
  // Normalize to midnight to make repeated calls for the same day consistent.
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function markAttendance(payload) {
  const { studentId, batchId, date, status } = payload ?? {};

  if (!studentId || !batchId || !date || !status) {
    throw new AppError('Missing required fields: studentId, batchId, date, status', { statusCode: 400 });
  }

  validateObjectId(studentId, 'studentId');
  validateObjectId(batchId, 'batchId');

  const normalizedDate = normalizeDate(date);
  const normalizedStatus = String(status).trim();
  if (!normalizedStatus || normalizedStatus.length > 30) {
    throw new AppError('"status" must be a non-empty string (max 30 chars).', { statusCode: 400 });
  }

  const [student, batch] = await Promise.all([
    Student.findById(studentId).exec(),
    Batch.findById(batchId).exec(),
  ]);

  if (!student) throw new AppError('Student not found', { statusCode: 404 });
  if (!batch) throw new AppError('Batch not found', { statusCode: 404 });

  const attendance = await Attendance.findOneAndUpdate(
    { studentId, batchId, date: normalizedDate },
    { status: normalizedStatus },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  )
    .populate({ path: 'studentId', select: 'name email role' })
    .populate({ path: 'batchId', select: 'batchName courseId schedule startDate' })
    .exec();

  return attendance;
}

export async function getAttendanceByBatch(batchId) {
  validateObjectId(batchId, 'batchId');

  const items = await Attendance.find({ batchId })
    .populate({ path: 'studentId', select: 'name email role' })
    .populate({ path: 'batchId', select: 'batchName schedule startDate' })
    .sort({ date: -1, createdAt: -1 })
    .exec();

  return { items };
}

export async function getAttendanceByStudent(studentId, requester = null) {
  let resolvedStudentId = studentId;

  if (requester?.role === 'student') {
    const requesterEmail = String(requester.email ?? '')
      .trim()
      .toLowerCase();
    if (!requesterEmail) {
      throw new AppError('Unauthorized', { statusCode: 401 });
    }

    const student = await Student.findOne({ email: requesterEmail }).select('_id').exec();
    if (!student) {
      throw new AppError('Student not found', { statusCode: 404 });
    }
    resolvedStudentId = student._id;
  } else {
    validateObjectId(studentId, 'studentId');
  }

  const items = await Attendance.find({ studentId: resolvedStudentId })
    .populate({ path: 'studentId', select: 'name email role' })
    .populate({ path: 'batchId', select: 'batchName schedule startDate' })
    .sort({ date: -1, createdAt: -1 })
    .exec();

  return { items };
}

