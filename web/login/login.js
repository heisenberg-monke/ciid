document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    tabLogin.addEventListener('click', () => {
        tabLogin.className = "flex-1 py-2 text-center font-semibold border-b-2 border-blue-600 text-blue-600";
        tabSignup.className = "flex-1 py-2 text-center font-semibold border-b-2 border-transparent text-gray-500";
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    });

    tabSignup.addEventListener('click', () => {
        tabSignup.className = "flex-1 py-2 text-center font-semibold border-b-2 border-blue-600 text-blue-600";
        tabLogin.className = "flex-1 py-2 text-center font-semibold border-b-2 border-transparent text-gray-500";
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });

    // Handle Login Simulation (matches student email)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const res = await fetch('/api/students');
        const students = await res.json();
        const student = students.find(s => s.email === email);

        if (student) {
            localStorage.setItem('currentStudent', JSON.stringify(student));
            window.location.href = '/home';
        } else {
            alert('Student not found with this email. Please sign up.');
        }
    });

    // Handle Signup
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('signupName').value,
            email: document.getElementById('signupEmail').value,
            phone: document.getElementById('signupPhone').value,
            department: document.getElementById('signupDepartment').value
        };

        const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const newStudent = await res.json();
            localStorage.setItem('currentStudent', JSON.stringify(newStudent));
            window.location.href = '/home';
        } else {
            alert('Error creating account. Email might already be in use.');
        }
    });
});