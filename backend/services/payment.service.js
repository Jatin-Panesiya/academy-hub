import mongoose from 'mongoose';

import { AppError } from '../utils/appError.js';
import { Payment, Student } from '../models/index.js';

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
  return d;
}

export async function addPayment(payload) {
  const { studentId, amount, date, paymentMethod } = payload ?? {};

  if (!studentId || amount === undefined || amount === null || !date || !paymentMethod) {
    throw new AppError('Missing required fields: studentId, amount, date, paymentMethod', { statusCode: 400 });
  }

  validateObjectId(studentId, 'studentId');

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError('"amount" must be a positive number.', { statusCode: 400 });
  }

  const normalizedDate = normalizeDate(date);
  const normalizedPaymentMethod = String(paymentMethod).trim();
  if (!normalizedPaymentMethod) {
    throw new AppError('"paymentMethod" cannot be empty.', { statusCode: 400 });
  }

  const student = await Student.findById(studentId).exec();
  if (!student) {
    throw new AppError('Student not found', { statusCode: 404 });
  }

  // Create the payment entry.
  const payment = await Payment.create({
    studentId,
    amount: numericAmount,
    date: normalizedDate,
    paymentMethod: normalizedPaymentMethod,
  });

  // Update running totals (feesPaid) for the student.
  // Note: we intentionally don't enforce "cannot exceed feesTotal" at the schema layer.
  await Student.findByIdAndUpdate(studentId, { $inc: { feesPaid: numericAmount } }, { new: false }).exec();

  const updatedStudent = await Student.findById(studentId).exec();

  const paidTotal = updatedStudent?.feesPaid ?? 0;
  const feesTotal = updatedStudent?.feesTotal ?? 0;
  const pendingFees = Math.max(0, feesTotal - paidTotal);

  return { payment, student: updatedStudent, paidTotal, pendingFees };
}

export async function getPaymentHistoryByStudent(studentId, requester = null) {
  let student = null;

  if (requester?.role === 'student') {
    const requesterEmail = String(requester.email ?? '')
      .trim()
      .toLowerCase();
    if (!requesterEmail) {
      throw new AppError('Unauthorized', { statusCode: 401 });
    }

    student = await Student.findOne({ email: requesterEmail }).exec();
    if (!student) {
      throw new AppError('Student not found', { statusCode: 404 });
    }
  } else {
    validateObjectId(studentId, 'studentId');
    student = await Student.findById(studentId).exec();
    if (!student) {
      throw new AppError('Student not found', { statusCode: 404 });
    }
  }

  const [payments] = await Promise.all([
    Payment.find({ studentId: student._id })
      .sort({ date: -1, createdAt: -1 })
      .exec(),
  ]);

  const paidTotal = student.feesPaid ?? 0;
  const feesTotal = student.feesTotal ?? 0;
  const pendingFees = Math.max(0, feesTotal - paidTotal);

  return { student: { id: student._id.toString(), name: student.name, email: student.email }, payments, paidTotal, pendingFees };
}

