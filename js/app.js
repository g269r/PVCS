/* ============================================================
   Main App Controller – PVCS DMS
   ============================================================ */

const PAGE_TITLES = {
  'dashboard': 'Dashboard',
  'create-letter': 'Create New Letter',
  'archive': 'Letter Archive',
  'templates': 'Letter Templates',
  'bylaws': 'Bylaw Search',
  'backup': 'Backup & Restore',
  'settings': 'Settings',
};

const PAGE_RENDERERS = {
  'dashboard': renderDashboard,
  'create-letter': renderCreateLetter,
  'archive': renderArchive,
  'templates': renderTemplatesPage,
  'bylaws': renderBylawsPage,
  'backup': renderBackupPage,
  'settings': renderSettingsPage,
};

let currentPage = 'dashboard';

async function navigateTo(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  // Show target page
  const target = document.getElementById(`page-${pageId}`);
  if (!target) return;
  target.classList.add('active');
  target.scrollTop = 0;

  // Update nav
  const navLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (navLink) navLink.classList.add('active');

  // Update title
  document.getElementById('page-title').textContent = PAGE_TITLES[pageId] || pageId;
  document.title = `${PAGE_TITLES[pageId] || pageId} – PVCS DMS`;

  // Close sidebar on mobile
  closeSidebar();

  currentPage = pageId;

  // Render
  const renderer = PAGE_RENDERERS[pageId];
  if (renderer) {
    try {
      await renderer();
    } catch (err) {
      console.error(`Error rendering page ${pageId}:`, err);
      target.innerHTML = `<div class="card"><div style="color:var(--danger);padding:20px">
        <strong>Error loading page:</strong> ${escHtml(err.message)}
        <br/><button class="btn btn-outline mt-8" onclick="navigateTo('${pageId}')">Retry</button>
      </div></div>`;
    }
  }
}

// Sidebar toggle
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for DB
  try {
    await openDB();
  } catch (err) {
    console.error('DB init failed:', err);
  }

  // Load bylaws if previously indexed
  await loadBylawsIndex();

  // Nav click handlers
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.dataset.page;
      if (pageId) navigateTo(pageId);
    });
  });

  // Sidebar toggle
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    if (document.getElementById('sidebar').classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);

  // Modal close
  document.getElementById('modal-close').addEventListener('click', hideModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) hideModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });

  // Online/Offline
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // Hash routing
  function handleHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash && PAGE_RENDERERS[hash]) {
      navigateTo(hash);
    } else {
      navigateTo('dashboard');
    }
  }

  window.addEventListener('hashchange', handleHash);
  handleHash();
});
