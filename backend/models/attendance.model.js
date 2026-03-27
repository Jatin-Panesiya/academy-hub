import mongoose from 'mongoose';

const { Schema } = mongoose;

const AttendanceSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
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

// Index to speed up attendance lookups for a student per day.
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: false });

export default mongoose.model('Attendance', AttendanceSchema);

