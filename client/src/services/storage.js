// In-browser mock data and storage layer for HRNova
// Provides complete persistence and zero-config deployment on Vercel/Netlify

const INITIAL_EMPLOYEES = [
  { id: 1, employee_id: 'HRN-001', name: 'Sarah Jenkins', email: 'sarah.jenkins@hrnova.com', department: 'Human Resources', role: 'VP of People & Culture', joining_date: '2021-03-15', status: 'Active', phone: '+1 (555) 234-5678', location: 'San Francisco, CA' },
  { id: 2, employee_id: 'HRN-101', name: 'Liam Vance', email: 'liam.vance@hrnova.com', department: 'Engineering', role: 'Lead Fullstack Architect', joining_date: '2022-01-10', status: 'Active', phone: '+1 (555) 345-6789', location: 'Seattle, WA' },
  { id: 3, employee_id: 'HRN-102', name: 'Elena Rostova', email: 'elena.rostova@hrnova.com', department: 'Engineering', role: 'Senior Backend Engineer', joining_date: '2022-06-01', status: 'Active', phone: '+1 (555) 456-7890', location: 'Austin, TX' },
  { id: 4, employee_id: 'HRN-103', name: 'Marcus Chen', email: 'marcus.chen@hrnova.com', department: 'Product', role: 'Principal Product Manager', joining_date: '2021-11-20', status: 'Active', phone: '+1 (555) 567-8901', location: 'San Francisco, CA' },
  { id: 5, employee_id: 'HRN-104', name: 'Alex Rivera', email: 'alex.rivera@hrnova.com', department: 'Design', role: 'Lead UI/UX Designer', joining_date: '2023-02-14', status: 'Active', phone: '+1 (555) 678-9012', location: 'New York, NY' },
  { id: 6, employee_id: 'HRN-105', name: 'Priya Patel', email: 'priya.patel@hrnova.com', department: 'Marketing', role: 'Head of Growth Marketing', joining_date: '2023-04-18', status: 'Active', phone: '+1 (555) 789-0123', location: 'Chicago, IL' },
  { id: 7, employee_id: 'HRN-106', name: 'David Kim', email: 'david.kim@hrnova.com', department: 'Engineering', role: 'DevOps & Cloud Engineer', joining_date: '2023-08-05', status: 'On Leave', phone: '+1 (555) 890-1234', location: 'San Francisco, CA' },
  { id: 8, employee_id: 'HRN-107', name: 'Chloe Dupont', email: 'chloe.dupont@hrnova.com', department: 'Human Resources', role: 'People Operations Specialist', joining_date: '2023-09-12', status: 'Active', phone: '+1 (555) 901-2345', location: 'San Francisco, CA' },
  { id: 9, employee_id: 'HRN-108', name: 'James Wilson', email: 'james.wilson@hrnova.com', department: 'Finance', role: 'Senior Financial Analyst', joining_date: '2022-09-01', status: 'Active', phone: '+1 (555) 012-3456', location: 'Boston, MA' },
  { id: 10, employee_id: 'HRN-109', name: 'Amina Idris', email: 'amina.idris@hrnova.com', department: 'Operations', role: 'Global Workplace Coordinator', joining_date: '2024-01-15', status: 'Inactive', phone: '+1 (555) 123-4567', location: 'Remote' }
];

const INITIAL_PROJECTS = [
  {
    id: 1,
    title: 'Nova Cloud Migration 2.0',
    description: 'Complete transition of microservices to AWS multi-region cluster with automated CI/CD and zero downtime.',
    deadline: '2026-11-30',
    status: 'In Progress',
    progress: 65,
    priority: 'High',
    department: 'Engineering',
    assignedEmployees: [
      { id: 2, name: 'Liam Vance', email: 'liam.vance@hrnova.com', role: 'Lead Fullstack Architect', department: 'Engineering' },
      { id: 3, name: 'Elena Rostova', email: 'elena.rostova@hrnova.com', role: 'Senior Backend Engineer', department: 'Engineering' },
      { id: 7, name: 'David Kim', email: 'david.kim@hrnova.com', role: 'DevOps & Cloud Engineer', department: 'Engineering' }
    ]
  },
  {
    id: 2,
    title: 'Global Design System Refresh',
    description: 'Unify tokens, accessible components, and brand micro-interactions across Web and Mobile surfaces.',
    deadline: '2026-12-15',
    status: 'In Progress',
    progress: 80,
    priority: 'Medium',
    department: 'Design',
    assignedEmployees: [
      { id: 5, name: 'Alex Rivera', email: 'alex.rivera@hrnova.com', role: 'Lead UI/UX Designer', department: 'Design' },
      { id: 2, name: 'Liam Vance', email: 'liam.vance@hrnova.com', role: 'Lead Fullstack Architect', department: 'Engineering' },
      { id: 4, name: 'Marcus Chen', email: 'marcus.chen@hrnova.com', role: 'Principal Product Manager', department: 'Product' }
    ]
  },
  {
    id: 3,
    title: 'Q4 Employee Wellness & Benefits',
    description: 'Rollout of expanded mental wellness coverage, annual fitness stipend, and ergonomic home setup subsidy.',
    deadline: '2026-10-15',
    status: 'Completed',
    progress: 100,
    priority: 'Low',
    department: 'Human Resources',
    assignedEmployees: [
      { id: 1, name: 'Sarah Jenkins', email: 'sarah.jenkins@hrnova.com', role: 'VP of People & Culture', department: 'Human Resources' },
      { id: 8, name: 'Chloe Dupont', email: 'chloe.dupont@hrnova.com', role: 'People Operations Specialist', department: 'Human Resources' }
    ]
  },
  {
    id: 4,
    title: 'AI-Powered Talent Matching',
    description: 'Pilot internal mobility platform matching current employee skill sets with open technical roles and stretch projects.',
    deadline: '2027-02-28',
    status: 'Not Started',
    progress: 10,
    priority: 'Urgent',
    department: 'Product',
    assignedEmployees: [
      { id: 4, name: 'Marcus Chen', email: 'marcus.chen@hrnova.com', role: 'Principal Product Manager', department: 'Product' },
      { id: 3, name: 'Elena Rostova', email: 'elena.rostova@hrnova.com', role: 'Senior Backend Engineer', department: 'Engineering' },
      { id: 6, name: 'Priya Patel', email: 'priya.patel@hrnova.com', role: 'Head of Growth Marketing', department: 'Marketing' }
    ]
  },
  {
    id: 5,
    title: 'Enterprise SOC2 Type II Audit',
    description: 'Security controls audit, evidence collection, and automated compliance policy verification across all internal tools.',
    deadline: '2026-11-20',
    status: 'In Progress',
    progress: 45,
    priority: 'High',
    department: 'Operations',
    assignedEmployees: [
      { id: 7, name: 'David Kim', email: 'david.kim@hrnova.com', role: 'DevOps & Cloud Engineer', department: 'Engineering' },
      { id: 9, name: 'James Wilson', email: 'james.wilson@hrnova.com', role: 'Senior Financial Analyst', department: 'Finance' },
      { id: 1, name: 'Sarah Jenkins', email: 'sarah.jenkins@hrnova.com', role: 'VP of People & Culture', department: 'Human Resources' }
    ]
  }
];

const INITIAL_HR_REQUESTS = [
  {
    id: 1,
    sender_id: 2,
    sender_name: 'Alex Rivera',
    sender_email: 'employee@hrnova.com',
    sender_role: 'Lead UI/UX Designer',
    subject: 'Home Office Ergonomic Monitor Arm Subsidy',
    message: 'Hi HR Team, I recently replaced my desk setup to manage neck strain and would like to apply for the ergonomic equipment reimbursement as discussed in the Q3 handbook.',
    urgency: 'Medium',
    status: 'Under Review',
    admin_reply: 'Hi Alex, please upload the receipt to the portal for payroll credit.',
    created_at: '2026-10-28 14:15:00'
  },
  {
    id: 2,
    sender_id: 3,
    sender_name: 'Elena Rostova',
    sender_email: 'elena.rostova@hrnova.com',
    sender_role: 'Senior Backend Engineer',
    subject: 'Paternity/Family Care Leave Query for November',
    message: 'Hello, I would like to schedule a quick 15-minute sync regarding policy guidelines for taking consecutive family leave starting mid-November.',
    urgency: 'High',
    status: 'New',
    admin_reply: null,
    created_at: '2026-10-28 16:30:00'
  },
  {
    id: 3,
    sender_id: 4,
    sender_name: 'Marcus Chen',
    sender_email: 'marcus.chen@hrnova.com',
    sender_role: 'Principal Product Manager',
    subject: 'Annual Education & Conference Budget Reimbursement',
    message: 'Submitted the registration receipt for the LeadDev San Francisco summit. Could someone review and approve?',
    urgency: 'Low',
    status: 'Resolved',
    admin_reply: 'Approved by Sarah Jenkins. Added to November 15 payroll cycle.',
    created_at: '2026-10-25 10:20:00'
  },
  {
    id: 4,
    sender_id: 7,
    sender_name: 'David Kim',
    sender_email: 'david.kim@hrnova.com',
    sender_role: 'DevOps & Cloud Engineer',
    subject: 'Urgent: Relocation Tax Documents Needed for State Filing',
    message: 'Need the signed state tax apportionment affidavit before Friday for state revenue department submission.',
    urgency: 'Urgent',
    status: 'New',
    admin_reply: null,
    created_at: '2026-10-29 07:15:00'
  }
];

const INITIAL_QUERIES = [
  {
    id: 1,
    user_id: 2,
    employee_name: 'Alex Rivera',
    employee_email: 'employee@hrnova.com',
    category: 'Leave & Attendance',
    question: 'Can unused PTO carry over into the first quarter of next year?',
    details: 'I have 4 remaining PTO days. Does our team allow carrying forward up to 5 days into Q1?',
    status: 'Resolved',
    resolution: 'Yes, up to 5 days can carry forward and must be utilized before March 31. Any additional days will be cashed out according to local labor standards.',
    resolved_by: 'Sarah Jenkins',
    resolved_at: '2026-10-20 11:15:00',
    created_at: '2026-10-19 14:00:00'
  },
  {
    id: 2,
    user_id: 2,
    employee_name: 'Alex Rivera',
    employee_email: 'employee@hrnova.com',
    category: 'Benefits & Compensation',
    question: 'When does open enrollment for dental and vision plans begin?',
    details: 'Looking to add my spouse to the vision plan during the upcoming annual open enrollment window.',
    status: 'In Progress',
    resolution: 'Our annual open enrollment opens November 3 and concludes November 24. Look out for the email webinar invitation next Tuesday.',
    resolved_by: 'Chloe Dupont',
    resolved_at: null,
    created_at: '2026-10-27 09:30:00'
  },
  {
    id: 3,
    user_id: 6,
    employee_name: 'Priya Patel',
    employee_email: 'priya.patel@hrnova.com',
    category: 'Payroll & Tax',
    question: 'How do I update my 401(k) contribution percentage before year-end?',
    details: 'I would like to increase my pre-tax matching contribution from 5% to 8%.',
    status: 'Open',
    resolution: null,
    resolved_by: null,
    resolved_at: null,
    created_at: '2026-10-28 11:45:00'
  },
  {
    id: 4,
    user_id: 2,
    employee_name: 'Liam Vance',
    employee_email: 'liam.vance@hrnova.com',
    category: 'Workplace & Policies',
    question: 'What is the international remote work policy duration limit?',
    details: 'Can engineering staff work from an EU location for up to 30 days without tax residency complications?',
    status: 'Resolved',
    resolution: 'Our Global Mobility Policy allows up to 30 consecutive calendar days per year in approved partner countries. Please submit the International Remote Work form at least 2 weeks in advance.',
    resolved_by: 'Sarah Jenkins',
    resolved_at: '2026-10-18 16:40:00',
    created_at: '2026-10-17 15:10:00'
  }
];

const INITIAL_FAQS = [
  { id: 1, category: 'Time Off & Leaves', question: 'What is HRNova’s standard Paid Time Off (PTO) policy?', answer: 'All full-time employees receive 20 days of flexible paid time off per calendar year, alongside 12 standard company holidays and 2 floating personal days.' },
  { id: 2, category: 'Time Off & Leaves', question: 'How do I request Sick Leave or Emergency Care Leave?', answer: 'Sick leave does not count against your general PTO. You can log sick days directly through the HR portal or notify your team lead. For absences longer than 3 days, a brief note to HR is requested.' },
  { id: 3, category: 'Health & Wellness', question: 'What is included in the company wellness & mental health benefits?', answer: 'HRNova covers 100% of employee premiums for standard healthcare plans and provides a $75/month lifestyle wellness credit usable for gym memberships, fitness trackers, or meditation apps.' },
  { id: 4, category: 'Equipment & Remote Work', question: 'Can I request a home office equipment upgrade or reimbursement?', answer: 'Yes! New hires receive a one-time $500 home workstation stipend, and all permanent remote staff can claim up to $250 annually for ergonomic peripherals via the "Contact HR" form.' },
  { id: 5, category: 'Payroll & Compensation', question: 'When are salaries paid and where can I view pay stubs?', answer: 'Salaries are paid semi-monthly on the 15th and last business day of every month via direct deposit. Digital pay stubs and tax withholdings are accessible 24/7 on the payroll portal.' },
  { id: 6, category: 'Career & Development', question: 'Does HRNova offer an annual education and conference budget?', answer: 'Yes, each team member is allotted $1,500 annually for continuing education, professional certifications, books, and conference tickets relevant to their role.' },
  { id: 7, category: 'Referrals & Hiring', question: 'How does the Employee Referral Bonus program work?', answer: 'Referring a qualified candidate who is successfully hired and passes their 90-day milestone yields a bonus of $2,500 to $4,000 depending on seniority level.' }
];

// Helper to get / set from localStorage
function getLocal(key, defaultVal) {
  try {
    const v = localStorage.getItem(`hrnova_${key}`);
    return v ? JSON.parse(v) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setLocal(key, val) {
  try {
    localStorage.setItem(`hrnova_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error('Local storage write failed:', e);
  }
}

// In-browser Mock Database
export const MockStorage = {
  getEmployees() {
    return getLocal('employees', INITIAL_EMPLOYEES);
  },
  saveEmployees(emps) {
    setLocal('employees', emps);
  },
  getProjects() {
    return getLocal('projects', INITIAL_PROJECTS);
  },
  saveProjects(projs) {
    setLocal('projects', projs);
  },
  getHrRequests() {
    return getLocal('hr_requests', INITIAL_HR_REQUESTS);
  },
  saveHrRequests(reqs) {
    setLocal('hr_requests', reqs);
  },
  getQueries() {
    return getLocal('queries', INITIAL_QUERIES);
  },
  saveQueries(q) {
    setLocal('queries', q);
  },
  getFaqs() {
    return INITIAL_FAQS;
  }
};
