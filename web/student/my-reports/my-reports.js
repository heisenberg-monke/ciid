// ── Auth guard ────────────────────────────────────────────────────────────────
const studentStr = localStorage.getItem('currentStudent');
if (!studentStr) window.location.assign('/');
const student = JSON.parse(studentStr);

// ── Cached lookups ────────────────────────────────────────────────────────────
let categories = [];
let locations  = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function severityBadge(sev) {
    if (!sev) return '<span class="badge badge-none">Pending Review</span>';
    const cls = {
        Low: 'badge-low',
        Medium: 'badge-medium',
        High: 'badge-high',
        Critical: 'badge-critical'
    };
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
    return l ? `${l.building} – Room ${l.room_no}` : `#${id}`;
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderReports(reports) {
    const tbody = document.getElementById('reportsBody');
    const countEl = document.getElementById('reportCount');

    if (!reports || reports.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state-cell">
                    <div class="empty-state-wrap">
                        <div class="empty-icon">📂</div>
                        <h3 class="empty-title">No Incident Reports Filed</h3>
                        <p class="empty-subtitle">You haven't reported any campus incidents yet.</p>
                        <a href="/incident" class="btn-primary-action">+ File Your First Report</a>
                    </div>
                </td>
            </tr>
        `;
        countEl.textContent = 'You have not submitted any reports yet.';
        document.getElementById('statOpen').textContent       = '0';
        document.getElementById('statInProgress').textContent = '0';
        document.getElementById('statResolved').textContent   = '0';
        document.getElementById('statTotal').textContent      = '0';
        return;
    }

    countEl.textContent = `You have filed ${reports.length} report${reports.length !== 1 ? 's' : ''}.`;

    // Stats calculations
    const open       = reports.filter(r => !r.status || r.status === 'Open').length;
    const inProgress = reports.filter(r => r.status === 'In Progress').length;
    const resolved   = reports.filter(r => ['Resolved', 'Closed'].includes(r.status)).length;

    document.getElementById('statOpen').textContent       = open;
    document.getElementById('statInProgress').textContent = inProgress;
    document.getElementById('statResolved').textContent   = resolved;
    document.getElementById('statTotal').textContent      = reports.length;

    tbody.innerHTML = reports.map(r => `
        <tr>
            <td><strong>#${r.incident_id}</strong></td>
            <td>${formatDate(r.incident_date)}</td>
            <td>${categoryName(r.category_id)}</td>
            <td>${locationLabel(r.location_id)}</td>
            <td class="desc-cell" title="${r.description}">${r.description}</td>
            <td>${severityBadge(r.severity)}</td>
            <td class="action-cell">${statusBadge(r.status)}</td>
        </tr>
    `).join('');
}

// ── Load data ─────────────────────────────────────────────────────────────────
async function loadData() {
    try {
        const reports = await CIIS.getJSON(`/api/students/${student.student_id}/incidents`);
        renderReports(reports);
    } catch (err) {
        document.getElementById('reportsBody').innerHTML = `
            <tr>
                <td colspan="7" class="empty-state-cell" style="color:var(--red);">
                    Error loading incident reports: ${err.message}
                </td>
            </tr>
        `;
    }
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Nav user
    document.getElementById('navUser').textContent = student.name || student.email;

    // Load lookups
    try {
        [categories, locations] = await Promise.all([
            CIIS.getJSON('/api/categories'),
            CIIS.getJSON('/api/locations'),
        ]);
    } catch (_) {
        // Non-fatal — labels fallback to IDs
    }

    await loadData();
});
