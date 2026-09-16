import User from '../models/User.js';
import Course from '../models/Course.js';
import Ticket from '../models/Ticket.js';
import Enrollment from '../models/Enrollment.js';

/**
 * @desc    Admin registers a new Student or Faculty member
 * @route   POST /api/admin/users
 * @access  Private (Admin)
 */
export const registerUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, department, designation, semester } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.',
      });
    }

    if (!['student', 'faculty'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be student or faculty.',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    if (role === 'student' && !rollNumber?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Roll number is required for student accounts.',
      });
    }

    if (role === 'student' && (!Number.isInteger(Number(semester)) || Number(semester) < 1 || Number(semester) > 8)) {
      return res.status(400).json({
        success: false,
        message: 'Semester must be a whole number between 1 and 8.',
      });
    }

    if (role === 'student' && rollNumber) {
      const existingRoll = await User.findOne({ rollNumber });
      if (existingRoll) {
        return res.status(400).json({
          success: false,
          message: 'A student with this roll number already exists.',
        });
      }
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      rollNumber: role === 'student' ? rollNumber || null : null,
      department: department || 'Computer Science',
      designation: role === 'faculty' ? designation || 'Assistant Professor' : '',
      semester: role === 'student' ? Number(semester) || 1 : undefined,
    });

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`,
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        rollNumber: newUser.rollNumber,
        department: newUser.department,
      },
    });
  } catch (error) {
    console.error('Admin Register Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating user.',
    });
  }
};

/**
 * @desc    Enroll a student into a course
 * @route   POST /api/admin/enroll
 * @access  Private (Admin)
 */
export const enrollStudentInCourse = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'studentId and courseId are required.',
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Valid student account not found.',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    const activeEnrollmentCount = await Enrollment.countDocuments({
      course: courseId,
      status: 'enrolled',
    });

    if (activeEnrollmentCount >= course.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Course seat capacity has been reached.',
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingEnrollment?.status === 'enrolled') {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course.',
      });
    }

    if (existingEnrollment) {
      existingEnrollment.status = 'enrolled';
      await existingEnrollment.save();
    } else {
      await Enrollment.create({
        student: studentId,
        course: courseId,
        status: 'enrolled',
      });
    }

    // Keep legacy denormalized references synchronized with the canonical enrollment.
    await Promise.all([
      Course.findByIdAndUpdate(courseId, { $addToSet: { students: studentId } }),
      User.findByIdAndUpdate(studentId, { $addToSet: { enrolledCourses: courseId } }),
    ]);

    res.status(200).json({
      success: true,
      message: `Successfully enrolled ${student.name} in ${course.courseCode}: ${course.title}.`,
    });
  } catch (error) {
    console.error('Enrollment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during enrollment.',
    });
  }
};

/**
 * @desc    Get user list filtered by role
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};

    const users = await User.find(filter)
      .select('-password')
      .populate('enrolledCourses', 'courseCode title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Fetch Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
    });
  }
};

/**
 * @desc    Get all courses with enrolled counts
 * @route   GET /api/admin/courses
 * @access  Private (Admin)
 */
export const getAllAdminCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('faculty', 'name email designation')
      .populate('students', 'name email rollNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error('Fetch Courses Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses.',
    });
  }
};

export const getAllAdminTickets = async (req , res) => {
  try {
    const {status , category , priority} = req.query ;
    const filter = {} ;

    if(status) filter.status = status ;
    if(category) filter.category = category ;
    if(priority) filter.priority = priority;

    const tickets = await Ticket.find(filter)
      .populate('raisedBy', 'name email role rollNumber department')
      .populate('assignedTo', 'name email')
      .populate('comments.sender', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error('Fetch Tickets Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets.',
    });
  }
}

export const respondToTicketByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responseText, resolutionNotes, assignedTo } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.',
      });
    }

    // Append comment if text was provided
    if (responseText && responseText.trim().length > 0) {
      ticket.comments.push({
        sender: req.user._id,
        text: responseText.trim(),
      });
    }

    // Update status and timestamp if resolved
    if (status) {
      ticket.status = status;
      if (status === 'Resolved' || status === 'Closed') {
        ticket.resolvedAt = new Date();
      }
    }

    if (resolutionNotes !== undefined) {
      ticket.resolutionNotes = resolutionNotes;
    }

    if (assignedTo !== undefined) {
      ticket.assignedTo = assignedTo;
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(id)
      .populate('raisedBy', 'name email role')
      .populate('comments.sender', 'name role');

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully.',
      data: updatedTicket,
    });
  } catch (error) {
    console.error('Update Ticket Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket.',
    });
  }
};
