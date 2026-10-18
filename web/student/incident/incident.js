document.addEventListener('DOMContentLoaded', async () => {
    // ── Auth guard ────────────────────────────────────────────────
    const studentStr = localStorage.getItem('currentStudent');
    if (!studentStr) {
        window.location.href = '/';
        return;
    }
    const student = JSON.parse(studentStr);

    const msgEl = document.getElementById('formMessage');

    function showMsg(text, type = 'error') {
        msgEl.textContent = text;
        msgEl.className = `form-message ${type}`;
        msgEl.classList.remove('hidden');
        msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideMsg() {
        msgEl.classList.add('hidden');
    }

    // ── Back button ───────────────────────────────────────────────
    document.getElementById('backBtn')?.addEventListener('click', () => {
        window.location.href = '/student-home';
    });

    // ── Load dropdowns ────────────────────────────────────────────
    try {
        const [categories, locations] = await Promise.all([
            fetch('/api/categories').then(r => r.json()),
            fetch('/api/locations').then(r => r.json()),
        ]);

        const catSelect = document.getElementById('incidentCategory');
        categories.forEach(c => {
            catSelect.innerHTML += `<option value="${c.category_id}">${c.category_name}</option>`;
        });

        const locSelect = document.getElementById('incidentLocation');
        locations.forEach(l => {
            locSelect.innerHTML += `<option value="${l.location_id}">${l.building} – Room ${l.room_no}</option>`;
        });
    } catch (err) {
        showMsg('Failed to load form data. Please refresh the page.');
        console.error('Error loading dropdown data:', err);
    }

    function formatErrorDetail(detail) {
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) {
            return detail.map(d => `${d.loc ? d.loc.slice(1).join(' ') : ''}: ${d.msg}`.trim()).join('; ');
        }
        return 'Invalid data submitted.';
    }

    // ── Form submit ───────────────────────────────────────────────
    document.getElementById('incidentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMsg();

        if (!student.student_id) {
            showMsg('Student session invalid. Please log in again.');
            return;
        }

        const catVal  = document.getElementById('incidentCategory').value;
        const locVal  = document.getElementById('incidentLocation').value;
        const rawDate = document.getElementById('incidentDate').value;
        const desc    = document.getElementById('incidentDescription').value.trim();

        if (!catVal) {
            showMsg('Please select an incident category.');
            return;
        }
        if (!locVal) {
            showMsg('Please select an incident location.');
            return;
        }
        if (!rawDate) {
            showMsg('Please specify the date and time of the incident.');
            return;
        }
        if (!desc) {
            showMsg('Please provide a description of the incident.');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';

        // datetime-local gives "YYYY-MM-DDTHH:MM" — append seconds so the
        // Python datetime parser accepts it as a valid ISO 8601 string.
        const isoDate = rawDate.length === 16 ? rawDate + ':00' : rawDate;

        const data = {
            category_id:   parseInt(catVal, 10),
            location_id:   parseInt(locVal, 10),
            reported_by:   student.student_id,
            incident_date: isoDate,
            severity:      null,
            description:   desc,
        };

        try {
            const res = await fetch('/api/incidents', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(data),
            });

            if (res.ok) {
                showMsg('Incident reported successfully! Redirecting…', 'success');
                setTimeout(() => window.location.href = '/student-home', 1500);
            } else {
                const err = await res.json().catch(() => ({}));
                const errText = formatErrorDetail(err.detail) || res.statusText;
                showMsg(`Failed to submit: ${errText}`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Report';
            }
        } catch (err) {
            showMsg('Network error. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Report';
        }
    });
});