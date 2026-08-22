import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import api from '../services/api';
import TicketDetailDrawer from '../components/TicketDetailDrawer';
import { useAuth } from '../context/AuthContext';

const STATUS_TABS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

export default function AdminHelpdesk() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      // The API applies the correct visibility rules for the signed-in role.
      const res = await api.get('/tickets');
      const data = res.data?.data || res.data?.tickets || res.data || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.response?.data?.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketUpdate = (updatedTicket) => {
    setSelectedTicket(updatedTicket);
    setTickets((prev) =>
      prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
    );
  };

  // Safe Filter Pipeline with Null Guards
  const filteredTickets = tickets.filter((ticket) => {
    const ticketTitle = ticket?.title || '';
    const ticketId = ticket?._id || '';

    const matchesStatus = activeTab === 'All' || ticket.status === activeTab;
    const matchesCategory = categoryFilter === 'All' || ticket.category === categoryFilter;
    const matchesSearch =
      ticketTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticketId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Helper badge color assigner
  const getPriorityBadge = (priority = '') => {
    switch (priority.toLowerCase()) {
      case 'urgent':
      case 'critical':
      case 'high':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusBadge = (status = '') => {
    switch (status) {
      case 'Open':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'In Progress':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Closed':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
            <span>{isAdmin ? 'Admin Helpdesk Portal' : 'Faculty Helpdesk Portal'}</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage campus issues, update ticket statuses, and respond to students.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center space-x-2 text-xs font-semibold self-start sm:self-auto transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Control Bar: Status Tabs & Search */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-800 pb-3 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                activeTab === tab
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Category Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ticket title or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition"
            >
              <option value="All">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Hostel & Mess">Hostel & Mess</option>
              <option value="IT & Campus WiFi">IT & Campus WiFi</option>
              <option value="Fee & Accounts">Fee & Accounts</option>
              <option value="Library">Library</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Tickets Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Fetching tickets...</span>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-500 text-xs">
          No tickets matching your filter criteria.
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Ticket Info</th>
                <th className="p-4">Submitted By</th>
                <th className="p-4">Category</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="hover:bg-slate-800/50 cursor-pointer transition"
                >
                  <td className="p-4">
                    <p className="font-semibold text-white">{ticket.title || 'Untitled Ticket'}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      #{ticket._id?.slice(-6).toUpperCase()}
                    </p>
                  </td>
                  <td className="p-4 text-slate-300">
                    <p className="font-medium text-slate-200">{ticket.raisedBy?.name || 'Student'}</p>
                    <p className="text-[10px] text-slate-500">{ticket.raisedBy?.email || 'N/A'}</p>
                  </td>
                  <td className="p-4 text-slate-300">{ticket.category || 'General'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-md border ${getPriorityBadge(ticket.priority)}`}>
                      {ticket.priority || 'Normal'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-md border ${getStatusBadge(ticket.status)}`}>
                      {ticket.status || 'Open'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Shared Drawer in Admin Mode */}
      {selectedTicket && (
        <TicketDetailDrawer
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onTicketUpdated={handleTicketUpdate}
          canUpdateStatus={isAdmin || user?.role === 'faculty'}
          canAssign={isAdmin}
        />
      )}
    </div>
  );
}
