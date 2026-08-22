import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, ArrowLeft, GraduationCap, Clock, Award } from 'lucide-react';
import { getCourses } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AssignmentList from '../components/assignments/AssignmentList';

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Retrieve global authenticated user safely

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'overview'

  useEffect(() => {
    fetchCourseInfo();
  }, [courseId]);

  const fetchCourseInfo = async () => {
    try {
      setLoading(true);
      // Fetch user's accessible courses and locate selected course
      const res = await getCourses();
      const courseList = res.data?.courses || res.data || [];
      const found = courseList.find((c) => c._id === courseId);
      setCourse(found || null);
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading course details...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <p className="text-slate-300 font-medium">Course not found or access restricted.</p>
        <p className="text-xs text-slate-500">
          Ensure you are enrolled or hold access rights for this course code.
        </p>
        <button
          onClick={() => navigate('/courses')}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs font-semibold rounded-lg border border-sky-500/20 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Course Directory</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Top Breadcrumb Navigation */}
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Course Directory</span>
      </button>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-xs font-semibold rounded-lg">
                {course.courseCode}
              </span>
              <span className="text-xs text-slate-400">{course.department}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{course.title}</h1>
            <p className="text-xs text-slate-400 flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-slate-500" />
              <span>
                Instructor:{' '}
                <strong className="text-slate-200 font-medium">
                  {course.faculty?.name || 'Unassigned'}
                </strong>
                {course.faculty?.email && ` (${course.faculty.email})`}
              </span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 text-xs">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-slate-800/80 rounded-lg text-slate-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-slate-500 uppercase tracking-wider text-[10px]">Credits</span>
                <span className="text-sm font-semibold text-white">{course.credits || '3'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="p-2 bg-slate-800/80 rounded-lg text-slate-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-slate-500 uppercase tracking-wider text-[10px]">Semester</span>
                <span className="text-sm font-semibold text-white">{course.semester || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'assignments'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Assignments</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Course Details</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'assignments' && (
          <AssignmentList courseId={course._id} userRole={user?.role} />
        )}

        {activeTab === 'overview' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300 text-xs space-y-4">
            <h3 className="text-sm font-bold text-white">Course Description & Syllabus</h3>
            <p className="leading-relaxed">
              {course.description ||
                `This course covers essential modules in ${course.department} under semester ${course.semester}. All course materials, lab assignments, and project deliverables will be managed through CampusOS.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}