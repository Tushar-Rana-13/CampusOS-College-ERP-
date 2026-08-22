import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, GraduationCap, ChevronRight } from 'lucide-react';
import { getCourses } from '../services/api';

export default function CoursesPage({ user }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await getCourses();
      setCourses(res.data?.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading your courses...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Directory</h1>
          <p className="text-xs text-slate-400">
            {user?.role === 'student' && 'View your enrolled classes'}
            {user?.role === 'faculty' && 'Manage your assigned courses'}
            {user?.role === 'admin' && 'System-wide course overview'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No courses found for your profile.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course._id}
              onClick={() => navigate(`/courses/${course._id}`)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-xs font-semibold rounded-lg">
                    {course.courseCode}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                    {course.semester}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white group-hover:text-sky-400 transition mb-2">
                  {course.title}
                </h2>
                <p className="text-xs text-slate-400 mb-4">{course.department}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
                <div className="flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{course.faculty?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center space-x-1 text-sky-400 font-medium">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}