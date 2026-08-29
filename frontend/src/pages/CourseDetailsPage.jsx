import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  ArrowLeft, 
  GraduationCap, 
  Clock, 
  Award, 
  Folder, 
  Download, 
  Upload, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { 
  getCourseDetails, 
  getCourseMaterials, 
  addCourseMaterial 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import AssignmentList from '../components/assignments/AssignmentList';

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Authenticated user context

  // Core Data States
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  
  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'materials' | 'overview'

  // Material Upload Modal State (Faculty/Admin)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileType: 'pdf'
  });

  /**
   * Fetch Course Details directly by ID from Backend
   */
  const fetchCourseInfo = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCourseDetails(courseId);
      // Handles both { data: { ... } } and direct object returns cleanly
      const courseData = res.data?.data || res.data;
      setCourse(courseData);
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  /**
   * Fetch downloadable course study materials
   */
  const fetchMaterials = useCallback(async () => {
    try {
      setMaterialsLoading(true);
      const res = await getCourseMaterials(courseId);
      const materialsData = res.data?.data || res.data || [];
      setMaterials(materialsData);
    } catch (err) {
      console.error('Failed to load course materials:', err);
    } finally {
      setMaterialsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseInfo();
    fetchMaterials();
  }, [fetchCourseInfo, fetchMaterials]);

  /**
   * Handle Material Upload Form Submission (Faculty / Admin only)
   */
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!materialForm.title.trim() || !materialForm.fileUrl.trim()) {
      setUploadError('Title and File URL are required.');
      return;
    }

    try {
      setUploadLoading(true);
      setUploadError(null);
      await addCourseMaterial(courseId, materialForm);
      
      // Reset form and refresh list
      setMaterialForm({ title: '', description: '', fileUrl: '', fileType: 'pdf' });
      setShowUploadModal(false);
      await fetchMaterials();
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload material.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Determine if current user has faculty ownership permissions for this course
  const isFacultyOwner = 
    user?.role === 'admin' || 
    (user?.role === 'faculty' && (course?.faculty?._id === user?._id || course?.faculty === user?._id));

  // --- RENDERING STATES ---

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading course workspace...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <p className="text-slate-300 font-medium">Course not found or access restricted.</p>
        <p className="text-xs text-slate-500">
          Ensure you are actively enrolled or hold access rights for this course code.
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

      {/* Tab Navigation */}
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
          onClick={() => setActiveTab('materials')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'materials'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Study Materials ({materials.length})</span>
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

      {/* Tab Content Area */}
      <div className="pt-2">
        {/* Tab 1: Assignments */}
        {activeTab === 'assignments' && (
          <AssignmentList courseId={course._id} userRole={user?.role} />
        )}

        {/* Tab 2: Study Materials */}
        {activeTab === 'materials' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Course Downloads & Resources</h3>
              {isFacultyOwner && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs font-semibold rounded-lg border border-sky-500/20 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Resource</span>
                </button>
              )}
            </div>

            {materialsLoading ? (
              <p className="text-xs text-slate-500 text-center py-6">Loading course files...</p>
            ) : materials.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <p>No study materials uploaded for this course yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {materials.map((mat) => (
                  <div key={mat._id} className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-xl transition">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded font-semibold">
                          {mat.fileType || 'PDF'}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-200">{mat.title}</h4>
                      </div>
                      {mat.description && (
                        <p className="text-xs text-slate-400 pl-1">{mat.description}</p>
                      )}
                    </div>
                    <a
                      href={mat.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-lg transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Overview */}
        {activeTab === 'overview' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300 text-xs space-y-4">
            <h3 className="text-sm font-bold text-white">Course Overview & Syllabus</h3>
            <p className="leading-relaxed">
              {course.description ||
                `This course covers key competencies in ${course.department} for ${course.semester}. All lecture slides, assignments, and practical deliverables will be managed through CampusOS.`}
            </p>
          </div>
        )}
      </div>

      {/* Upload Material Modal for Faculty */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Upload Study Resource</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 1 - System Design Slides"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief summary of this file..."
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">File URL / Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/..."
                    value={materialForm.fileUrl}
                    onChange={(e) => setMaterialForm({ ...materialForm, fileUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Type</label>
                  <select
                    value={materialForm.fileType}
                    onChange={(e) => setMaterialForm({ ...materialForm, fileType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="pdf">PDF</option>
                    <option value="doc">Document</option>
                    <option value="ppt">Slides</option>
                    <option value="link">Link</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {uploadLoading ? 'Uploading...' : 'Publish Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}