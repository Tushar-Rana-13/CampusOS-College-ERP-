import React, { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink, Award, Loader2, CheckCircle2 } from 'lucide-react';
import { getAssignmentSubmissions, gradeSubmission } from '../../services/api';

export default function FacultyGradingModal({ assignment, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gradingState, setGradingState] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const fetchSubmissions = useCallback(async () => {
    if (!assignment?._id) return;
    try {
      setLoading(true);
      setError('');
      const res = await getAssignmentSubmissions(assignment._id);
      const data = res.data?.submissions || res.data || [];
      setSubmissions(data);

      // Pre-fill existing grades and feedback into local form state
      const initialFormState = {};
      data.forEach((sub) => {
        initialFormState[sub._id] = {
          marksObtained: sub.marksObtained !== undefined ? sub.marksObtained : '',
          feedback: sub.feedback || '',
        };
      });
      setGradingState(initialFormState);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student submissions.');
    } finally {
      setLoading(false);
    }
  }, [assignment]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleGradeSubmit = async (submissionId, e) => {
    e.preventDefault();
    const payload = gradingState[submissionId];
    if (!payload || payload.marksObtained === '') {
      alert('Please enter valid marks.');
      return;
    }

    try {
      setSubmittingId(submissionId);
      const res = await gradeSubmission(submissionId, {
        marksObtained: Number(payload.marksObtained),
        feedback: payload.feedback,
      });

      const updatedSubmission = res.data?.submission || res.data;
      setSubmissions((prev) =>
        prev.map((item) => (item._id === submissionId ? updatedSubmission : item))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit grade.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white">
              Submissions: {assignment.title}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Max Score: {assignment.maxMarks} Marks
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No student submissions recorded for this assignment yet.
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-slate-800">
            {submissions.map((sub) => {
              const isGraded = sub.status === 'Graded';
              return (
                <div key={sub._id} className="pt-4 space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-slate-200">
                        {sub.student?.name || 'Student'}
                      </h4>
                      <span className="text-slate-400 text-[10px]">{sub.student?.email}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isGraded && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-semibold border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Graded</span>
                        </span>
                      )}
                      {sub.fileUrl && (
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg border border-slate-700"
                        >
                          <span>Open Submission</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {sub.submissionText && (
                    <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800/80 text-slate-300">
                      {sub.submissionText}
                    </div>
                  )}

                  {/* Grading Inputs Form */}
                  <form
                    onSubmit={(e) => handleGradeSubmit(sub._id, e)}
                    className="bg-slate-800/20 p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row items-end gap-3"
                  >
                    <div className="w-full md:w-32">
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Marks (0 - {assignment.maxMarks})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={assignment.maxMarks}
                        required
                        value={gradingState[sub._id]?.marksObtained ?? ''}
                        onChange={(e) =>
                          setGradingState({
                            ...gradingState,
                            [sub._id]: { ...gradingState[sub._id], marksObtained: e.target.value },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex-1 w-full">
                      <label className="block text-[10px] text-slate-400 mb-1">Feedback</label>
                      <input
                        type="text"
                        placeholder="Optional feedback..."
                        value={gradingState[sub._id]?.feedback ?? ''}
                        onChange={(e) =>
                          setGradingState({
                            ...gradingState,
                            [sub._id]: { ...gradingState[sub._id], feedback: e.target.value },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingId === sub._id}
                      className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center space-x-1"
                    >
                      {submittingId === sub._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>{isGraded ? 'Update Grade' : 'Submit Grade'}</span>
                      )}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}