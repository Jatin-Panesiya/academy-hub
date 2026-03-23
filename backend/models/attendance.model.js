import mongoose from 'mongoose';

const { Schema } = mongoose;

const AttendanceSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
  },
  {
    timestamps: true,
  }
);

// Index to speed up common lookups (e.g., attendance history for a student/batch).
AttendanceSchema.index({ studentId: 1, batchId: 1, date: 1 }, { unique: false });

export default mongoose.model('Attendance', AttendanceSchema);

