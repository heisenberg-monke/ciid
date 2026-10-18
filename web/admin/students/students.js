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

async function loadStudents() {
    try {
        const students = await getJSON('/api/students');
        const tbody = document.getElementById('studentTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        students.forEach(s => {
            tbody.innerHTML += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="p-4 text-sm text-gray-600">${s.student_id}</td>
                    <td class="p-4 text-sm text-gray-800 font-medium">${s.name}</td>
                    <td class="p-4 text-sm text-gray-600">${s.email}</td>
                    <td class="p-4 text-sm text-gray-600">${s.department}</td>
                    <td class="p-4 text-right">
                        <button onclick="deleteStudent(${s.student_id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error loading students:", err);
    }
}

async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student account?")) return;

    try {
        await deleteJSON(`/api/students/${id}`);
        alert('Student deleted successfully');
        loadStudents();
    } catch (err) {
        alert('Error deleting student: ' + err.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("currentAdmin")) {
        window.location.assign("/");
    }
    loadStudents();
});
