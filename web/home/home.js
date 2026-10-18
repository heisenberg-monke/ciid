document.addEventListener('DOMContentLoaded', () => {
    const student = JSON.parse(localStorage.getItem('currentStudent'));
    if (!student) {
        window.location.href = '/';
        return;
    }

    // Populate Account Modal Info
    document.getElementById('accName').textContent = student.name;
    document.getElementById('accEmail').textContent = student.email;
    document.getElementById('accDept').textContent = student.department;
    document.getElementById('accPhone').textContent = student.phone || 'N/A';

    // Account Modal Toggle
    const modal = document.getElementById('accountModal');
    document.getElementById('accountBtn').addEventListener('click', () => modal.classList.remove('hidden'));
    document.getElementById('closeModal').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('currentStudent');
        window.location.href = '/';
    });

    // Navigation buttons
    document.getElementById('reportIncidentBtn').addEventListener('click', () => {
        window.location.href = '/incident';
    });
});