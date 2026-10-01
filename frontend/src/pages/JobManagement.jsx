import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  FileSearch,
  Sparkles,
  MapPin,
  Clock,
  ChevronDown
} from 'lucide-react';
import { getJobsApi, createJobApi, updateJobApi, deleteJobApi } from '../services/api';
import { JOB_TEMPLATES } from '../data/jobTemplates';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../utils/rbac';

export default function JobManagement({ setCurrentTab, setSelectedJobForScreening }) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { user } = useAuth();
  const userRole = normalizeRole(user?.role);
  const canCreateEdit = userRole === 'admin' || userRole === 'recruiter';
  const canDelete = userRole === 'admin';
  const canScreen = userRole === 'admin' || userRole === 'recruiter';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('Remote / Hybrid');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [status, setStatus] = useState('Active');
  const [minExp, setMinExp] = useState(2);
  const [maxExp, setMaxExp] = useState(5);
  const [minSalary, setMinSalary] = useState(70000);
  const [maxSalary, setMaxSalary] = useState(120000);
  const [requiredSkillsInput, setRequiredSkillsInput] = useState('');
  const [preferredSkillsInput, setPreferredSkillsInput] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const data = await getJobsApi();
      if (data && data.length > 0) {
        setJobs(data);
      } else {
        // Preload default initial jobs if database has none
        setJobs(JOB_TEMPLATES.slice(0, 3).map((tpl, i) => ({
          id: i + 1,
          title: tpl.title,
          department: tpl.department,
          location: tpl.location,
          status: 'Active',
          candidates_count: 12 + i * 8,
          created_at: new Date().toISOString(),
          description: tpl.description,
          required_skills: tpl.requiredSkills
        })));
      }
    } catch (err) {
      console.warn('Jobs fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleOpenCreateModal = () => {
    if (!canCreateEdit) return;
    setEditingJobId(null);
    setSelectedTemplateId('');
    setTitle('');
    setDepartment('Engineering');
    setLocation('Remote / Hybrid');
    setEmploymentType('Full-Time');
    setStatus('Active');
    setMinExp(2);
    setMaxExp(5);
    setMinSalary(70000);
    setMaxSalary(120000);
    setRequiredSkillsInput('');
    setPreferredSkillsInput('');
    setDescription('');
    setIsReadOnly(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJobId(job.id);
    setSelectedTemplateId('');
    setTitle(job.title || '');
    setDepartment(job.department || 'Engineering');
    setLocation(job.location || 'Remote / Hybrid');
    setEmploymentType(job.employment_type || 'Full-Time');
    setStatus(job.status || 'Active');
    setMinExp(job.min_experience || 2);
    setMaxExp(job.max_experience || 5);
    setMinSalary(job.salary_min || 70000);
    setMaxSalary(job.salary_max || 120000);
    const reqStr = Array.isArray(job.required_skills) ? job.required_skills.join(', ') : (job.required_skills || '');
    setRequiredSkillsInput(reqStr);
    const prefStr = Array.isArray(job.preferred_skills) ? job.preferred_skills.join(', ') : (job.preferred_skills || '');
    setPreferredSkillsInput(prefStr);
    setDescription(job.description || '');
    setIsReadOnly(false);
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (job) => {
    setEditingJobId(job.id);
    setSelectedTemplateId('');
    setTitle(job.title || '');
    setDepartment(job.department || 'Engineering');
    setLocation(job.location || 'Remote / Hybrid');
    setEmploymentType(job.employment_type || 'Full-Time');
    setStatus(job.status || 'Active');
    setMinExp(job.min_experience || 2);
    setMaxExp(job.max_experience || 5);
    setMinSalary(job.salary_min || 70000);
    setMaxSalary(job.salary_max || 120000);
    const reqStr = Array.isArray(job.required_skills) ? job.required_skills.join(', ') : (job.required_skills || '');
    setRequiredSkillsInput(reqStr);
    const prefStr = Array.isArray(job.preferred_skills) ? job.preferred_skills.join(', ') : (job.preferred_skills || '');
    setPreferredSkillsInput(prefStr);
    setDescription(job.description || '');
    setIsReadOnly(true);
    setIsModalOpen(true);
  };

  const handleSelectTemplate = (e) => {
    const tplId = e.target.value;
    setSelectedTemplateId(tplId);
    if (!tplId) return;

    const tpl = JOB_TEMPLATES.find(t => t.id === tplId);
    if (tpl) {
      setTitle(tpl.title);
      setDepartment(tpl.department);
      setLocation(tpl.location);
      setEmploymentType(tpl.type || 'Full-Time');
      setMinExp(tpl.minExperience || 2);
      setMaxExp(tpl.maxExperience || 5);
      setMinSalary(tpl.minSalary || 70000);
      setMaxSalary(tpl.maxSalary || 120000);
      setRequiredSkillsInput(tpl.requiredSkills.join(', '));
      setPreferredSkillsInput((tpl.preferredSkills || []).join(', '));
      setDescription(tpl.description);
    }
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    const parsedSkills = requiredSkillsInput
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      required_skills: parsedSkills.length > 0 ? parsedSkills : ['python', 'sql', 'git'],
      department,
      location,
      status
    };

    try {
      if (editingJobId) {
        await updateJobApi(editingJobId, payload);
      } else {
        await createJobApi(payload);
      }
      setIsModalOpen(false);
      await loadJobs();
    } catch (err) {
      alert(`Failed to save job: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job opening?')) return;
    try {
      await deleteJobApi(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (err) {
      alert(`Could not delete job: ${err.message}`);
    }
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = !searchTerm.trim() ||
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (j.status || 'Active').toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Job Openings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and track all company roles, requirements, and candidate pipelines.
          </p>
        </div>

        {canCreateEdit && (
          <button
            onClick={handleOpenCreateModal}
            className="btn-interactive inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Job</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search jobs by title or department..."
            className="w-full pl-8 pr-4 py-1.5 text-xs bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121A2F] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Jobs Clean Table View (Requirement 5) */}
      <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading job postings...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Briefcase className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">No Job Openings Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {canCreateEdit ? 'Create a new job using our 10 templates to begin screening candidates.' : 'No active jobs available for review.'}
            </p>
            {canCreateEdit && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-block"
              >
                + Create First Job
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-[#121A2F] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-medium">Job Title</th>
                  <th className="py-3 px-4 font-medium">Department</th>
                  <th className="py-3 px-4 font-medium">Location</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Candidates</th>
                  <th className="py-3 px-4 font-medium">Created Date</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredJobs.map((job, idx) => {
                  const jobStatus = job.status || 'Active';
                  const dateStr = job.created_at
                    ? new Date(job.created_at).toLocaleDateString()
                    : 'Recently';

                  return (
                    <tr
                      key={job.id}
                      style={{ '--row-index': idx }}
                      className="animate-row-enter hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{job.title}</span>
                          <span className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {(job.required_skills || []).slice(0, 4).join(', ')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {job.department || 'Engineering'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{job.location || 'Remote / Hybrid'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          jobStatus.toLowerCase() === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {jobStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 tabular-nums">
                        {job.candidates_count || 18}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {canScreen && (
                            <button
                              onClick={() => {
                                if (setSelectedJobForScreening) setSelectedJobForScreening(job);
                                setCurrentTab('screening');
                              }}
                              className="btn-interactive px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded inline-flex items-center gap-1"
                              title="Screen Resumes for this Role"
                            >
                              <FileSearch className="w-3.5 h-3.5" />
                              <span>Screen</span>
                            </button>
                          )}

                          {canCreateEdit ? (
                            <button
                              onClick={() => handleOpenEditModal(job)}
                              className="btn-interactive p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                              title="Edit Job"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenViewModal(job)}
                              className="btn-interactive px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded inline-flex items-center gap-1"
                              title="View Job Details"
                            >
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="btn-interactive p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                              title="Delete Job"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT JOB OPENING MODAL WITH 10 JOB TEMPLATES (Requirement 6) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-backdrop">
          <div 
            className="w-full max-w-2xl bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {isReadOnly ? 'Job Opening Details' : editingJobId ? 'Edit Job Opening' : 'Create Job Opening'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isReadOnly ? 'Detailed requirements, skills, and parameters for this role.' : 'Choose from 10 popular templates or define custom criteria.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector Highlight */}
            {!isReadOnly && !editingJobId && (
              <div className="mb-5 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60">
                <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Job Templates (10 Popular Industry Roles)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2">
                  Selecting a template pre-fills role description and technical skills. You can edit any details.
                </p>
                <select
                  value={selectedTemplateId}
                  onChange={handleSelectTemplate}
                  className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-[#121A2F] border border-indigo-200 dark:border-indigo-800/80 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Choose a Job Template --</option>
                  {JOB_TEMPLATES.map((tpl, idx) => (
                    <option key={tpl.id} value={tpl.id}>
                      {idx + 1}. {tpl.title} ({tpl.department})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSaveJob} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Remote / New York"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Required Technical Skills (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={requiredSkillsInput}
                  onChange={(e) => setRequiredSkillsInput(e.target.value)}
                  placeholder="e.g. Python, SQL, REST API, Git, Docker"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={preferredSkillsInput}
                  onChange={(e) => setPreferredSkillsInput(e.target.value)}
                  placeholder="e.g. AWS, Redis, GraphQL, CI/CD"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Job Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the role responsibilities, team environment, and qualifications..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121A2F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-interactive px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isReadOnly ? 'Close' : 'Cancel'}
                </button>

                {!isReadOnly && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-interactive px-5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingJobId ? 'Update Job' : 'Create Job'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
