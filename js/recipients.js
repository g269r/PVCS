/* ============================================================
   Recipient Management – PVCS DMS
   Three-part structured recipients:
     Designation + Organization + Location
   Stored as separate master lists in IndexedDB.
   Abbreviation engine drives ref number generation.
   ============================================================ */

// ---- Default master lists ----

const DEFAULT_DESIGNATIONS = [
  { name: 'District Cooperative Officer',    abbr: 'DCO'  },
  { name: 'Block Cooperative Officer',       abbr: 'BCO'  },
  { name: 'Registrar Cooperative Societies', abbr: 'RCS'  },
  { name: 'District Magistrate',             abbr: 'DM'   },
  { name: 'Sub Divisional Officer',          abbr: 'SDO'  },
  { name: 'Chief Executive Officer',         abbr: 'CEO'  },
  { name: 'Block Development Officer',       abbr: 'BDO'  },
  { name: 'Circle Officer',                  abbr: 'CO'   },
  { name: 'Sub Divisional Magistrate',       abbr: 'SDM'  },
  { name: 'Land Reform Deputy Collector',    abbr: 'LRDC' },
  { name: 'Managing Director',               abbr: 'MD'   },
  { name: 'Additional District Magistrate',  abbr: 'ADM'  },
  { name: 'Deputy Development Commissioner', abbr: 'DDC'  },
  { name: 'Agriculture Officer',             abbr: 'AO'   },
  { name: 'District Agriculture Officer',    abbr: 'DAO'  },
  { name: 'Horticulture Officer',            abbr: 'HO'   },
  { name: 'District Horticulture Officer',   abbr: 'DHO'  },
  { name: 'Collector',                       abbr: 'COL'  },
  { name: 'Director',                        abbr: 'DIR'  },
  { name: 'Joint Director',                  abbr: 'JD'   },
  { name: 'Deputy Director',                 abbr: 'DD'   },
  { name: 'General Manager',                 abbr: 'GM'   },
  { name: 'Secretary',                       abbr: 'SEC'  },
  { name: 'Chairman',                        abbr: 'CHR'  },
  { name: 'Vice Chairman',                   abbr: 'VCHR' },
  { name: 'President',                       abbr: 'PRES' },
  { name: 'Minister',                        abbr: 'MIN'  },
  { name: 'Principal Secretary',             abbr: 'PSEC' },
  { name: 'Special Secretary',               abbr: 'SSEC' },
  { name: 'Under Secretary',                 abbr: 'USEC' },
  { name: 'Divisional Commissioner',         abbr: 'DC'   },
  { name: 'Inspector General',               abbr: 'IG'   },
  { name: 'Nodal Officer',                   abbr: 'NO'   },
  { name: 'Project Director',                abbr: 'PD'   },
  { name: 'Chief Engineer',                  abbr: 'CE'   },
  { name: 'Executive Engineer',              abbr: 'EE'   },
  { name: 'Assistant Engineer',              abbr: 'AE'   },
  { name: 'Audit Officer',                   abbr: 'AUDR' },
  { name: 'Bank Manager',                    abbr: 'BM'   },
  { name: 'Branch Manager',                  abbr: 'BRM'  },
];

const DEFAULT_ORGANIZATIONS = [
  { name: 'Patna District Government',           abbr: 'PDG'   },
  { name: 'Government of Bihar',                  abbr: 'GOB'   },
  { name: 'Central Government',                   abbr: 'GOI'   },
  { name: 'Cooperative Department Bihar',         abbr: 'CDB'   },
  { name: 'Agriculture Department Bihar',         abbr: 'ADB'   },
  { name: 'Revenue Department Bihar',             abbr: 'RDB'   },
  { name: 'District Administration Patna',        abbr: 'DAP'   },
  { name: 'Housing Union',                        abbr: 'HU'    },
  { name: 'Harit Union',                          abbr: 'HRTU'  },
  { name: 'Bihar State Vegetable Federation',     abbr: 'BSVF'  },
  { name: 'NABARD',                               abbr: 'NABARD'},
  { name: 'Bihar State Cooperative Bank',         abbr: 'BSCB'  },
  { name: 'Land Reform Department Bihar',         abbr: 'LRD'   },
  { name: 'Horticulture Department Bihar',        abbr: 'HDB'   },
  { name: 'Bihar Rajya Sahkari Sahkari Sangh',    abbr: 'BRSS'  },
  { name: 'National Cooperative Development Corporation', abbr: 'NCDC' },
  { name: 'Bihar Cooperative Audit Department',   abbr: 'BCAD'  },
  { name: 'Patna Municipal Corporation',          abbr: 'PMC'   },
  { name: 'Bihar Urban Infrastructure Development', abbr: 'BUID'},
  { name: 'National Horticulture Mission',        abbr: 'NHM'   },
  { name: 'MIDH',                                 abbr: 'MIDH'  },
  { name: 'State Bank of India',                  abbr: 'SBI'   },
  { name: 'Bank of India',                        abbr: 'BOI'   },
  { name: 'Cooperative Society',                  abbr: 'CS'    },
];

const DEFAULT_LOCATIONS = [
  { name: 'Patna',          abbr: 'PATNA'  },
  { name: 'Patna Sadar',    abbr: 'PTNSR'  },
  { name: 'Patna District', abbr: 'PTNDT'  },
  { name: 'Bihar',          abbr: 'BIHAR'  },
  { name: 'New Delhi',      abbr: 'DELHI'  },
  { name: 'Phulwari Sharif',abbr: 'PHWSR'  },
  { name: 'Danapur',        abbr: 'DNAPR'  },
  { name: 'Fatuha',         abbr: 'FATUH'  },
  { name: 'Khagaul',        abbr: 'KHGL'   },
  { name: 'Bihta',          abbr: 'BIHTA'  },
  { name: 'Naubatpur',      abbr: 'NBTPR'  },
  { name: 'Maner',          abbr: 'MANER'  },
  { name: 'Masaurhi',       abbr: 'MSRHI'  },
  { name: 'Gaya',           abbr: 'GAYA'   },
  { name: 'Muzaffarpur',    abbr: 'MZFPR'  },
  { name: 'Bhagalpur',      abbr: 'BHGLP'  },
];

// ============================================================
// RecipientMaster – IndexedDB-backed master lists
// ============================================================

const RecipientMaster = {

  // ---- Internal helpers ----

  async _getList(key) {
    await openDB();
    const rec = await dbGet(STORES.SETTINGS, key);
    return rec ? rec.value : null;
  },

  async _saveList(key, list) {
    await openDB();
    await dbPut(STORES.SETTINGS, { key, value: list });
  },

  // ---- Designations ----

  async getDesignations() {
    const saved = await this._getList('rec_designations');
    if (saved) return saved;
    // First run – seed defaults
    await this._saveList('rec_designations', DEFAULT_DESIGNATIONS);
    return DEFAULT_DESIGNATIONS;
  },

  async saveDesignations(list) {
    await this._saveList('rec_designations', list);
  },

  async addDesignation(name, abbr) {
    const list = await this.getDesignations();
    const normalised = name.trim();
    if (!normalised) return;
    if (list.some(d => d.name.toLowerCase() === normalised.toLowerCase())) return; // no dup
    const autoAbbr = abbr ? abbr.trim().toUpperCase() : autoAbbreviate(normalised);
    list.push({ name: normalised, abbr: autoAbbr });
    list.sort((a, b) => a.name.localeCompare(b.name));
    await this.saveDesignations(list);
  },

  // ---- Organizations ----

  async getOrganizations() {
    const saved = await this._getList('rec_organizations');
    if (saved) return saved;
    await this._saveList('rec_organizations', DEFAULT_ORGANIZATIONS);
    return DEFAULT_ORGANIZATIONS;
  },

  async saveOrganizations(list) {
    await this._saveList('rec_organizations', list);
  },

  async addOrganization(name, abbr) {
    const list = await this.getOrganizations();
    const normalised = name.trim();
    if (!normalised) return;
    if (list.some(o => o.name.toLowerCase() === normalised.toLowerCase())) return;
    const autoAbbr = abbr ? abbr.trim().toUpperCase() : autoAbbreviate(normalised);
    list.push({ name: normalised, abbr: autoAbbr });
    list.sort((a, b) => a.name.localeCompare(b.name));
    await this.saveOrganizations(list);
  },

  // ---- Locations ----

  async getLocations() {
    const saved = await this._getList('rec_locations');
    if (saved) return saved;
    await this._saveList('rec_locations', DEFAULT_LOCATIONS);
    return DEFAULT_LOCATIONS;
  },

  async saveLocations(list) {
    await this._saveList('rec_locations', list);
  },

  async addLocation(name, abbr) {
    const list = await this.getLocations();
    const normalised = name.trim();
    if (!normalised) return;
    if (list.some(l => l.name.toLowerCase() === normalised.toLowerCase())) return;
    const autoAbbr = abbr ? abbr.trim().toUpperCase() : locationAbbr(normalised);
    list.push({ name: normalised, abbr: autoAbbr });
    list.sort((a, b) => a.name.localeCompare(b.name));
    await this.saveLocations(list);
  },

  // ---- Auto-persist new entries from a letter save ----
  async persistFromLetter(designation, organization, location) {
    if (designation) await this.addDesignation(designation);
    if (organization) await this.addOrganization(organization);
    if (location)     await this.addLocation(location);
  },

  // ---- Build recipient display string ----
  buildDisplayString(designation, organization, location) {
    // "The District Cooperative Officer\nPatna District Government\nPatna, Bihar"
    const parts = [];
    if (designation) parts.push(`The ${designation}`);
    if (organization) parts.push(organization);
    const locPart = [location, location && !location.toLowerCase().includes('bihar') ? 'Bihar' : ''].filter(Boolean).join(', ');
    if (locPart) parts.push(locPart);
    return parts.join('\n');
  },

  // ---- Build reference number segment for a recipient ----
  async buildRefSegment(designation, organization, location) {
    const desigs  = await this.getDesignations();
    const orgs    = await this.getOrganizations();
    const locs    = await this.getLocations();

    const desigEntry = desigs.find(d => d.name.toLowerCase() === (designation||'').toLowerCase());
    const orgEntry   = orgs.find(o => o.name.toLowerCase() === (organization||'').toLowerCase());
    const locEntry   = locs.find(l => l.name.toLowerCase() === (location||'').toLowerCase());

    const desigCode = desigEntry ? desigEntry.abbr : (designation ? autoAbbreviate(designation) : '');
    const orgCode   = orgEntry   ? orgEntry.abbr   : (organization ? autoAbbreviate(organization) : '');
    const locCode   = locEntry   ? locEntry.abbr   : (location ? locationAbbr(location) : '');

    // Build: DCO-PATNA  or  CEO-HU-PATNA  or  DM-GOB
    const parts = [desigCode, orgCode && orgCode !== desigCode ? orgCode : '', locCode]
      .filter(Boolean)
      .join('-')
      .toUpperCase()
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 20);

    return parts || 'RECIPIENT';
  },

  // ---- Legacy: convert old flat recipient string to ref segment ----
  legacyToRefSegment(recipientStr) {
    // Strip "The " prefix, collapse spaces to hyphens, uppercase, limit length
    return (recipientStr || '')
      .replace(/^The\s+/i, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 20) || 'RECIPIENT';
  },
};

// ============================================================
// Abbreviation helpers
// ============================================================

/**
 * Auto-generate abbreviation from a multi-word name.
 * Uses initials for common patterns, intelligent truncation otherwise.
 * e.g. "Chief Executive Officer" → "CEO"
 *      "Harit Union" → "HU"
 *      "National Horticulture Mission" → "NHM"
 */
function autoAbbreviate(name) {
  if (!name) return '';

  // Skip words that add no abbreviation value
  const SKIP = new Set(['of','the','and','for','a','an','to','in','at','by','on',
    'is','or','with','from','under','into','over','as','its','this','that','such']);

  const words = name.trim().split(/\s+/);
  const meaningful = words.filter(w => !SKIP.has(w.toLowerCase()));

  if (meaningful.length >= 2) {
    const initials = meaningful.map(w => w[0].toUpperCase()).join('');
    if (initials.length <= 6) return initials;
  }

  // Single word – take first 4 chars uppercased
  return (meaningful[0] || name).slice(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Abbreviate a location name for use in ref numbers.
 * e.g. "Patna Sadar" → "PTNSR", "New Delhi" → "DELHI", "Bihar" → "BIHAR"
 */
function locationAbbr(name) {
  if (!name) return '';
  const clean = name.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '');
  const words = clean.split(/\s+/);

  if (words.length === 1) {
    // Single word – up to 5 chars
    return words[0].slice(0, 5);
  }

  // Multi-word – consonant-compressed first word + initials of rest
  const first = words[0];
  const consonants = first.replace(/[AEIOU]/g, '');
  const rest = words.slice(1).map(w => w[0]).join('');
  const abbr = (consonants.slice(0, 3) + rest.slice(0, 2)).slice(0, 6);
  return abbr || clean.replace(/\s/g,'').slice(0, 5);
}

// ============================================================
// Three-Part Recipient UI Builder
// ============================================================

/**
 * Builds the structured 3-part recipient input panel.
 * Returns an object with getValue() that returns { designation, organization, location, displayString }.
 */
async function buildRecipientPanel(container, initial = {}) {
  const [desigs, orgs, locs] = await Promise.all([
    RecipientMaster.getDesignations(),
    RecipientMaster.getOrganizations(),
    RecipientMaster.getLocations(),
  ]);

  const desigNames = desigs.map(d => d.name);
  const orgNames   = orgs.map(o => o.name);
  const locNames   = locs.map(l => l.name);

  container.innerHTML = `
    <div class="recipient-panel">
      <div class="recipient-panel-row">
        <div class="form-group" style="flex:2;min-width:0">
          <label class="form-label" style="font-size:0.78rem;color:var(--text-muted)">Designation <span class="req">*</span></label>
          <div id="rp-desig-wrap" class="rp-ac-wrap"></div>
        </div>
        <div class="form-group" style="flex:2;min-width:0">
          <label class="form-label" style="font-size:0.78rem;color:var(--text-muted)">Organization / Department</label>
          <div id="rp-org-wrap" class="rp-ac-wrap"></div>
        </div>
        <div class="form-group" style="flex:1;min-width:0">
          <label class="form-label" style="font-size:0.78rem;color:var(--text-muted)">Location <span class="req">*</span></label>
          <div id="rp-loc-wrap" class="rp-ac-wrap"></div>
        </div>
      </div>
      <div id="rp-preview" class="rp-preview hidden"></div>
    </div>
  `;

  const state = {
    designation:  initial.designation  || '',
    organization: initial.organization || '',
    location:     initial.location     || '',
  };

  function updatePreview() {
    const preview = container.querySelector('#rp-preview');
    if (!state.designation && !state.location) { preview.classList.add('hidden'); return; }
    const display = RecipientMaster.buildDisplayString(state.designation, state.organization, state.location);
    preview.classList.remove('hidden');
    preview.innerHTML = `
      <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Recipient Preview</div>
      <div style="font-size:0.88rem;font-weight:600;color:var(--primary);white-space:pre-line;line-height:1.7">${escHtml(display)}</div>
    `;
  }

  buildAutoComplete(container.querySelector('#rp-desig-wrap'),  desigNames, initial.designation  || '', 'e.g. District Cooperative Officer', (v) => { state.designation  = v; updatePreview(); });
  buildAutoComplete(container.querySelector('#rp-org-wrap'),    orgNames,   initial.organization || '', 'e.g. Patna District Government',   (v) => { state.organization = v; updatePreview(); });
  buildAutoComplete(container.querySelector('#rp-loc-wrap'),    locNames,   initial.location     || '', 'e.g. Patna',                       (v) => { state.location     = v; updatePreview(); });

  updatePreview();

  return {
    getValue() {
      // Read live values from inputs
      state.designation  = container.querySelector('#rp-desig-wrap input')?.value.trim() || '';
      state.organization = container.querySelector('#rp-org-wrap input')?.value.trim()   || '';
      state.location     = container.querySelector('#rp-loc-wrap input')?.value.trim()   || '';
      return {
        designation:   state.designation,
        organization:  state.organization,
        location:      state.location,
        displayString: RecipientMaster.buildDisplayString(state.designation, state.organization, state.location),
      };
    },
  };
}

/**
 * Lightweight autocomplete widget for a single field.
 * Adds custom values on Enter / blur and shows matching suggestions.
 */
function buildAutoComplete(wrapper, items, initialValue, placeholder, onChange) {
  wrapper.innerHTML = `
    <div style="position:relative">
      <input type="text"
        class="form-control ac-input"
        placeholder="${escHtml(placeholder)}"
        autocomplete="off"
        value="${escHtml(initialValue)}"
        style="padding-right:28px"
      />
      <div class="ac-list" style="
        position:absolute;top:100%;left:0;right:0;
        background:#fff;border:1.5px solid var(--border);border-top:none;
        border-radius:0 0 6px 6px;max-height:200px;overflow-y:auto;
        z-index:60;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.1)
      "></div>
    </div>`;

  const input = wrapper.querySelector('.ac-input');
  const list  = wrapper.querySelector('.ac-list');

  function showList(filter) {
    const q = filter.toLowerCase();
    const matches = items.filter(i => i.toLowerCase().includes(q)).slice(0, 12);
    if (!matches.length && !filter) { list.style.display = 'none'; return; }

    let html = matches.map(m => `
      <div class="ac-item" style="padding:8px 12px;cursor:pointer;font-size:0.87rem;border-bottom:1px solid var(--border)">
        ${escHtml(m)}
      </div>`).join('');

    // Show "add new" option if typed value isn't already an exact match
    if (filter && !items.some(i => i.toLowerCase() === q)) {
      html += `<div class="ac-item ac-add" style="padding:8px 12px;cursor:pointer;font-size:0.82rem;color:var(--primary);border-top:1px solid var(--border)">
        + Use: "<strong>${escHtml(filter)}</strong>"
      </div>`;
    }

    list.innerHTML = html;
    list.style.display = 'block';
  }

  input.addEventListener('focus', () => showList(input.value));
  input.addEventListener('input', () => showList(input.value));

  list.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const item = e.target.closest('.ac-item');
    if (!item) return;
    const val = item.classList.contains('ac-add') ? input.value.trim() : item.textContent.trim();
    input.value = val;
    list.style.display = 'none';
    onChange(val);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); list.style.display = 'none'; onChange(input.value.trim()); }
    if (e.key === 'Escape') list.style.display = 'none';
    if (e.key === 'ArrowDown') {
      const first = list.querySelector('.ac-item');
      if (first) first.focus();
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => { list.style.display = 'none'; onChange(input.value.trim()); }, 150);
  });
}
