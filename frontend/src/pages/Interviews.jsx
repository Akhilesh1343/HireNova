import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Video,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const SAMPLE_INTERVIEWS = [
  {
    id: 1,
    candidateName: 'David Miller',
    candidateEmail: 'david.m@example.com',
    jobTitle: 'Senior Python & Backend Developer',
    interviewer: 'Alex Morgan (Hiring Manager)',
    stage: 'Technical Round',
    date: 'Tomorrow, 10:30 AM',
    status: 'Scheduled',
    matchScore: 88,
    meetingType: 'Google Meet'
  },
  {
    id: 2,
    candidateName: 'Sophia Chen',
    candidateEmail: 'sophia.c@example.com',
    jobTitle: 'Machine Learning & NLP Engineer',
    interviewer: 'Dr. Sarah Vance (Lead AI)',
    stage: 'System Architecture',
    date: 'Oct 2, 2:00 PM',
    status: 'Confirmed',
    matchScore: 92,
    meetingType: 'Zoom Meeting'
  },
  {
    id: 3,
    candidateName: 'Marcus Reynolds',
    candidateEmail: 'm.reynolds@example.com',
    jobTitle: 'Full Stack Engineer (React/FastAPI)',
    interviewer: 'Jordan Lee (Senior Recruiter)',
    stage: 'Initial Screening',
    date: 'Oct 3, 11:00 AM',
    status: 'Scheduled',
    matchScore: 84,
    meetingType: 'Teams Video'
  },
  {
    id: 4,
    candidateName: 'Elena Rostova',
    candidateEmail: 'elena.r@example.com',
    jobTitle: 'Senior Python & Backend Developer',
    interviewer: 'Executive Panel (HR Lead)',
    stage: 'Executive Final Round',
    date: 'Yesterday, 3:30 PM',
    status: 'Completed',
    matchScore: 90,
    meetingType: 'In-Person / Hybrid'
  }
];

export default function Interviews({ onSelectCandidate }) {
  const [interviews] = useState(SAMPLE_INTERVIEWS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = interviews.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      item.candidateName.toLowerCase().includes(term) ||
      item.jobTitle.toLowerCase().includes(term) ||
      item.interviewer.toLowerCase().includes(term);
    const matchStatus = statusFilter === 'ALL' || item.status.toUpperCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Candidate Interviews
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
              {filtered.length} Active
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Coordinate interview schedules, stages, and interviewer evaluations across roles.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate, role, interviewer..."
            className="w-full pl-8 pr-4 py-1.5 text-xs bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121A2F] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Interviews Table View */}
      <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 dark:bg-[#121A2F] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-medium">Candidate</th>
                <th className="py-3 px-4 font-medium">Target Role</th>
                <th className="py-3 px-4 font-medium">Stage</th>
                <th className="py-3 px-4 font-medium">Interviewer</th>
                <th className="py-3 px-4 font-medium">Schedule</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Meeting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{ '--row-index': idx }}
                  className="animate-row-enter hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{item.candidateName}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">{item.candidateEmail}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.jobTitle}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {item.stage}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{item.interviewer}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{item.date}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      item.status === 'Completed'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                    }`}>
                      {item.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      className="btn-interactive inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded"
                    >
                      <Video className="w-3 h-3" />
                      <span>Join Room</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
