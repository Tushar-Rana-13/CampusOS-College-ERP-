import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId ,
            ref: 'User',
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        enrolledAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamp: true,
    }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
const Enrollment = new mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;