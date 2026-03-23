import mongoose from 'mongoose';

import { AppError } from '../utils/appError.js';
import { Assignment, Batch } from '../models/index.js';

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
  const { title, description, batchId, deadline } = payload ?? {};

  if (!title || !description || !batchId || !deadline) {
    throw new AppError('Missing required fields: title, description, batchId, deadline', { statusCode: 400 });
  }

  validateObjectId(batchId, 'batchId');
  parseDate(deadline, 'deadline');

  const batch = await Batch.findById(batchId).exec();
  if (!batch) {
    throw new AppError('Batch not found', { statusCode: 404 });
  }

  const assignment = await Assignment.create({
    title: String(title).trim(),
    description: String(description).trim(),
    batchId,
    deadline: parseDate(deadline, 'deadline'),
  });

  return assignment;
}

export async function listAssignmentsByBatch(batchId) {
  validateObjectId(batchId, 'batchId');

  const items = await Assignment.find({ batchId })
    .sort({ deadline: 1, createdAt: -1 })
    .exec();

  return { items };
}

