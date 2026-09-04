// client/src/pages/FacultyDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, ClipboardCheck, ArrowRight, Plus, Loader2 } from 'lucide-react';
import { getCourses } from '../services/api';
import AddCourseModal from '../components/AddCourseModal';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await getCourses({ myCourses: 'true' }, { signal: controller.signal });
        const data = response?.data?.data || response?.data || [];
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('Failed to load faculty dashboard courses:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();

    return () => controller.abort();
  }, []);

  const handleCourseCreated = (newCourse) => {
    setCourses((prev) => [newCourse, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Faculty Workspace — Prof. {user?.name}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage course content, record attendance, and publish courses for students.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Course</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Assigned Courses</p>
            <p className="text-lg font-bold text-white">{courses.length}</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Active Term</p>
            <p className="text-lg font-bold text-white">Fall 2026</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">System Status</p>
            <p className="text-lg font-bold text-white">Active</p>
          </div>
        </div>
      </div>

      {/* Managed Courses List */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Your Managed Courses</h2>
          <Link
            to="/faculty/courses"
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1"
          >
            <span>Course Manager View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/80 space-y-3">
            <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">No active courses published yet.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-500/10 text-sky-400 text-xs font-semibold rounded-lg border border-sky-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Course</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div
                key={course._id}
                className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex items-center justify-between hover:border-slate-600 transition"
              >
                <div>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase">
                    {course.courseCode}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1.5">{course.title}</h3>
                  <p className="text-xs text-slate-400">{course.department}</p>
                </div>
                <Link
                  to={`/courses/${course._id}`}
                  className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs font-semibold rounded-lg transition shrink-0"
                >
                  Workspace
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <AddCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCourseAdded={handleCourseCreated}
      />
    </div>
  );
}