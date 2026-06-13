/* ============================================================
   Utility Functions – PVCS DMS
   ============================================================ */

// ---- Toast notifications ----
function showToast(msg, type = 'info', duration = 3500) {
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100%)'; t.style.transition = '0.3s'; setTimeout(() => t.remove(), 350); }, duration);
}

// ---- Modal ----
function showModal(html, width = '860px') {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  const content = document.getElementById('modal-content');
  box.style.maxWidth = width;
  content.innerHTML = html;
  overlay.classList.remove('hidden');
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-content').innerHTML = '';
}

// ---- Date helpers ----
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function yearMonth(dateStr) {
  const d = new Date(dateStr || new Date());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ---- Text helpers ----
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function highlightText(text, query) {
  if (!query) return escHtml(text);
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escHtml(text).replace(re, '<mark>$1</mark>');
}

function truncate(str, n = 60) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// ---- Priority badge ----
function priorityBadge(p) {
  const map = { Normal: 'badge-normal', Important: 'badge-important', Urgent: 'badge-urgent', Confidential: 'badge-confidential' };
  const dot = { Normal: 'p-normal', Important: 'p-important', Urgent: 'p-urgent', Confidential: 'p-confidential' };
  return `<span class="badge ${map[p] || 'badge-normal'}"><span class="priority-dot ${dot[p] || 'p-normal'}"></span>${p || 'Normal'}</span>`;
}

// ---- Sender codes ----
const SENDER_MAP = {
  'Chairperson': { code: 'CP', name: 'Gautam Raj', title: 'Chairperson' },
  'Vice Chairperson': { code: 'VP', name: 'Sita Ram Singh', title: 'Vice Chairperson' },
  'Secretary': { code: 'SEC', name: 'Kavita Devi', title: 'Secretary' },
  'Advisor to Chairperson': { code: 'ADV', name: 'Sushil Kumar', title: 'Advisor to Chairperson' },
  'Financial Advisor': { code: 'FADV', name: 'Harsh Prakash', title: 'Financial Advisor' },
};

// ---- Letter type codes ----
const TYPE_CODE_MAP = {
  'Request': 'REQ',
  'Complaint': 'CMP',
  'Proposal': 'PRP',
  'Notice': 'NTC',
  'Appointment': 'APT',
  'Advisory': 'ADVS',
  'Reminder': 'RMD',
  'Legal': 'LGL',
  'Financial': 'FIN',
  'Construction': 'CON',
  'Procurement': 'PRO',
  'Sales': 'SLS',
  'Purchase': 'PUR',
  'Tender': 'TDR',
  'General': 'GEN',
  'Custom': 'CST',
};

// ---- Recipient slug ----
function recipientSlug(name) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 16);
}

// ---- Searchable dropdown ----
function buildSearchableDropdown(container, items, placeholder, onSelect, initialValue) {
  container.innerHTML = `
    <div class="searchable-dropdown" style="position:relative;">
      <input type="text" class="form-control sd-input" placeholder="${placeholder}" autocomplete="off" value="${escHtml(initialValue || '')}" />
      <div class="sd-list" style="position:absolute;top:100%;left:0;right:0;background:#fff;border:1.5px solid var(--border);border-top:none;border-radius:0 0 6px 6px;max-height:220px;overflow-y:auto;z-index:50;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
      </div>
    </div>`;

  const input = container.querySelector('.sd-input');
  const list = container.querySelector('.sd-list');
  let selected = initialValue || '';

  function renderList(filter) {
    const filtered = items.filter(i => i.toLowerCase().includes(filter.toLowerCase()));
    list.innerHTML = filtered.length
      ? filtered.map(i => `<div class="sd-item" style="padding:9px 14px;cursor:pointer;font-size:0.88rem;border-bottom:1px solid var(--border);">${escHtml(i)}</div>`).join('')
        + `<div class="sd-item sd-custom" style="padding:9px 14px;cursor:pointer;font-size:0.82rem;color:var(--primary);border-top:1px solid var(--border);">+ Add: "${escHtml(filter || 'Custom')}"</div>`
      : `<div style="padding:10px 14px;font-size:0.82rem;color:var(--text-muted);">No match – press Enter to add custom</div>
         <div class="sd-item sd-custom" style="padding:9px 14px;cursor:pointer;font-size:0.82rem;color:var(--primary);">+ Add: "${escHtml(filter || 'Custom')}"</div>`;
    list.style.display = 'block';
  }

  input.addEventListener('focus', () => renderList(input.value));
  input.addEventListener('input', () => renderList(input.value));

  list.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const item = e.target.closest('.sd-item');
    if (!item) return;
    if (item.classList.contains('sd-custom')) {
      selected = input.value.trim() || 'Custom';
      input.value = selected;
    } else {
      selected = item.textContent;
      input.value = selected;
    }
    list.style.display = 'none';
    onSelect(selected);
    if (item.classList.contains('sd-custom') && selected !== 'Custom') {
      Recipients.add(selected);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      selected = input.value.trim();
      if (selected) { onSelect(selected); list.style.display = 'none'; }
    }
    if (e.key === 'Escape') { list.style.display = 'none'; }
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) list.style.display = 'none';
  });

  return { getValue: () => input.value.trim() };
}

// ---- Confirm dialog ----
function confirmDialog(msg) {
  return new Promise(resolve => {
    showModal(`
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:2rem;margin-bottom:12px">⚠️</div>
        <p style="font-size:1rem;margin-bottom:24px;color:var(--text)">${escHtml(msg)}</p>
        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn btn-danger" id="confirm-yes">Yes, Proceed</button>
          <button class="btn btn-outline" id="confirm-no">Cancel</button>
        </div>
      </div>
    `, '400px');
    document.getElementById('confirm-yes').onclick = () => { hideModal(); resolve(true); };
    document.getElementById('confirm-no').onclick = () => { hideModal(); resolve(false); };
  });
}

// ---- Number formatting ----
function padNum(n, len = 6) { return String(n).padStart(len, '0'); }

// ---- Download helpers ----
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---- Debounce ----
function debounce(fn, ms = 300) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ---- Online/Offline status ----
function updateOnlineStatus() {
  const el = document.getElementById('online-status');
  if (!el) return;
  if (navigator.onLine) {
    el.textContent = '● Online';
    el.className = 'offline-badge online';
    el.style.background = '#eaf4ea';
    el.style.color = '#1e7e34';
  } else {
    el.textContent = '● Offline';
    el.className = 'offline-badge offline';
  }
}
