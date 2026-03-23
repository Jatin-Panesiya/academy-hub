import mongoose from 'mongoose';

const { Schema } = mongoose;

const SubmissionSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

// A student can submit a particular assignment multiple times (e.g., resubmissions),
// so we don't enforce uniqueness at this layer.

export default mongoose.model('Submission', SubmissionSchema);

