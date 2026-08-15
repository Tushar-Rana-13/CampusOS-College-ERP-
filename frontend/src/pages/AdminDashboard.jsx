import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">System Administration</h1>
      <p className="text-slate-400 text-sm">System-wide metrics, user distribution, and global helpdesk.</p>
    </div>
  );
}