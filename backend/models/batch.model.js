import mongoose from 'mongoose';

const { Schema } = mongoose;

const BatchSchema = new Schema(
  {
    batchName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    schedule: {
      // Kept as a string to avoid hard-coding a specific format.
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    startDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Batch', BatchSchema);

