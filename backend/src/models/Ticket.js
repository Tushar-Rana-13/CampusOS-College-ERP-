import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Academic', 'IT_Support', 'Finance', 'Administration', 'Other'],
        message: '{VALUE} is not a valid helpdesk category',
      },
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In_Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin or Faculty handling the issue
    },
    resolutionNotes: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up dashboard lookups & filtering by status/student
ticketSchema.index({ raisedBy: 1, status: 1 });
ticketSchema.index({ category: 1, status: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;