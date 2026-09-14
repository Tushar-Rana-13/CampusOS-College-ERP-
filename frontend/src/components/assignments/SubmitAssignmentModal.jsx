import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, Link as LinkIcon, FileText, AlertCircle, Award, CheckCircle2, ExternalLink } from 'lucide-react';
import { submitAssignment } from '../../services/api';

export default function SubmitAssignmentModal({ assignment, onClose, onSubmitted }) {
  const existingSubmission = assignment?.mySubmission || null;
  const isGraded = existingSubmission?.status === 'Graded';
  const hasSubmitted = Boolean(existingSubmission);

  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Pre-fill submission data if student already submitted work
  useEffect(() => {
    if (existingSubmission) {
      setSubmissionText(existingSubmission.submissionText || '');
      setFileUrl(existingSubmission.fileUrl || '');
    }
  }, [existingSubmission]);

  if (!assignment) return null;

  const isPastDue = new Date(assignment.dueDate) < new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isGraded) {
      setStatusMsg({ type: 'error', text: 'Graded assignments cannot be resubmitted.' });
      return;
    }

    if (!submissionText.trim() && !fileUrl.trim()) {
      setStatusMsg({ type: 'error', text: 'Please provide either text notes or a deliverable link.' });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMsg({ type: '', text: '' });

      const res = await submitAssignment(assignment._id, {
        submissionText: submissionText.trim(),
        fileUrl: fileUrl.trim(),
      });

      setStatusMsg({
        type: 'success',
        text: res.data?.message || 'Assignment submitted successfully!',
      });

      if (onSubmitted) onSubmitted();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Submission failed. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white">
              {isGraded ? 'View Submission & Grade:' : hasSubmitted ? 'Edit Submission:' : 'Turn In:'} {assignment.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Due Date: {new Date(assignment.dueDate).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Graded Summary Callout */}
        {isGraded && (
          <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-sky-400 font-bold">
              <span className="flex items-center space-x-1.5">
                <Award className="w-4 h-4" />
                <span>Evaluation Completed</span>
              </span>
              <span className="text-sm">
                {existingSubmission.marksObtained} / {assignment.maxMarks} Marks
              </span>
            </div>
            {existingSubmission.feedback ? (
              <p className="text-slate-300 text-xs pt-1 border-t border-sky-500/20">
                <strong className="text-sky-400">Faculty Feedback:</strong> {existingSubmission.feedback}
              </p>
            ) : (
              <p className="text-slate-400 italic text-[11px]">No feedback comments attached.</p>
            )}
          </div>
        )}

        {/* Pending Evaluation Callout */}
        {hasSubmitted && !isGraded && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Turned in on {new Date(existingSubmission.submittedAt).toLocaleDateString()}. You can update your links before grading.
            </span>
          </div>
        )}

        {/* Late Submission Notice */}
        {isPastDue && !hasSubmitted && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>The due date has passed. Your turn-in will be logged as <strong>Late</strong>.</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Submission Notes / Technical Details</span>
            </label>
            <textarea
              rows={3}
              disabled={isGraded}
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Add implementation details, approach notes, or response text..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 transition resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-slate-300 font-medium flex items-center space-x-1">
                <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>External Repository / Hosted URL</span>
              </label>
              {fileUrl && isGraded && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline flex items-center space-x-1 text-[11px]"
                >
                  <span>Open Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <input
              type="url"
              disabled={isGraded}
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://github.com/user/repo or Google Drive link"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {statusMsg.text && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                statusMsg.type === 'error'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white font-medium transition"
            >
              {isGraded ? 'Close' : 'Cancel'}
            </button>

            {!isGraded && (
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl disabled:opacity-50 transition flex items-center space-x-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{hasSubmitted ? 'Update Submission' : 'Confirm Turn In'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}