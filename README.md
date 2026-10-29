# 🌟 HRNova — Smart HR Dashboard

**HRNova** is a modern, responsive, full-stack Human Resources management dashboard built with **React (Vite)**, **Node.js (Express)**, and **SQLite**. It features a modern design aesthetic with rich visual accents, glassmorphic elements, role-based access control, real-time KPI metrics, interactive data visualizations, and automated inquiry support.

---

## 🚀 Key Features

### 1. 👥 Employee Record Management
- **Full CRUD operations**: Add, view, edit, and delete employee records.
- Fields: Full name, employee ID, company email, department, role / title, joining date, status (`Active`, `On Leave`, `Inactive`), phone, and location.
- **Search & Department Filtering**: Live search by employee name, role, ID, or email, alongside filtering by department and employment status.
- **Role Validation**: Form input validation and unique constraints on Employee ID and email.

### 2. 📁 Project Management & Allocations
- **Strategic Initiative Tracking**: Create projects, set target deadlines, update statuses (`Not Started`, `In Progress`, `Completed`), and adjust completion progress (0–100%).
- **Cross-Functional Team Assignments**: Multi-select employees across departments and assign them to project initiatives.
- **Progress Overview**: Dedicated overview metrics tracking active projects, completed projects, backlog, and organization-wide average completion percentage.
- **Deadline Countdown**: Visual indicators calculating days remaining until target delivery, with overdue alerts.

### 3. ✉️ Contact HR Button & HR Inbox
- **Visible Global Header Action**: A prominent, styled **"Contact HR"** button accessible throughout the platform.
- **Urgency Matrix**: Employees select urgency levels (`Low`, `Medium`, `High`, `Urgent` with visual alert styling).
- **HR Inbox**: HR Admins review incoming requests, change ticket statuses (`New`, `Under Review`, `Resolved`), and respond directly with resolution notes.

### 4. 💡 HR Support & Query Page
- **Searchable FAQ Accordion**: Categorized knowledge base at the top covering PTO policy, remote work equipment allowances, wellness benefits, payroll cycles, and referral bonuses.
- **Personal Support Queries**: Employees can submit custom inquiries and track their status (`Open`, `In Progress`, `Resolved`).
- **HR Specialist Resolutions**: HR Admins can review open questions, publish official guidance, and mark queries as resolved.

### 5. 📊 Home Dashboard & Role-Based Auth
- **KPI Summary Cards**: Real-time counters for Total Staff, Active Projects, Open Support Queries, and Unread HR Inbox Messages.
- **Interactive SVG Visualizations**:
  - *Employees by Department*: Visual progress bars reflecting headcount and department distribution percentages.
  - *Project Initiatives Breakdown*: Dynamic status ring showing in-progress vs. completed vs. not-started ratios.
- **Role-Based Login**:
  - **👑 HR Admin (Sarah Jenkins)**: Full administrative access to add/edit/delete employees, create/manage projects, and resolve HR tickets.
  - **👤 Employee (Alex Rivera)**: Read-only directory view, view personal assigned projects, submit Contact HR tickets, and track query statuses.
  - **Instant Role Switcher**: Quick-toggle pill in the top navigation bar to seamlessly test both roles with a single click.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Lucide Icons, Vanilla CSS Design System |
| **Backend** | Node.js, Express, CORS, JSON Web Tokens (JWT), BcryptJS |
| **Database** | SQLite via `better-sqlite3` (self-contained, pre-seeded) |
| **Tooling** | Concurrently for unified mono-command dev execution |

---

## ⚡ Getting Started

### 1. Install Dependencies
```bash
# Install root orchestration packages
npm install

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 2. Run the Application
From the project root:
```bash
npm run dev
```
This concurrently starts:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

*(The Vite frontend automatically proxies `/api` requests to the Express backend on port 5000.)*

---

## 🔑 Demo Login Credentials

The database is pre-seeded with sample employees, active projects, inquiries, and two default users. You can toggle between them using the topbar switch or log in with:

| Role | Username / Email | Password | Access Level |
|---|---|---|---|
| **HR Admin** | `admin` / `admin@hrnova.com` | `admin123` | Full Access (CRUD records, manage projects, inbox triage) |
| **Employee** | `alex` / `employee@hrnova.com` | `employee123` | Limited Access (View directory, assigned projects, submit tickets) |

---

## 🧪 Testing the Test Suite
An automated end-to-end integration test suite is included:
```bash
cd server
node test_suite.js
```
Validates 32 automated checks across database constraints, validation errors, role security permissions, and all five core features.
