// src/pages/AdminHelpdesk.jsx
import React, { useState, useEffect } from 'react';
import TicketDetailDrawer from '../components/TicketDetailDrawer';
import api from '../services/api';
import { ShieldAlert, Search, Filter, RefreshCw } from 'lucide-react';

const STATUS_TABS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

export default function AdminHelpdesk() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetchAdminTickets();
  }, []);

  const fetchAdminTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets/admin/all');
      const data = res.data?.data || res.data?.tickets || res.data || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching admin tickets:', err);
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

  // Filter pipeline
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = activeTab === 'All' || ticket.status === activeTab;
    const matchesCategory =
      categoryFilter === 'All' || ticket.category === categoryFilter;
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket._id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
            <span>Admin Helpdesk Portal</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage campus issues, update ticket statuses, and respond to students.
          </p>
        </div>

        <button
          onClick={fetchAdminTickets}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center space-x-2 text-xs font-semibold self-start sm:self-auto transition"
        >
          <RefreshCw className="w-4 h-4" />
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
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ticket title or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
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

      {/* Tickets Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Fetching administrative records...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-500 text-sm">
          No tickets matching your filter criteria.
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-semibold text-slate-400 uppercase">
                <th className="p-4">Ticket Info</th>
                <th className="p-4">Category</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="hover:bg-slate-800/50 cursor-pointer transition"
                >
                  <td className="p-4">
                    <p className="font-semibold text-white">{ticket.title}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      #{ticket._id?.slice(-6).toUpperCase()}
                    </p>
                  </td>
                  <td className="p-4 text-slate-300 text-xs">{ticket.category}</td>
                  <td className="p-4 text-xs font-semibold text-amber-400">
                    {ticket.priority}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-[11px] font-medium bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20">
                      {ticket.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Shared Drawer in Admin Mode */}
      <TicketDetailDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={handleTicketUpdate}
        isAdmin={true}
      />
    </div>
  );
}
