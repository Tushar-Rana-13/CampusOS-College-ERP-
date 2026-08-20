// src/pages/StudentHelpdesk.jsx
import React, { useState, useEffect } from 'react';
import TicketDetailDrawer from '../components/TicketDetailDrawer';
import CreateTicketModal from '../components/CreateTicketModal';
import api from '../services/api';
import { LifeBuoy, Plus, Clock, CheckCircle2 } from 'lucide-react';

export default function StudentHelpdesk() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const[isModalOpen , setIsModalOpen] = useState(false) ;

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets');
      const data = res.data?.data || res.data?.tickets || res.data || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCreated = (newTicket) => {
    setTickets((prev) => [newTicket , ...prev]) ;
  } ;

  // Seamless state update when modified inside drawer
  const handleTicketUpdate = (updatedTicket) => {
    setSelectedTicket(updatedTicket);
    setTickets((prev) =>
      prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <LifeBuoy className="w-7 h-7 text-sky-400" />
            <span>Helpdesk & Support</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Click on any ticket to view details, status updates, or responses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded-xl inline-flex items-center justify-center space-x-2 transition shadow-lg shadow-sky-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading tickets...</div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase">
                <th className="p-4">Ticket</th>
                <th className="p-4">Category</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-sm">
              {tickets.map((ticket) => (
                <tr
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="hover:bg-slate-700/40 cursor-pointer transition duration-150"
                >
                  <td className="p-4">
                    <p className="font-semibold text-white">{ticket.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{ticket.description}</p>
                  </td>
                  <td className="p-4 text-slate-300">{ticket.category}</td>
                  <td className="p-4 text-amber-400 font-medium">{ticket.priority}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs font-medium bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20">
                      {ticket.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-out Drawer */}
      <TicketDetailDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={handleTicketUpdate}
        isAdmin={false}
      />

      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
}