import React, { useState } from 'react';
import { X, Send, Loader2, Link as LinkIcon, FileText, AlertCircle } from 'lucide-react';
import { submitAssignment } from '../../services/api';

export default function SubmitAssignmentModal({ assignment, onClose, onSubmitted }) {
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  if (!assignment) return null;

  const isPastDue = new Date(assignment.dueDate) < new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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

      // Notify parent to refresh list and close modal
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
              Turn In: {assignment.title}
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

        {/* Late Submission Notice */}
        {isPastDue && (
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
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Add implementation details, approach notes, or response text..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center space-x-1">
              <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>External Repository / Hosted URL</span>
            </label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://github.com/user/repo or Google Drive link"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 transition"
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
              Cancel
            </button>
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
                  <span>Confirm Turn In</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}