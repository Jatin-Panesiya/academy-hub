import mongoose from 'mongoose';

import { AppError } from '../utils/appError.js';
import { Assignment, Course, Student } from '../models/index.js';

function validateObjectId(id, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid "${fieldName}". Must be a valid ObjectId.`, { statusCode: 400 });
  }
}

function parseDate(dateRaw, fieldName) {
  const d = dateRaw instanceof Date ? dateRaw : new Date(dateRaw);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`Invalid "${fieldName}". Must be a valid date.`, { statusCode: 400 });
  }
  return d;
}

export async function createAssignment(payload) {
  const { title, description, deadline, courseId } = payload ?? {};

  if (!title || !description || !deadline || !courseId) {
    throw new AppError('Missing required fields: title, description, deadline, courseId', { statusCode: 400 });
  }

  parseDate(deadline, 'deadline');
  validateObjectId(courseId, 'courseId');

  const courseExists = await Course.exists({ _id: courseId });
  if (!courseExists) {
    throw new AppError('Course not found', { statusCode: 404 });
  }

  const assignment = await Assignment.create({
    title: String(title).trim(),
    description: String(description).trim(),
    deadline: parseDate(deadline, 'deadline'),
    courseId,
  });

  return assignment;
}

export async function listAssignments(requester = null) {
  const filter = {};

  if (requester?.role === 'student') {
    const requesterEmail = String(requester.email ?? '').trim().toLowerCase();
    if (!requesterEmail) {
      throw new AppError('Unauthorized', { statusCode: 401 });
    }

    const student = await Student.findOne({ email: requesterEmail }).select('courseId').exec();
    if (!student) {
      throw new AppError('Student not found', { statusCode: 404 });
    }

    filter.courseId = student.courseId;
  }

  const items = await Assignment.find(filter)
    .populate('courseId', 'courseName')
    .sort({ deadline: 1, createdAt: -1 })
    .exec();

  return { items };
}

export async function deleteAssignment(assignmentId) {
  validateObjectId(assignmentId, 'assignmentId');

  const deleted = await Assignment.findByIdAndDelete(assignmentId).exec();
  if (!deleted) {
    throw new AppError('Assignment not found', { statusCode: 404 });
  }

  return { deleted: true };
}

