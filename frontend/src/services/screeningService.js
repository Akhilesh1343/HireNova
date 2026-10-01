import mockData from '../data/mockData.json';
import {
  screenResumeApi,
  screenResumesBatchApi,
  getCandidatesApi,
  getTopCandidatesApi,
  getAnalyticsApi,
  getCandidateByIdApi,
  getSkillsApi,
  checkHealthApi
} from './api';

// Local storage key for candidate persistence during current recruiter session
const STORAGE_KEY = 'talent_ai_screened_candidates';

// Pre-defined sample resumes for 1-click recruiter testing
export const SAMPLE_RESUMES = [
  {
    id: 'sample-python-expert',
    label: 'Strong Match (Senior Python Engineer)',
    name: 'Elena Rostova',
    category: 'ENGINEERING',
    fileName: 'Elena_Rostova_Senior_Python_Resume.txt',
    text: `ELENA ROSTOVA
Senior Backend Software Engineer | Python & Distributed Systems
Email: elena.rostova@example.com | GitHub: github.com/elena-rostova

PROFESSIONAL SUMMARY
Experienced Software Development Engineer with 7+ years architecting scalable REST APIs, microservices, and high-throughput data processing systems. Expert in Python, Django, Flask, SQL, and database performance tuning. Proven track record leading Git workflows and implementing robust data structures.

TECHNICAL SKILLS
- Languages: Python, SQL, C++, Bash
- Frameworks & Libraries: Django, Flask, FastAPI, Celery, SQLAlchemy
- Architecture: REST API design, Microservices, Data Structures & Algorithms
- Databases: PostgreSQL, MySQL, Redis
- Tools: Git, Docker, Kubernetes, AWS, Linux, CI/CD pipelines
- Methodology: Agile, Software Development Life Cycle (SDLC)

PROFESSIONAL EXPERIENCE
Senior Python Engineer | CloudScale Tech (2022 - Present)
- Designed and built high-performance REST APIs using Python and Django serving 12M+ monthly active requests.
- Streamlined relational database queries in PostgreSQL/SQL reducing query execution latency by 45%.
- Implemented asynchronous background job queues using Flask and Celery.
- Maintained enterprise Git branching policies, automated code reviews, and enforced rigorous unit testing.
- Optimized core caching algorithms and custom data structures for distributed caching.

Software Development Engineer | FinTech Systems (2018 - 2022)
- Built financial reconciliation services using Python and SQL.
- Designed secure public and internal REST APIs adhering to OAuth2 standards.
- Collaborated across cross-functional teams in software development sprints.

EDUCATION
Bachelor of Science in Computer Science & Engineering (2014 - 2018)
Core coursework: Advanced Data Structures, Algorithms, Database Systems.`
  },
  {
    id: 'sample-fullstack-mid',
    label: 'Good Match (Full Stack Developer)',
    name: 'Alex Rivera',
    category: 'INFORMATION-TECHNOLOGY',
    fileName: 'Alex_Rivera_FullStack_Resume.txt',
    text: `ALEX RIVERA
Full Stack Developer | Python, SQL & Web Technologies
Email: alex.rivera@example.com | Portfolio: alexrivera.dev

PROFESSIONAL SUMMARY
Versatile software development professional with 4 years of experience building modern web applications. Skilled in Python, SQL databases, Git version control, and frontend frameworks. Passionate about writing clean, maintainable software and collaborating with engineering teams.

TECHNICAL SKILLS
- Programming: Python, JavaScript, TypeScript, SQL
- Web Frameworks: Flask, Express.js, React
- Databases: PostgreSQL, SQLite
- Developer Tools: Git, GitHub, Docker, Postman
- Core Competencies: Software Development, Problem Solving, Data Structures

WORK EXPERIENCE
Software Developer | Apex Solutions (2021 - Present)
- Developed and maintained web applications utilizing Python and Flask backends with React frontend.
- Structured complex SQL queries and migrations for relational databases.
- Utilized Git for daily version control, pull requests, and continuous deployment workflows.
- Contributed to ongoing software development initiatives and technical documentation.

Junior Programmer | CodeCraft Labs (2020 - 2021)
- Wrote automated test scripts using Python.
- Assisted in building SQL reports and database backups.
- Participated in weekly code reviews and team standups.

EDUCATION
B.S. in Information Technology (2016 - 2020)`
  },
  {
    id: 'sample-unmatched',
    label: 'Low Match (Digital Marketing Specialist)',
    name: 'Jordan Hayes',
    category: 'DIGITAL-MEDIA',
    fileName: 'Jordan_Hayes_Marketing_Resume.txt',
    text: `JORDAN HAYES
Digital Marketing & Creative Content Specialist
Email: jordan.hayes@example.com

PROFESSIONAL SUMMARY
Creative marketing manager with 5+ years driving audience engagement, social media campaigns, and brand storytelling. Expert in SEO, Google Ads, content marketing, and Adobe Creative Cloud. Seeking to leverage analytical and strategic creative skills.

CORE COMPETENCIES
- Social Media Strategy, Paid Advertising (Google, Meta, LinkedIn)
- SEO Optimization, Copywriting, Public Relations
- Analytics: Google Analytics 4, Tableau, Excel
- Creative: Adobe Photoshop, Illustrator, Premiere Pro

EXPERIENCE
Marketing Manager | GrowthWave Agency (2021 - Present)
- Led end-to-end creative marketing campaigns generating 300% ROI.
- Managed quarterly ad spend across multiple digital channels.
- Spearheaded team branding and social media content creation.

Marketing Coordinator | BrightStar Media (2019 - 2021)
- Authored weekly blog posts and marketing emails.
- Monitored engagement metrics and prepared client presentations.`
  }
];

// Helper: Clean text matching Python app.py logic
export function cleanText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/http\S+|www\S+/g, ' ')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Screen Resume via live FastAPI backend (POST /api/screen-resume)
 */
export async function screenResumeWithApi({ file, resumeText, jobDescription, requiredSkills, candidateName, fileName, jobTitle, jobDescriptionId }) {
  const formData = new FormData();

  if (file instanceof File || file instanceof Blob) {
    formData.append('file', file, file.name || fileName || 'resume.pdf');
  } else if (resumeText) {
    const textBlob = new Blob([resumeText], { type: 'text/plain' });
    formData.append('file', textBlob, fileName || 'resume.txt');
  } else {
    throw new Error('Please select or upload a resume file.');
  }

  formData.append('job_description', jobDescription || '');

  if (requiredSkills && requiredSkills.length > 0) {
    formData.append('required_skills', requiredSkills.join(','));
  }

  if (jobTitle) {
    formData.append('job_title', jobTitle);
  }

  if (candidateName) {
    formData.append('candidate_name', candidateName);
  }

  if (jobDescriptionId) {
    formData.append('job_description_id', jobDescriptionId.toString());
  }

  try {
    const data = await screenResumeApi(formData);

    const formattedResult = {
      id: data.candidate_id,
      name: candidateName || (fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : `Candidate ${data.candidate_id}`),
      fileName: data.file_name || fileName || 'resume.pdf',
      category: data.predicted_category,
      similarity: data.similarity_score,
      skillScore: data.skill_score,
      atsScore: data.ats_score,
      matchedSkills: data.matched_skills || [],
      missingSkills: data.missing_skills || [],
      totalSkillsCount: (data.matched_skills?.length || 0) + (data.missing_skills?.length || 0),
      recommendation: data.recommendation,
      analyzedAt: new Date().toISOString(),
      extractedTextPreview: data.extracted_text_preview || resumeText || '',
      isShortlisted: data.ats_score >= 50.0
    };

    saveScreenedCandidate(formattedResult);
    return formattedResult;

  } catch (err) {
    console.error('[ScreeningService] Live API call error:', err);
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Backend server is currently unavailable. Please verify the FastAPI service is running on http://127.0.0.1:8000.');
    }
    throw new Error(err.message || 'An unexpected error occurred during resume screening. Please try again.');
  }
}

/**
 * Screen Multiple Resumes in batch via live FastAPI backend (POST /api/screen-resumes-batch)
 */
export async function screenBatchResumesWithApi({
  files = [],
  jobDescription,
  requiredSkills,
  jobTitle,
  jobDescriptionId
}) {
  const formData = new FormData();

  if (!files || files.length === 0) {
    throw new Error('Please select at least one resume file.');
  }

  files.forEach((file) => {
    if (file instanceof File || file instanceof Blob) {
      formData.append('files', file, file.name || 'resume.pdf');
    }
  });

  formData.append('job_description', jobDescription || '');

  if (requiredSkills && requiredSkills.length > 0) {
    formData.append('required_skills', requiredSkills.join(','));
  }

  if (jobTitle) {
    formData.append('job_title', jobTitle);
  }

  if (jobDescriptionId) {
    formData.append('job_description_id', jobDescriptionId.toString());
  }

  try {
    const data = await screenResumesBatchApi(formData);
    const formattedResults = (data.results || []).map((r, index) => {
      const formatted = {
        rank: index + 1,
        id: r.candidate_id,
        name: r.candidate_name || `Candidate #${r.candidate_id}`,
        fileName: r.file_name || `resume_${index + 1}.pdf`,
        category: r.predicted_category,
        similarity: r.similarity_score,
        skillScore: r.skill_score,
        atsScore: r.ats_score,
        matchedSkills: r.matched_skills || [],
        missingSkills: r.missing_skills || [],
        totalSkillsCount: (r.matched_skills?.length || 0) + (r.missing_skills?.length || 0),
        recommendation: r.recommendation,
        analyzedAt: new Date().toISOString(),
        extractedTextPreview: r.extracted_text_preview || '',
        isShortlisted: r.ats_score >= 50.0
      };
      saveScreenedCandidate(formatted);
      return formatted;
    });

    return {
      total: data.total_screened || formattedResults.length,
      jobTitle: data.job_title || jobTitle || 'Target Role',
      results: formattedResults
    };
  } catch (err) {
    console.error('[ScreeningService] Batch API call error:', err);
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Backend server is currently unavailable. Please verify the FastAPI service is running on http://127.0.0.1:8000.');
    }
    throw new Error(err.message || 'An unexpected error occurred during batch resume screening.');
  }
}

/**
 * Fetch Paginated Candidates from live FastAPI backend (GET /api/candidates)
 */
export async function fetchCandidatesApi(params = {}) {
  try {
    const data = await getCandidatesApi(params);
    return {
      total: data.total,
      candidates: data.candidates.map(c => ({
        ...c,
        name: `Candidate ${c.id}`,
        skillScore: c.skill_score,
        atsScore: c.ats_score,
        matchedSkills: c.matched_skills
      }))
    };
  } catch (err) {
    console.warn('[ScreeningService] Live candidates API unavailable, using cached dataset:', err.message);
    return {
      total: mockData.candidates.length,
      candidates: getAllCandidates()
    };
  }
}

/**
 * Fetch Top 10 Shortlisted Candidates from backend (GET /api/candidates/top)
 */
export async function fetchTopCandidatesApi(limit = 10) {
  try {
    const data = await getTopCandidatesApi(limit);
    return data.map(c => ({
      ...c,
      name: `Candidate ${c.id}`,
      skillScore: c.skill_score,
      atsScore: c.ats_score,
      matchedSkills: c.matched_skills
    }));
  } catch (err) {
    console.warn('[ScreeningService] Live top candidates API unavailable:', err.message);
    return mockData.candidates.slice(0, limit);
  }
}

/**
 * Fetch Analytics from live FastAPI backend (GET /api/analytics)
 */
export async function fetchAnalyticsApi() {
  try {
    return await getAnalyticsApi();
  } catch (err) {
    console.warn('[ScreeningService] Live analytics API unavailable:', err.message);
    return mockData.stats;
  }
}

/**
 * Fetch Candidate by ID from backend (GET /api/candidates/{id})
 */
export async function fetchCandidateByIdApi(candidateId) {
  try {
    const c = await getCandidateByIdApi(candidateId);
    return {
      ...c,
      name: `Candidate ${c.id}`,
      skillScore: c.skill_score,
      atsScore: c.ats_score,
      matchedSkills: c.matched_skills,
      extractedTextPreview: c.resume_preview || ''
    };
  } catch (err) {
    return getCandidateById(candidateId);
  }
}

// ==========================================
// CLIENT-SIDE ENGINE (OFFLINE FALLBACK)
// ==========================================

export function computeCosineSimilarity(textA, textB) {
  const cleanA = cleanText(textA);
  const cleanB = cleanText(textB);
  const wordsA = cleanA.split(' ').filter(w => w.length > 2);
  const wordsB = cleanB.split(' ').filter(w => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  const freqA = {};
  const freqB = {};
  const allWords = new Set();
  for (const w of wordsA) { freqA[w] = (freqA[w] || 0) + 1; allWords.add(w); }
  for (const w of wordsB) { freqB[w] = (freqB[w] || 0) + 1; allWords.add(w); }
  let dotProduct = 0, normA = 0, normB = 0;
  for (const w of allWords) {
    dotProduct += (freqA[w] || 0) * (freqB[w] || 0);
  }
  for (const w in freqA) { normA += freqA[w] * freqA[w]; }
  for (const w in freqB) { normB += freqB[w] * freqB[w]; }
  if (normA === 0 || normB === 0) return 0;
  return Math.min(100, Math.max(0, (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))) * 100));
}

export function screenResumeLocal({ resumeText, jobDescription, requiredSkills, candidateName, fileName }) {
  const cleanResume = cleanText(resumeText);
  const cleanJob = cleanText(jobDescription);

  const matchedSkills = (requiredSkills || []).filter(skill => {
    const s = skill.toLowerCase().trim();
    return s && cleanResume.includes(s);
  });
  const missingSkills = (requiredSkills || []).filter(skill => !matchedSkills.includes(skill));

  const skillScore = requiredSkills && requiredSkills.length > 0
    ? (matchedSkills.length / requiredSkills.length) * 100
    : 0;

  let similarity = computeCosineSimilarity(cleanJob, cleanResume);
  if (matchedSkills.length >= 6) {
    similarity = Math.min(95, Math.max(similarity, 65 + matchedSkills.length * 4));
  } else if (matchedSkills.length >= 3) {
    similarity = Math.min(80, Math.max(similarity, 25 + matchedSkills.length * 3));
  }

  const atsScore = (similarity * 0.4) + (skillScore * 0.6);

  let recommendation = 'Low Match';
  if (atsScore >= 70) recommendation = 'Strong Match';
  else if (atsScore >= 50) recommendation = 'Good Match';
  else if (atsScore >= 30) recommendation = 'Moderate Match';

  const result = {
    id: `CAND-${Math.floor(10000000 + Math.random() * 90000000)}`,
    name: candidateName || 'Screened Candidate',
    fileName: fileName || 'Resume_Document.pdf',
    category: cleanResume.includes('engineer') || cleanResume.includes('software') ? 'ENGINEERING' : 'INFORMATION-TECHNOLOGY',
    similarity: Math.round(similarity * 100) / 100,
    skillScore: Math.round(skillScore * 100) / 100,
    atsScore: Math.round(atsScore * 100) / 100,
    matchedSkills,
    missingSkills,
    totalSkillsCount: requiredSkills.length,
    recommendation,
    analyzedAt: new Date().toISOString(),
    extractedTextPreview: resumeText.slice(0, 3000),
    isShortlisted: atsScore >= 50
  };

  saveScreenedCandidate(result);
  return result;
}

export function getAllCandidates() {
  const sessionScreened = getScreenedCandidates();
  const existingIds = new Set(sessionScreened.map(c => c.id));
  const baseCandidates = mockData.candidates.filter(c => !existingIds.has(c.id));
  return [...sessionScreened, ...baseCandidates];
}

export function getCandidateById(id) {
  const all = getAllCandidates();
  return all.find(c => c.id === id || c.rank === Number(id)) || null;
}

function getScreenedCandidates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScreenedCandidate(candidate) {
  try {
    const current = getScreenedCandidates();
    const updated = [candidate, ...current.filter(c => c.id !== candidate.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

export function getSystemStats() {
  return mockData.stats;
}

export function getRequiredSkillsDefault() {
  return mockData.stats.requiredSkills || [
    'python', 'django', 'flask', 'sql', 'rest api', 'git', 'data structures', 'software development'
  ];
}
