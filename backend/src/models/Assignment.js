import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course reference is required'],
        },
        title: {
            type: String,
            required: [true, 'Assignment title is required'],
            trim: true,
            maxlength: [150, 'Title cannot exceed 150 characters'],
        },
        description: {
            type: String,
            required: [true, 'Assignment description is required'],
            trim: true,
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required'],
            validate: {
                validator: function (value) {
                    // Prevent setting due dates in the past during creation
                    return this.isNew ? value > new Date() : true;
                },
                message: 'Due date must be a future date',
            },
        },
        maxMarks: {
            type: Number,
            required: [true, 'Maximum marks are required'],
            min: [1, 'Maximum marks must be at least 1'],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Faculty author reference is required'],
        },
    },
    {
        timestamps: true, // Auto-manages createdAt and updatedAt
    }
);

// Indexing course and dueDate together optimizes fetching upcoming assignments per course
assignmentSchema.index({ course: 1, dueDate: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;