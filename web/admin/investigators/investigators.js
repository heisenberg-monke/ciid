async function getJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
}

async function deleteJSON(url) {
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
}

async function loadInvestigators() {
    try {
        const investigators = await getJSON('/api/investigators');
        const tbody = document.getElementById('investigatorTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        investigators.forEach(inv => {
            tbody.innerHTML += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="p-4 text-sm text-gray-600">${inv.investigator_id}</td>
                    <td class="p-4 text-sm text-gray-800 font-medium">${inv.name}</td>
                    <td class="p-4 text-sm text-gray-600">${inv.email}</td>
                    <td class="p-4 text-sm text-gray-600">${inv.specialization || 'General'}</td>
                    <td class="p-4 text-right">
                        <button onclick="deleteInvestigator(${inv.investigator_id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error loading investigators:", err);
    }
}

async function deleteInvestigator(id) {
    if (!confirm("Are you sure you want to delete this investigator account?")) return;

    try {
        await deleteJSON(`/api/investigators/${id}`);
        alert('Investigator deleted successfully');
        loadInvestigators();
    } catch (err) {
        alert('Error deleting investigator: ' + err.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("currentAdmin")) {
        window.location.assign("/");
    }
    loadInvestigators();
});
