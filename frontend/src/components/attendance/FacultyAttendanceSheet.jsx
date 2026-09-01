// client/src/components/attendance/FacultyAttendanceSheet.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Calendar, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { getCourseAttendance, markAttendance } from '../../services/api';

export default function FacultyAttendanceSheet({ courseId, courseCode, courseTitle }) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch roster and existing attendance records for the selected date
  const loadSheetData = useCallback(async (signal) => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      // Fetch roster + existing records for target date in one call
      const res = await getCourseAttendance(courseId, selectedDate, { signal });
      const rosterData = res.data?.roster || [];

      setStudents(rosterData);

      // Populate map with saved database status (or default to 'Present')
      const initialMap = {};
      rosterData.forEach((s) => {
        initialMap[s.studentId] = s.status || 'Present';
      });

      setAttendanceMap(initialMap);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        console.error('Fetch Roster Error:', err);
        setError(err.response?.data?.message || 'Failed to fetch course attendance.');
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

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const updatedMap = {};
    students.forEach((s) => {
      updatedMap[s.studentId] = status;
    });
    setAttendanceMap(updatedMap);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseId || students.length === 0) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');

      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      const res = await markAttendance({
        courseId,
        date: selectedDate,
        records,
      });

      setSuccessMsg(res.data?.message || `Attendance saved successfully for ${records.length} students.`);
    } catch (err) {
      console.error('Submit Attendance Error:', err);
      setError(err.response?.data?.message || 'Failed to submit attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-slate-900 border border-slate-800 rounded-2xl">
        <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading session roster and records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="px-2 py-0.5 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded font-mono uppercase">
            {courseCode || 'COURSE'}
          </span>
          <h2 className="text-lg font-bold text-white mt-1">
            {courseTitle || 'Attendance Management'}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl focus:outline-none focus:border-sky-500 transition cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={() => loadSheetData()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            title="Refresh Sheet"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Roster Container */}
      {students.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-500">
          No students currently enrolled in this course.
        </div>
      ) : (
        <>
          {/* Bulk Action Controls */}
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-sky-400" />
              <span>Total Students: {students.length}</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg transition"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg transition"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Student Roster List */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800">
                {students.map((student) => {
                  const studentId = student.studentId || student._id;
                  const currentStatus = attendanceMap[studentId] || 'Present';

                  return (
                    <div
                      key={studentId}
                      className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{student.name}</p>
                        <p className="text-xs text-slate-400">
                          {student.rollNumber ? `Roll: ${student.rollNumber}` : student.email}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(studentId, 'Present')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 border ${
                            currentStatus === 'Present'
                              ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Present</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(studentId, 'Late')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 border ${
                            currentStatus === 'Late'
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Late</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(studentId, 'Absent')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 border ${
                            currentStatus === 'Absent'
                              ? 'bg-rose-500 text-white border-rose-500'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Absent</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Footer */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || students.length === 0}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-2 shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Attendance...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Submit Attendance</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}