// client/src/pages/StudentDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, GraduationCap, Clock, ArrowRight, Loader2, Compass } from 'lucide-react';
import { getCourses } from '../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
  
    const fetchEnrolledCourses = async () => {
      try {
        setLoading(true);
        // Fetch student's enrolled courses using query flag
        const response = await getCourses({ enrolled: 'true' }, { signal: controller.signal });
        const data = response?.data?.data || response?.data || [];
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('Failed to load student enrolled courses:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();

    return () => controller.abort();
  }, []);

  // Calculate cumulative registered credits
  const totalCredits = courses.reduce((acc, course) => acc + (Number(course.credits) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Student Portal — {user?.name || 'Student'}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Access your active enrollments, course content, schedules, and academic progress.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/courses"
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 shrink-0 shadow-sm"
          >
            <Compass className="w-4 h-4" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Enrolled Courses</p>
            <p className="text-lg font-bold text-white">{courses.length}</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Total Credits</p>
            <p className="text-lg font-bold text-white">{totalCredits} Units</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Current Term</p>
            <p className="text-lg font-bold text-white">Fall 2026</p>
          </div>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Your Enrolled Courses</h2>
          <Link
            to="/courses"
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1"
          >
            <span>Explore More</span>
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
            <p className="text-xs text-slate-400">You are not enrolled in any courses yet.</p>
            <Link
              to="/courses"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-500/10 text-sky-400 text-xs font-semibold rounded-lg border border-sky-500/20 hover:bg-sky-500/20 transition"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Course Catalog</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div
                key={course._id}
                className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex items-center justify-between hover:border-slate-600 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase font-mono">
                      {course.courseCode}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {course.credits} {course.credits === 1 ? 'Credit' : 'Credits'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{course.title}</h3>
                  <p className="text-xs text-slate-400">
                    Instructor: {course.faculty?.name || 'Unassigned'}
                  </p>
                </div>
                <Link
                  to={`/courses/${course._id}`}
                  className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs font-semibold rounded-lg transition shrink-0 ml-4"
                >
                  Go to Classroom
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}