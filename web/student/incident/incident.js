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

let incidents = [];
let investigators = [];

async function loadData() {
    const incRes = await fetch('/api/incidents');
    incidents = await incRes.json();
    
    const invRes = await fetch('/api/investigators');
    investigators = await invRes.json();

    renderTable(incidents);
}

function renderTable(data) {
    const tbody = document.getElementById('incidentTableBody');
    tbody.innerHTML = '';
    
    data.forEach(i => {
        let invOptions = `<option value="">Unassigned</option>`;
        investigators.forEach(inv => {
            invOptions += `<option value="${inv.investigator_id}">${inv.name} (${inv.specialization || 'General'})</option>`;
        });

        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 border-b">
                <td class="p-3">${i.incident_id}</td>
                <td class="p-3">${new Date(i.incident_date).toLocaleDateString()}</td>
                <td class="p-3">${i.description}</td>
                <td class="p-3">
                    <select id="sev-${i.incident_id}" class="border p-1 rounded bg-white">
                        <option value="Unassigned" ${!i.severity ? 'selected' : ''}>-- Select --</option>
                        <option value="Low" ${i.severity === 'Low' ? 'selected' : ''}>Low</option>
                        <option value="Medium" ${i.severity === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="High" ${i.severity === 'High' ? 'selected' : ''}>High</option>
                        <option value="Critical" ${i.severity === 'Critical' ? 'selected' : ''}>Critical</option>
                    </select>
                </td>
                <td class="p-3">
                    <select id="inv-${i.incident_id}" class="border p-1 rounded bg-white">
                        ${invOptions}
                    </select>
                </td>
                <td class="p-3">
                    <button onclick="saveAssignment(${i.incident_id})" class="bg-blue-600 text-white px-2 py-1 rounded text-xs">Save</button>
                </td>
            </tr>
        `;
    });
}

async function saveAssignment(id) {
    const severity = document.getElementById(`sev-${id}`).value;
    const invId = document.getElementById(`inv-${id}`).value;

    const res = await fetch(`/api/incidents/${id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            severity: severity === 'Unassigned' ? null : severity,
            investigator_id: invId ? parseInt(invId) : null
        })
    });

    if (res.ok) {
        alert('Updated successfully!');
        loadData();
    }
}

// Filter Function
document.getElementById('filterSeverity').addEventListener('change', (e) => {
    const val = e.target.value;
    const filtered = val ? incidents.filter(i => i.severity === val) : incidents;
    renderTable(filtered);
});

loadData();