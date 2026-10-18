// ── Auth guard ────────────────────────────────────────────────────────────────
const invStr = localStorage.getItem('currentInvestigator');
if (!invStr) {
    if (localStorage.getItem('currentStudent')) {
        window.location.replace('/student/profile');
    } else {
        window.location.assign('/');
    }
}
const investigator = invStr ? JSON.parse(invStr) : {};

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name) {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

// ── Populate static profile fields ────────────────────────────────────────────
function populateProfile() {
    document.getElementById('navUser').textContent        = investigator.name || investigator.email;
    document.getElementById('avatarInitials').textContent = initials(investigator.name);
    document.getElementById('profileName').textContent    = investigator.name || '—';
    document.getElementById('profileSpecialization').textContent =
        investigator.specialization || 'General';

    document.getElementById('detStaffId').textContent       = investigator.staff_id       || '—';
    document.getElementById('detEmail').textContent         = investigator.email           || '—';
    document.getElementById('detSpecialization').textContent = investigator.specialization || 'General';
    document.getElementById('detAvailability').textContent  = investigator.availability_status || 'Available';

    const pill = document.getElementById('availabilityPill');
    const avail = investigator.availability_status || 'Available';
    pill.textContent = avail;
    if (avail.toLowerCase() !== 'available') pill.classList.add('unavailable');
}

// ── Load case summary ─────────────────────────────────────────────────────────
async function loadSummary() {
    try {
        const cases = await CIIS.getJSON(`/api/investigators/${investigator.investigator_id}/cases`);

        const total      = cases.length;
        const open       = cases.filter(c => !c.investigation_status || c.investigation_status === 'Open').length;
        const inProgress = cases.filter(c => c.investigation_status === 'In Progress').length;
        const resolved   = cases.filter(c => ['Resolved', 'Closed'].includes(c.investigation_status)).length;

        document.getElementById('sumTotal').textContent      = total;
        document.getElementById('sumOpen').textContent       = open;
        document.getElementById('sumInProgress').textContent = inProgress;
        document.getElementById('sumResolved').textContent   = resolved;
    } catch (err) {
        ['sumTotal', 'sumOpen', 'sumInProgress', 'sumResolved'].forEach(id => {
            document.getElementById(id).textContent = '—';
        });
    }
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    populateProfile();
    loadSummary();
});
