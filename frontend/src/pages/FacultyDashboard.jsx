import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function FacultyDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Faculty Workspace — Prof. {user?.name}</h1>
      <p className="text-slate-400 text-sm">Manage courses, record attendance, and grade assignments.</p>
    </div>
  );
}