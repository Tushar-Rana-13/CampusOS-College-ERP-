// client/src/components/attendance/FacultyAttendanceSheet.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { getCourseAttendance, markAttendance } from '../../services/api';
import { Calendar, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';

export default function FacultyAttendanceSheet({ courseId }) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch Roster & Saved Attendance
  const loadSheetData = useCallback(async (signal) => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      const response = await getCourseAttendance(courseId, selectedDate, { signal });
      
      // Robust data extraction handling diverse response envelopes
      const payload = response?.data?.data || response?.data || {};
      const rosterData = Array.isArray(payload.roster) ? payload.roster : Array.isArray(payload) ? payload : [];

      setStudents(rosterData);

      // Populate current status mapping
      const initialMap = {};
      rosterData.forEach((item) => {
        const studentId = item.studentId?._id || item.studentId || item._id;
        initialMap[studentId] = item.status || 'Present';
      });

      setAttendanceMap(initialMap);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        console.error('Attendance Load Error:', err);
        setError(err.response?.data?.message || 'Failed to load class roster for selected date.');
        setStudents([]);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId, selectedDate]);

  useEffect(() => {
    const controller = new AbortController();
    loadSheetData(controller.signal);

    return () => controller.abort();
  }, [loadSheetData]);

  // 2. Local State Toggle Handler
  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // 3. Submit Session Payload
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');

      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await markAttendance({
        courseId,
        date: selectedDate,
        records,
      });

      setSuccessMsg(`Attendance recorded successfully for ${selectedDate}`);
    } catch (err) {
      console.error('Attendance Save Error:', err);
      setError(err.response?.data?.message || 'Failed to submit attendance records.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-3">
        <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Fetching class roster...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 space-y-6">
      {/* Date Bar & Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <h2 className="text-base font-bold text-white">Attendance Roster</h2>
          <p className="text-xs text-slate-400">Total Enrolled: {students.length}</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/80">
            <Calendar className="w-4 h-4 text-sky-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Roster Table */}
      {students.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-xs bg-slate-900/40 rounded-xl border border-dashed border-slate-700/80">
          No students are currently enrolled in this course.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 text-xs font-medium text-slate-200">
                {students.map((item) => {
                  const student = item.studentId || item;
                  const sId = student._id || item._id;
                  const currentStatus = attendanceMap[sId] || 'Present';

                  return (
                    <tr key={sId} className="hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {student.name || 'Unknown Student'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{student.email || 'N/A'}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          {['Present', 'Absent', 'Late'].map((status) => {
                            const isSelected = currentStatus === status;
                            let activeClass = 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600';
                            
                            if (isSelected) {
                              if (status === 'Present') activeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
                              if (status === 'Absent') activeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
                              if (status === 'Late') activeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
                            }

                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(sId, status)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${activeClass}`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-700/60">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-slate-950 text-xs font-bold rounded-xl transition flex items-center space-x-2 shadow-sm"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{submitting ? 'Saving Records...' : 'Save Attendance'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}