import React, { useState, useEffect } from 'react';
import { getTickets, createTicket } from '../services/api'; // ✅ Updated export name
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
} from 'lucide-react';

export default function StudentHelpdesk() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('IT Support');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  // Close modal on escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTickets();

      // Flexible safety check for array extraction
      let ticketArray = [];
      if (Array.isArray(res.data)) {
        ticketArray = res.data;
      } else if (Array.isArray(res.data?.data)) {
        ticketArray = res.data.data;
      } else if (Array.isArray(res.data?.tickets)) {
        ticketArray = res.data.tickets;
      }

      setTickets(ticketArray);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError(err.response?.data?.message || 'Unable to load support tickets.');
      setTickets([]); // Keep state as array on error so UI doesn't crash
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('IT Support');
    setPriority('Medium');
    setDescription('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTicket({ title, category, priority, description });
      handleCloseModal();
      await fetchTickets(); // Refresh ticket list after creation
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center space-x-1 w-fit">
            <Clock className="w-3 h-3 mr-1" /> Open
          </span>
        );
      case 'in progress':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full flex items-center space-x-1 w-fit">
            <Clock className="w-3 h-3 mr-1" /> In Progress
          </span>
        );
      case 'resolved':
      case 'closed':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center space-x-1 w-fit">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full flex items-center space-x-1 w-fit">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const getPriorityBadge = (prio) => {
    const p = prio?.toLowerCase();
    if (p === 'high') return <span className="text-xs font-bold text-red-400">High</span>;
    if (p === 'medium') return <span className="text-xs font-bold text-amber-400">Medium</span>;
    return <span className="text-xs font-bold text-slate-400">Low</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <LifeBuoy className="w-7 h-7 text-sky-400" />
            <span>Student Helpdesk & Support</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Submit grievances, IT requests, or academic queries to campus administration.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-medium text-sm rounded-xl transition duration-150 flex items-center space-x-2 shadow-lg shadow-sky-600/30"
        >
          <Plus className="w-5 h-5" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-12 text-center space-y-3">
          <LifeBuoy className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-semibold text-white">No Support Tickets Found</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            You haven't submitted any support requests yet. Click the button above to open your first ticket.
          </p>
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Ticket Info</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 text-sm">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-700/30 transition duration-150">
                    <td className="p-4">
                      <p className="font-semibold text-white">{ticket.title}</p>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{ticket.description}</p>
                    </td>
                    <td className="p-4 text-slate-300">{ticket.category}</td>
                    <td className="p-4">{getPriorityBadge(ticket.priority)}</td>
                    <td className="p-4">{getStatusBadge(ticket.status)}</td>
                    <td className="p-4 text-slate-400 text-xs">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing when clicking inside modal
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white">Create Support Ticket</h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Subject / Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Wi-Fi disconnected in Lab 3"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="IT Support">IT Support</option>
                    <option value="Academics">Academics</option>
                    <option value="Hostel/Facility">Hostel/Facility</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  rows="4"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain your query or issue in detail..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-xl flex items-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}