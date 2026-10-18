function logout() {
    console.log("Executing logout...");
    localStorage.removeItem('currentStudent');
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Student home JS loaded");
    const studentStr = localStorage.getItem('currentStudent');

    if (!studentStr) {
        console.log("No session found, redirecting...");
        window.location.href = '/';
        return;
    }

    try {
        const student = JSON.parse(studentStr);
        console.log("Student session active:", student.name);
    } catch (e) {
        console.error("Failed to parse student session", e);
        localStorage.removeItem('currentStudent');
        window.location.href = '/';
    }
});
