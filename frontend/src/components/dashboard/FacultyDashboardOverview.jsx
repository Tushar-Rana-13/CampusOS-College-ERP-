import React, { useState, useEffect } from 'react';
import { getFacultyDashboardStats } from '../../services/api';
import StatCard from './StatCard';
import { Users, BookOpen, BarChart3, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function FacultyDashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await getFacultyDashboardStats();
        setStats(res.data?.data || null);
      } catch (err) {
        console.error('Faculty Analytics Fetch Error:', err);
        setError(err.response?.data?.message || 'Failed to load faculty metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
        <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Aggregating course metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const statusDist = stats?.statusDistribution || { Present: 0, Absent: 0, Late: 0 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Courses"
          value={stats?.totalCourses ?? 0}
          icon={BookOpen}
          subtitle="Active subjects instructed"
          colorScheme="sky"
        />

        <StatCard
          title="Total Students Enrolled"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          subtitle="Unique students across courses"
          colorScheme="emerald"
        />

        <StatCard
          title="Average Attendance Rate"
          value={`${stats?.avgAttendanceRate ?? 100}%`}
          icon={BarChart3}
          subtitle="Overall class participation"
          colorScheme="sky"
        />
      </div>

      {/* Attendance Distribution Breakdown Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Student Session Breakdown</h3>
          <span className="text-xs text-slate-400 font-medium">Cumulative Record Log</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-slate-400 block mb-1">Present Logs</span>
            <span className="text-lg font-bold text-emerald-400">{statusDist.Present}</span>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <span className="text-slate-400 block mb-1">Absent Logs</span>
            <span className="text-lg font-bold text-rose-400">{statusDist.Absent}</span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <span className="text-slate-400 block mb-1">Late Logs</span>
            <span className="text-lg font-bold text-amber-400">{statusDist.Late}</span>
          </div>
        </div>
      </div>
    </div>
  );
}