const SEVERITY_ORDER = {
    'Low': 1,
    'Medium': 2,
    'High': 3,
    'Critical': 4,
    'Unassigned': 0
};

let incidents = [];
let investigators = [];
let dateBounds = { min: null, max: null };

function formatDate(date, forInput = false) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    // HTML5 <input type="date"> REQUIREs yyyy-mm-dd format to display correctly
    if (forInput) {
        return `${year}-${month}-${day}`;
    }
    return `${year}/${month}/${day}`;
}

function updateDateRangeFromSliders() {
    if (!dateBounds.min || !dateBounds.max) return;

    const minVal = document.getElementById('minDateSlider').value;
    const maxVal = document.getElementById('maxDateSlider').value;

    const minBound = new Date(dateBounds.min);
    const maxBound = new Date(dateBounds.max);
    const totalMs = maxBound.getTime() - minBound.getTime();

    const currentMin = new Date(minBound.getTime() + (minVal / 100) * totalMs);
    const currentMax = new Date(minBound.getTime() + (maxVal / 100) * totalMs);

    const minStrInput = formatDate(currentMin, true);
    const maxStrInput = formatDate(currentMax, true);
    const minStrLabel = formatDate(currentMin);
    const maxStrLabel = formatDate(currentMax);

    document.getElementById('minDate').value = minStrInput;
    document.getElementById('maxDate').value = maxStrInput;
    document.getElementById('minDateLabel').textContent = minStrLabel;
    document.getElementById('maxDateLabel').textContent = maxStrLabel;
}

async function loadData() {
    try {
        const bounds = await CIIS.getJSON('/api/incidents/bounds');
        dateBounds = bounds;

        updateDateRangeFromSliders();
        await applyFiltersAndSort();
    } catch (err) {
        console.error("Error loading data:", err);
    }
}

async function applyFiltersAndSort() {
    const sortBy = document.getElementById('sortBy').value;
    const sortOrder = document.getElementById('sortOrder').value;

    const checkedSeverities = Array.from(document.querySelectorAll('.severity-checkboxes input:checked'))
                                  .map(cb => cb.value);

    const minDate = document.getElementById('minDate').value;
    const maxDate = document.getElementById('maxDate').value;

    const params = new URLSearchParams();
    params.append('sort_by', sortBy);
    params.append('sort_order', sortOrder);

    if (checkedSeverities.length > 0) {
        checkedSeverities.forEach(s => params.append('severity', s));
    }

    // Only send date filters if they are not empty
    if (minDate && minDate !== "") params.append('date_min', minDate);
    if (maxDate && maxDate !== "") params.append('date_max', maxDate);

    try {
        // Use the constructed params to fetch data
        const response = await CIIS.getJSON(`/api/incidents?${params.toString()}`);
        incidents = response;
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

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">No incidents found matching the filters.</td></tr>';
        return;
    }

    data.forEach(i => {
        let invOptions = `<option value="">Unassigned</option>`;
        investigators.forEach(inv => {
            invOptions += `<option value="${inv.investigator_id}" ${i.investigator_id === inv.investigator_id ? 'selected' : ''}>${inv.name} (${inv.specialization || 'General'})</option>`;
        });

        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="p-4 text-sm text-gray-600">${i.incident_id}</td>
                <td class="p-4 text-sm text-gray-600">${formatDate(new Date(i.incident_date))}</td>
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

    document.getElementById('applyFiltersBtn').addEventListener('click', applyFiltersAndSort);

    const minSlider = document.getElementById('minDateSlider');
    const maxSlider = document.getElementById('maxDateSlider');

    if (minSlider && maxSlider) {
        const handleSlider = () => {
            updateDateRangeFromSliders();
        };
        minSlider.addEventListener('input', handleSlider);
        maxSlider.addEventListener('input', handleSlider);
    }

    document.getElementById('minDate').addEventListener('change', applyFiltersAndSort);
    document.getElementById('maxDate').addEventListener('change', applyFiltersAndSort);

    loadData();
});
