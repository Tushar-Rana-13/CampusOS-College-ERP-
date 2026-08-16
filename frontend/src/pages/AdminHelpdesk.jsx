import React, { useState, useEffect } from 'react';
import { getTickets, updateTicket, getFacultyList } from '../services/api';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  UserCheck,
  Edit3,
  X,
  Save,
  Search,
} from 'lucide-react';

export default function AdminHelpdesk() {
  const [tickets, setTickets] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Ticket Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ticketsRes, facultyRes] = await Promise.all([
        getTickets(),
        getFacultyList(),
      ]);

      setTickets(ticketsRes.data.tickets || []);
      setFacultyList(facultyRes.data.users || []);
    } catch (err) {
      console.error('Failed to load helpdesk data:', err);
      setError(err.response?.data?.message || 'Failed to sync support requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (ticket) => {
    setSelectedTicket(ticket);
    setStatus(ticket.status || 'Open');
    setAssignedTo(ticket.assignedTo?._id || '');
    setResolutionNotes(ticket.resolutionNotes || '');
  };

  const handleCloseModal = () => {
    setSelectedTicket(null);
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setUpdating(true);
    try {
      await updateTicket(selectedTicket._id, {
        status,
        assignedTo: assignedTo || null,
        resolutionNotes,
      });

      handleCloseModal();
      await fetchData(); // Refresh data grid
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  // Filter Logic
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus =
      statusFilter === 'All' ||
      ticket.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.raisedBy?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Analytics Counters
  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'Open').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    resolved: tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length,
  };

  const getStatusBadge = (ticketStatus) => {
    switch (ticketStatus?.toLowerCase()) {
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
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-7 h-7 text-sky-400" />
          <span>Admin Support Queue</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Assign incoming campus issues, update resolution status, and manage support logs.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">Total Tickets</p>
          <p className="text-2xl font-bold text-white mt-1">{counts.total}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <p className="text-xs text-amber-400 font-medium">Open</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{counts.open}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <p className="text-xs text-sky-400 font-medium">In Progress</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{counts.inProgress}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <p className="text-xs text-emerald-400 font-medium">Resolved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{counts.resolved}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title or student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          {['All', 'Open', 'In Progress', 'Resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                statusFilter === tab
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-12 text-center text-slate-400 text-sm">
          No support tickets match the selected filters.
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Ticket</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 text-sm">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-700/30 transition">
                    <td className="p-4">
                      <p className="font-semibold text-white">{ticket.title}</p>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{ticket.description}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-200 font-medium">{ticket.raisedBy?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{ticket.raisedBy?.email}</p>
                    </td>
                    <td className="p-4 text-slate-300">{ticket.category}</td>
                    <td className="p-4">
                      {ticket.assignedTo ? (
                        <span className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded-md flex items-center w-fit space-x-1">
                          <UserCheck className="w-3 h-3 text-sky-400 mr-1" />
                          {ticket.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(ticket.status)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(ticket)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition inline-flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Management Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white">Manage Ticket</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-4">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 space-y-1">
                <p className="text-xs text-slate-400">Subject</p>
                <p className="text-sm font-semibold text-white">{selectedTicket.title}</p>
                <p className="text-xs text-slate-300 mt-2">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Assign To Staff
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Unassigned</option>
                    {facultyList.map((faculty) => (
                      <option key={faculty._id} value={faculty._id}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Resolution / Admin Notes
                </label>
                <textarea
                  rows="3"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Notes on resolution or steps taken..."
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
                  disabled={updating}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-xl flex items-center space-x-2 disabled:opacity-50"
                >
                  {updating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
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