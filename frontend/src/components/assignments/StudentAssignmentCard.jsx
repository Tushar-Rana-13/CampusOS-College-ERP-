import React, { useState, useEffect, useCallback } from 'react';
import { getCourseAssignments, submitAssignment } from '../../services/api';
import { Calendar, CheckCircle2, AlertTriangle, Loader2, Send } from 'lucide-react';

export default function StudentAssignmentCard({ courseId }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  // Submission inputs map: { assignmentId: { text: string, url: string } }
  const [inputs, setInputs] = useState({});
  const [feedbackMsg, setFeedbackMsg] = useState({});

  const loadAssignments = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await getCourseAssignments(courseId);
      const data = res?.data?.assignments || res?.data || [];
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleSubmit = async (assignmentId) => {
    const input = inputs[assignmentId] || {};
    if (!input.text && !input.url) {
      setFeedbackMsg((prev) => ({
        ...prev,
        [assignmentId]: { type: 'error', text: 'Provide text content or a URL before submitting.' },
      }));
      return;
    }

    try {
      setSubmittingId(assignmentId);
      setFeedbackMsg((prev) => ({ ...prev, [assignmentId]: null }));

      const res = await submitAssignment(assignmentId, {
        submissionText: input.text || '',
        fileUrl: input.url || '',
      });

      setFeedbackMsg((prev) => ({
        ...prev,
        [assignmentId]: { type: 'success', text: res.data.message || 'Submitted successfully!' },
      }));

      loadAssignments();
    } catch (err) {
      setFeedbackMsg((prev) => ({
        ...prev,
        [assignmentId]: {
          type: 'error',
          text: err.response?.data?.message || 'Failed to submit assignment.',
        },
      }));
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="pb-3 border-b border-slate-700/60">
        <h2 className="text-base font-bold text-white">Course Assignments</h2>
        <p className="text-xs text-slate-400">View tasks and submit your solutions</p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-dashed border-slate-700">
          No active assignments for this course.
        </div>
      ) : (
        assignments.map((item) => {
          const isPastDue = new Date() > new Date(item.dueDate);
          const currentInput = inputs[item._id] || { text: '', url: '' };
          const msg = feedbackMsg[item._id];

          return (
            <div key={item._id} className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>Due: {new Date(item.dueDate).toLocaleString()}</span>
                    </span>
                    <span>Max Marks: {item.maxMarks}</span>
                  </div>
                </div>

                {isPastDue && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Past Due</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl">
                {item.description}
              </p>

              {msg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                    msg.type === 'error'
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{msg.text}</span>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <textarea
                  rows={2}
                  placeholder="Enter submission notes or description..."
                  value={currentInput.text}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      [item._id]: { ...currentInput, text: e.target.value },
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <input
                  type="url"
                  placeholder="Submission URL (GitHub repository, Google Drive link)..."
                  value={currentInput.url}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      [item._id]: { ...currentInput, url: e.target.value },
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={() => handleSubmit(item._id)}
                  disabled={submittingId === item._id}
                  className="w-full py-2 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 font-bold text-xs text-slate-950 rounded-xl transition flex justify-center items-center space-x-1.5"
                >
                  {submittingId === item._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{isPastDue ? 'Submit (Late)' : 'Submit Work'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}