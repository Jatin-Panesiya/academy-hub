import { AppError } from '../utils/appError.js';
import { addPayment, getPaymentHistoryByStudent } from '../services/payment.service.js';

export async function add(req, res, next) {
  try {
    const result = await addPayment(req.body);
    return res.status(201).json(result);
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(err);
  }
}

export async function historyByStudent(req, res, next) {
  try {
    const { id } = req.params ?? {};
    if (!id) throw new AppError('Missing student id parameter.', { statusCode: 400 });
    const result = await getPaymentHistoryByStudent(id, req.user ?? null);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

