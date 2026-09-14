import React, { useState, useEffect, useCallback } from 'react';
import { 
  getCourseAssignments, 
  createAssignment, 
  getAssignmentSubmissions, 
  gradeSubmission 
} from '../../services/api';
import { PlusCircle, Calendar, FileText, CheckCircle, ChevronDown, ChevronUp, Loader2, Award } from 'lucide-react';

export default function FacultyAssignmentManager({ courseId }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [loadingSubmissions, setLoadingSubmissions] = useState({});

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Grading State Map: { submissionId: { marks: number, feedback: string, saving: boolean } }
  const [gradingState, setGradingState] = useState({});

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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      await createAssignment({ courseId, title, description, dueDate, maxMarks });
      setTitle('');
      setDescription('');
      setDueDate('');
      setMaxMarks(100);
      setShowForm(false);
      loadAssignments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = async (assignmentId) => {
    if (expandedId === assignmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(assignmentId);

    if (!submissions[assignmentId]) {
      try {
        setLoadingSubmissions((prev) => ({ ...prev, [assignmentId]: true }));
        const res = await getAssignmentSubmissions(assignmentId);
        const list = res?.data?.submissions || [];
        setSubmissions((prev) => ({ ...prev, [assignmentId]: list }));
        
        // Pre-fill existing grades in local state
        const initialGrading = {};
        list.forEach((sub) => {
          initialGrading[sub._id] = {
            marks: sub.marksObtained ?? '',
            feedback: sub.feedback || '',
          };
        });
        setGradingState((prev) => ({ ...prev, ...initialGrading }));
      } catch (err) {
        console.error('Failed to fetch submissions', err);
      } finally {
        setLoadingSubmissions((prev) => ({ ...prev, [assignmentId]: false }));
      }
    }
  };

  const handleGradeSubmit = async (submissionId, maxAllowed) => {
    const target = gradingState[submissionId];
    if (!target || target.marks === '') return;

    if (Number(target.marks) < 0 || Number(target.marks) > maxAllowed) {
      alert(`Marks must be between 0 and ${maxAllowed}`);
      return;
    }

    try {
      setGradingState((prev) => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: true },
      }));

      await gradeSubmission(submissionId, {
        marksObtained: Number(target.marks),
        feedback: target.feedback,
      });

      // Update submissions list locally
      setSubmissions((prev) => {
        const currentList = prev[expandedId] || [];
        return {
          ...prev,
          [expandedId]: currentList.map((item) =>
            item._id === submissionId
              ? { ...item, status: 'Graded', marksObtained: Number(target.marks), feedback: target.feedback }
              : item
          ),
        };
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save grade');
    } finally {
      setGradingState((prev) => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: false },
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
        <div>
          <h2 className="text-base font-bold text-white">Course Assignments</h2>
          <p className="text-xs text-slate-400">Manage tasks and evaluate student work</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showForm ? 'Cancel' : 'New Assignment'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              placeholder="e.g. Problem Set 1: Binary Trees"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              placeholder="Instructions and requirements..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Max Marks</label>
              <input
                type="number"
                min="1"
                required
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-sky-500 hover:bg-sky-400 font-bold text-xs text-slate-950 rounded-xl transition flex justify-center items-center"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Assignment'}
          </button>
        </form>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-dashed border-slate-700">
          No assignments published yet.
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((item) => {
            const isExpanded = expandedId === item._id;
            const subList = submissions[item._id] || [];
            const isLoadingSubs = loadingSubmissions[item._id];

            return (
              <div key={item._id} className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden">
                <div
                  onClick={() => toggleExpand(item._id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        <span>Due: {new Date(item.dueDate).toLocaleString()}</span>
                      </span>
                      <span>Max Marks: {item.maxMarks}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-700/60 bg-slate-900/50 space-y-4">
                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Student Submissions</h4>

                    {isLoadingSubs ? (
                      <div className="flex py-4 justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                      </div>
                    ) : subList.length === 0 ? (
                      <p className="text-xs text-slate-400">No submissions received yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {subList.map((sub) => {
                          const state = gradingState[sub._id] || { marks: '', feedback: '' };

                          return (
                            <div key={sub._id} className="bg-slate-800 p-3.5 rounded-xl border border-slate-700/60 space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-semibold text-white">{sub.student?.name}</span>
                                  <span className="text-slate-400 block text-[11px]">{sub.student?.email}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sub.status === 'Late' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {sub.status}
                                </span>
                              </div>

                              {sub.submissionText && (
                                <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg">{sub.submissionText}</p>
                              )}

                              {sub.fileUrl && (
                                <a
                                  href={sub.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-sky-400 hover:underline flex items-center space-x-1"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>View Attachment</span>
                                </a>
                              )}

                              <div className="pt-2 border-t border-slate-700/40 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                                <input
                                  type="number"
                                  placeholder={`Score / ${item.maxMarks}`}
                                  value={state.marks}
                                  onChange={(e) =>
                                    setGradingState((prev) => ({
                                      ...prev,
                                      [sub._id]: { ...prev[sub._id], marks: e.target.value },
                                    }))
                                  }
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Feedback..."
                                  value={state.feedback}
                                  onChange={(e) =>
                                    setGradingState((prev) => ({
                                      ...prev,
                                      [sub._id]: { ...prev[sub._id], feedback: e.target.value },
                                    }))
                                  }
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                                />
                                <button
                                  onClick={() => handleGradeSubmit(sub._id, item.maxMarks)}
                                  disabled={state.saving}
                                  className="py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs rounded-lg transition border border-emerald-500/40 flex items-center justify-center space-x-1"
                                >
                                  {state.saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                                  <span>{sub.status === 'Graded' ? 'Update Grade' : 'Grade'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}