// client/src/components/attendance/StudentAttendanceView.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  BookOpen, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { getStudentAttendance } from '../../services/api';

export default function StudentAttendanceView() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await getStudentAttendance();
        setReport(res.data?.attendanceReport || []);
      } catch (err) {
        console.error('Fetch Attendance Error:', err);
        setError(err.response?.data?.message || 'Failed to load attendance report.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const getStatusColor = (percentage) => {
    if (percentage >= 75) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (percentage >= 65) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Fetching attendance metrics...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Attendance Overview</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track your course attendance stats and maintain compliance above 75%.
          </p>
        </div>
      </div>

      {report.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 rounded-2xl border border-dashed border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No Attendance Records Found</p>
          <p className="text-xs text-slate-500 mt-1">You are currently not enrolled in active courses with recorded sessions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {report.map((item) => {
            const status = getStatusColor(item.percentage);
            const isShortage = item.percentage < 75;

            return (
              <div
                key={item.courseId}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-lg uppercase font-mono">
                      {item.courseCode}
                    </span>
                    <span className={`px-2.5 py-1 text-[10px] font-bold ${status.bg} ${status.text} ${status.border} border rounded-lg`}>
                      {item.percentage}%
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-1" title={item.courseTitle}>
                    {item.courseTitle}
                  </h3>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        item.percentage >= 75
                          ? 'bg-emerald-500'
                          : item.percentage >= 65
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                  {isShortage && (
                    <div className="flex items-center space-x-1.5 text-rose-400 text-[11px] font-medium pt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Low attendance warning (&lt;75%)</span>
                    </div>
                  )}
                </div>

                {/* Attendance Counter Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                  <div className="p-2 bg-slate-800/40 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Attended</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{item.attendedClasses}</p>
                  </div>
                  <div className="p-2 bg-slate-800/40 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Absent</p>
                    <p className="text-sm font-bold text-rose-400 mt-0.5">{item.absentCount}</p>
                  </div>
                  <div className="p-2 bg-slate-800/40 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total</p>
                    <p className="text-sm font-bold text-white mt-0.5">{item.totalClasses}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}