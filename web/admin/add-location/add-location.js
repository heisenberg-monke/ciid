async function postJSON(url, data) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
}

async function getJSON(url) {
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
}

async function deleteResource(url) {
    const response = await fetch(url, { method: "DELETE" });
    if (!response.ok) throw new Error(`Delete failed (${response.status})`);
    return response.json();
}

async function fetchAndRenderLocations() {
    const tbody = document.getElementById("locationTbody");
    const empty = document.getElementById("locationEmpty");
    if (!tbody) return;

    try {
        const locations = await getJSON("/api/locations");
        if (!locations || locations.length === 0) {
            tbody.innerHTML = "";
            empty.classList.remove("hidden");
            return;
        }
        empty.classList.add("hidden");
        tbody.innerHTML = locations.map(loc => `
            <tr data-id="${loc.location_id}">
                <td>${loc.building}</td>
                <td>${loc.room_no}</td>
                <td>${loc.location_type}</td>
                <td class="action-cell">
                    <button class="delete-btn" data-id="${loc.location_id}" title="Delete location">
                        🗑 Delete
                    </button>
                </td>
            </tr>
        `).join("");
    } catch (err) {
        console.error("Error fetching locations:", err);
        tbody.innerHTML = `<tr><td colspan="4" class="error-cell">Error loading locations: ${err.message}</td></tr>`;
        empty.classList.add("hidden");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("locationForm");
    const message = document.getElementById("formMessage");
    const btn = document.getElementById("submitBtn");
    const tbody = document.getElementById("locationTbody");

    if (!localStorage.getItem("currentAdmin")) {
        window.location.assign("/");
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        btn.disabled = true;
        message.className = "form-message hidden";

        try {
            const data = {
                building: document.getElementById("building").value.trim(),
                room_no: document.getElementById("roomNo").value.trim(),
                location_type: document.getElementById("locationType").value,
            };
            await postJSON("/api/locations", data);

            message.textContent = "Location created successfully!";
            message.className = "form-message success";
            form.reset();
            await fetchAndRenderLocations();
        } catch (err) {
            message.textContent = err.message;
            message.className = "form-message error";
        } finally {
            btn.disabled = false;
        }
    });

    // Event delegation — one listener handles all delete buttons
    tbody.addEventListener("click", async (e) => {
        const btn = e.target.closest(".delete-btn");
        if (!btn) return;

        const id = btn.dataset.id;
        if (!confirm("Delete this location? This cannot be undone.")) return;

        btn.disabled = true;
        try {
            await deleteResource(`/api/locations/${id}`);
            await fetchAndRenderLocations();
        } catch (err) {
            alert(`Failed to delete: ${err.message}`);
            btn.disabled = false;
        }
    });

    fetchAndRenderLocations();
});
