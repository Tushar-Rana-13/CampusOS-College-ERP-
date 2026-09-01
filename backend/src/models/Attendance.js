import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['Present', 'Absent', 'Late'],
        message: '{VALUE} is not a valid attendance status',
      },
      required: [true, 'Attendance status is required'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'MarkedBy reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Ensures a student has only ONE attendance entry per course per day
attendanceSchema.index({ course: 1, student: 1, date: 1 }, { unique: true });

// Speeds up student report aggregation ($match on student & course)
attendanceSchema.index({ student: 1, course: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;