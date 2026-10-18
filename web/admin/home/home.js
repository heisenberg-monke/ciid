document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");

    // Check for admin session
    const admin = localStorage.getItem("currentAdmin");
    if (!admin) {
        window.location.assign("/");
    }

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("currentAdmin");
        window.location.assign("/");
    });
});
