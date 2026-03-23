import mongoose from 'mongoose';

const { Schema } = mongoose;

const CourseSchema = new Schema(
  {
    courseName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    fees: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Course', CourseSchema);

