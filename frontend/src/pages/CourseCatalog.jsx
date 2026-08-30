// client/src/pages/CourseCatalog.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { getCourses, enrollInCourse } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Business Administration',
];

const SEMESTERS = ['Fall 2026', 'Spring 2026', 'Summer 2026'];

export default function CourseCatalog() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core state
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filter & Search states
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch courses list with abort controller to prevent memory leaks / race conditions
  const fetchCoursesList = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (department) params.department = department;
      if (semester) params.semester = semester;

      const response = await getCourses(params, { signal });
      const courseData = response.data?.data || response.data || [];
      setCourses(Array.isArray(courseData) ? courseData : []);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        console.error('Failed to fetch courses:', err);
        setError(err.response?.data?.message || 'Failed to load courses catalog.');
      }
    } finally {
      setLoading(false);
    }
  }, [department, semester]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCoursesList(controller.signal);
    return () => controller.abort();
  }, [fetchCoursesList]);

  // Handle Enrollment
  const handleEnroll = async (courseId) => {
    try {
      setActionLoadingId(courseId);
      await enrollInCourse(courseId);

      // Optimistic update: mark as enrolled & update capacity
      setCourses((prev) =>
        prev.map((c) => {
          if (c._id !== courseId) return c;
          const updatedEnrolled = (c.enrolledCount || 0) + 1;
          const capacity = c.maxStudents || 60;
          return {
            ...c,
            isEnrolled: true,
            enrolledCount: updatedEnrolled,
            isFull: updatedEnrolled >= capacity,
          };
        })
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Memoized search filtering
  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.courseCode?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Course Catalog</h1>
          <p className="text-slate-400 text-xs mt-1">
            Browse available courses, view class seat limits, and enroll for the upcoming term.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center gap-4 text-xs">
        <div className="flex-1 min-w-[200px]">
          <label className="block font-semibold text-slate-400 mb-1 uppercase tracking-wider text-[10px]">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
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
          <label className="block font-semibold text-slate-400 mb-1 uppercase tracking-wider text-[10px]">
            Semester
          </label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Semesters</option>
            {SEMESTERS.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          <p>Loading course catalog...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-xs">
          No courses matching your criteria were found.
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
                className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden hover:border-slate-700 transition shadow-sm"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-xs font-semibold rounded-lg">
                      {course.courseCode}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {course.credits} {course.credits === 1 ? 'Credit' : 'Credits'}
                    </span>
                  </div>

                  <div>
                    <h3
                      className="text-base font-bold text-white transition line-clamp-1"
                      title={course.title}
                    >
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {course.department} • {course.semester}
                    </p>
                  </div>

                  <div className="text-xs text-slate-400 pt-1">
                    <span className="text-slate-500">Instructor: </span>
                    <span className="text-slate-200 font-medium">
                      {course.faculty?.name || 'Unassigned'}
                    </span>
                  </div>

                  {/* Seat Capacity Bar */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 text-[11px]">Seat Availability</span>
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          isFull
                            ? 'text-red-400'
                            : percentFilled > 80
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {enrolled} / {capacity} ({percentFilled}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isFull
                            ? 'bg-red-500'
                            : percentFilled > 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentFilled}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
                  {user?.role === 'student' && (
                    <div className="w-full flex items-center justify-between">
                      {course.isEnrolled ? (
                        <>
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Enrolled</span>
                          </span>
                          <button
                            onClick={() => navigate('/my-courses')}
                            className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition flex items-center space-x-1"
                          >
                            <span>Go to My Courses</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : isFull ? (
                        <span className="w-full text-center py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-500 cursor-not-allowed">
                          Course Full
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course._id)}
                          disabled={actionLoadingId === course._id}
                          className="w-full py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center space-x-1"
                        >
                          {actionLoadingId === course._id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Enrolling...</span>
                            </>
                          ) : (
                            <span>Enroll Now</span>
                          )}
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
    </div>
  );
}