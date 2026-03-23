import mongoose from 'mongoose';

import { AppError } from '../utils/appError.js';
import { Assignment, Submission, Student } from '../models/index.js';

function validateObjectId(id, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid "${fieldName}". Must be a valid ObjectId.`, { statusCode: 400 });
  }
}

export async function submitAssignment({ assignmentId, studentId, fileUrl }) {
  if (!assignmentId || !studentId || !fileUrl) {
    throw new AppError('Missing required fields: assignmentId, studentId, fileUrl', { statusCode: 400 });
  }

  validateObjectId(assignmentId, 'assignmentId');
  validateObjectId(studentId, 'studentId');

  const normalizedFileUrl = String(fileUrl).trim();
  if (!normalizedFileUrl) {
    throw new AppError('"fileUrl" cannot be empty.', { statusCode: 400 });
  }

  const [assignment, student] = await Promise.all([
    Assignment.findById(assignmentId).exec(),
    Student.findById(studentId).exec(),
  ]);

  if (!assignment) {
    throw new AppError('Assignment not found', { statusCode: 404 });
  }
  if (!student) {
    throw new AppError('Student not found', { statusCode: 404 });
  }

  const submission = await Submission.create({
    assignmentId,
    studentId,
    fileUrl: normalizedFileUrl,
  });

  return submission;
}

export async function submitAssignmentForUser({ assignmentId, userId, userEmail, fileUrl }) {
  if (!assignmentId) {
    throw new AppError('Missing required field: assignmentId', { statusCode: 400 });
  }
  if (!userId && !userEmail) {
    throw new AppError('Authenticated student identity missing from token.', { statusCode: 401 });
  }
  if (fileUrl === undefined || fileUrl === null) {
    throw new AppError('Missing required field: fileUrl', { statusCode: 400 });
  }

  validateObjectId(assignmentId, 'assignmentId');

  const normalizedFileUrl = String(fileUrl).trim();
  if (!normalizedFileUrl) {
    throw new AppError('"fileUrl" cannot be empty.', { statusCode: 400 });
  }

  let student = null;
  if (mongoose.Types.ObjectId.isValid(userId)) {
    student = await Student.findById(userId).exec();
  }

  // Fallback when User._id and Student._id are different collections.
  if (!student && userEmail) {
    student = await Student.findOne({ email: String(userEmail).toLowerCase().trim() }).exec();
  }

  const assignment = await Assignment.findById(assignmentId).exec();
  if (!assignment) {
    throw new AppError('Assignment not found', { statusCode: 404 });
  }

  if (!student) {
    throw new AppError('Student not found', { statusCode: 404 });
  }

  const submission = await Submission.create({
    assignmentId,
    studentId: student._id,
    fileUrl: normalizedFileUrl,
  });

  return submission;
}

