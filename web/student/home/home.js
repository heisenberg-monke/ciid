document.addEventListener('DOMContentLoaded', () => {
    const studentStr = localStorage.getItem('currentStudent');
    if (!studentStr) {
        window.location.href = '/';
        return;
    }

    let student;
    try {
        student = JSON.parse(studentStr);
    } catch (e) {
        localStorage.removeItem('currentStudent');
        window.location.href = '/';
        return;
    }

    // Personalise welcome
    const heading = document.getElementById('welcomeHeading');
    const msg     = document.getElementById('welcomeMsg');
    if (heading && student.name) {
        heading.textContent = `Welcome back, ${student.name.split(' ')[0]}.`;
    }
    if (msg && student.department) {
        msg.textContent = `${student.department} · Report and track campus incidents.`;
    }

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('currentStudent');
        window.location.href = '/';
    });
});
