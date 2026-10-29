// HRNova Full Stack Integration Test Suite
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== STARTING HRNOVA AUTOMATED INTEGRATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    assert(health.status === 'online', 'Server health check is online');

    // 2. Authentication & Role Switch Testing
    console.log('\n--- 1. Authentication & Role-Based Access ---');
    // Login as Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const adminAuth = await adminLoginRes.json();
    assert(adminLoginRes.ok && adminAuth.user.role === 'admin', 'Admin login successful (Sarah Jenkins)');
    const adminHeaders = { 'Authorization': `Bearer ${adminAuth.token}`, 'Content-Type': 'application/json' };

    // Login as Employee
    const empLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alex', password: 'employee123' })
    });
    const empAuth = await empLoginRes.json();
    assert(empLoginRes.ok && empAuth.user.role === 'employee', 'Employee login successful (Alex Rivera)');
    const empHeaders = { 'Authorization': `Bearer ${empAuth.token}`, 'Content-Type': 'application/json' };

    // 3. Feature 1: Employee Record Management
    console.log('\n--- 2. Feature 1: Employee Record Management ---');
    // List employees
    const listEmpRes = await fetch(`${BASE_URL}/employees`);
    const listEmpData = await listEmpRes.json();
    assert(listEmpData.employees.length >= 10, `Initial employees loaded (count: ${listEmpData.employees.length})`);
    assert(listEmpData.departments.length > 3, `Departments list returned (count: ${listEmpData.departments.length})`);

    // Search and filter
    const searchRes = await fetch(`${BASE_URL}/employees?search=Elena`);
    const searchData = await searchRes.json();
    assert(searchData.employees.length === 1 && searchData.employees[0].name === 'Elena Rostova', 'Search employee by name works');

    const deptFilterRes = await fetch(`${BASE_URL}/employees?department=Design`);
    const deptFilterData = await deptFilterRes.json();
    assert(deptFilterData.employees.every(e => e.department === 'Design'), 'Department filtering works');

    // Form Validation test: empty employee creation
    const invalidEmpRes = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ name: '', email: 'not-an-email' })
    });
    assert(invalidEmpRes.status === 400, 'Employee form validation catches invalid inputs');

    // Add employee
    const newEmpPayload = {
      name: 'Jordan Hayes',
      employee_id: `HRN-${Date.now().toString().slice(-3)}`,
      email: `jordan.${Date.now()}@hrnova.com`,
      department: 'Engineering',
      role: 'Staff Infrastructure Architect',
      joining_date: '2026-10-29',
      status: 'Active',
      phone: '+1 (555) 777-8899',
      location: 'San Francisco, CA'
    };
    const addEmpRes = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(newEmpPayload)
    });
    const addEmpData = await addEmpRes.json();
    assert(addEmpRes.status === 201 && addEmpData.employee.name === 'Jordan Hayes', 'Add employee succeeds with Admin role');
    const createdEmpId = addEmpData.employee.id;

    // Unauthorized employee creation (Employee role attempting Admin action)
    const empAddAttempt = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify(newEmpPayload)
    });
    assert(empAddAttempt.status === 403, 'Role authorization enforces employee cannot add new employee (403 Forbidden)');

    // Edit employee
    const updateEmpRes = await fetch(`${BASE_URL}/employees/${createdEmpId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        ...newEmpPayload,
        role: 'Principal Reliability Architect',
        status: 'On Leave'
      })
    });
    const updateEmpData = await updateEmpRes.json();
    assert(updateEmpData.employee.role === 'Principal Reliability Architect', 'Edit employee record succeeds');

    // View employee
    const viewEmpRes = await fetch(`${BASE_URL}/employees/${createdEmpId}`);
    const viewEmpData = await viewEmpRes.json();
    assert(viewEmpData.employee.name === 'Jordan Hayes', 'View single employee profile succeeds');

    // Delete employee
    const delEmpRes = await fetch(`${BASE_URL}/employees/${createdEmpId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    assert(delEmpRes.ok, 'Delete employee record succeeds');

    // 4. Feature 2: Project Management
    console.log('\n--- 3. Feature 2: Project Management ---');
    // List projects with progress overview
    const listProjRes = await fetch(`${BASE_URL}/projects`);
    const listProjData = await listProjRes.json();
    assert(listProjData.projects.length >= 5, `Projects list loaded (count: ${listProjData.projects.length})`);
    assert(listProjData.stats.total >= 5 && typeof listProjData.stats.avgProgress === 'number', 'Progress overview stats computed');

    // Create project
    const newProjectPayload = {
      title: 'AI Automated Performance Review 2026',
      description: 'Implement automated 360-degree feedback collation and goal calibration.',
      deadline: '2026-12-31',
      status: 'In Progress',
      progress: 30,
      priority: 'High',
      department: 'Human Resources',
      assignedEmployeeIds: [1, 2] // assign Sarah and Liam
    };
    const addProjRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(newProjectPayload)
    });
    const addProjData = await addProjRes.json();
    assert(addProjRes.status === 201 && addProjData.project.title === newProjectPayload.title, 'Create project succeeds');
    assert(addProjData.project.assignedEmployees.length === 2, 'Employees assigned to project successfully');
    const createdProjId = addProjData.project.id;

    // Quick status update
    const patchProjRes = await fetch(`${BASE_URL}/projects/${createdProjId}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'Completed' })
    });
    const patchProjData = await patchProjRes.json();
    assert(patchProjData.project.status === 'Completed' && patchProjData.project.progress === 100, 'Project quick status marked Completed with 100% progress');

    // Delete created project
    const delProjRes = await fetch(`${BASE_URL}/projects/${createdProjId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    assert(delProjRes.ok, 'Project deleted successfully');

    // 5. Feature 3: Contact HR Button & Inbox
    console.log('\n--- 4. Feature 3: Contact HR Button & Inbox ---');
    // Submit Contact HR form
    const contactPayload = {
      subject: 'Dental Insurance Card & Coverage Question',
      message: 'Hello People Ops, I need a digital copy of my dental insurance group policy card for an appointment tomorrow morning.',
      urgency: 'High',
      sender_name: 'Alex Rivera',
      sender_email: 'employee@hrnova.com'
    };
    const contactRes = await fetch(`${BASE_URL}/hr-requests`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify(contactPayload)
    });
    const contactData = await contactRes.json();
    assert(contactRes.status === 201 && contactData.request.subject === contactPayload.subject, 'Contact HR form submission succeeds');
    const requestId = contactData.request.id;

    // Fetch HR inbox (Admin view)
    const inboxRes = await fetch(`${BASE_URL}/hr-requests`, { headers: adminHeaders });
    const inboxData = await inboxRes.json();
    assert(inboxData.requests.some(r => r.id === requestId), 'Submitted message appears in HR Inbox');
    assert(inboxData.stats.new >= 1, `Inbox new messages count updated (${inboxData.stats.new})`);

    // Triage / respond to message
    const triageRes = await fetch(`${BASE_URL}/hr-requests/${requestId}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({
        status: 'Resolved',
        admin_reply: 'Attached digital benefits card and confirmed coverage.'
      })
    });
    const triageData = await triageRes.json();
    assert(triageData.request.status === 'Resolved' && triageData.request.admin_reply !== null, 'HR Admin replies and resolves message');

    // 6. Feature 4: HR Support / Query Page & FAQs
    console.log('\n--- 5. Feature 4: HR Support / Query Page & FAQs ---');
    // List FAQs
    const faqRes = await fetch(`${BASE_URL}/queries/faqs`);
    const faqData = await faqRes.json();
    assert(faqData.faqs.length >= 7, `FAQs retrieved (count: ${faqData.faqs.length})`);
    assert(faqData.categories.length >= 4, `FAQ categories loaded (count: ${faqData.categories.length})`);

    // Submit Support Query
    const queryPayload = {
      category: 'Leave & Attendance',
      question: 'Can unused PTO carry forward into Q1?',
      details: 'Have 3 days remaining before year end.',
      employee_name: 'Alex Rivera',
      employee_email: 'employee@hrnova.com'
    };
    const submitQueryRes = await fetch(`${BASE_URL}/queries`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify(queryPayload)
    });
    const submitQueryData = await submitQueryRes.json();
    assert(submitQueryRes.status === 201 && submitQueryData.query.status === 'Open', 'Support query submitted with Open status');
    const queryId = submitQueryData.query.id;

    // Resolve Support Query (Admin)
    const resolveQueryRes = await fetch(`${BASE_URL}/queries/${queryId}/resolve`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({
        status: 'Resolved',
        resolution: 'Yes, up to 5 days of PTO automatically roll forward into Q1.'
      })
    });
    const resolveQueryData = await resolveQueryRes.json();
    assert(resolveQueryData.query.status === 'Resolved' && resolveQueryData.query.resolved_by === 'Sarah Jenkins', 'HR Admin resolves support query with official answer');

    // 7. Feature 5: Home Dashboard & Charts Data
    console.log('\n--- 6. Feature 5: Home Dashboard & Analytics ---');
    const dashAdminRes = await fetch(`${BASE_URL}/dashboard/stats`, { headers: adminHeaders });
    const dashAdminData = await dashAdminRes.json();
    assert(dashAdminData.summary.totalEmployees >= 10, `Dashboard total employees KPI: ${dashAdminData.summary.totalEmployees}`);
    assert(dashAdminData.summary.totalProjects >= 5, `Dashboard total projects KPI: ${dashAdminData.summary.totalProjects}`);
    assert(dashAdminData.charts.departmentDistribution.length > 0, 'Department distribution chart data populated');
    assert(dashAdminData.charts.projectStatusDistribution.length === 3, 'Project status distribution chart data populated');

    // Employee dashboard specific view
    const dashEmpRes = await fetch(`${BASE_URL}/dashboard/stats`, { headers: empHeaders });
    const dashEmpData = await dashEmpRes.json();
    assert(Array.isArray(dashEmpData.myProjects), 'Employee dashboard loads user-specific assigned projects');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n=== TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runTests();
