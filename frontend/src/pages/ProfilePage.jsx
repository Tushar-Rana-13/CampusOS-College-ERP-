// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { User, Shield, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ProfilePage({ currentUser, onUserUpdated }) {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    rollNumber: '',
    semester: 1,
    designation: '',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync form state when currentUser prop hydrates or updates
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        department: currentUser.department || '',
        rollNumber: currentUser.rollNumber || '',
        semester: currentUser.semester || 1,
        designation: currentUser.designation || '',
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert semester to integer for clean payload schema
    const parsedValue = name === 'semester' ? parseInt(value, 10) : value;

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    if (successMsg) setSuccessMsg('');
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // Clean payload based on user role to avoid dirty schema updates
      const userRole = currentUser?.role?.toLowerCase();
      const payload = {
        name: formData.name,
        department: formData.department,
        ...(userRole === 'student' && {
          rollNumber: formData.rollNumber,
          semester: formData.semester,
        }),
        ...(userRole === 'faculty' && {
          designation: formData.designation,
        }),
      };

      const res = await api.put('/users/profile', payload);
      const updatedUser = res.data?.data || res.data;

      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      setSuccessMsg('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      const serverMessage =
        err.response?.data?.message || 'Failed to update profile. Please try again.';
      setErrorMsg(serverMessage);
    } finally {
      setSaving(false);
    }
  };

  const userRoleNormalized = currentUser?.role?.toLowerCase() || 'student';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-2xl">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{currentUser?.name || 'User Profile'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser?.email}</p>
          </div>
        </div>

        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center space-x-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>{currentUser?.role || 'Student'}</span>
        </span>
      </div>

      {/* Status Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Settings Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3">
          Account Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Role Conditional Fields */}
          {userRoleNormalized === 'student' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Roll Number</label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  placeholder="e.g. 21BCS104"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Current Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {userRoleNormalized === 'faculty' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g. Assistant Professor"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 transition shadow-lg shadow-sky-600/20"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}