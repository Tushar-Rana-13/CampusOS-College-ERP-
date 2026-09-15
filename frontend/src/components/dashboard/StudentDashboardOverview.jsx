import React, { useState, useEffect } from 'react';
import { getStudentDashboardStats } from '../../services/api';
import StatCard from './StatCard';
import { 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  LifeBuoy, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

export default function StudentDashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await getStudentDashboardStats();
        setStats(res.data?.data || null);
      } catch (err) {
        console.error('Student Analytics Fetch Error:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
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
        <p className="text-xs text-slate-400 font-medium">Loading real-time analytics...</p>
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

  const attendanceValue = `${stats?.overallAttendancePercentage ?? 100}%`;
  const isAttendanceLow = (stats?.overallAttendancePercentage ?? 100) < 75;

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={attendanceValue}
          icon={isAttendanceLow ? AlertTriangle : CheckCircle2}
          subtitle="Target compliance is 75%"
          badgeText={isAttendanceLow ? 'Below Target' : 'Good Standing'}
          colorScheme={isAttendanceLow ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Enrolled Courses"
          value={stats?.enrolledCoursesCount ?? 0}
          icon={BookOpen}
          subtitle="Active subjects this term"
          colorScheme="sky"
        />

        <StatCard
          title="Shortage Alerts"
          value={stats?.lowAttendanceWarningCount ?? 0}
          icon={AlertTriangle}
          subtitle="Courses with < 75% attendance"
          colorScheme={stats?.lowAttendanceWarningCount > 0 ? 'amber' : 'emerald'}
        />

        <StatCard
          title="Open Support Tickets"
          value={stats?.openTicketsCount ?? 0}
          icon={LifeBuoy}
          subtitle="Active requests pending resolution"
          colorScheme="sky"
        />
      </div>
    </div>
  );
}