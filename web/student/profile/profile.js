// ── Auth guard ────────────────────────────────────────────────────────────────
const studentStr = localStorage.getItem('currentStudent');
if (!studentStr) {
    if (localStorage.getItem('currentInvestigator')) {
        window.location.replace('/investigator/profile');
    } else {
        window.location.assign('/');
    }
}
const student = studentStr ? JSON.parse(studentStr) : {};

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name) {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

// ── Populate static profile fields ────────────────────────────────────────────
function populateProfile() {
    document.getElementById('navUser').textContent        = student.name || student.email;
    document.getElementById('avatarInitials').textContent = initials(student.name);
    document.getElementById('profileName').textContent    = student.name || '—';
    document.getElementById('profileDepartment').textContent =
        student.department ? `${student.department} Department` : 'Student';

    document.getElementById('detStudentId').textContent   = student.student_id ? `#${student.student_id}` : '—';
    document.getElementById('detFullName').textContent    = student.name || '—';
    document.getElementById('detEmail').textContent       = student.email || '—';
    document.getElementById('detPhone').textContent       = student.phone || 'Not provided';
    document.getElementById('detDepartment').textContent  = student.department || '—';
}

// ── Load reporting activity summary ───────────────────────────────────────────
async function loadSummary() {
    try {
        const reports = await CIIS.getJSON(`/api/students/${student.student_id}/incidents`);

        const total      = reports.length;
        const open       = reports.filter(r => !r.status || r.status === 'Open').length;
        const inProgress = reports.filter(r => r.status === 'In Progress').length;
        const resolved   = reports.filter(r => ['Resolved', 'Closed'].includes(r.status)).length;

        document.getElementById('sumTotal').textContent      = total;
        document.getElementById('sumOpen').textContent       = open;
        document.getElementById('sumInProgress').textContent = inProgress;
        document.getElementById('sumResolved').textContent   = resolved;
    } catch (err) {
        ['sumTotal', 'sumOpen', 'sumInProgress', 'sumResolved'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '—';
        });
    }
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    populateProfile();
    loadSummary();
});
