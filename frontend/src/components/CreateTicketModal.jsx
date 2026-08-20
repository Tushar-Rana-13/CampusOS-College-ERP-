// src/components/CreateTicketModal.jsx
import React, { useState } from 'react';
import { X, AlertCircle, Send, Paperclip } from 'lucide-react';
import api from '../services/api';

const CATEGORIES = [
  'Academic',
  'Hostel & Mess',
  'IT & Campus WiFi',
  'Fee & Accounts',
  'Library',
  'Other',
];

const PRIORITIES = [
  { label: 'Low', value: 'Low', color: 'border-slate-600 text-slate-300' },
  { label: 'Medium', value: 'Medium', color: 'border-amber-500/50 text-amber-400' },
  { label: 'High', value: 'High', color: 'border-rose-500/50 text-rose-400' },
];

export default function CreateTicketModal({ isOpen, onClose, onTicketCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Academic',
    priority: 'Medium',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend Validation
    if (!formData.title.trim()) {
      setError('Ticket title is required.');
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 15) {
      setError('Please provide a detailed description (at least 15 characters).');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Submit payload to backend
      const res = await api.post('/tickets', formData);
      const newTicket = res.data?.data || res.data?.ticket || res.data;

      // Notify parent component to update state
      onTicketCreated(newTicket);

      // Reset and close
      setFormData({
        title: '',
        category: 'Academic',
        priority: 'Medium',
        description: '',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div>
            <h3 className="text-lg font-bold text-white">Raise a Support Ticket</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit your issue to campus administration or faculty.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., WiFi disconnected in Block B Hostel"
              className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Priority Level
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide relevant details (e.g., room number, error codes, steps to reproduce)..."
              className="w-full bg-slate-800 border border-slate-700/80 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-sky-500 transition resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 transition shadow-lg shadow-sky-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Submitting...' : 'Submit Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}