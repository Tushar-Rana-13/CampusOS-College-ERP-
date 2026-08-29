// client/src/pages/FacultyCourses.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Loader2, AlertCircle, ArrowRight, FolderKanban } from 'lucide-react';
import { getCourses } from '../services/api';
import AddCourseModal from '../components/AddCourseModal';

export default function FacultyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchFacultyCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch courses assigned specifically to the logged-in faculty
      const response = await getCourses({ myCourses: 'true' });
      const data = response?.data?.data || response?.data || [];
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch Faculty Courses Error:', err);
      setError(err.response?.data?.message || 'Failed to load your assigned courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacultyCourses();
  }, [fetchFacultyCourses]);

  const handleCourseCreated = (newCourse) => {
    // Append newly created course directly to local state
    setCourses((prev) => [newCourse, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading managed courses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Course Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create and oversee academic courses for the active term.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Courses List */}
      {courses.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No Courses Created Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click the "Create New Course" button above to publish your first course to the student catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-5 flex flex-col justify-between hover:border-slate-600 transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-lg uppercase tracking-wider">
                    {course.courseCode}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {course.credits} Credits
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1 group-hover:text-sky-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-400">{course.department}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Semester:</span>
                  <span className="font-semibold text-slate-200">{course.semester}</span>
                </div>

                {/* Workspace Navigation Link */}
                <Link
                  to={`/courses/${course._id}`}
                  className="w-full mt-2 py-2 px-3 bg-slate-700/50 hover:bg-sky-500/10 text-slate-200 hover:text-sky-400 border border-slate-600/50 hover:border-sky-500/30 text-xs font-semibold rounded-xl transition flex items-center justify-between group/btn"
                >
                  <span className="flex items-center space-x-2">
                    <FolderKanban className="w-3.5 h-3.5 text-sky-400" />
                    <span>Manage Workspace</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Creation Modal */}
      <AddCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCourseAdded={handleCourseCreated}
      />
    </div>
  );
}