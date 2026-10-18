async function getJSON(url) {
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
}

async function deleteJSON(url) {
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Delete failed (${response.status})`);
    return response.json();
}

async function loadStudents() {
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    try {
        const students = await getJSON('/api/students');
        if (!students || students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No students found.</td></tr>';
            return;
        }

        tbody.innerHTML = students.map(s => `
            <tr data-id="${s.student_id}">
                <td>${s.student_id}</td>
                <td><strong>${s.name}</strong></td>
                <td>${s.email}</td>
                <td>${s.department}</td>
                <td class="action-cell">
                    <button class="delete-btn" data-id="${s.student_id}" title="Delete student">
                        🗑 Delete
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Error loading students:", err);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--red);padding:24px;">Error loading students: ${err.message}</td></tr>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("currentAdmin")) {
        window.location.assign("/");
    }

    const tbody = document.getElementById("studentTableBody");
    if (tbody) {
        tbody.addEventListener("click", async (e) => {
            const btn = e.target.closest(".delete-btn");
            if (!btn) return;

            const id = btn.dataset.id;
            if (!confirm("Are you sure you want to delete this student? This cannot be undone.")) return;

            btn.disabled = true;
            try {
                await deleteJSON(`/api/students/${id}`);
                await loadStudents();
            } catch (err) {
                alert('Error deleting student: ' + err.message);
                btn.disabled = false;
            }
        });
    }

    loadStudents();
});
