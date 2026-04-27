/**
 * CorpFlow Dashboard — dashboardJS.js
 */
import { requireAuth, getDashboardStats, getTasks, getClients } from "./api.js";
import { renderSidebar } from "./app-registry.js";
import { formatCurrency, statusBadge, timeAgo, emptyState } from "./ui.js";

const user = await requireAuth();
await renderSidebar("dashboard", user);

// Greeting
const hour = new Date().getHours();
const greet =
  hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
document.getElementById("greeting").textContent =
  `${greet}, ${user.displayName?.split(" ")[0] || "there"} ◈`;
document.getElementById("greeting-sub").textContent =
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

// ── KPIs ────────────────────────────────────────────────────────
async function loadKPIs() {
  const stats = await getDashboardStats(user.uid);
  document.getElementById("kpi-revenue").textContent = formatCurrency(
    stats.totalRevenue,
  );
  document.getElementById("kpi-expenses").textContent = formatCurrency(
    stats.totalExpenses,
  );
  document.getElementById("kpi-projects").textContent = stats.activeProjects;
  document.getElementById("kpi-tasks").textContent = stats.openTasks;
}

// ── Tasks panel ──────────────────────────────────────────────────
async function loadTasks() {
  const tasks = await getTasks(user.uid);
  const el = document.getElementById("tasks-list");
  const recent = tasks.slice(-5).reverse();

  if (!recent.length) {
    el.innerHTML = emptyState("◌", "No tasks yet");
    return;
  }

  el.innerHTML = recent
    .map(
      (t) => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${t.status === "done" ? "var(--green)" : t.status === "in-progress" ? "var(--blue)" : "var(--text-dim)"}"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
        <div style="font-size:11px;color:var(--text-muted)">${t.project || "No project"}</div>
      </div>
      ${statusBadge(t.status || "pending")}
    </div>`,
    )
    .join("");
}

// ── Clients panel ────────────────────────────────────────────────
async function loadClients() {
  const clients = await getClients(user.uid);
  const el = document.getElementById("clients-list");
  const recent = clients.slice(-5).reverse();

  if (!recent.length) {
    el.innerHTML = emptyState("◈", "No clients yet");
    return;
  }

  el.innerHTML = recent
    .map(
      (c) => `
    <div class="activity-item">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--green-glow);
           border:1px solid var(--green-border);display:flex;align-items:center;justify-content:center;
           color:var(--green);font-weight:700;font-size:13px;flex-shrink:0">
        ${(c.name || "?")[0].toUpperCase()}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500">${c.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">${c.email || c.company || "—"}</div>
      </div>
      ${statusBadge(c.status || "active")}
    </div>`,
    )
    .join("");
}

// Load everything in parallel
await Promise.all([loadKPIs(), loadTasks(), loadClients()]);
