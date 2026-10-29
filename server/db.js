const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'hrnova.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDatabase() {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee')),
      avatar TEXT,
      department TEXT,
      employee_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Employees Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL,
      joining_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'On Leave', 'Inactive')),
      phone TEXT,
      location TEXT DEFAULT 'San Francisco, CA',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Projects Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      deadline TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Not Started' CHECK(status IN ('Not Started', 'In Progress', 'Completed')),
      progress INTEGER NOT NULL DEFAULT 0,
      priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')),
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Project Member Assignments
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE(project_id, employee_id)
    );
  `);

  // 5. Contact HR Messages (Inbox)
  db.exec(`
    CREATE TABLE IF NOT EXISTS hr_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      sender_name TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      sender_role TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      urgency TEXT NOT NULL DEFAULT 'Medium' CHECK(urgency IN ('Low', 'Medium', 'High', 'Urgent')),
      status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New', 'Under Review', 'Resolved')),
      admin_reply TEXT,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 6. HR Support Queries
  db.exec(`
    CREATE TABLE IF NOT EXISTS hr_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      employee_name TEXT NOT NULL,
      employee_email TEXT NOT NULL,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Resolved')),
      resolution TEXT,
      resolved_by TEXT,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 7. FAQs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      order_num INTEGER DEFAULT 0
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial data for HRNova...');

  // Seed Users (hashed passwords: admin123 & employee123)
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const employeeHash = bcrypt.hashSync('employee123', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, email, role, avatar, department, employee_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'admin',
    adminHash,
    'Sarah Jenkins',
    'admin@hrnova.com',
    'admin',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'Human Resources',
    'HRN-001'
  );

  insertUser.run(
    'alex',
    employeeHash,
    'Alex Rivera',
    'employee@hrnova.com',
    'employee',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'Design',
    'HRN-104'
  );

  // Seed Employees
  const insertEmployee = db.prepare(`
    INSERT INTO employees (employee_id, name, email, department, role, joining_date, status, phone, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialEmployees = [
    ['HRN-001', 'Sarah Jenkins', 'sarah.jenkins@hrnova.com', 'Human Resources', 'VP of People & Culture', '2021-03-15', 'Active', '+1 (555) 234-5678', 'San Francisco, CA'],
    ['HRN-101', 'Liam Vance', 'liam.vance@hrnova.com', 'Engineering', 'Lead Fullstack Architect', '2022-01-10', 'Active', '+1 (555) 345-6789', 'Seattle, WA'],
    ['HRN-102', 'Elena Rostova', 'elena.rostova@hrnova.com', 'Engineering', 'Senior Backend Engineer', '2022-06-01', 'Active', '+1 (555) 456-7890', 'Austin, TX'],
    ['HRN-103', 'Marcus Chen', 'marcus.chen@hrnova.com', 'Product', 'Principal Product Manager', '2021-11-20', 'Active', '+1 (555) 567-8901', 'San Francisco, CA'],
    ['HRN-104', 'Alex Rivera', 'alex.rivera@hrnova.com', 'Design', 'Lead UI/UX Designer', '2023-02-14', 'Active', '+1 (555) 678-9012', 'New York, NY'],
    ['HRN-105', 'Priya Patel', 'priya.patel@hrnova.com', 'Marketing', 'Head of Growth Marketing', '2023-04-18', 'Active', '+1 (555) 789-0123', 'Chicago, IL'],
    ['HRN-106', 'David Kim', 'david.kim@hrnova.com', 'Engineering', 'DevOps & Cloud Engineer', '2023-08-05', 'On Leave', '+1 (555) 890-1234', 'San Francisco, CA'],
    ['HRN-107', 'Chloe Dupont', 'chloe.dupont@hrnova.com', 'Human Resources', 'People Operations Specialist', '2023-09-12', 'Active', '+1 (555) 901-2345', 'San Francisco, CA'],
    ['HRN-108', 'James Wilson', 'james.wilson@hrnova.com', 'Finance', 'Senior Financial Analyst', '2022-09-01', 'Active', '+1 (555) 012-3456', 'Boston, MA'],
    ['HRN-109', 'Amina Idris', 'amina.idris@hrnova.com', 'Operations', 'Global Workplace Coordinator', '2024-01-15', 'Inactive', '+1 (555) 123-4567', 'Remote']
  ];

  for (const emp of initialEmployees) {
    insertEmployee.run(...emp);
  }

  // Seed Projects
  const insertProject = db.prepare(`
    INSERT INTO projects (title, description, deadline, status, progress, priority, department)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const p1 = insertProject.run(
    'Nova Cloud Migration 2.0',
    'Complete transition of microservices to AWS multi-region cluster with automated CI/CD and zero downtime.',
    '2026-11-30',
    'In Progress',
    65,
    'High',
    'Engineering'
  ).lastInsertRowid;

  const p2 = insertProject.run(
    'Global Design System Refresh',
    'Unify tokens, accessible components, and brand micro-interactions across Web and Mobile surfaces.',
    '2026-12-15',
    'In Progress',
    80,
    'Medium',
    'Design'
  ).lastInsertRowid;

  const p3 = insertProject.run(
    'Q4 Employee Wellness & Benefits',
    'Rollout of expanded mental wellness coverage, annual fitness stipend, and ergonomic home setup subsidy.',
    '2026-10-15',
    'Completed',
    100,
    'Low',
    'Human Resources'
  ).lastInsertRowid;

  const p4 = insertProject.run(
    'AI-Powered Talent Matching',
    'Pilot internal mobility platform matching current employee skill sets with open technical roles and stretch projects.',
    '2027-02-28',
    'Not Started',
    10,
    'Urgent',
    'Product'
  ).lastInsertRowid;

  const p5 = insertProject.run(
    'Enterprise SOC2 Type II Audit',
    'Security controls audit, evidence collection, and automated compliance policy verification across all internal tools.',
    '2026-11-20',
    'In Progress',
    45,
    'High',
    'Operations'
  ).lastInsertRowid;

  // Project Assignments
  const insertAssign = db.prepare(`
    INSERT INTO project_assignments (project_id, employee_id)
    VALUES (?, ?)
  `);

  // Nova Cloud Migration: Liam (2), Elena (3), David (7)
  insertAssign.run(p1, 2);
  insertAssign.run(p1, 3);
  insertAssign.run(p1, 7);

  // Design System Refresh: Alex Rivera (5), Liam (2), Marcus (4)
  insertAssign.run(p2, 5);
  insertAssign.run(p2, 2);
  insertAssign.run(p2, 4);

  // Q4 Wellness: Sarah Jenkins (1), Chloe Dupont (8)
  insertAssign.run(p3, 1);
  insertAssign.run(p3, 8);

  // AI Talent: Marcus (4), Elena (3), Priya (6)
  insertAssign.run(p4, 4);
  insertAssign.run(p4, 3);
  insertAssign.run(p4, 6);

  // SOC2 Audit: David (7), James (9), Sarah (1)
  insertAssign.run(p5, 7);
  insertAssign.run(p5, 9);
  insertAssign.run(p5, 1);

  // Seed Contact HR Requests (Inbox)
  const insertRequest = db.prepare(`
    INSERT INTO hr_requests (sender_id, sender_name, sender_email, sender_role, subject, message, urgency, status, admin_reply, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRequest.run(
    2,
    'Alex Rivera',
    'employee@hrnova.com',
    'Lead UI/UX Designer',
    'Home Office Ergonomic Monitor Arm Subsidy',
    'Hi HR Team, I recently replaced my desk setup to manage neck strain and would like to apply for the ergonomic equipment reimbursement as discussed in the Q3 handbook.',
    'Medium',
    'Under Review',
    'Hi Alex, thanks for reaching out. Please upload the purchase receipt to your employee portal and we will process the credit on the next payroll run.',
    null
  );

  insertRequest.run(
    null,
    'Elena Rostova',
    'elena.rostova@hrnova.com',
    'Senior Backend Engineer',
    'Paternity/Family Care Leave Query for November',
    'Hello, I would like to schedule a quick 15-minute sync regarding policy guidelines for taking consecutive family leave starting mid-November.',
    'High',
    'New',
    null,
    null
  );

  insertRequest.run(
    null,
    'Marcus Chen',
    'marcus.chen@hrnova.com',
    'Principal Product Manager',
    'Annual Education & Conference Budget Reimbursement',
    'Submitted the registration receipt for the LeadDev San Francisco summit. Could someone review and approve?',
    'Low',
    'Resolved',
    'Approved by Sarah Jenkins. Added to November 15 payroll cycle.',
    '2026-10-25 14:30:00'
  );

  insertRequest.run(
    null,
    'David Kim',
    'david.kim@hrnova.com',
    'DevOps & Cloud Engineer',
    'Urgent: Relocation Tax Documents Needed for State Filing',
    'Need the signed state tax apportionment affidavit before Friday for state revenue department submission.',
    'Urgent',
    'New',
    null,
    null
  );

  // Seed HR Support Queries
  const insertQuery = db.prepare(`
    INSERT INTO hr_queries (user_id, employee_name, employee_email, category, question, details, status, resolution, resolved_by, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertQuery.run(
    2,
    'Alex Rivera',
    'employee@hrnova.com',
    'Leave & Attendance',
    'Can unused PTO carry over into the first quarter of next year?',
    'I have 4 remaining PTO days. Does our team allow carrying forward up to 5 days into Q1?',
    'Resolved',
    'Yes, up to 5 days can carry forward and must be utilized before March 31. Any additional days will be cashed out according to local labor standards.',
    'Sarah Jenkins',
    '2026-10-20 11:15:00'
  );

  insertQuery.run(
    2,
    'Alex Rivera',
    'employee@hrnova.com',
    'Benefits & Compensation',
    'When does open enrollment for dental and vision plans begin?',
    'Looking to add my spouse to the vision plan during the upcoming annual open enrollment window.',
    'In Progress',
    'Our annual open enrollment opens November 3 and concludes November 24. Look out for the email webinar invitation next Tuesday.',
    'Chloe Dupont',
    null
  );

  insertQuery.run(
    null,
    'Priya Patel',
    'priya.patel@hrnova.com',
    'Payroll & Tax',
    'How do I update my 401(k) contribution percentage before year-end?',
    'I would like to increase my pre-tax matching contribution from 5% to 8%.',
    'Open',
    null,
    null,
    null
  );

  insertQuery.run(
    null,
    'Liam Vance',
    'liam.vance@hrnova.com',
    'Workplace & Policies',
    'What is the international remote work policy duration limit?',
    'Can engineering staff work from an EU location for up to 30 days without tax residency complications?',
    'Resolved',
    'Our Global Mobility Policy allows up to 30 consecutive calendar days per year in approved partner countries. Please submit the International Remote Work form at least 2 weeks in advance.',
    'Sarah Jenkins',
    '2026-10-18 16:40:00'
  );

  // Seed FAQs
  const insertFaq = db.prepare(`
    INSERT INTO faqs (category, question, answer, order_num)
    VALUES (?, ?, ?, ?)
  `);

  const initialFaqs = [
    [
      'Time Off & Leaves',
      'What is HRNova’s standard Paid Time Off (PTO) policy?',
      'All full-time employees receive 20 days of flexible paid time off per calendar year, accruing bi-weekly, alongside 12 standard company holidays and 2 floating personal days.',
      1
    ],
    [
      'Time Off & Leaves',
      'How do I request Sick Leave or Emergency Care Leave?',
      'Sick leave does not count against your general PTO. You can log sick days directly through the HR portal or notify your team lead. For absences longer than 3 days, a brief note to HR is requested.',
      2
    ],
    [
      'Health & Wellness',
      'What is included in the company wellness & mental health benefits?',
      'HRNova covers 100% of employee premiums for standard healthcare plans and provides a $75/month lifestyle wellness credit usable for gym memberships, fitness trackers, or meditation apps.',
      3
    ],
    [
      'Equipment & Remote Work',
      'Can I request a home office equipment upgrade or reimbursement?',
      'Yes! New hires receive a one-time $500 home workstation stipend, and all permanent remote staff can claim up to $250 annually for ergonomic peripherals via the "Contact HR" form.',
      4
    ],
    [
      'Payroll & Compensation',
      'When are salaries paid and where can I view pay stubs?',
      'Salaries are paid semi-monthly on the 15th and last business day of every month via direct deposit. Digital pay stubs and tax withholdings are accessible 24/7 on the payroll portal.',
      5
    ],
    [
      'Career & Development',
      'Does HRNova offer an annual education and conference budget?',
      'Yes, each team member is allotted $1,500 annually for continuing education, professional certifications, books, and conference tickets relevant to their role.',
      6
    ],
    [
      'Referrals & Hiring',
      'How does the Employee Referral Bonus program work?',
      'Referring a qualified candidate who is successfully hired and passes their 90-day milestone yields a bonus of $2,500 to $4,000 depending on seniority level.',
      7
    ]
  ];

  for (const faq of initialFaqs) {
    insertFaq.run(...faq);
  }

  console.log('HRNova database seeded successfully with users, employees, projects, requests, queries, and FAQs.');
}

initDatabase();

module.exports = db;
