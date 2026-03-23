import mongoose from 'mongoose';

const { Schema } = mongoose;

const StudentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 320,
      match: /^\S+@\S+\.\S+$/,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    feesTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    feesPaid: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    joinDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Student', StudentSchema);

