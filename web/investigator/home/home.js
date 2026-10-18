document.addEventListener('DOMContentLoaded', () => {
    const invStr = localStorage.getItem('currentInvestigator');
    if (!invStr) {
        window.location.href = '/';
        return;
    }
    const investigator = JSON.parse(invStr);

    // Handle Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentInvestigator');
            window.location.href = '/';
        });
    }
});
