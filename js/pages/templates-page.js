/* ============================================================
   Templates Page – PVCS DMS
   ============================================================ */

function renderTemplatesPage() {
  const container = document.getElementById('page-templates');

  container.innerHTML = `
    <div class="section-title">📋 Letter Templates</div>
    <p style="color:var(--text-muted);margin-bottom:20px;font-size:0.9rem">
      Select a template to create a new letter pre-filled with the appropriate format.
      All templates support both English and Hindi drafts.
    </p>

    <div class="template-grid">
      ${TEMPLATES.map(t => `
        <div class="template-card" onclick="useTemplate('${t.id}')">
          <div class="template-card-icon">${t.icon}</div>
          <div class="template-card-name">${t.name}</div>
          <div class="template-card-desc">${t.desc}</div>
          <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
            <span class="badge badge-normal" style="font-size:0.7rem">${t.type}</span>
          </div>
          <button class="btn btn-sm btn-primary" style="margin-top:12px;width:100%">Use Template →</button>
        </div>
      `).join('')}
    </div>

    <!-- Template Preview Section -->
    <div class="card mt-16">
      <div class="card-header"><div class="card-title">Template Reference Guide</div></div>
      <div class="accordion-item">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          🏗️ Land Allocation Request
          <span class="accordion-arrow">▼</span>
        </div>
        <div class="accordion-body">
          Use this template when applying to DCO, SDO, District Magistrate, or Revenue Department for land allocation for society projects such as Hyper Bazaar, Cold Storage, or Farmer Service Centre.
          <br/><br/>Key inclusions: Society registration details, land area requirement, proposed use, member benefit statement, and funding plan.
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          🧊 Cold Storage Proposal
          <span class="accordion-arrow">▼</span>
        </div>
        <div class="accordion-body">
          For formal proposals to Agriculture Department, NABARD, Cooperative Department, or District Administration for cold storage construction. Includes project overview, capacity, funding plan, and subsidy request.
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          🏪 Hyper Bazaar Proposal
          <span class="accordion-arrow">▼</span>
        </div>
        <div class="accordion-body">
          For establishing a modern vegetable marketing facility. Directed at District Magistrate, Housing Union, or Municipal/Urban Development bodies. Includes facility list, funding model, and rationale.
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          💰 Grant / Subsidy Request
          <span class="accordion-arrow">▼</span>
        </div>
        <div class="accordion-body">
          For requesting government grants under schemes like MIDH (Mission for Integrated Development of Horticulture), NHM (National Horticulture Mission), NABARD, or State Cooperative Development Fund.
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          🔍 Audit Response
          <span class="accordion-arrow">▼</span>
        </div>
        <div class="accordion-body">
          For responding to audit observations from the Cooperative Audit Wing, District Cooperative Officer, or any statutory auditor. Includes observation-by-observation response format.
        </div>
      </div>
    </div>
  `;
}

function useTemplate(id) {
  createLetterState.templateId = id;
  const tmpl = getTemplate(id);
  if (tmpl) createLetterState.letterType = tmpl.type;
  navigateTo('create-letter');
  showToast(`Template "${tmpl?.name}" selected`, 'success', 1800);
}

function toggleAccordion(header) {
  const item = header.closest('.accordion-item');
  const body = item.querySelector('.accordion-body');
  const isOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.accordion-item').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.accordion-body').classList.remove('open');
  });
  if (!isOpen) {
    item.classList.add('open');
    body.classList.add('open');
  }
}
