import { useState } from 'react';
import { BookOpenCheck, Headset, UsersRound } from 'lucide-react';
import UserRegistrationForm from '../components/admin/UserRegistrationForm';
import CourseEnrollmentForm from '../components/admin/CourseEnrollmentForm';
import HelpdeskAdminView from '../components/admin/HelpdeskAdminView';

const tabs = [
  { id: 'users', label: 'User provisioning', description: 'Create student and faculty accounts.', icon: UsersRound },
  { id: 'enrollment', label: 'Course enrollment', description: 'Enroll students in active courses.', icon: BookOpenCheck },
  { id: 'helpdesk', label: 'Helpdesk', description: 'Review and respond to support tickets.', icon: Headset },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  return <div className="mx-auto max-w-6xl space-y-6">
    <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-xl shadow-slate-950/20 md:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">Administration</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">CampusOS control center</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">Create accounts, manage course rosters, and keep student support moving from one workspace.</p></section>
    <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-2 sm:grid-cols-3">{tabs.map(({ id, label, description, icon: Icon }) => { const isActive = activeTab === id; return <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${isActive ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/40' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><Icon className="h-5 w-5 shrink-0" /><span><span className="block text-sm font-semibold">{label}</span><span className={`mt-0.5 block text-xs ${isActive ? 'text-sky-100' : 'text-slate-500'}`}>{description}</span></span></button>; })}</div>
    <section aria-label={currentTab?.label}>{activeTab === 'users' && <UserRegistrationForm />}{activeTab === 'enrollment' && <CourseEnrollmentForm />}{activeTab === 'helpdesk' && <HelpdeskAdminView />}</section>
  </div>;
}
