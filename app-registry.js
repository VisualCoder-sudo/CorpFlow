/**
 * CorpFlow App Registry — app-registry.js
 * ─────────────────────────────────────────────────────────────────
 * This is the SINGLE SOURCE OF TRUTH for all tools, modules, and
 * third-party apps in the platform.
 *
 * HOW TO ADD A NEW TOOL / PAGE:
 *   1. Add an entry to the APPS array below
 *   2. Create your HTML + JS files
 *   3. The sidebar, dashboard, and navigation auto-update.
 *   That's it. No other files need to change.
 *
 * HOW TO ADD AN EXTERNAL APP INTEGRATION:
 *   1. Add an entry to INTEGRATIONS below
 *   2. Set enabled: false until the integration is built
 * ─────────────────────────────────────────────────────────────────
 */

import { requireAuth, getUserProfile } from "./api.js";

export const APPS = [
  // ── Core ──────────────────────────────────────────────────────
  {
    id: "dashboard",
    label: "Dashboard",
    icon: `<img style="height: 1em;" src="DashboardICON.png" alt="Dashboard" class="nav-icon-img" />`,
    href: "dashboard.html",
    section: "core",
    description: "Overview of your business at a glance",
    enabled: true,
  },
  {
    id: "business",
    label: "Business",
    icon: `<img style="height: 1em;" src="CompanyICON.png" alt="Business" class="nav-icon-img" />`,
    href: "businessmanagement.html",
    section: "core",
    description: "Clients, projects, tasks and employees",
    enabled: true,
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: `<img style="height: 1em;" src="InvoicesICON.png" alt="Invoices" class="nav-icon-img" />`,
    href: "invoices.html",
    section: "core",
    description: "Create and manage invoices",
    enabled: true,
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: `<img style="height: 1em;" src="ExpensesICON.png" alt="Expenses" class="nav-icon-img" />`,
    href: "expenses.html",
    section: "core",
    description: "Track business expenses",
    enabled: true,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: `<img style="height: 1em;" src="InventoryICON.png" alt="Inventory" class="nav-icon-img" />`,
    href: "inventory.html",
    section: "core",
    description: "Manage your product inventory",
    enabled: true,
  },
  {
  id: "tax-estimator",
  label: "Tax Estimator",
  icon: `<img style="height: 1em;" src="TaxICON.png" alt="Tax" class="nav-icon-img" />`,
  href: "taxestimator.html",
  section: "tools",
  description: "Estimate income tax, CPP, EI & quarterly payments",
  enabled: false,
  },

  // ── Tools (add yours here) ────────────────────────────────────
  // {
  //   id:          "crm",
  //   label:       "CRM",
  //   icon:        "◆",
  //   href:        "crm.html",
  //   section:     "tools",
  //   description: "Full customer relationship manager",
  //   enabled:     false,
  // },

  // ── Settings ─────────────────────────────────────────────────
  {
    id: "settings",
    label: "Settings",
    icon: `<img style="height: 1em;" src="SettingsICON.png" alt="Settings" class="nav-icon-img" />`,
    href: "settings.html",
    section: "settings",
    description: "Account and workspace settings",
    enabled: true,
  },
];

export const INTEGRATIONS = [];

async function resolveCorpName(user) {
  const companyInput =
    document.getElementById("s-company") ||
    document.getElementById("c-company");
  const companyName = companyInput?.value?.trim();
  if (companyName) return companyName;

  const authUser = user || (await requireAuth());
  const profile = await getUserProfile(authUser.uid);
  return profile?.company?.trim() || authUser.displayName?.trim() || "CorpFlow";
}

/** Returns enabled apps by section */
export function getNavItems(section) {
  return APPS.filter((a) => a.section === section && a.enabled);
}

/** Returns all enabled apps */
export function getAllApps() {
  return APPS.filter((a) => a.enabled);
}

/** Marks the current active nav item */
export function markActiveNav(currentPage) {
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.appId === currentPage);
  });
}

/**
 * Injects mobile nav CSS into <head> once.
 */
function injectMobileNavStyles() {
  if (document.getElementById("corpflow-mobile-nav-styles")) return;

  const style = document.createElement("style");
  style.id = "corpflow-mobile-nav-styles";
  style.textContent = `
    /* ── 3-dot toggle button ─────────────────────────────── */
    #mobile-nav-toggle {
      display: none;
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 1100;
      background: var(--color-surface, #1e1e2e);
      border: 1.5px solid var(--color-border, rgba(255,255,255,0.12));
      border-radius: 10px;
      width: 42px;
      height: 42px;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 5px;
      padding: 0;
      box-shadow: 0 2px 12px rgba(0,0,0,0.25);
      transition: transform 0.12s;
      -webkit-tap-highlight-color: transparent;
    }
    #mobile-nav-toggle:active { transform: scale(0.92); }
    #mobile-nav-toggle .mnm-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--color-text, #e0e0e0);
      pointer-events: none;
    }

    /* ── Full-screen modal ───────────────────────────────── */
    /*
     * KEY FIX: We never toggle display. The modal stays display:flex
     * at all times. Open/close is controlled by visibility + opacity
     * + pointer-events, which is reliable and animatable.
     */
    #mobile-nav-modal {
      position: fixed;
      inset: 0;
      z-index: 1200;
      background: var(--color-bg, #13131f);
      display: flex;
      flex-direction: column;
      overflow: hidden;

      visibility: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-6px);
      transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
    }
    #mobile-nav-modal.open {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    /* ── Header ──────────────────────────────────────────── */
    .mnm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 20px 14px;
      border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
      flex-shrink: 0;
    }
    .mnm-logo {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--color-text, #e0e0e0);
    }
    .mnm-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted, #888);
      font-size: 1.6rem;
      line-height: 1;
      padding: 4px 10px;
      border-radius: 6px;
      transition: color 0.12s, background 0.12s;
      -webkit-tap-highlight-color: transparent;
    }
    .mnm-close:hover { color: var(--color-text, #e0e0e0); background: rgba(255,255,255,0.06); }

    /* ── Search ──────────────────────────────────────────── */
    .mnm-search-wrap {
      padding: 14px 20px 10px;
      flex-shrink: 0;
    }
    .mnm-search-wrap input {
      width: 100%;
      box-sizing: border-box;
      background: var(--color-surface, #1e1e2e);
      border: 1.5px solid var(--color-border, rgba(255,255,255,0.12));
      border-radius: 10px;
      padding: 11px 16px 11px 40px;
      font-size: 0.95rem;
      color: var(--color-text, #e0e0e0);
      outline: none;
      transition: border-color 0.15s;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: 13px center;
    }
    .mnm-search-wrap input::placeholder { color: var(--color-text-muted, #666); }
    .mnm-search-wrap input:focus { border-color: var(--color-accent, #6c63ff); }

    /* ── Nav list ────────────────────────────────────────── */
    .mnm-list {
      flex: 1;
      overflow-y: auto;
      padding: 6px 12px 32px;
    }
    .mnm-section-label {
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--color-text-muted, #666);
      padding: 16px 8px 6px;
    }
    .mnm-nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 13px 12px;
      border-radius: 10px;
      text-decoration: none;
      color: var(--color-text, #e0e0e0);
      transition: background 0.12s;
      -webkit-tap-highlight-color: transparent;
    }
    .mnm-nav-item:hover,
    .mnm-nav-item:active { background: rgba(255,255,255,0.06); }
    .mnm-nav-item.active {
      background: rgba(108,99,255,0.15);
      color: var(--color-accent, #6c63ff);
    }
    .mnm-nav-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--color-surface, #1e1e2e);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }
    .mnm-nav-item.active .mnm-nav-icon { background: rgba(108,99,255,0.18); }
    .mnm-nav-label { font-size: 0.95rem; font-weight: 500; }
    .mnm-nav-desc { font-size: 0.75rem; color: var(--color-text-muted, #888); line-height: 1.3; margin-top: 1px; }

    /* ── No results ──────────────────────────────────────── */
    .mnm-no-results {
      text-align: center;
      color: var(--color-text-muted, #666);
      font-size: 0.9rem;
      padding: 48px 20px;
    }

    /* ── Show only on mobile ─────────────────────────────── */
    @media (max-width: 768px) {
      #mobile-nav-toggle { display: flex; }
      #sidebar { display: none !important; }
    }
    @media (min-width: 769px) {
      #mobile-nav-modal { display: none !important; }
      #mobile-nav-toggle { display: none !important; }
    }
  `;

  document.head.appendChild(style);
}

/**
 * Builds the 3-dot button and modal, injects into <body>.
 */
function injectMobileNavModal(apps, currentId, corpName) {
  document.getElementById("mobile-nav-modal")?.remove();
  document.getElementById("mobile-nav-toggle")?.remove();

  const sectionLabels = { core: "Platform", tools: "Tools", settings: "Account" };

  // ── 3-dot button ────────────────────────────────────────────
  const toggle = document.createElement("button");
  toggle.id = "mobile-nav-toggle";
  toggle.setAttribute("aria-label", "Open navigation menu");
  toggle.setAttribute("type", "button");
  toggle.innerHTML =
    `<span class="mnm-dot"></span>` +
    `<span class="mnm-dot"></span>` +
    `<span class="mnm-dot"></span>`;

  // ── Modal ───────────────────────────────────────────────────
  const modal = document.createElement("div");
  modal.id = "mobile-nav-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Navigation menu");
  modal.innerHTML = `
    <div class="mnm-header">
      <span class="mnm-logo">${corpName}</span>
      <button class="mnm-close" type="button" aria-label="Close navigation">&times;</button>
    </div>
    <div class="mnm-search-wrap">
      <input
        type="search"
        id="mnm-search-input"
        placeholder="Search pages…"
        autocomplete="off"
        spellcheck="false"
      />
    </div>
    <nav class="mnm-list" id="mnm-list" aria-label="App pages"></nav>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(modal);

  // ── Render list (filtered by search query) ──────────────────
  function renderList(query) {
    const q = (query || "").toLowerCase().trim();
    const filtered = apps.filter(
      (a) =>
        !q ||
        a.label.toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q)
    );

    const list = document.getElementById("mnm-list");

    if (!filtered.length) {
      list.innerHTML = `<div class="mnm-no-results">No pages match "<strong>${query}</strong>"</div>`;
      return;
    }

    const grouped = {};
    filtered.forEach((a) => {
      if (!grouped[a.section]) grouped[a.section] = [];
      grouped[a.section].push(a);
    });

    let html = "";
    for (const [section, items] of Object.entries(grouped)) {
      if (!q && sectionLabels[section]) {
        html += `<div class="mnm-section-label">${sectionLabels[section]}</div>`;
      }
      items.forEach((app) => {
        html += `
          <a
            class="mnm-nav-item${app.id === currentId ? " active" : ""}"
            href="${app.href}"
            data-app-id="${app.id}"
          >
            <span class="mnm-nav-icon">${app.icon}</span>
            <span>
              <div class="mnm-nav-label">${app.label}</div>
              ${app.description ? `<div class="mnm-nav-desc">${app.description}</div>` : ""}
            </span>
          </a>`;
      });
    }

    list.innerHTML = html;
  }

  renderList("");

  // ── Open / close ────────────────────────────────────────────
  function openModal() {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    // Small delay so the transition plays before focus shifts
    setTimeout(() => document.getElementById("mnm-search-input")?.focus(), 60);
  }

  function closeModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    // Reset search after transition ends
    modal.addEventListener(
      "transitionend",
      () => {
        const input = document.getElementById("mnm-search-input");
        if (input) { input.value = ""; renderList(""); }
      },
      { once: true }
    );
  }

  toggle.addEventListener("click", openModal);
  modal.querySelector(".mnm-close").addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  // Close on nav link tap
  document.getElementById("mnm-list").addEventListener("click", (e) => {
    if (e.target.closest(".mnm-nav-item")) closeModal();
  });

  // Live search
  document.getElementById("mnm-search-input").addEventListener("input", (e) => {
    renderList(e.target.value);
  });
}

/**
 * Renders the sidebar nav from the registry.
 * Call this from every page's JS:
 *   import { renderSidebar } from './app-registry.js';
 *   renderSidebar('dashboard');
 */
export async function renderSidebar(currentId, user = null) {
  const sidebar = document.getElementById("sidebar");

  const sections = {
    core: { label: "Platform", ids: [] },
    tools: { label: "Tools", ids: [] },
    settings: { label: "Account", ids: [] },
  };

  const enabledApps = APPS.filter((a) => a.enabled);
  enabledApps.forEach((a) => {
    if (sections[a.section]) sections[a.section].ids.push(a);
  });

  const corpName = await resolveCorpName(user);

  // ── Desktop sidebar ─────────────────────────────────────────
  if (sidebar) {
    let html = `<div class="sidebar-logo" id="sidebar-logo">${corpName}</div>`;
    for (const [, sec] of Object.entries(sections)) {
      if (!sec.ids.length) continue;
      html += `<div class="sidebar-section-label">${sec.label}</div>`;
      sec.ids.forEach((app) => {
        html += `
          <a class="nav-item ${app.id === currentId ? "active" : ""}"
             href="${app.href}" data-app-id="${app.id}">
            <span class="nav-icon">${app.icon}</span>
            ${app.label}
          </a>`;
      });
    }
    sidebar.innerHTML = html;

    document.getElementById("logout-btn")?.addEventListener("click", async (e) => {
      e.preventDefault();
      const { logout } = await import("./api.js");
      await logout();
      window.location.href = "auth.html";
    });
  }

  // ── Mobile nav ───────────────────────────────────────────────
  injectMobileNavStyles();
  injectMobileNavModal(enabledApps, currentId, corpName);
}