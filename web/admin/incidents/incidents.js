const SEVERITY_ORDER = {
    'Low': 1,
    'Medium': 2,
    'High': 3,
    'Critical': 4,
    'Unassigned': 0
};

let incidents = [];
let investigators = [];

async function loadData() {
    try {
        // Note: Initial load now triggers filter/sort automatically
        await applyFiltersAndSort();
    } catch (err) {
        console.error("Error loading data:", err);
    }
}

async function applyFiltersAndSort() {
    // 1. Gather current UI state
    const sortBy = document.getElementById('sortBy').value;
    const sortOrder = document.getElementById('sortOrder').value;

    const checkedSeverities = Array.from(document.querySelectorAll('.severity-checkboxes input:checked'))
                                  .map(cb => cb.value);

    const minDate = document.getElementById('minDate').value;
    const maxDate = document.getElementById('maxDate').value;

    // 2. Construct Query String
    const params = new URLSearchParams();
    params.append('sort_by', sortBy);
    params.append('sort_order', sortOrder);

    if (checkedSeverities.length > 0) {
        // FastAPI allows multiple values for the same key: ?severity=High&severity=Critical
        checkedSeverities.forEach(s => params.append('severity', s));
    }

    if (minDate) params.append('date_min', minDate);
    if (maxDate) params.append('date_max', maxDate);

    try {
        // 3. Fetch filtered and sorted data from backend
        incidents = await CIIS.getJSON(`/api/incidents?${params.toString()}`);
        investigators = await CIIS.getJSON('/api/investigators');
        renderTable(incidents);
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('incidentTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach(i => {
        let invOptions = `<option value="">Unassigned</option>`;
        investigators.forEach(inv => {
            invOptions += `<option value="${inv.investigator_id}" ${i.investigator_id === inv.investigator_id ? 'selected' : ''}>${inv.name} (${inv.specialization || 'General'})</option>`;
        });

        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="p-4 text-sm text-gray-600">${i.incident_id}</td>
                <td class="p-4 text-sm text-gray-600">${new Date(i.incident_date).toLocaleDateString()}</td>
                <td class="p-4 text-sm text-gray-800">${i.description}</td>
                <td class="p-4">
                    <select id="sev-${i.incident_id}" class="border p-1 rounded bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="Unassigned" ${!i.severity ? 'selected' : ''}>-- Select --</option>
                        <option value="Low" ${i.severity === 'Low' ? 'selected' : ''}>Low</option>
                        <option value="Medium" ${i.severity === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="High" ${i.severity === 'High' ? 'selected' : ''}>High</option>
                        <option value="Critical" ${i.severity === 'Critical' ? 'selected' : ''}>Critical</option>
                    </select>
                </td>
                <td class="p-4">
                    <select id="inv-${i.incident_id}" class="border p-1 rounded bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500">
                        ${invOptions}
                    </select>
                </td>
                <td class="p-4">
                    <button onclick="saveAssignment(${i.incident_id})" class="btn-action btn-save">Save</button>
                </td>
            </tr>
        `;
    });
}

async function saveAssignment(id) {
    const severity = document.getElementById(`sev-${id}`).value;
    const invId = document.getElementById(`inv-${id}`).value;

    try {
        await CIIS.putJSON(`/api/incidents/${id}/assign`, {
            severity: severity === 'Unassigned' ? null : severity,
            investigator_id: invId ? parseInt(invId) : null
        });
        alert('Updated successfully!');
        await applyFiltersAndSort();
    } catch (err) {
        alert('Error updating assignment: ' + err.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("currentAdmin")) {
        window.location.assign("/");
    }

    // Sort Listeners
    document.getElementById('sortBy').addEventListener('change', applyFiltersAndSort);
    document.getElementById('sortOrder').addEventListener('change', applyFiltersAndSort);

    // Severity Filter Listeners
    document.querySelectorAll('.severity-checkboxes input').forEach(cb => {
        cb.addEventListener('change', applyFiltersAndSort);
    });

    // Date Filter Listeners
    document.getElementById('minDate').addEventListener('change', applyFiltersAndSort);
    document.getElementById('maxDate').addEventListener('change', applyFiltersAndSort);

    // Slider listener (if implemented in HTML)
    const slider = document.getElementById('dateSlider');
    if (slider) {
        slider.addEventListener('input', applyFiltersAndSort);
    }

    loadData();
});
