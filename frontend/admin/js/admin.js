/* ==========================================================================
   GIULIVO ADMIN — login + gestione prenotazioni
   API_BASE_URL è definita in ../js/config.js (caricato prima di questo file).
   ========================================================================== */

const TOKEN_KEY = 'giulivo_admin_token';
const ADMIN_KEY = 'giulivo_admin_info';

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function getAdmin() {
  try { return JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null'); }
  catch { return null; }
}
function setSession(token, admin) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}
function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

function todayISORome() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
}

function formatDateDisplay(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (res.status === 401) {
    clearSession();
    window.location.href = 'index.html';
    throw new Error('Sessione scaduta.');
  }
  return res;
}

/* --------------------------------------------------------------------------
   LOGIN PAGE
   -------------------------------------------------------------------------- */
function initLoginPage() {
  const form = document.querySelector('#login-form');
  if (!form) return;

  // Se è già loggato, vai dritto alla dashboard.
  if (getToken()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const errorBox = document.querySelector('#login-error');
  const submitBtn = document.querySelector('#login-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.remove('is-visible');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Accesso in corso…';

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.value.trim(),
          password: form.password.value,
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || 'Accesso non riuscito.');
      }

      setSession(body.token, body.admin);
      window.location.href = 'dashboard.html';
    } catch (err) {
      errorBox.textContent = err.message || 'Accesso non riuscito. Controlla email e password.';
      errorBox.classList.add('is-visible');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Accedi';
    }
  });
}

/* --------------------------------------------------------------------------
   DASHBOARD PAGE
   -------------------------------------------------------------------------- */
function initDashboardPage() {
  const tbody = document.querySelector('#reservations-tbody');
  if (!tbody) return;

  if (!getToken()) {
    window.location.href = 'index.html';
    return;
  }

  const admin = getAdmin();
  const whoEl = document.querySelector('#admin-who');
  if (whoEl && admin) whoEl.textContent = admin.name || admin.email;

  document.querySelector('#logout-btn')?.addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });

  const STATUS_LABELS = { pending: 'Da confermare', confirmed: 'Confermata', declined: 'Rifiutata', completed: 'Completata' };

  function renderRows(reservations) {
    if (!reservations.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nessuna prenotazione trovata.</td></tr>`;
      return;
    }
    tbody.innerHTML = reservations.map(r => `
      <tr data-id="${r.id}">
        <td>${formatDateDisplay(r.reservation_date)}</td>
        <td>${r.reservation_time}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${r.party_size}</td>
        <td>
          <div>${escapeHtml(r.phone)}</div>
          <div style="color:var(--oliva-light); font-size:0.8rem;">${escapeHtml(r.email)}</div>
        </td>
        <td class="notes-cell">${escapeHtml(r.notes || '—')}</td>
        <td><span class="status-badge ${r.status}">${STATUS_LABELS[r.status] || r.status}</span></td>
        <td>
          <div class="row-actions">
            ${r.status !== 'confirmed' ? `<button data-action="confirmed">Conferma</button>` : ''}
            ${r.status !== 'declined' ? `<button data-action="declined">Rifiuta</button>` : ''}
            ${r.status !== 'completed' ? `<button data-action="completed">Completa</button>` : ''}
            <button data-action="delete" class="danger">Elimina</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderStats(reservations) {
    const today = todayISORome();
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);
    const weekAheadISO = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(weekAhead);

    const todayCount = reservations.filter(r => r.reservation_date === today).length;
    const pendingCount = reservations.filter(r => r.status === 'pending').length;
    const weekCount = reservations.filter(r => r.reservation_date >= today && r.reservation_date <= weekAheadISO).length;

    document.querySelector('#stat-today').textContent = todayCount;
    document.querySelector('#stat-pending').textContent = pendingCount;
    document.querySelector('#stat-week').textContent = weekCount;
    document.querySelector('#stat-total').textContent = reservations.length;
  }

  async function loadStats() {
    try {
      const res = await apiFetch('/reservations');
      const body = await res.json();
      renderStats(body.reservations || []);
    } catch (err) {
      console.error('Errore caricando le statistiche:', err);
    }
  }

  async function loadTable() {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Caricamento prenotazioni…</td></tr>`;
    const status = document.querySelector('#filter-status').value;
    const from = document.querySelector('#filter-from').value;
    const to = document.querySelector('#filter-to').value;

    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    try {
      const res = await apiFetch(`/reservations?${params.toString()}`);
      const body = await res.json();
      renderRows(body.reservations || []);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Errore nel caricamento. Riprova.</td></tr>`;
    }
  }

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('tr');
    const id = row.dataset.id;
    const action = btn.dataset.action;

    if (action === 'delete') {
      if (!confirm('Eliminare definitivamente questa prenotazione?')) return;
      await apiFetch(`/reservations/${id}`, { method: 'DELETE' });
    } else {
      await apiFetch(`/reservations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: action }),
      });
    }
    loadTable();
    loadStats();
  });

  document.querySelector('#filter-apply').addEventListener('click', loadTable);
  document.querySelector('#filter-reset').addEventListener('click', () => {
    document.querySelector('#filter-status').value = '';
    document.querySelector('#filter-from').value = '';
    document.querySelector('#filter-to').value = '';
    loadTable();
  });

  loadStats();
  loadTable();
}

document.addEventListener('DOMContentLoaded', () => {
  initLoginPage();
  initDashboardPage();
});
