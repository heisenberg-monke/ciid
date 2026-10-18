// ── Auth guard ────────────────────────────────────────────────────────────────
const invStr = localStorage.getItem('currentInvestigator');
if (!invStr) window.location.assign('/');
const investigator = JSON.parse(invStr);

// ── Cached lookups ────────────────────────────────────────────────────────────
let categories = [];
let locations  = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function severityBadge(sev) {
    if (!sev) return '<span class="badge badge-none">Unset</span>';
    const cls = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high', Critical: 'badge-critical' };
    return `<span class="badge ${cls[sev] || 'badge-none'}">${sev}</span>`;
}

function statusBadge(st) {
    if (!st) return '<span class="status-badge status-open">Open</span>';
    const cls = {
        'Open':        'status-open',
        'In Progress': 'status-inprogress',
        'Resolved':    'status-resolved',
        'Closed':      'status-closed',
    };
    return `<span class="status-badge ${cls[st] || 'status-open'}">${st}</span>`;
}

function categoryName(id) {
    const c = categories.find(c => c.category_id == id);
    return c ? c.category_name : `#${id}`;
}

function locationLabel(id) {
    const l = locations.find(l => l.location_id == id);
    return l ? `${l.building} – ${l.room_no}` : `#${id}`;
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderTable(cases) {
    const tbody = document.getElementById('casesBody');
    const count = document.getElementById('caseCount');

    if (!cases.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-row">No cases assigned to you yet.</td></tr>`;
        count.textContent = 'You have no assigned cases.';
        return;
    }

    count.textContent = `You have ${cases.length} assigned case${cases.length !== 1 ? 's' : ''}.`;

    // Stats
    const open       = cases.filter(c => !c.investigation_status || c.investigation_status === 'Open').length;
    const inProgress = cases.filter(c => c.investigation_status === 'In Progress').length;
    const resolved   = cases.filter(c => ['Resolved', 'Closed'].includes(c.investigation_status)).length;

    document.getElementById('statOpen').textContent      = open;
    document.getElementById('statInProgress').textContent = inProgress;
    document.getElementById('statResolved').textContent  = resolved;
    document.getElementById('statTotal').textContent     = cases.length;

    tbody.innerHTML = cases.map(c => `
        <tr>
            <td><strong>#${c.incident_id}</strong></td>
            <td>${formatDate(c.incident_date)}</td>
            <td>${categoryName(c.category_id)}</td>
            <td>${locationLabel(c.location_id)}</td>
            <td class="desc-cell" title="${c.description}">${c.description}</td>
            <td>${severityBadge(c.severity)}</td>
            <td>${statusBadge(c.investigation_status)}</td>
            <td class="action-cell">
                <select class="status-select" id="status-${c.investigation_id}">
                    <option value="Open"        ${c.investigation_status === 'Open'        ? 'selected' : ''}>Open</option>
                    <option value="In Progress" ${c.investigation_status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Resolved"    ${c.investigation_status === 'Resolved'    ? 'selected' : ''}>Resolved</option>
                    <option value="Closed"      ${c.investigation_status === 'Closed'      ? 'selected' : ''}>Closed</option>
                </select>
                <button class="btn-save-status"
                        data-inv-id="${c.investigation_id}"
                        data-incident-id="${c.incident_id}">
                    Save
                </button>
            </td>
        </tr>
    `).join('');
}

// ── Update investigation status ───────────────────────────────────────────────
async function handleSave(invId, incidentId, btn) {
    const select = document.getElementById(`status-${invId}`);
    const newStatus = select.value;
    btn.disabled = true;
    try {
        await CIIS.putJSON(`/api/investigations/${invId}/status`, { status: newStatus });
        await loadCases(); // refresh full list so badges update
    } catch (err) {
        alert('Failed to update status: ' + err.message);
        btn.disabled = false;
    }
}

// ── Load data ─────────────────────────────────────────────────────────────────
async function loadCases() {
    try {
        const cases = await CIIS.getJSON(`/api/investigators/${investigator.investigator_id}/cases`);
        renderTable(cases);
    } catch (err) {
        document.getElementById('casesBody').innerHTML =
            `<tr><td colspan="8" class="empty-row" style="color:var(--red)">Error loading cases: ${err.message}</td></tr>`;
    }
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Nav user label
    document.getElementById('navUser').textContent = investigator.name || investigator.email;

    // Load supporting data, then cases
    try {
        [categories, locations] = await Promise.all([
            CIIS.getJSON('/api/categories'),
            CIIS.getJSON('/api/locations'),
        ]);
    } catch (_) {
        // Non-fatal — labels will fall back to IDs
    }

    await loadCases();

    // Event delegation for Save buttons
    document.getElementById('casesBody').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-save-status');
        if (!btn) return;
        handleSave(btn.dataset.invId, btn.dataset.incidentId, btn);
    });
});
