// client/src/pages/MyCourses.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Download, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  X,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { getCourses, dropCourse, getCourseMaterials } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MyCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary State
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Drop Action & Confirmation State
  const [courseToDrop, setCourseToDrop] = useState(null);
  const [droppingId, setDroppingId] = useState(null);

  // Quick Material Preview Modal State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState('');

  const fetchMyCourses = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError('');

      const res = await getCourses({ myCourses: 'true', enrolled: 'true' }, { signal });
      const rawData = res?.data?.data || res?.data?.courses || res?.data || [];
      
      setEnrolledCourses(Array.isArray(rawData) ? rawData : []);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        console.error('Fetch My Courses Error:', err);
        setError(err.response?.data?.message || 'Failed to load enrolled courses.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchMyCourses(controller.signal);
    return () => controller.abort();
  }, [fetchMyCourses]);

  // Lock body scroll when any modal is active
  useEffect(() => {
    if (selectedCourse || courseToDrop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseMaterials();
        setCourseToDrop(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCourse, courseToDrop]);

  // Drop Course Execution Handler
  const confirmDropCourse = async () => {
    if (!courseToDrop) return;
    const { _id: courseId, code } = courseToDrop;

    try {
      setDroppingId(courseId);
      setError('');
      setSuccessMsg('');

      await dropCourse(courseId);

      setSuccessMsg(`Successfully dropped ${code}.`);
      setEnrolledCourses((prev) => prev.filter((c) => c._id !== courseId));
      setCourseToDrop(null);
    } catch (err) {
      console.error('Drop Course Error:', err);
      setError(err.response?.data?.message || 'Failed to drop course.');
    } finally {
      setDroppingId(null);
    }
  };

  // Open Materials Modal & Fetch Data
  const handleOpenMaterials = async (e, course) => {
    e.stopPropagation(); // Prevents triggers if parent card has onClick
    setSelectedCourse(course);
    setMaterials([]);
    setMaterialsError('');
    setMaterialsLoading(true);

    try {
      const res = await getCourseMaterials(course._id);
      const rawData = res?.data?.data || res?.data || [];
      setMaterials(Array.isArray(rawData) ? rawData : []);
    } catch (err) {
      console.error('Fetch Materials Error:', err);
      setMaterialsError(err.response?.data?.message || 'Failed to load materials for this course.');
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleCloseMaterials = () => {
    setSelectedCourse(null);
    setMaterials([]);
    setMaterialsError('');
  };

  const totalCredits = enrolledCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading your enrolled courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Enrolled Courses</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your active term schedule and access learning resources.
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-slate-800/60 px-4 py-3 rounded-xl border border-slate-700/50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <GraduationCap className="w-5 h-5 text-sky-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Courses</p>
              <p className="text-sm font-bold text-white">{enrolledCourses.length}</p>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-700" />
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Credits</p>
            <p className="text-sm font-bold text-white">{totalCredits}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Course Cards Grid */}
      {enrolledCourses.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 rounded-2xl border border-dashed border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Enrolled Courses Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You are not currently enrolled in any courses for this term. Visit the Course Catalog to browse and enroll.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrolledCourses.map((course) => {
            const courseCode = course.courseCode || course.code || 'N/A';
            const courseTitle = course.title || course.name || 'Untitled Course';

            return (
              <div
                key={course._id}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-lg uppercase tracking-wider font-mono">
                      {courseCode}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {course.credits || 3} Credits
                    </span>
                  </div>

                  <h3 
                    onClick={() => navigate(`/courses/${course._id}`)}
                    className="text-base font-bold text-white mb-1 line-clamp-1 cursor-pointer hover:text-sky-400 transition" 
                    title={courseTitle}
                  >
                    {courseTitle}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {course.description || 'No course description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3 mt-auto">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Faculty:</span>
                    <span className="font-semibold text-slate-200">
                      {course.faculty?.name || 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {/* Primary Navigation into Course Workspace */}
                    <button
                      onClick={() => navigate(`/courses/${course._id}`)}
                      className="flex-1 py-2 px-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5"
                    >
                      <span>Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Material Modal Shortcut */}
                    <button
                      onClick={(e) => handleOpenMaterials(e, course)}
                      title="Quick View Materials"
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>

                    {/* Drop Course Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCourseToDrop({ _id: course._id, code: courseCode });
                      }}
                      disabled={droppingId === course._id}
                      title="Drop Course"
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition disabled:opacity-50"
                    >
                      {droppingId === course._id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Dropping Course */}
      {courseToDrop && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCourseToDrop(null)}
        >
          <div 
            className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Drop Course</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to drop <span className="font-mono text-slate-200 font-semibold">{courseToDrop.code}</span>? You will immediately lose access to all associated course materials and assignment submissions.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setCourseToDrop(null)}
                disabled={droppingId !== null}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDropCourse}
                disabled={droppingId !== null}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {droppingId !== null ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dropping...</span>
                  </>
                ) : (
                  <span>Confirm Drop</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Materials Preview Modal */}
      {selectedCourse && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleCloseMaterials}
        >
          <div 
            className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md uppercase border border-sky-500/20 font-mono">
                  {selectedCourse.courseCode || selectedCourse.code}
                </span>
                <h2 className="text-base font-bold text-white mt-1">
                  {selectedCourse.title || selectedCourse.name} — Quick Resources
                </h2>
              </div>
              <button
                onClick={handleCloseMaterials}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {materialsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                  <p className="text-xs text-slate-400">Fetching materials...</p>
                </div>
              ) : materialsError ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{materialsError}</span>
                </div>
              ) : materials.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/40 rounded-xl border border-dashed border-slate-800">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-300">No Materials Uploaded</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your instructor has not uploaded any study resources yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((mat) => (
                    <div
                      key={mat._id}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 hover:border-slate-700 transition flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-slate-200">
                            {mat.title}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded uppercase">
                            {mat.fileType || 'PDF'}
                          </span>
                        </div>
                        {mat.description && (
                          <p className="text-xs text-slate-400">{mat.description}</p>
                        )}
                      </div>

                      <a
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center space-x-1 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => {
                  const cId = selectedCourse._id;
                  handleCloseMaterials();
                  navigate(`/courses/${cId}`);
                }}
                className="text-xs text-sky-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>Go to full workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCloseMaterials}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}