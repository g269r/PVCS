/* ============================================================
   Dashboard Page – PVCS DMS
   ============================================================ */

async function renderDashboard() {
  const container = document.getElementById('page-dashboard');
  container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:60px"><div class="spinner"></div></div>`;

  const [total, thisMonth, thisYear, recent, bylawsCount] = await Promise.all([
    Letters.countAll(),
    Letters.countThisMonth(),
    Letters.countThisYear(),
    Letters.getRecent(8),
    Bylaws.count(),
  ]);

  const now = new Date();
  const monthName = now.toLocaleString('en-IN', { month: 'long' });

  container.innerHTML = `
    <div class="section-title">📊 Dashboard</div>

    <!-- Stats -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total Letters</div>
        <div class="stat-value">${total}</div>
        <div class="stat-sub">In Archive</div>
      </div>
      <div class="stat-card accent">
        <div class="stat-label">This Month</div>
        <div class="stat-value">${thisMonth}</div>
        <div class="stat-sub">${monthName} ${now.getFullYear()}</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">This Year</div>
        <div class="stat-value">${thisYear}</div>
        <div class="stat-sub">Year ${now.getFullYear()}</div>
      </div>
      <div class="stat-card info">
        <div class="stat-label">Bylaw Pages</div>
        <div class="stat-value">${bylawsCount}</div>
        <div class="stat-sub">${bylawsCount > 0 ? 'Indexed' : 'Not Loaded'}</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card mb-16">
      <div class="card-header">
        <div class="card-title">Quick Actions</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="navigateTo('create-letter')">✍️ Create New Letter</button>
        <button class="btn btn-outline" onclick="navigateTo('archive')">🗂️ View Archive</button>
        <button class="btn btn-outline" onclick="navigateTo('bylaws')">📖 Bylaw Search</button>
        <button class="btn btn-outline" onclick="navigateTo('templates')">📋 Templates</button>
        <button class="btn btn-outline" onclick="navigateTo('backup')">💾 Backup</button>
      </div>
    </div>

    <!-- Recent Letters -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Recent Letters</div>
        <button class="btn btn-sm btn-outline" onclick="navigateTo('archive')">View All</button>
      </div>
      ${recent.length === 0 ? `
        <div class="table-empty">
          <div style="font-size:2.5rem;margin-bottom:12px">📭</div>
          <div>No letters yet. <a href="#" onclick="navigateTo('create-letter')" style="color:var(--primary)">Create your first letter</a></div>
        </div>
      ` : `
        <div>
          ${recent.map(l => `
            <div class="recent-letter-item">
              <div class="rli-meta">
                <div class="rli-ref">${escHtml(l.refNumber || l.did)}</div>
                <div class="rli-subject">${escHtml(l.subject || '(No Subject)')}</div>
                <div class="rli-recipient">To: ${escHtml(l.recipient || '')} &nbsp;·&nbsp; ${formatDateShort(l.letterDate)}</div>
              </div>
              <div class="rli-actions">
                ${priorityBadge(l.priority)}
                <button class="btn btn-sm btn-outline" onclick="viewLetter('${escHtml(l.did)}')">View</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Society Info Card -->
    <div class="card" style="border-top:3px solid var(--accent)">
      <div class="card-header"><div class="card-title">Society Information</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <div class="form-label">Society Name</div>
          <div style="font-size:0.88rem;color:var(--text);margin-bottom:8px">PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED</div>
          <div class="hindi" style="font-size:0.92rem;color:var(--primary);margin-bottom:12px">पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड</div>
          <div class="form-label">Registration</div>
          <div style="font-size:0.88rem">26/HQR/2018</div>
        </div>
        <div>
          <div class="form-label">Office Bearers</div>
          ${Object.entries(SENDER_MAP).map(([role, info]) =>
            `<div style="font-size:0.85rem;padding:4px 0;border-bottom:1px solid var(--border)">
              <span style="color:var(--text-muted);min-width:140px;display:inline-block">${role}:</span>
              <strong>${info.name}</strong>
            </div>`
          ).join('')}
        </div>
      </div>
    </div>
  `;
}
