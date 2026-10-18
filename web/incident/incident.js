document.addEventListener('DOMContentLoaded', async () => {
    const student = JSON.parse(localStorage.getItem('currentStudent'));
    if (!student) {
        window.location.href = '/';
        return;
    }

    // Load Dropdowns
    try {
        const catRes = await fetch('/api/categories');
        const categories = await catRes.json();
        const catSelect = document.getElementById('incidentCategory');
        categories.forEach(c => {
            catSelect.innerHTML += `<option value="${c.category_id}">${c.category_name}</option>`;
        });

        const locRes = await fetch('/api/locations');
        const locations = await locRes.json();
        const locSelect = document.getElementById('incidentLocation');
        locations.forEach(l => {
            locSelect.innerHTML += `<option value="${l.location_id}">${l.building} - Room ${l.room_no}</option>`;
        });
    } catch (err) {
        console.error("Error loading dropdown data:", err);
    }

    // Handle Form Submit
    document.getElementById('incidentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            category_id: parseInt(document.getElementById('incidentCategory').value),
            location_id: parseInt(document.getElementById('incidentLocation').value),
            reported_by: student.student_id,
            incident_date: document.getElementById('incidentDate').value,
            severity: document.getElementById('incidentSeverity').value,
            description: document.getElementById('incidentDescription').value
        };

        const res = await fetch('/api/incidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert('Incident reported successfully!');
            window.location.href = '/home';
        } else {
            alert('Failed to submit incident.');
        }
    });

    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = '/home';
    });
});