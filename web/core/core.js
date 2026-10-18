// Global helper utilities or state management can go here
const getCurrentStudent = () => {
    return JSON.parse(localStorage.getItem('currentStudent'));
};

const requireAuth = () => {
    const student = getCurrentStudent();
    if (!student && window.location.pathname !== '/') {
        window.location.href = '/';
    }
};