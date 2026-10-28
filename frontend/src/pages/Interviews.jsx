import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Video,
  Plus,
  Trash2,
  AlertCircle,
  X
} from 'lucide-react';
import { getInterviewsApi, createInterviewApi, deleteInterviewApi } from '../services/api';

export default function Interviews({ onSelectCandidate }) {
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Schedule modal form state
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [stage, setStage] = useState('Technical Round');
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetingType, setMeetingType] = useState('Google Meet');
  const [notes, setNotes] = useState('');

  const loadInterviews = async () => {
    setIsLoading(true);
    try {
      const data = await getInterviewsApi();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load interviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!candidateName.trim() || !jobTitle.trim() || !interviewer.trim()) {
      setFormError('Candidate name, target role, and interviewer are required.');
      return;
    }

    const scheduledDate = scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString();

    setIsSubmitting(true);
    try {
      await createInterviewApi({
        candidate_id: `CAND-${Date.now().toString().slice(-4)}`,
        candidate_name: candidateName.trim(),
        candidate_email: candidateEmail.trim() || null,
        job_title: jobTitle.trim(),
        interviewer: interviewer.trim(),
        stage,
        scheduled_at: scheduledDate,
        meeting_type: meetingType,
        status: 'Scheduled',
        notes: notes.trim() || null
      });

      setShowScheduleModal(false);
      setCandidateName('');
      setCandidateEmail('');
      setJobTitle('');
      setInterviewer('');
      setNotes('');
      await loadInterviews();
    } catch (err) {
      setFormError(err.message || 'Failed to schedule interview.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this interview?')) return;
    try {
      await deleteInterviewApi(id);
      setInterviews(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to cancel interview');
    }
  };

  const filtered = interviews.filter(item => {
    const term = searchTerm.toLowerCase();
    const cName = (item.candidate_name || item.candidateName || '').toLowerCase();
    const jTitle = (item.job_title || item.jobTitle || '').toLowerCase();
    const inv = (item.interviewer || '').toLowerCase();
    const matchSearch = cName.includes(term) || jTitle.includes(term) || inv.includes(term);
    const itemStatus = (item.status || 'Scheduled').toUpperCase();
    const matchStatus = statusFilter === 'ALL' || itemStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-500/15">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Candidate Interviews
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-950/50 text-[#34D399] border border-emerald-500/25">
              {filtered.length} Scheduled
            </span>
          </div>
          <p className="text-sm text-[#94A3A8] mt-1">
            Coordinate interview schedules, stages, and interviewer evaluations from live database records.
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] rounded-xl shadow-md shadow-emerald-700/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Interview</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3A8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate, role, interviewer..."
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
            className="w-full pl-8 pr-4 py-2 text-xs border rounded-xl focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
            className="text-xs px-3 py-2 rounded-xl border focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Interviews Table View */}
      <div
        className="theme-card border rounded-2xl overflow-hidden shadow-xs"
        style={{
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)'
        }}
      >
        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#94A3A8]">
            Loading scheduled interviews...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center px-4">
            <Calendar className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
            <div className="text-sm font-bold text-white">
              No interviews found
            </div>
            <p className="text-xs text-[#94A3A8] mt-1 max-w-sm mx-auto">
              {interviews.length === 0
                ? 'No interviews are currently scheduled in the database. Schedule an interview round with shortlisted candidates.'
                : 'No interviews match your filter criteria.'}
            </p>
            {interviews.length === 0 && (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule First Interview</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#F8F7FD] dark:bg-white/[0.02] border-b border-[#EAE7F4] dark:border-white/[0.06] text-[#736B92] dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Candidate</th>
                  <th className="py-3 px-4 font-semibold">Target Role</th>
                  <th className="py-3 px-4 font-semibold">Stage</th>
                  <th className="py-3 px-4 font-semibold">Interviewer</th>
                  <th className="py-3 px-4 font-semibold">Scheduled Time</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDF8] dark:divide-white/[0.05]">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F4F3FA]/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-[#1C1739] dark:text-white">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs">{item.candidate_name || item.candidateName}</span>
                        {(item.candidate_email || item.candidateEmail) && (
                          <span className="text-[11px] text-[#736B92] dark:text-slate-400 mt-0.5">
                            {item.candidate_email || item.candidateEmail}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#5C5677] dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#736B92] shrink-0" />
                        <span className="font-medium">{item.job_title || item.jobTitle}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#1C1739] dark:text-white font-medium">
                      {item.stage || 'Technical Round'}
                    </td>

                    <td className="py-3.5 px-4 text-[#5C5677] dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#736B92] shrink-0" />
                        <span>{item.interviewer}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#5C5677] dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#736B92] shrink-0" />
                        <span>
                          {item.scheduled_at
                            ? new Date(item.scheduled_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : item.date || 'TBD'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/50 text-[#34D399] border border-emerald-500/20">
                        {item.status || 'Scheduled'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Cancel interview"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-modal">
          <div
            className="theme-card border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: 'var(--accent-bright)' }} />
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Schedule Interview</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-[#94A3A8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-2 rounded-xl bg-[#131F1B] border border-emerald-500/20 text-white placeholder:text-[#94A3A8]/60 focus:outline-none focus:border-[#34D399]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Candidate Email
                </label>
                <input
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#131F1B] border border-emerald-500/20 text-white placeholder:text-[#94A3A8]/60 focus:outline-none focus:border-[#34D399]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Target Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Python Developer"
                  className="w-full px-3 py-2 rounded-xl bg-[#131F1B] border border-emerald-500/20 text-white placeholder:text-[#94A3A8]/60 focus:outline-none focus:border-[#34D399]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">
                    Interviewer *
                  </label>
                  <input
                    type="text"
                    required
                    value={interviewer}
                    onChange={(e) => setInterviewer(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3 py-2 rounded-xl bg-[#131F1B] border border-emerald-500/20 text-white placeholder:text-[#94A3A8]/60 focus:outline-none focus:border-[#34D399]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">
                    Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131F1B] border border-emerald-500/20 text-white focus:outline-none focus:border-[#34D399]"
                  >
                    <option value="Initial Screening">Initial Screening</option>
                    <option value="Technical Round">Technical Round</option>
                    <option value="System Architecture">System Architecture</option>
                    <option value="Culture Fit">Culture Fit</option>
                    <option value="Executive Final">Executive Final</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">
                    Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131F1B] border border-emerald-500/20 text-white focus:outline-none focus:border-[#34D399]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">
                    Meeting Format
                  </label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131F1B] border border-emerald-500/20 text-white focus:outline-none focus:border-[#34D399]"
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="In-Person">In-Person</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-emerald-500/15">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3A8] hover:text-white hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] shadow-md shadow-emerald-700/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Scheduling...' : 'Save Interview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

