/**
 * CorpFlow UI Utilities — ui.js
 * Reusable UI helpers. Import anywhere.
 */

// ── Toast notifications ──────────────────────────────────────────
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function toast(message, type = 'info', duration = 3500) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  el.textContent = `${icons[type] || ''} ${message}`;

  getToastContainer().appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
    el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, duration);
}

// ── Modal ────────────────────────────────────────────────────────
export function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

export function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

export function createModal(id, title, bodyHTML, footerHTML = '') {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = 'modal-backdrop';
  el.id = id;
  el.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <span style="font-family:var(--font-display);font-weight:700;font-size:18px">${title}</span>
        <button class="modal-close" data-close="${id}">✕</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal-footer" style="margin-top:var(--s-6);display:flex;gap:var(--s-3);justify-content:flex-end">${footerHTML}</div>` : ''}
    </div>`;
  document.body.appendChild(el);

  el.querySelector('[data-close]').addEventListener('click', () => closeModal(id));
  el.addEventListener('click', e => { if (e.target === el) closeModal(id); });
  return el;
}

// ── Confirm dialog ───────────────────────────────────────────────
export function confirm(message) {
  return new Promise(resolve => {
    createModal('__confirm', 'Confirm', `<p style="color:var(--text-muted)">${message}</p>`,
      `<button class="btn btn-ghost" id="__confirm-no">Cancel</button>
       <button class="btn btn-danger" id="__confirm-yes">Delete</button>`);
    openModal('__confirm');
    document.getElementById('__confirm-yes').onclick = () => { closeModal('__confirm'); resolve(true); };
    document.getElementById('__confirm-no').onclick  = () => { closeModal('__confirm'); resolve(false); };
  });
}

// ── Loading state helpers ────────────────────────────────────────
export function setLoading(btn, loading, label = 'Save') {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Saving…`;
  } else {
    btn.disabled = false;
    btn.textContent = label;
  }
}

// ── Format helpers ───────────────────────────────────────────────
export function formatCurrency(n, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n || 0);
}

export function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

// ── Status badge ─────────────────────────────────────────────────
const STATUS_CLASSES = {
  active: 'badge-green', paid: 'badge-green', done: 'badge-green', completed: 'badge-green',
  pending: 'badge-amber', 'in-progress': 'badge-blue', overdue: 'badge-red',
  draft: 'badge-blue', inactive: 'badge-amber', cancelled: 'badge-red',
};

export function statusBadge(status) {
  const cls = STATUS_CLASSES[status] || 'badge-blue';
  return `<span class="badge ${cls}">${status}</span>`;
}

// ── Empty state ──────────────────────────────────────────────────
export function emptyState(icon, message, actionHTML = '') {
  return `
    <div style="text-align:center;padding:var(--s-16) 0;color:var(--text-muted)">
      <div style="font-size:40px;margin-bottom:var(--s-4)">${icon}</div>
      <div style="font-size:15px">${message}</div>
      ${actionHTML ? `<div style="margin-top:var(--s-4)">${actionHTML}</div>` : ''}
    </div>`;
}

// ── Search/filter helper ─────────────────────────────────────────
export function filterList(items, query, fields) {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(item =>
    fields.some(f => String(item[f] || '').toLowerCase().includes(q))
  );
}
