import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      min: [1, 'Course must be at least 1 credit'],
      max: [6, 'Course cannot exceed 6 credits'],
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned faculty member is required'],
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'], // e.g., "Fall 2026", "Spring 2026"
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to optimize filtering courses by department and semester
courseSchema.index({ department: 1, semester: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;   