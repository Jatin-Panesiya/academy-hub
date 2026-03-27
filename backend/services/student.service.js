import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { Student, User } from '../models/index.js';

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
    $or: [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ],
  };
}

function parseDate(dateRaw, fieldName) {
  const d = dateRaw instanceof Date ? dateRaw : new Date(dateRaw);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`Invalid "${fieldName}". Must be a valid date.`, { statusCode: 400 });
  }
  return d;
}

const createRequiredFields = ['name', 'email', 'phone', 'courseId', 'feesTotal', 'feesPaid', 'joinDate'];
const allowedUpdateFields = new Set(createRequiredFields);

function validateObjectId(id, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid "${fieldName}". Must be a valid ObjectId.`, { statusCode: 400 });
  }
}

function generateTemporaryPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function listStudents({ page, limit, search }) {
  const { page: pageNum, limit: limitNum, skip } = parsePagination(page, limit);
  const normalizedSearch = normalizeSearch(search);

  const filter = buildSearchFilter(normalizedSearch);

  const [total, items] = await Promise.all([
    Student.countDocuments(filter),
    Student.find(filter)
      .populate('courseId', 'courseName')
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

export async function createStudent(payload) {
  const missing = createRequiredFields.filter((f) => payload?.[f] === undefined || payload?.[f] === null || payload?.[f] === '');
  if (missing.length > 0) {
    throw new AppError(`Missing required fields: ${missing.join(', ')}`, { statusCode: 400 });
  }

  validateObjectId(payload.courseId, 'courseId');

  const joinDate = parseDate(payload.joinDate, 'joinDate');

  try {
    const email = String(payload.email).trim().toLowerCase();
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      throw new AppError('A user account already exists with this email. Student can login using existing credentials.', {
        statusCode: 409,
      });
    }

    const student = await Student.create({
      name: String(payload.name).trim(),
      email,
      phone: String(payload.phone).trim(),
      courseId: payload.courseId,
      feesTotal: payload.feesTotal,
      feesPaid: payload.feesPaid,
      joinDate,
    });

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, env.BCRYPT_SALT_ROUNDS);
    await User.create({
      name: String(payload.name).trim(),
      email,
      password: hashedPassword,
      role: 'student',
      mustChangePassword: true,
    });

    return {
      student,
      onboarding: {
        email,
        temporaryPassword,
      },
    };
  } catch (err) {
    if (err?.name === 'ValidationError') {
      throw new AppError(err.message ?? 'Invalid input', { statusCode: 400 });
    }
    throw err;
  }
}

export async function updateStudent(studentId, payload) {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new AppError('Invalid student id.', { statusCode: 400 });
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

  if (payload.name !== undefined) update.name = String(payload.name).trim();
  if (payload.email !== undefined) update.email = String(payload.email).trim();
  if (payload.phone !== undefined) update.phone = String(payload.phone).trim();
  if (payload.courseId !== undefined) {
    validateObjectId(payload.courseId, 'courseId');
    update.courseId = payload.courseId;
  }
  if (payload.feesTotal !== undefined) update.feesTotal = payload.feesTotal;
  if (payload.feesPaid !== undefined) update.feesPaid = payload.feesPaid;
  if (payload.joinDate !== undefined) update.joinDate = parseDate(payload.joinDate, 'joinDate');

  try {
    const currentStudent = await Student.findById(studentId).exec();
    if (!currentStudent) {
      throw new AppError('Student not found', { statusCode: 404 });
    }

    const previousEmail = String(currentStudent.email ?? '').toLowerCase();
    const nextEmail = String(update.email ?? currentStudent.email ?? '').toLowerCase();
    if (update.email !== undefined) {
      const userWithNextEmail = await User.findOne({ email: nextEmail }).exec();
      if (userWithNextEmail && nextEmail !== previousEmail) {
        throw new AppError('A user account already exists with this email.', { statusCode: 409 });
      }
    }

    const student = await Student.findByIdAndUpdate(studentId, { ...update, email: nextEmail }, {
      new: true,
      runValidators: true,
    }).exec();

    await User.updateOne({ email: previousEmail }, { $set: { email: nextEmail, name: student.name } }).exec();

    return student;
  } catch (err) {
    if (err?.name === 'ValidationError') {
      throw new AppError(err.message ?? 'Invalid input', { statusCode: 400 });
    }
    throw err;
  }
}

export async function deleteStudent(studentId) {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new AppError('Invalid student id.', { statusCode: 400 });
  }

  const student = await Student.findByIdAndDelete(studentId).exec();
  if (!student) {
    throw new AppError('Student not found', { statusCode: 404 });
  }

  return { deleted: true };
}

export async function resetStudentPassword(studentId) {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new AppError('Invalid student id.', { statusCode: 400 });
  }

  const student = await Student.findById(studentId).exec();
  if (!student) {
    throw new AppError('Student not found', { statusCode: 404 });
  }

  const email = String(student.email ?? '').toLowerCase();
  const temporaryPassword = generateTemporaryPassword();
  const hashed = await bcrypt.hash(temporaryPassword, env.BCRYPT_SALT_ROUNDS);
  const user = await User.findOne({ email }).exec();
  if (!user) {
    await User.create({
      name: student.name,
      email,
      password: hashed,
      role: 'student',
      mustChangePassword: true,
    });
  } else {
    user.password = hashed;
    user.mustChangePassword = true;
    await user.save();
  }

  return {
    email,
    temporaryPassword,
  };
}

