import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCourses,
  enrollInCourse,
  dropCourse,
} from '../services/api'; // Adjust path if needed
import { useAuth } from '../context/AuthContext'; // Adjust path if needed

const CourseCatalog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters state
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [filterEnrolledOnly, setFilterEnrolledOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Drop Modal state
  const [courseToDrop, setCourseToDrop] = useState(null);

  // Department options for filter dropdown
  const DEPARTMENTS = [
    'Computer Science',
    'Information Technology',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Business Administration',
  ];

  // Semester options
  const SEMESTERS = ['Fall 2026', 'Spring 2026', 'Summer 2026'];

  // Fetch courses with current filters
  const fetchCoursesList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (department) params.department = department;
      if (semester) params.semester = semester;
      if (filterEnrolledOnly) params.enrolled = 'true';

      const response = await getCourses(params);
      
      // Handle ApiResponse structure { statusCode, data, message }
      const courseData = response.data?.data || response.data || [];
      setCourses(courseData);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, [department, semester, filterEnrolledOnly]);

  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList]);

  // Handle Enrollment
  const handleEnroll = async (courseId) => {
    try {
      setActionLoadingId(courseId);
      await enrollInCourse(courseId);

      // Optimistically update local state
      setCourses((prevCourses) =>
        prevCourses.map((c) =>
          c._id === courseId
            ? {
                ...c,
                isEnrolled: true,
                enrolledCount: (c.enrolledCount || 0) + 1,
                isFull: (c.enrolledCount || 0) + 1 >= (c.maxStudents || 60),
              }
            : c
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Enrollment failed. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Course Drop Execution
  const handleConfirmDrop = async () => {
    if (!courseToDrop) return;

    try {
      setActionLoadingId(courseToDrop._id);
      await dropCourse(courseToDrop._id);

      // Optimistically update state
      setCourses((prevCourses) =>
        prevCourses.map((c) =>
          c._id === courseToDrop._id
            ? {
                ...c,
                isEnrolled: false,
                enrolledCount: Math.max(0, (c.enrolledCount || 1) - 1),
                isFull: false,
              }
            : c
        )
      );

      setCourseToDrop(null); // Close modal
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to drop the course.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Client-side search filter by Code or Title
  const filteredCourses = courses.filter((course) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      course.courseCode.toLowerCase().includes(q) ||
      course.title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Catalog</h1>
          <p className="text-gray-600 text-sm mt-1">
            Browse offered courses, monitor seat availability, and manage your enrollment.
          </p>
        </div>

        {/* Search bar */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
            Semester
          </label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Semesters</option>
            {SEMESTERS.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>

        {user?.role === 'student' && (
          <div className="flex items-center pt-5">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filterEnrolledOnly}
                onChange={(e) => setFilterEnrolledOnly(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                My Enrolled Courses Only
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-500 text-sm">Loading course offerings...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 text-base">No courses found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const capacity = course.maxStudents || 60;
            const enrolled = course.enrolledCount || 0;
            const percentFilled = Math.min(100, Math.round((enrolled / capacity) * 100));
            const isFull = course.isFull || enrolled >= capacity;

            return (
              <div
                key={course._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Top Banner & Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-xs px-2.5 py-1 rounded-md tracking-wide">
                      {course.courseCode}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {course.credits} {course.credits === 1 ? 'Credit' : 'Credits'}
                    </span>
                  </div>

                  <h3
                    onClick={() => navigate(`/courses/${course._id}`)}
                    className="text-lg font-bold text-gray-900 hover:text-indigo-600 cursor-pointer transition-colors line-clamp-1"
                    title={course.title}
                  >
                    {course.title}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    {course.department} • {course.semester}
                  </p>

                  <div className="mt-3 text-xs text-gray-600 flex items-center gap-1">
                    <span className="font-semibold text-gray-700">Faculty:</span>
                    <span>{course.faculty?.name || 'Unassigned'}</span>
                  </div>

                  {/* Seat Capacity Bar */}
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-medium text-gray-600">Seat Capacity</span>
                      <span
                        className={`font-semibold ${
                          isFull
                            ? 'text-red-600'
                            : percentFilled > 80
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {enrolled} / {capacity} ({percentFilled}%)
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isFull
                            ? 'bg-red-500'
                            : percentFilled > 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentFilled}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Card Footer / Action Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/courses/${course._id}`)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    View Details →
                  </button>

                  {user?.role === 'student' && (
                    <div>
                      {course.isEnrolled ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                            Enrolled
                          </span>
                          <button
                            onClick={() => setCourseToDrop(course)}
                            disabled={actionLoadingId === course._id}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 focus:outline-none transition-colors"
                          >
                            Drop
                          </button>
                        </div>
                      ) : isFull ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-gray-200 text-gray-600 cursor-not-allowed">
                          Course Full
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course._id)}
                          disabled={actionLoadingId === course._id}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {actionLoadingId === course._id ? 'Enrolling...' : 'Enroll Now'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Dropping Course */}
      {courseToDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Confirm Course Drop</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to drop{' '}
              <strong className="text-gray-800">{courseToDrop.courseCode}: {courseToDrop.title}</strong>?
              This will free up your seat for other students.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCourseToDrop(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDrop}
                disabled={actionLoadingId === courseToDrop._id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoadingId === courseToDrop._id ? 'Dropping...' : 'Confirm Drop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCatalog;