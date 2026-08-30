import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  Clock, 
  Plus, 
  Upload, 
  CheckCircle2, 
  Users
} from 'lucide-react';
import { getCourseAssignments } from '../../services/api';
import CreateAssignmentModal from './CreateAssignmentModal';
import SubmitAssignmentModal from './SubmitAssignmentModal';

export default function AssignmentList({ courseId, userRole = 'student', onSelectGrading }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals State
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  /**
   * Safe fetch wrapped in useCallback to avoid react hooks dependency warnings
   */
  const fetchAssignments = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      setError('');
      const res = await getCourseAssignments(courseId);
      setAssignments(res.data?.assignments || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

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
          <p className="text-xs text-slate-400">Manage coursework, submissions, and evaluations</p>
        </div>

        {(userRole === 'faculty' || userRole === 'admin') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
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
            const hasSubmitted = item.isSubmitted || Boolean(item.mySubmission);

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

                {/* Student Actions */}
                {userRole === 'student' && (
                  <button
                    onClick={() => setSelectedAssignment(item)}
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

                {/* Faculty / Admin Actions */}
                {(userRole === 'faculty' || userRole === 'admin') && (
                  <button
                    onClick={() => onSelectGrading && onSelectGrading(item)}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700 transition"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>View Student Submissions</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Student Submission Modal */}
      {selectedAssignment && (
        <SubmitAssignmentModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onSubmitted={fetchAssignments}
        />
      )}

      {/* Faculty Create Assignment Modal */}
      {isCreateModalOpen && (
        <CreateAssignmentModal
          courseId={courseId}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={fetchAssignments}
        />
      )}
    </div>
  );
}