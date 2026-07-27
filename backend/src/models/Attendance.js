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
            required: [true, 'Attendance status is required'],
        },
        status: {
            type: String,
            enum: ['Present', 'Absent', 'Late'],
            required: [true, 'Attendance status is required'],
        },
        markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    }, {
    timestamps: true,
}
);

attendanceSchema.index({ course: 1, student: 1, date: 1 }, { unique: true });

attendanceSchema.index({ student: 1, course: 1 });
const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;  