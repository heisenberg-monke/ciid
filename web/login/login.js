
document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => document.getElementById(id);

    const roles = {
        student: {
            tab: $("tabStudent"),
            panel: $("studentContainer"),
        },
        investigator: {
            tab: $("tabInvestigator"),
            panel: $("investigatorContainer"),
        },
        admin: {
            tab: $("tabAdmin"),
            panel: $("adminContainer"),
        },
    };

    const message = $("formMessage");

    $("currentYear").textContent = new Date().getFullYear();

    // Display a message without using alert().
    function showMessage(text, type = "error") {
        message.textContent = text;
        message.className =
            type === "success"
                ? "form-message success"
                : "form-message";

        message.hidden = false;
    }

    function clearMessage() {
        message.textContent = "";
        message.hidden = true;
        message.className = "form-message";
    }

    // Parse API responses safely.
    async function readResponse(response) {
        const text = await response.text();

        if (!text) return null;

        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    }

    // POST JSON and handle network/API failures.
    async function postJSON(url, data) {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(
                result?.message ||
                result?.error ||
                `Request failed (${response.status}). Please try again.`
            );
        }

        return result;
    }

    // GET JSON.
    async function getJSON(url) {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
            },
        });

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(
                result?.message ||
                result?.error ||
                `Unable to contact the server (${response.status}).`
            );
        }

        if (!Array.isArray(result)) {
            throw new Error(
                "The server returned an unexpected response."
            );
        }

        return result;
    }

    // Prevent repeated submissions and restore buttons afterwards.
    async function submitWithButton(form, callback) {
        if (form.dataset.submitting === "true") return;

        const button = form.querySelector(
            'button[type="submit"]'
        );

        const originalText = button.textContent;

        form.dataset.submitting = "true";
        button.disabled = true;
        button.textContent = "Please wait...";

        clearMessage();

        try {
            await callback();
        } catch (error) {
            showMessage(
                error.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            delete form.dataset.submitting;
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    // Switch between Student, Investigator, and Admin.
    function switchRole(roleName) {
        clearMessage();

        Object.entries(roles).forEach(([name, role]) => {
            const active = name === roleName;

            role.tab.classList.toggle("active", active);
            role.tab.setAttribute(
                "aria-selected",
                String(active)
            );
            role.tab.tabIndex = active ? 0 : -1;

            role.panel.classList.toggle("hidden", !active);
            role.panel.hidden = !active;
        });

        // Each role starts on its login screen.
        if (roleName === "student") {
            switchAuth("student", "login");
        } else if (roleName === "investigator") {
            switchAuth("investigator", "login");
        }
    }

    Object.entries(roles).forEach(([roleName, role]) => {
        role.tab.addEventListener("click", () => {
            switchRole(roleName);
        });

        // Keyboard navigation for the role tabs.
        role.tab.addEventListener("keydown", (event) => {
            const roleNames = Object.keys(roles);
            const currentIndex = roleNames.indexOf(roleName);

            let nextIndex = currentIndex;

            if (event.key === "ArrowRight") {
                nextIndex = (currentIndex + 1) % roleNames.length;
            } else if (event.key === "ArrowLeft") {
                nextIndex =
                    (currentIndex - 1 + roleNames.length) %
                    roleNames.length;
            } else if (event.key === "Home") {
                nextIndex = 0;
            } else if (event.key === "End") {
                nextIndex = roleNames.length - 1;
            } else {
                return;
            }

            event.preventDefault();

            const nextRole = roles[roleNames[nextIndex]];
            nextRole.tab.focus();
            switchRole(roleNames[nextIndex]);
        });
    });

    // Switch between login and signup for Student/Investigator.
    function switchAuth(roleName, mode) {
        const isStudent = roleName === "student";
        const prefix = isStudent ? "student" : "investigator";

        const loginTab = $(`${prefix}LoginTab`);
        const signupTab = $(`${prefix}SignupTab`);
        const loginForm = $(`${prefix}LoginForm`);
        const signupForm = $(`${prefix}SignupForm`);
        const heading = $(`${prefix}Heading`);

        const showLogin = mode === "login";

        loginTab.classList.toggle("active", showLogin);
        signupTab.classList.toggle("active", !showLogin);

        loginTab.setAttribute(
            "aria-selected",
            String(showLogin)
        );
        signupTab.setAttribute(
            "aria-selected",
            String(!showLogin)
        );

        loginForm.classList.toggle("hidden", !showLogin);
        signupForm.classList.toggle("hidden", showLogin);

        heading.textContent = isStudent
            ? (showLogin ? "Student login" : "Create student account")
            : (showLogin
                ? "Investigator login"
                : "Create investigator account");

        clearMessage();
    }

    $("studentLoginTab").addEventListener("click", () => {
        switchAuth("student", "login");
    });

    $("studentSignupTab").addEventListener("click", () => {
        switchAuth("student", "signup");
    });

    $("investigatorLoginTab").addEventListener("click", () => {
        switchAuth("investigator", "login");
    });

    $("investigatorSignupTab").addEventListener("click", () => {
        switchAuth("investigator", "signup");
    });

    // STUDENT LOGIN
    $("studentLoginForm").addEventListener("submit", (event) => {
        event.preventDefault();

        submitWithButton(event.currentTarget, async () => {
            const email = $("studentLoginEmail").value
                .trim()
                .toLowerCase();

            const students = await getJSON("/api/students");

            const student = students.find(
                (item) =>
                    item.email?.trim().toLowerCase() === email
            );

            if (!student) {
                throw new Error(
                    "Student account not found. Please check your email or create an account."
                );
            }

            localStorage.setItem(
                "currentStudent",
                JSON.stringify(student)
            );

            window.location.assign("/student-home");
        });
    });

    // STUDENT SIGNUP
    $("studentSignupForm").addEventListener("submit", (event) => {
        event.preventDefault();

        submitWithButton(event.currentTarget, async () => {
            const data = {
                name: $("studentSignupName").value.trim(),
                email: $("studentSignupEmail").value.trim(),
                phone: $("studentSignupPhone").value.trim(),
                department: $("studentSignupDepartment").value.trim(),
            };

            const student = await postJSON("/api/students", data);

            if (!student) {
                throw new Error(
                    "The server did not return the new student account."
                );
            }

            localStorage.setItem(
                "currentStudent",
                JSON.stringify(student)
            );

            window.location.assign("/student-home");
        });
    });

    // INVESTIGATOR LOGIN
    $("investigatorLoginForm").addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            submitWithButton(event.currentTarget, async () => {
                const email = $("invLoginEmail").value
                    .trim()
                    .toLowerCase();

                const investigators = await getJSON(
                    "/api/investigators"
                );

                const investigator = investigators.find(
                    (item) =>
                        item.email?.trim().toLowerCase() === email
                );

                if (!investigator) {
                    throw new Error(
                        "Investigator account not found. Please check your email or create an account."
                    );
                }

                localStorage.setItem(
                    "currentInvestigator",
                    JSON.stringify(investigator)
                );

                window.location.assign("/investigator-home");
            });
        }
    );

    // INVESTIGATOR SIGNUP
    $("investigatorSignupForm").addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            submitWithButton(event.currentTarget, async () => {
                const data = {
                    staff_id: $("invStaffId").value.trim(),
                    name: $("invName").value.trim(),
                    email: $("invEmail").value.trim(),
                    specialization:
                        $("invSpecialization").value.trim(),
                };

                const investigator = await postJSON(
                    "/api/investigators",
                    data
                );

                if (!investigator) {
                    throw new Error(
                        "The server did not return the new investigator account."
                    );
                }

                localStorage.setItem(
                    "currentInvestigator",
                    JSON.stringify(investigator)
                );

                window.location.assign("/investigator-home");
            });
        }
    );

    // ADMIN LOGIN ONLY
    $("adminLoginForm").addEventListener("submit", (event) => {
        event.preventDefault();

        submitWithButton(event.currentTarget, async () => {
            const admin = await postJSON("/api/admin/login", {
                email: $("adminEmail").value.trim(),
                password: $("adminPassword").value,
            });

            if (!admin) {
                throw new Error(
                    "The server did not return an admin account."
                );
            }

            localStorage.setItem(
                "currentAdmin",
                JSON.stringify(admin)
            );

            window.location.assign("/admin-home");
        });
    });

    // Start on the Student login tab.
    switchRole("student");
});
