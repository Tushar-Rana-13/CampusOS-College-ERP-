import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    submissionText: {
      type: String,
      trim: true,
      maxlength: [2000, 'Submission text cannot exceed 2000 characters'],
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['Submitted', 'Late', 'Graded'],
        message: '{VALUE} is not a valid submission status',
      },
      default: 'Submitted',
    },
    marksObtained: {
      type: Number,
      min: [0, 'Marks obtained cannot be negative'],
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    gradedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce single submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

// Efficient lookups for student dashboard history
submissionSchema.index({ student: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;