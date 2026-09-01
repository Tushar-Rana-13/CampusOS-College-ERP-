// client/src/pages/FacultyAttendancePage.jsx

import React from 'react';
import FacultyAttendanceSheet from '../components/attendance/FacultyAttendanceSheet';

export default function FacultyAttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Mark Attendance</h1>
        <p className="text-slate-400 text-sm mt-1">
          Select a course and session date to record student attendance.
        </p>
      </div>

      <FacultyAttendanceSheet />
    </div>
  );
}