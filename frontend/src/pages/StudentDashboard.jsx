import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStudentDashboardData } from '../services/api';
import {
  BookOpen,
  CalendarCheck,
  FileText,
  LifeBuoy,
  Bell,
  ArrowRight,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getStudentDashboardData();
      // Handle standard response wrapper { success: true, data: ... }
      setData(res.data.data || res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Unable to load dashboard metrics. Please check backend API.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Loading State (Skeleton Loaders)
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-slate-800 rounded-2xl"></div>
          <div className="h-64 bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-3 text-red-400">
        <AlertCircle className="w-6 h-6 flex-shrink-0" />
        <div>
          <h3 className="font-semibold">Error Loading Dashboard</h3>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  // Default fallbacks in case metrics are undefined
  const stats = [
    {
      title: 'Enrolled Courses',
      value: data?.totalCourses ?? 0,
      icon: BookOpen,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20',
    },
    {
      title: 'Avg. Attendance',
      value: `${data?.attendancePercentage ?? 0}%`,
      icon: CalendarCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      title: 'Pending Assignments',
      value: data?.pendingAssignmentsCount ?? 0,
      icon: FileText,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Open Support Tickets',
      value: data?.openTicketsCount ?? 0,
      icon: LifeBuoy,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Here is your academic overview and campus notifications for today.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`p-5 bg-slate-800/80 rounded-2xl border ${stat.borderColor} flex items-center justify-between shadow-sm`}
            >
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Announcements & Active Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Campus Announcements (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-sky-400" />
              <h2 className="font-bold text-lg text-white">Campus Announcements</h2>
            </div>
          </div>

          {!data?.announcements || data.announcements.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No recent campus announcements.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="p-4 bg-slate-900/50 border border-slate-700/40 rounded-xl space-y-1 hover:border-slate-600 transition duration-150"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-200 text-sm">
                      {announcement.title}
                    </h3>
                    <span className="text-xs text-slate-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {announcement.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enrolled Courses Quick List (1 Column) */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-lg text-white">My Subjects</h2>
              </div>
            </div>

            {!data?.courses || data.courses.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">Not enrolled in any courses yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.courses.map((course) => (
                  <div
                    key={course._id}
                    className="p-3 bg-slate-900/50 border border-slate-700/40 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{course.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{course.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <Link
            to="/student/courses"
            className="w-full mt-4 py-2.5 px-4 bg-slate-700/50 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-xl transition duration-150 flex items-center justify-center space-x-2"
          >
            <span>View All Course Details</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}