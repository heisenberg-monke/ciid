async function postJSON(url, data) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("locationForm");
    const message = document.getElementById("formMessage");
    const btn = document.getElementById("submitBtn");

    if (!localStorage.getItem("currentAdmin")) {
        window.location.assign("/");
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        btn.disabled = true;
        message.classList.add("hidden");

        try {
            const data = {
                building: document.getElementById("building").value.trim(),
                room_no: document.getElementById("roomNo").value.trim(),
                location_type: document.getElementById("locationType").value,
            };
            await postJSON("/api/locations", data);

            message.textContent = "Location created successfully!";
            message.className = "mt-4 text-center text-green-600 font-medium";
            message.classList.remove("hidden");
            form.reset();
        } catch (err) {
            message.textContent = err.message;
            message.className = "mt-4 text-center text-red-600 font-medium";
            message.classList.remove("hidden");
        } finally {
            btn.disabled = false;
        }
    });
});
