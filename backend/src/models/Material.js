import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Associated course is required'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL or resource link is required'],
    },
    fileType: {
      type: String,
      enum: ['pdf', 'document', 'slides', 'link'],
      default: 'pdf',
    },
  },
  { timestamps: true }
);

// Compound index to quickly fetch materials for a specific course
materialSchema.index({ course: 1, createdAt: -1 });

const Material = mongoose.model('Material', materialSchema);
export default Material;