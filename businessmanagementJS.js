/**
 * CorpFlow Business Management — businessmanagementJS.js
 * Handles Clients, Projects, Tasks (Kanban), Employees
 */
import {
  requireAuth,
  getClients,
  addClient,
  updateClient,
  deleteClient,
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  formatDate,
} from "./api.js";
import { renderSidebar } from "./app-registry.js";
import {
  toast,
  confirm,
  openModal,
  closeModal,
  statusBadge,
  formatCurrency,
  emptyState,
  filterList,
  setLoading,
} from "./ui.js";

const user = await requireAuth();
await renderSidebar("business", user);

// ── Global state ─────────────────────────────────────────────────
let clients = [];
let projects = [];
let tasks = [];
let employees = [];

// ── Tab switching ────────────────────────────────────────────────
const tabs = document.querySelectorAll(".tab-btn");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-panel")
      .forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// Handle URL params (e.g. ?new=client from dashboard quick actions)
const params = new URLSearchParams(window.location.search);
if (params.get("new")) {
  const target = params.get("new");
  const tabBtn = document.querySelector(
    `[data-tab="${target}s"] , [data-tab="${target}"]`,
  );
  tabBtn?.click();
  setTimeout(() => document.getElementById(`add-${target}-btn`)?.click(), 200);
}

// ── Modal close helpers ──────────────────────────────────────────
document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});
document.querySelectorAll(".modal-backdrop").forEach((m) => {
  m.addEventListener("click", (e) => {
    if (e.target === m) closeModal(m.id);
  });
});

// ══════════════════════════════════════════════════════════════════
// CLIENTS
// ══════════════════════════════════════════════════════════════════
async function loadClients() {
  clients = await getClients(user.uid);
  renderClients(clients);
}

function renderClients(data) {
  const tbody = document.getElementById("clients-tbody");
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6">${emptyState("◈", "No clients yet. Add your first one!")}</td></tr>`;
    return;
  }
  tbody.innerHTML = data
    .map(
      (c) => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.company || "—"}</td>
      <td>${c.email || "—"}</td>
      <td>${c.phone || "—"}</td>
      <td>${statusBadge(c.status || "active")}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" onclick="editClient('${c.id}')">Edit</button>
          <button class="icon-btn del" onclick="removeClient('${c.id}')">✕</button>
        </div>
      </td>
    </tr>`,
    )
    .join("");
}

// Search + filter
document.getElementById("client-search").addEventListener("input", (e) => {
  const filtered = filterList(clients, e.target.value, [
    "name",
    "company",
    "email",
  ]);
  const status = document.getElementById("client-filter").value;
  renderClients(filtered.filter((c) => !status || c.status === status));
});
document.getElementById("client-filter").addEventListener("change", (e) => {
  const filtered = filterList(
    clients,
    document.getElementById("client-search").value,
    ["name", "company", "email"],
  );
  renderClients(
    filtered.filter((c) => !e.target.value || c.status === e.target.value),
  );
});

// Add button
document.getElementById("add-client-btn").addEventListener("click", () => {
  clearForm([
    "c-name",
    "c-company",
    "c-email",
    "c-phone",
    "c-notes",
    "c-industry",
  ]);
  document.getElementById("client-id").value = "";
  document.getElementById("c-status").value = "active";
  document.getElementById("client-modal-title").textContent = "New Client";
  openModal("client-modal");
});

// Save
document
  .getElementById("save-client-btn")
  .addEventListener("click", async () => {
    const btn = document.getElementById("save-client-btn");
    const name = document.getElementById("c-name").value.trim();
    if (!name) {
      toast("Client name is required.", "error");
      return;
    }

    setLoading(btn, true);
    const data = {
      name,
      company: document.getElementById("c-company").value.trim(),
      email: document.getElementById("c-email").value.trim(),
      phone: document.getElementById("c-phone").value.trim(),
      industry: document.getElementById("c-industry").value.trim(),
      notes: document.getElementById("c-notes").value.trim(),
      status: document.getElementById("c-status").value,
    };

    try {
      const id = document.getElementById("client-id").value;
      if (id) {
        await updateClient(user.uid, id, data);
        toast("Client updated", "success");
      } else {
        await addClient(user.uid, data);
        toast("Client added", "success");
      }
      closeModal("client-modal");
      await loadClients();
    } catch (e) {
      toast("Failed to save client.", "error");
    } finally {
      setLoading(btn, false, "Save Client");
    }
  });

window.editClient = (id) => {
  const c = clients.find((c) => c.id === id);
  if (!c) return;
  document.getElementById("client-id").value = id;
  document.getElementById("c-name").value = c.name || "";
  document.getElementById("c-company").value = c.company || "";
  document.getElementById("c-email").value = c.email || "";
  document.getElementById("c-phone").value = c.phone || "";
  document.getElementById("c-industry").value = c.industry || "";
  document.getElementById("c-notes").value = c.notes || "";
  document.getElementById("c-status").value = c.status || "active";
  document.getElementById("client-modal-title").textContent = "Edit Client";
  openModal("client-modal");
};

window.removeClient = async (id) => {
  if (!(await confirm("Delete this client? This cannot be undone."))) return;
  await deleteClient(user.uid, id);
  toast("Client deleted", "info");
  await loadClients();
};

// ══════════════════════════════════════════════════════════════════
// PROJECTS
// ══════════════════════════════════════════════════════════════════
async function loadProjects() {
  projects = await getProjects(user.uid);
  renderProjects(projects);
  populateProjectDropdowns();
}

function renderProjects(data) {
  const tbody = document.getElementById("projects-tbody");
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6">${emptyState("◎", "No projects yet.")}</td></tr>`;
    return;
  }
  tbody.innerHTML = data
    .map(
      (p) => `
    <tr>
      <td><strong>${p.name}</strong><br><span style="font-size:11px;color:var(--text-muted)">${p.desc || ""}</span></td>
      <td>${clients.find((c) => c.id === p.clientId)?.name || p.client || "—"}</td>
      <td>${statusBadge(p.status || "active")}</td>
      <td>${p.budget ? formatCurrency(p.budget) : "—"}</td>
      <td>${p.due || "—"}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" onclick="editProject('${p.id}')">Edit</button>
          <button class="icon-btn del" onclick="removeProject('${p.id}')">✕</button>
        </div>
      </td>
    </tr>`,
    )
    .join("");
}

document.getElementById("project-search").addEventListener("input", (e) => {
  const filtered = filterList(projects, e.target.value, ["name", "desc"]);
  const status = document.getElementById("project-filter").value;
  renderProjects(filtered.filter((p) => !status || p.status === status));
});
document.getElementById("project-filter").addEventListener("change", (e) => {
  const filtered = filterList(
    projects,
    document.getElementById("project-search").value,
    ["name", "desc"],
  );
  renderProjects(
    filtered.filter((p) => !e.target.value || p.status === e.target.value),
  );
});

document.getElementById("add-project-btn").addEventListener("click", () => {
  clearForm(["p-name", "p-budget", "p-due", "p-desc"]);
  document.getElementById("project-id").value = "";
  document.getElementById("p-status").value = "active";
  document.getElementById("project-modal-title").textContent = "New Project";
  openModal("project-modal");
});

document
  .getElementById("save-project-btn")
  .addEventListener("click", async () => {
    const btn = document.getElementById("save-project-btn");
    const name = document.getElementById("p-name").value.trim();
    if (!name) {
      toast("Project name is required.", "error");
      return;
    }
    setLoading(btn, true);

    const data = {
      name,
      clientId: document.getElementById("p-client").value,
      status: document.getElementById("p-status").value,
      budget: parseFloat(document.getElementById("p-budget").value) || 0,
      due: document.getElementById("p-due").value,
      desc: document.getElementById("p-desc").value.trim(),
    };

    try {
      const id = document.getElementById("project-id").value;
      if (id) {
        await updateProject(user.uid, id, data);
        toast("Project updated", "success");
      } else {
        await addProject(user.uid, data);
        toast("Project added", "success");
      }
      closeModal("project-modal");
      await loadProjects();
    } catch {
      toast("Failed to save project.", "error");
    } finally {
      setLoading(btn, false, "Save Project");
    }
  });

window.editProject = (id) => {
  const p = projects.find((p) => p.id === id);
  if (!p) return;
  document.getElementById("project-id").value = id;
  document.getElementById("p-name").value = p.name || "";
  document.getElementById("p-client").value = p.clientId || "";
  document.getElementById("p-status").value = p.status || "active";
  document.getElementById("p-budget").value = p.budget || "";
  document.getElementById("p-due").value = p.due || "";
  document.getElementById("p-desc").value = p.desc || "";
  document.getElementById("project-modal-title").textContent = "Edit Project";
  openModal("project-modal");
};

window.removeProject = async (id) => {
  if (!(await confirm("Delete this project?"))) return;
  await deleteProject(user.uid, id);
  toast("Project deleted", "info");
  await loadProjects();
};

// ══════════════════════════════════════════════════════════════════
// TASKS (Kanban)
// ══════════════════════════════════════════════════════════════════
async function loadTasks() {
  tasks = await getTasks(user.uid);
  renderKanban(tasks);
  populateTaskProjectDropdown();
}

function renderKanban(data) {
  const statuses = ["pending", "in-progress", "review", "done"];
  statuses.forEach((status) => {
    const colTasks = data.filter((t) => t.status === status);
    document.getElementById(`count-${status}`).textContent = colTasks.length;
    document.getElementById(`col-${status}`).innerHTML = colTasks.length
      ? colTasks
          .map(
            (t) => `
            <div class="kanban-card" onclick="editTask('${t.id}')">
              <div class="kanban-card-title">${t.title}</div>
              <div class="kanban-card-meta">${t.project || "—"} · ${priorityDot(t.priority)}</div>
              ${t.assignee ? `<div class="kanban-card-meta" style="margin-top:4px">👤 ${t.assignee}</div>` : ""}
              ${t.due ? `<div class="kanban-card-meta">📅 ${t.due}</div>` : ""}
              <div style="margin-top:6px;text-align:right">
                <button class="icon-btn del" onclick="event.stopPropagation();removeTask('${t.id}')">✕</button>
              </div>
            </div>`,
          )
          .join("")
      : `<div style="color:var(--text-dim);font-size:12px;text-align:center;padding:var(--s-4)">Empty</div>`;
  });
}

function priorityDot(p) {
  if (p === "high") return '<span style="color:var(--red)">● High</span>';
  if (p === "medium") return '<span style="color:var(--amber)">● Medium</span>';
  return '<span style="color:var(--text-dim)">● Low</span>';
}

document.getElementById("task-search").addEventListener("input", (e) => {
  renderKanban(
    filterList(tasks, e.target.value, ["title", "project", "assignee"]),
  );
});

document.getElementById("add-task-btn").addEventListener("click", () => {
  clearForm(["t-title", "t-assignee", "t-due"]);
  document.getElementById("task-id").value = "";
  document.getElementById("t-status").value = "pending";
  document.getElementById("t-priority").value = "medium";
  document.getElementById("task-modal-title").textContent = "New Task";
  openModal("task-modal");
});

document.getElementById("save-task-btn").addEventListener("click", async () => {
  const btn = document.getElementById("save-task-btn");
  const title = document.getElementById("t-title").value.trim();
  if (!title) {
    toast("Task title is required.", "error");
    return;
  }
  setLoading(btn, true);

  const projectId = document.getElementById("t-project").value;
  const projectName = projects.find((p) => p.id === projectId)?.name || "";

  const data = {
    title,
    projectId,
    project: projectName,
    assignee: document.getElementById("t-assignee").value.trim(),
    status: document.getElementById("t-status").value,
    priority: document.getElementById("t-priority").value,
    due: document.getElementById("t-due").value,
  };

  try {
    const id = document.getElementById("task-id").value;
    if (id) {
      await updateTask(user.uid, id, data);
      toast("Task updated", "success");
    } else {
      await addTask(user.uid, data);
      toast("Task added", "success");
    }
    closeModal("task-modal");
    await loadTasks();
  } catch {
    toast("Failed to save task.", "error");
  } finally {
    setLoading(btn, false, "Save Task");
  }

  setTimeout(() => {
    location.replace("businessmanagement.html");
  }, 500);
});

window.editTask = (id) => {
  const t = tasks.find((t) => t.id === id);
  if (!t) return;
  document.getElementById("task-id").value = id;
  document.getElementById("t-title").value = t.title || "";
  document.getElementById("t-project").value = t.projectId || "";
  document.getElementById("t-assignee").value = t.assignee || "";
  document.getElementById("t-status").value = t.status || "pending";
  document.getElementById("t-priority").value = t.priority || "medium";
  document.getElementById("t-due").value = t.due || "";
  document.getElementById("task-modal-title").textContent = "Edit Task";
  openModal("task-modal");
};

window.removeTask = async (id) => {
  if (!(await confirm("Delete this task?"))) return;
  await deleteTask(user.uid, id);
  toast("Task deleted", "info");
  await loadTasks();
};

// ══════════════════════════════════════════════════════════════════
// EMPLOYEES
// ══════════════════════════════════════════════════════════════════
async function loadEmployees() {
  employees = await getEmployees(user.uid);
  renderEmployees(employees);
}

function renderEmployees(data) {
  const tbody = document.getElementById("employees-tbody");
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7">${emptyState("⬡", "No employees yet.")}</td></tr>`;
    return;
  }
  tbody.innerHTML = data
    .map(
      (e) => `
    <tr>
      <td><strong>${e.name}</strong></td>
      <td>${e.role || "—"}</td>
      <td><span class="badge badge-blue">${e.department || "—"}</span></td>
      <td>${e.email || "—"}</td>
      <td>${statusBadge(e.status || "active")}</td>
      <td>${e.salary ? `$${e.salary.toFixed(2)}` : "—"}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" onclick="editEmployee('${e.id}')">Edit</button>
          <button class="icon-btn del" onclick="removeEmployee('${e.id}')">✕</button>
        </div>
      </td>
    </tr>`,
    )
    .join("");
}

document.getElementById("employee-search").addEventListener("input", (e) => {
  const dept = document.getElementById("employee-filter").value;
  const filtered = filterList(employees, e.target.value, [
    "name",
    "role",
    "email",
  ]);
  renderEmployees(filtered.filter((emp) => !dept || emp.department === dept));
});
document.getElementById("employee-filter").addEventListener("change", (e) => {
  const filtered = filterList(
    employees,
    document.getElementById("employee-search").value,
    ["name", "role", "email"],
  );
  renderEmployees(
    filtered.filter(
      (emp) => !e.target.value || emp.department === e.target.value,
    ),
  );
});

document.getElementById("add-employee-btn").addEventListener("click", () => {
  clearForm(["e-name", "e-role", "e-email", "e-salary"]);
  document.getElementById("employee-id").value = "";
  document.getElementById("e-status").value = "active";
  document.getElementById("employee-modal-title").textContent = "New Employee";
  openModal("employee-modal");
});

document
  .getElementById("save-employee-btn")
  .addEventListener("click", async () => {
    const btn = document.getElementById("save-employee-btn");
    const name = document.getElementById("e-name").value.trim();
    if (!name) {
      toast("Employee name is required.", "error");
      return;
    }
    setLoading(btn, true);

    const data = {
      name,
      role: document.getElementById("e-role").value.trim(),
      department: document.getElementById("e-dept").value,
      email: document.getElementById("e-email").value.trim(),
      salary: parseFloat(document.getElementById("e-salary").value) || 0,
      status: document.getElementById("e-status").value,
    };

    try {
      const id = document.getElementById("employee-id").value;
      if (id) {
        await updateEmployee(user.uid, id, data);
        toast("Employee updated", "success");
      } else {
        await addEmployee(user.uid, data);
        toast("Employee added", "success");
      }
      closeModal("employee-modal");
      await loadEmployees();
    } catch {
      toast("Failed to save employee.", "error");
    } finally {
      setLoading(btn, false, "Save Employee");
    }
  });

window.editEmployee = (id) => {
  const e = employees.find((e) => e.id === id);
  if (!e) return;
  document.getElementById("employee-id").value = id;
  document.getElementById("e-name").value = e.name || "";
  document.getElementById("e-role").value = e.role || "";
  document.getElementById("e-dept").value = e.department || "engineering";
  document.getElementById("e-email").value = e.email || "";
  document.getElementById("e-salary").value = e.salary || "";
  document.getElementById("e-status").value = e.status || "active";
  document.getElementById("employee-modal-title").textContent = "Edit Employee";
  openModal("employee-modal");
};

window.removeEmployee = async (id) => {
  if (!(await confirm("Delete this employee?"))) return;
  await deleteEmployee(user.uid, id);
  toast("Employee deleted", "info");
  await loadEmployees();
};

// ── Dropdown helpers ─────────────────────────────────────────────
function populateProjectDropdowns() {
  const opts =
    `<option value="">— Select project —</option>` +
    projects.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
  document.getElementById("t-project").innerHTML = opts;

  const clientOpts =
    `<option value="">— Select client —</option>` +
    clients.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  document.getElementById("p-client").innerHTML = clientOpts;
}

function populateTaskProjectDropdown() {
  const opts =
    `<option value="">— Select project —</option>` +
    projects.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
  document.getElementById("t-project").innerHTML = opts;
}

function clearForm(ids) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

// ── Boot ─────────────────────────────────────────────────────────
await Promise.all([loadClients(), loadProjects(), loadEmployees()]);
await loadTasks(); // load after projects are available for dropdown
