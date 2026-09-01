// client/src/pages/StudentAttendancePage.jsx

import React from 'react';
import StudentAttendanceView from '../components/attendance/StudentAttendanceView';

export default function StudentAttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Attendance Record</h1>
        <p className="text-slate-400 text-sm mt-1">
          Track your overall and course-wise attendance percentage and logs.
        </p>
      </div>

      <StudentAttendanceView />
    </div>
  );
}