// src/components/TicketDetailsDrawer.jsx
import React, { useState, useEffect } from 'react';
import { X, Send, Clock, User, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function TicketDetailsDrawer({
  ticket,
  onClose,
  onTicketUpdated,
  isAdmin = false,
}) {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(ticket?.status || 'Open');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Sync internal state when a new ticket is selected
  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
    }
  }, [ticket]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (ticket) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [ticket]);

  if (!ticket) return null;

  // Handle Admin status change
  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      setStatus(newStatus);
      const res = await api.patch(`/tickets/${ticket._id}/status`, {
        status: newStatus,
      });

      // Update parent component state seamlessly
      const updated = res.data?.data || { ...ticket, status: newStatus };
      onTicketUpdated(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
      setStatus(ticket.status); // Rollback on failure
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Add comment / response update
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/tickets/${ticket._id}/comments`, {
        message: commentText,
      });

      const updatedTicket = res.data?.data || {
        ...ticket,
        comments: [
          ...(ticket.comments || []),
          { message: commentText, createdAt: new Date() },
        ],
      };

      onTicketUpdated(updatedTicket);
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/50">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-slate-400">
                  #{ticket._id?.slice(-6).toUpperCase()}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {ticket.category}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{ticket.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status & Actions Section */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Current Status</span>
                <span>Priority: <strong className="text-amber-400">{ticket.priority}</strong></span>
              </div>

              {isAdmin ? (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Update Status (Admin Only)
                  </label>
                  <select
                    value={status}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              ) : (
                <div className="text-sm font-semibold text-sky-400 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{ticket.status}</span>
                </div>
              )}
            </div>

            {/* Ticket Description */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Description
              </h4>
              <p className="text-sm text-slate-300 bg-slate-800/30 p-3.5 rounded-xl border border-slate-800 whitespace-pre-line">
                {ticket.description}
              </p>
            </div>

            {/* Conversation / Activity Log */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Activity & Responses
              </h4>
              <div className="space-y-3">
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map((c, i) => (
                    <div key={i} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium text-slate-200">
                          {c.senderName || 'Support Agent'}
                        </span>
                        <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-300">{c.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No responses recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Input */}
          <form onSubmit={handleAddComment} className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center space-x-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type a reply or note..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}