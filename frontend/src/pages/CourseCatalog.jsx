// client/src/pages/CourseCatalog.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getCourses, enrollInCourse } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CourseCatalog() {
  const { user } = useAuth();

  // State Management
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [enrollingId, setEnrollingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
  try {
    setLoading(true);
    setError('');

    const res = await getCourses();

    // Support both standard ApiResponse ({ data: [...] }) and simple response ({ courses: [...] })
    const rawData = res?.data?.courses || res?.data?.data || res?.data || [];
    
    // Ensure courseList is always an array
    const courseList = Array.isArray(rawData) ? rawData : [];

    setCourses(courseList);
  } catch (err) {
    console.error('Fetch Courses Error:', err);
    setError(err.response?.data?.message || 'Failed to load courses from server.');
    setCourses([]);
  } finally {
    setLoading(false);
  }
};

  // Enroll Handler
  const handleEnroll = async (courseId) => {
    try {
      setEnrollingId(courseId);
      setError('');
      setSuccessMsg('');

      const res = await enrollInCourse(courseId);

      // Extract success message
      const msg = res?.data?.message || 'Successfully enrolled in course!';
      setSuccessMsg(msg);

      // Optimistically update local state so the button reflects enrollment immediately
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course._id === courseId ? { ...course, isEnrolled: true } : course
        )
      );
    } catch (err) {
      console.error('Enrollment Error:', err);
      setError(err.response?.data?.message || 'Failed to enroll in this course.');
    } finally {
      setEnrollingId(null);
    }
  };

  // Extract unique departments for filter dropdown
  const departments = useMemo(() => {
    const list = courses.map((c) => c.department).filter(Boolean);
    return ['ALL', ...Array.from(new Set(list))];
  }, [courses]);

  // Filter Logic (Search Term + Department Dropdown)
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept =
        selectedDepartment === 'ALL' || course.department === selectedDepartment;

      return matchesSearch && matchesDept;
    });
  }, [courses, searchTerm, selectedDepartment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Course Catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header, Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Course Catalog</h1>
          <p className="text-xs text-slate-500">
            Browse active university courses and enroll for the current term.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, title, or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none transition bg-white"
            />
          </div>

          {/* Department Filter Dropdown */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? 'All Departments' : dept}
              </option>
            ))}
          </select>

          {/* Manual Refresh Button */}
          <button
            onClick={fetchCourses}
            title="Refresh Catalog"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition border border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-600">No matching courses found</p>
          <p className="text-[11px] text-slate-400 mt-1">Try clearing filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const isStudentEnrolled = Boolean(course.isEnrolled);

            return (
              <div
                key={course._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 text-[10px] font-bold text-sky-700 bg-sky-50 rounded-lg uppercase tracking-wider">
                      {course.courseCode}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {course.credits || 3} Credits
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {course.description || 'No course description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="text-xs text-slate-500">
                    Faculty: <span className="font-semibold text-slate-700">{course.faculty?.name || 'Unassigned'}</span>
                  </div>

                  {user?.role === 'student' && (
                    <button
                      onClick={() => handleEnroll(course._id)}
                      disabled={isStudentEnrolled || enrollingId === course._id}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 ${
                        isStudentEnrolled
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-sky-600 text-white hover:bg-sky-500 shadow-sm active:scale-95'
                      }`}
                    >
                      {enrollingId === course._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isStudentEnrolled ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Enrolled</span>
                        </>
                      ) : (
                        <span>Enroll Now</span>
                      )}
                    </button>
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