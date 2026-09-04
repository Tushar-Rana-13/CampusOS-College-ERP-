// client/src/pages/FacultyAttendancePage.jsx

import React, { useState, useEffect } from 'react';
import { getCourses } from '../services/api';
import FacultyAttendanceSheet from '../components/attendance/FacultyAttendanceSheet';
import { BookOpen, Loader2, AlertCircle } from 'lucide-react';

export default function FacultyAttendancePage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch only the courses assigned to/created by this faculty member
  useEffect(() => {
    const controller = new AbortController();

    const fetchFacultyCourses = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Pass myCourses query param to restrict to user's assigned courses
        const response = await getCourses({ myCourses: 'true' }, { signal: controller.signal });
        
        // Handle varying API response structures safely
        const courseData = response?.data?.data || response?.data || [];
        const courseList = Array.isArray(courseData) ? courseData : [];

        setCourses(courseList);

        // Auto-select the first course in the list if available
        if (courseList.length > 0) {
          setSelectedCourseId(courseList[0]._id);
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('Failed to load courses for attendance:', err);
          setError(err.response?.data?.message || 'Could not load your assigned courses.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyCourses();

    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mark Attendance</h1>
          <p className="text-slate-400 text-sm mt-1">
            Select a course and session date to record student attendance.
          </p>
        </div>

        {/* Course Selector Dropdown */}
        {!loading && courses.length > 0 && (
          <div className="flex items-center space-x-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/80">
            <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pr-2"
            >
              {courses.map((course) => (
                <option key={course._id} value={course._id} className="bg-slate-900 text-slate-200">
                  {course.courseCode} — {course.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* State Feedback Views */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700/60 space-y-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading assigned courses...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-medium text-slate-300">No active courses assigned.</p>
          <p className="text-xs text-slate-500">You must create or be assigned to a course before managing attendance.</p>
        </div>
      ) : (
        /* Render Attendance Sheet with guaranteed valid courseId prop */
        <FacultyAttendanceSheet courseId={selectedCourseId} />
      )}
    </div>
  );
}