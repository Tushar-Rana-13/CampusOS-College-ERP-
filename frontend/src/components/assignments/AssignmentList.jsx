import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  Plus, 
  Upload, 
  CheckCircle2, 
  X,
  FileText
} from 'lucide-react';
import { getCourseAssignments, submitAssignment } from '../../services/api';
import CreateAssignmentModal from './CreateAssignmentModal';

export default function AssignmentList({ courseId, userRole = 'student' }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Submission Modal State (Student)
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ type: '', text: '' });

  // Faculty Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchAssignments();
    }
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getCourseAssignments(courseId);
      setAssignments(res.data?.assignments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmissionModal = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionText('');
    setFileUrl('');
    setSubmitMsg({ type: '', text: '' });
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submissionText.trim() && !fileUrl.trim()) {
      setSubmitMsg({ type: 'error', text: 'Provide text notes or a file URL.' });
      return;
    }

    try {
      setSubmitting(true);
      setSubmitMsg({ type: '', text: '' });

      const res = await submitAssignment(selectedAssignment._id, {
        submissionText: submissionText.trim(),
        fileUrl: fileUrl.trim(),
      });

      setSubmitMsg({ 
        type: 'success', 
        text: res.data?.message || 'Assignment submitted successfully!' 
      });

      // Refetch assignments to reflect updated status
      fetchAssignments();

      // Automatically close modal after brief delay
      setTimeout(() => {
        setSelectedAssignment(null);
      }, 1500);
    } catch (err) {
      setSubmitMsg({
        type: 'error',
        text: err.response?.data?.message || 'Submission failed. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
        <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Loading course assignments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">Course Assignments</h2>
          <p className="text-xs text-slate-400">Manage coursework and turn in submissions</p>
        </div>

        {(userRole === 'faculty' || userRole === 'admin') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Assignment Grid */}
      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-xs">No assignments posted for this course yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((item) => {
            const isPastDue = new Date(item.dueDate) < new Date();
            const hasSubmitted = item.isSubmitted || item.mySubmission; // Backend boolean flag or object

            return (
              <div
                key={item._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Badges Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {item.maxMarks} Marks
                    </span>

                    <div className="flex items-center space-x-2">
                      {hasSubmitted && (
                        <span className="text-xs px-2.5 py-0.5 rounded-lg flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Submitted
                        </span>
                      )}

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-lg flex items-center space-x-1 ${
                          isPastDue
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Footer Action for Students */}
                {userRole === 'student' && (
                  <button
                    onClick={() => handleOpenSubmissionModal(item)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                      hasSubmitted
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-sky-600 hover:bg-sky-500 text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {hasSubmitted
                        ? 'Resubmit Work'
                        : isPastDue
                        ? 'Turn In Late'
                        : 'Submit Work'}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Student Submission Modal */}
      {selectedAssignment && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedAssignment(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Submit Work: {selectedAssignment.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Due date: {new Date(selectedAssignment.dueDate).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-slate-500 hover:text-white transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Submission Notes / Content
                </label>
                <textarea
                  rows={3}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Write your text submission or additional notes here..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  External Deliverable URL
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://github.com/username/repo or Google Drive link"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              {submitMsg.text && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                    submitMsg.type === 'error'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  <span>{submitMsg.text}</span>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition"
                >
                  {submitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Create Assignment Modal */}
      {isModalOpen && (
        <CreateAssignmentModal
          courseId={courseId}
          onClose={() => setIsModalOpen(false)}
          onCreated={fetchAssignments}
        />
      )}
    </div>
  );
}