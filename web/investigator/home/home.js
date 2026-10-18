document.addEventListener('DOMContentLoaded', () => {
    const invStr = localStorage.getItem('currentInvestigator');
    if (!invStr) {
        window.location.href = '/';
        return;
    }
    const investigator = JSON.parse(invStr);

    // Personalise welcome
    const heading = document.getElementById('welcomeHeading');
    const msg     = document.getElementById('welcomeMsg');
    if (heading && investigator.name) {
        heading.textContent = `Welcome back, ${investigator.name.split(' ')[0]}.`;
    }
    if (msg && investigator.specialization) {
        msg.textContent = `${investigator.specialization} · Review and manage your active investigations.`;
    }

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('currentInvestigator');
        window.location.href = '/';
    });
});
