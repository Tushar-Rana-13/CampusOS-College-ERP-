// client/src/components/TicketDetailsDrawer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Clock, UserCheck } from 'lucide-react';
import api from '../services/api';

export default function TicketDetailsDrawer({
  ticket,
  onClose,
  onTicketUpdated,
  canUpdateStatus = false,
  canAssign = false,
}) {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(ticket?.status || 'Open');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState('');
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(
    ticket?.assignedTo?._id || ticket?.assignedTo || ''
  );
  const [assigning, setAssigning] = useState(false);

  const commentsEndRef = useRef(null);

  // Sync state when active ticket prop changes
  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status || 'Open');
      setSelectedFaculty(ticket.assignedTo?._id || ticket.assignedTo || '');
      setError('');
    }
  }, [ticket]);

  // Scroll to bottom of comment thread on update
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.comments]);

  // Lock scroll background
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

  // Fetch Faculty members for Admin dropdown
  useEffect(() => {
    if (canAssign) {
      const fetchFaculty = async () => {
        try {
          // Adjust query parameter based on your user route
          const res = await api.get('/users?role=faculty');
          const list = res.data?.data || res.data || [];
          setFacultyList(Array.isArray(list) ? list : []);
        } catch (err) {
          console.warn('Faculty list fetch failed, falling back to empty list:', err);
        }
      };
      fetchFaculty();
    }
  }, [canAssign]);

  if (!ticket) return null;

  // Handle Status Update (PATCH /api/tickets/:id/status)
  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      setError('');
      setStatus(newStatus); // Optimistic UI update

      const res = await api.patch(`/tickets/${ticket._id}/status`, {
        status: newStatus,
      });

      // Unwrap ApiResponse structure
      const updatedTicket = res.data?.data;
      if (updatedTicket && onTicketUpdated) {
        onTicketUpdated(updatedTicket);
      }
    } catch (err) {
      console.error('Status update failed:', err);
      setStatus(ticket.status); // Rollback
      setError(err.response?.data?.message || 'Failed to update ticket status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Faculty Assignment (PATCH /api/tickets/:id/assign)
  const handleAssignChange = async (e) => {
    const facultyId = e.target.value;
    setSelectedFaculty(facultyId);

    if (!facultyId) return;

    try {
      setAssigning(true);
      setError('');

      // Payload key must match req.body.assignedTo in ticketController.js
      const res = await api.patch(`/tickets/${ticket._id}/assign`, {
        assignedTo: facultyId,
      });

      const updatedTicket = res.data?.data;
      if (updatedTicket && onTicketUpdated) {
        onTicketUpdated(updatedTicket);
      }
    } catch (err) {
      console.error('Assignment failed:', err);
      setSelectedFaculty(ticket.assignedTo?._id || ticket.assignedTo || ''); // Rollback
      setError(err.response?.data?.message || 'Failed to assign ticket.');
    } finally {
      setAssigning(false);
    }
  };

  // Handle Comment Submission (POST /api/tickets/:id/comments)
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      setError('');

      const res = await api.post(`/tickets/${ticket._id}/comments`, {
        text: commentText.trim(),
      });

      const updatedTicket = res.data?.data;
      if (updatedTicket && onTicketUpdated) {
        onTicketUpdated(updatedTicket);
        setCommentText('');
      }
    } catch (err) {
      console.error('Comment failed:', err);
      setError(err.response?.data?.message || 'Failed to send comment.');
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
                  {ticket.category || 'General'}
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
            
            {/* Status & Assignment Panel */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Current Status</span>
                <span>
                  Priority: <strong className="text-amber-400">{ticket.priority || 'Medium'}</strong>
                </span>
              </div>

              {canUpdateStatus ? (
                <div className="space-y-3 pt-1 border-t border-slate-700/50">
                  {/* Status Dropdown */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Update Ticket Status
                    </label>
                    <select
                      value={status}
                      disabled={updatingStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  {/* Assignee Dropdown */}
                  {canAssign && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center space-x-1">
                        <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                        <span>Assign to Faculty / Staff</span>
                      </label>
                      <select
                        value={selectedFaculty}
                        disabled={assigning}
                        onChange={handleAssignChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition"
                      >
                        <option value="">Unassigned</option>
                        {facultyList.map((fac) => (
                          <option key={fac._id} value={fac._id}>
                            {fac.name} ({fac.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm font-semibold text-sky-400 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{ticket.status}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Description
              </h4>
              <p className="text-sm text-slate-300 bg-slate-800/30 p-3.5 rounded-xl border border-slate-800 whitespace-pre-line">
                {ticket.description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Comments Thread */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Activity & Responses
              </h4>
              <div className="space-y-3">
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map((c, i) => (
                    <div
                      key={c._id || i}
                      className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium text-slate-200">
                          {typeof c.sender === 'object' ? c.sender?.name : 'Staff/Student'}
                        </span>
                        <span>
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{c.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No responses recorded yet.</p>
                )}
                <div ref={commentsEndRef} />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                {error}
              </div>
            )}
          </div>

          {/* Bottom Reply Box */}
          <form
            onSubmit={handleAddComment}
            className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center space-x-2"
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type a reply or note..."
              disabled={submitting}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
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
