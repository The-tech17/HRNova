import { MockStorage } from './storage';

// Safe fetch wrapper that handles HTML 404 responses gracefully and falls back to in-browser storage
async function tryBackend(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    // If the server returns HTML (e.g. Vercel 404 page), don't call res.json() which throws "Unexpected token 'T'"
    if (!contentType.includes('application/json')) {
      return null;
    }

    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // Network error / offline / server not running
    return null;
  }
}

export const API = {
  // 1. Auth API
  async login(username, password) {
    const backend = await tryBackend('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (backend && backend.ok) {
      return backend.data;
    }

    // In-browser fallback
    if (username === 'admin' || username === 'admin@hrnova.com') {
      const user = {
        id: 1,
        username: 'admin',
        name: 'Sarah Jenkins',
        email: 'admin@hrnova.com',
        role: 'admin',
        department: 'Human Resources',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        employee_id: 'HRN-001'
      };
      return { user, token: 'mock-admin-token-2026' };
    } else {
      const user = {
        id: 2,
        username: 'alex',
        name: 'Alex Rivera',
        email: 'employee@hrnova.com',
        role: 'employee',
        department: 'Design',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        employee_id: 'HRN-104'
      };
      return { user, token: 'mock-employee-token-2026' };
    }
  },

  // 2. Employees API
  async getEmployees({ search = '', department = 'All', status = 'All' } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department !== 'All') params.append('department', department);
    if (status !== 'All') params.append('status', status);

    const backend = await tryBackend(`/api/employees?${params.toString()}`);
    if (backend && backend.ok) return backend.data;

    // Fallback
    let emps = MockStorage.getEmployees();
    const allDepts = Array.from(new Set(emps.map(e => e.department))).sort();

    if (search) {
      const s = search.toLowerCase();
      emps = emps.filter(e =>
        e.name.toLowerCase().includes(s) ||
        e.employee_id.toLowerCase().includes(s) ||
        e.email.toLowerCase().includes(s) ||
        e.role.toLowerCase().includes(s)
      );
    }
    if (department !== 'All') {
      emps = emps.filter(e => e.department === department);
    }
    if (status !== 'All') {
      emps = emps.filter(e => e.status === status);
    }

    return { employees: emps, departments: allDepts, total: emps.length };
  },

  async addEmployee(empData, token) {
    const backend = await tryBackend('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(empData)
    });
    if (backend && backend.ok) return backend.data;

    const emps = MockStorage.getEmployees();
    const newEmp = {
      ...empData,
      id: Date.now()
    };
    emps.unshift(newEmp);
    MockStorage.saveEmployees(emps);
    return { message: 'Employee record created successfully.', employee: newEmp };
  },

  async updateEmployee(id, empData, token) {
    const backend = await tryBackend(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(empData)
    });
    if (backend && backend.ok) return backend.data;

    let emps = MockStorage.getEmployees();
    emps = emps.map(e => e.id === Number(id) ? { ...e, ...empData } : e);
    MockStorage.saveEmployees(emps);
    const updated = emps.find(e => e.id === Number(id));
    return { message: 'Employee record updated successfully.', employee: updated };
  },

  async deleteEmployee(id, token) {
    const backend = await tryBackend(`/api/employees/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (backend && backend.ok) return backend.data;

    let emps = MockStorage.getEmployees();
    emps = emps.filter(e => e.id !== Number(id));
    MockStorage.saveEmployees(emps);
    return { message: 'Employee record deleted.' };
  },

  // 3. Projects API
  async getProjects({ search = '', status = 'All' } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status !== 'All') params.append('status', status);

    const backend = await tryBackend(`/api/projects?${params.toString()}`);
    if (backend && backend.ok) return backend.data;

    let projs = MockStorage.getProjects();
    if (search) {
      const s = search.toLowerCase();
      projs = projs.filter(p => p.title.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s)));
    }
    if (status !== 'All') {
      projs = projs.filter(p => p.status === status);
    }

    const all = MockStorage.getProjects();
    const total = all.length;
    const completed = all.filter(p => p.status === 'Completed').length;
    const inProgress = all.filter(p => p.status === 'In Progress').length;
    const notStarted = all.filter(p => p.status === 'Not Started').length;
    const avgProg = total > 0 ? Math.round(all.reduce((acc, p) => acc + (p.progress || 0), 0) / total) : 0;

    return {
      projects: projs,
      stats: { total, completed, inProgress, notStarted, avgProgress: avgProg }
    };
  },

  async addProject(projData, token) {
    const backend = await tryBackend('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(projData)
    });
    if (backend && backend.ok) return backend.data;

    const allEmps = MockStorage.getEmployees();
    const assigned = (projData.assignedEmployeeIds || []).map(id => {
      const emp = allEmps.find(e => e.id === id);
      return emp ? { id: emp.id, name: emp.name, email: emp.email, role: emp.role, department: emp.department } : null;
    }).filter(Boolean);

    const newProj = {
      ...projData,
      id: Date.now(),
      progress: projData.status === 'Completed' ? 100 : Number(projData.progress || 0),
      assignedEmployees: assigned
    };

    const projs = MockStorage.getProjects();
    projs.unshift(newProj);
    MockStorage.saveProjects(projs);
    return { message: 'Project created successfully.', project: newProj };
  },

  async updateProject(id, projData, token) {
    const backend = await tryBackend(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(projData)
    });
    if (backend && backend.ok) return backend.data;

    let projs = MockStorage.getProjects();
    const allEmps = MockStorage.getEmployees();
    const assigned = (projData.assignedEmployeeIds || []).map(empId => {
      const emp = allEmps.find(e => e.id === empId);
      return emp ? { id: emp.id, name: emp.name, email: emp.email, role: emp.role, department: emp.department } : null;
    }).filter(Boolean);

    projs = projs.map(p => {
      if (p.id === Number(id)) {
        return {
          ...p,
          ...projData,
          progress: projData.status === 'Completed' ? 100 : Number(projData.progress || p.progress),
          assignedEmployees: assigned.length > 0 ? assigned : p.assignedEmployees
        };
      }
      return p;
    });

    MockStorage.saveProjects(projs);
    return { message: 'Project updated successfully.' };
  },

  async updateProjectStatus(id, newStatus, token) {
    const backend = await tryBackend(`/api/projects/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus, progress: newStatus === 'Completed' ? 100 : undefined })
    });
    if (backend && backend.ok) return backend.data;

    let projs = MockStorage.getProjects();
    projs = projs.map(p => {
      if (p.id === Number(id)) {
        return {
          ...p,
          status: newStatus,
          progress: newStatus === 'Completed' ? 100 : p.progress
        };
      }
      return p;
    });
    MockStorage.saveProjects(projs);
    return { message: 'Status updated' };
  },

  async deleteProject(id, token) {
    const backend = await tryBackend(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (backend && backend.ok) return backend.data;

    let projs = MockStorage.getProjects();
    projs = projs.filter(p => p.id !== Number(id));
    MockStorage.saveProjects(projs);
    return { message: 'Project deleted' };
  },

  // 4. Contact HR / Inbox API
  async getHrRequests({ search = '', status = 'All', urgency = 'All' } = {}, token, user) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status !== 'All') params.append('status', status);
    if (urgency !== 'All') params.append('urgency', urgency);

    const backend = await tryBackend(`/api/hr-requests?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (backend && backend.ok) return backend.data;

    let reqs = MockStorage.getHrRequests();
    if (user && user.role !== 'admin') {
      reqs = reqs.filter(r => r.sender_email === user.email || r.sender_id === user.id);
    }
    if (search) {
      const s = search.toLowerCase();
      reqs = reqs.filter(r => r.subject.toLowerCase().includes(s) || r.message.toLowerCase().includes(s) || r.sender_name.toLowerCase().includes(s));
    }
    if (status !== 'All') {
      reqs = reqs.filter(r => r.status === status);
    }
    if (urgency !== 'All') {
      reqs = reqs.filter(r => r.urgency === urgency);
    }

    const all = MockStorage.getHrRequests();
    return {
      requests: reqs,
      stats: {
        total: all.length,
        new: all.filter(r => r.status === 'New').length,
        underReview: all.filter(r => r.status === 'Under Review').length,
        resolved: all.filter(r => r.status === 'Resolved').length,
        urgentPending: all.filter(r => r.urgency === 'Urgent' && r.status !== 'Resolved').length
      }
    };
  },

  async submitContactHr(payload, token) {
    const backend = await tryBackend('/api/hr-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (backend && backend.ok) return backend.data;

    const newReq = {
      ...payload,
      id: Date.now(),
      status: 'New',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    const reqs = MockStorage.getHrRequests();
    reqs.unshift(newReq);
    MockStorage.saveHrRequests(reqs);
    return { message: 'Your message has been securely sent to the HR team.', request: newReq };
  },

  async updateHrRequestStatus(id, newStatus, reply, token) {
    const backend = await tryBackend(`/api/hr-requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus, admin_reply: reply })
    });
    if (backend && backend.ok) return backend.data;

    let reqs = MockStorage.getHrRequests();
    reqs = reqs.map(r => {
      if (r.id === Number(id)) {
        return {
          ...r,
          status: newStatus,
          admin_reply: reply !== undefined ? reply : r.admin_reply,
          resolved_at: newStatus === 'Resolved' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : r.resolved_at
        };
      }
      return r;
    });
    MockStorage.saveHrRequests(reqs);
    return { message: 'HR request status updated.' };
  },

  async deleteHrRequest(id, token) {
    const backend = await tryBackend(`/api/hr-requests/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (backend && backend.ok) return backend.data;

    let reqs = MockStorage.getHrRequests();
    reqs = reqs.filter(r => r.id !== Number(id));
    MockStorage.saveHrRequests(reqs);
    return { message: 'Request removed from HR inbox.' };
  },

  // 5. Support Queries & FAQs API
  async getFaqs({ search = '', category = 'All' } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category !== 'All') params.append('category', category);

    const backend = await tryBackend(`/api/queries/faqs?${params.toString()}`);
    if (backend && backend.ok) return backend.data;

    let faqs = MockStorage.getFaqs();
    const categories = Array.from(new Set(faqs.map(f => f.category)));
    if (category !== 'All') {
      faqs = faqs.filter(f => f.category === category);
    }
    if (search) {
      const s = search.toLowerCase();
      faqs = faqs.filter(f => f.question.toLowerCase().includes(s) || f.answer.toLowerCase().includes(s));
    }
    return { faqs, categories };
  },

  async getQueries({ search = '', status = 'All' } = {}, token) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status !== 'All') params.append('status', status);

    const backend = await tryBackend(`/api/queries?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (backend && backend.ok) return backend.data;

    let queries = MockStorage.getQueries();
    if (search) {
      const s = search.toLowerCase();
      queries = queries.filter(q => q.question.toLowerCase().includes(s) || (q.details && q.details.toLowerCase().includes(s)));
    }
    if (status !== 'All') {
      queries = queries.filter(q => q.status === status);
    }

    const all = MockStorage.getQueries();
    return {
      queries,
      stats: {
        total: all.length,
        open: all.filter(q => q.status === 'Open').length,
        inProgress: all.filter(q => q.status === 'In Progress').length,
        resolved: all.filter(q => q.status === 'Resolved').length
      }
    };
  },

  async submitQuery(payload, token) {
    const backend = await tryBackend('/api/queries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (backend && backend.ok) return backend.data;

    const newQ = {
      ...payload,
      id: Date.now(),
      status: 'Open',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    const queries = MockStorage.getQueries();
    queries.unshift(newQ);
    MockStorage.saveQueries(queries);
    return { message: 'Support query submitted successfully.', query: newQ };
  },

  async resolveQuery(id, resolution, status, token, userName = 'Sarah Jenkins') {
    const backend = await tryBackend(`/api/queries/${id}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resolution, status })
    });
    if (backend && backend.ok) return backend.data;

    let queries = MockStorage.getQueries();
    queries = queries.map(q => {
      if (q.id === Number(id)) {
        return {
          ...q,
          status,
          resolution,
          resolved_by: userName,
          resolved_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
      }
      return q;
    });
    MockStorage.saveQueries(queries);
    return { message: `Query marked as ${status}.` };
  },

  // 6. Dashboard Stats API
  async getDashboardStats(token, user) {
    const backend = await tryBackend('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (backend && backend.ok) return backend.data;

    // Fallback computation
    const emps = MockStorage.getEmployees();
    const projs = MockStorage.getProjects();
    const queries = MockStorage.getQueries();
    const reqs = MockStorage.getHrRequests();

    // Dept distribution
    const deptMap = {};
    for (const e of emps) {
      deptMap[e.department] = (deptMap[e.department] || 0) + 1;
    }
    const departmentDistribution = Object.entries(deptMap).map(([department, count]) => ({ department, count }));

    // User's assigned projects
    const isEmployee = user?.role === 'employee';
    let myProjects = [];
    if (isEmployee && user) {
      myProjects = projs.filter(p => (p.assignedEmployees || []).some(e => e.email === user.email || e.name === user.name));
    }

    return {
      summary: {
        totalEmployees: emps.length,
        activeEmployees: emps.filter(e => e.status === 'Active').length,
        onLeaveEmployees: emps.filter(e => e.status === 'On Leave').length,
        totalProjects: projs.length,
        activeProjects: projs.filter(p => p.status === 'In Progress').length,
        completedProjects: projs.filter(p => p.status === 'Completed').length,
        notStartedProjects: projs.filter(p => p.status === 'Not Started').length,
        openQueries: queries.filter(q => q.status === 'Open' || q.status === 'In Progress').length,
        resolvedQueries: queries.filter(q => q.status === 'Resolved').length,
        totalQueries: queries.length,
        newHrRequests: reqs.filter(r => r.status === 'New').length,
        totalHrRequests: reqs.length
      },
      charts: {
        departmentDistribution,
        projectStatusDistribution: [
          { status: 'In Progress', count: projs.filter(p => p.status === 'In Progress').length, color: '#3b82f6' },
          { status: 'Completed', count: projs.filter(p => p.status === 'Completed').length, color: '#10b981' },
          { status: 'Not Started', count: projs.filter(p => p.status === 'Not Started').length, color: '#f59e0b' }
        ]
      },
      upcomingDeadlines: projs.filter(p => p.status !== 'Completed').map(p => ({
        title: p.title,
        subtitle: p.status,
        timestamp: p.deadline
      })),
      recentQueries: queries.slice(0, 3).map(q => ({
        title: q.question,
        subtitle: q.status,
        timestamp: q.created_at
      })),
      myProjects
    };
  }
};
