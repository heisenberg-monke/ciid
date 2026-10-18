async function getJSON(url) {
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
}

async function deleteJSON(url) {
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
}

async function loadInvestigators() {
    const tbody = document.getElementById('investigatorTableBody');
    if (!tbody) return;

    try {
        const investigators = await getJSON('/api/investigators');
        if (!investigators || investigators.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No investigators found.</td></tr>';
            return;
        }

        tbody.innerHTML = investigators.map(inv => `
            <tr data-id="${inv.investigator_id}">
                <td>${inv.investigator_id}</td>
                <td><strong>${inv.name}</strong></td>
                <td>${inv.email}</td>
                <td>${inv.specialization || 'General'}</td>
                <td class="action-cell">
                    <button class="delete-btn" data-id="${inv.investigator_id}" title="Delete investigator">
                        🗑 Delete
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Error loading investigators:", err);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--red);padding:24px;">Error loading investigators: ${err.message}</td></tr>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("currentAdmin")) {
        window.location.assign("/");
    }

    const tbody = document.getElementById("investigatorTableBody");
    if (tbody) {
        tbody.addEventListener("click", async (e) => {
            const btn = e.target.closest(".delete-btn");
            if (!btn) return;

            const id = btn.dataset.id;
            if (!confirm("Are you sure you want to delete this investigator? This cannot be undone.")) return;

            btn.disabled = true;
            try {
                await deleteJSON(`/api/investigators/${id}`);
                await loadInvestigators();
            } catch (err) {
                alert('Error deleting investigator: ' + err.message);
                btn.disabled = false;
            }
        });
    }

    loadInvestigators();
});
