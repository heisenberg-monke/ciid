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

async function fetchAndRenderCategories() {
    const tbody = document.getElementById("categoryTbody");
    const empty = document.getElementById("categoryEmpty");
    if (!tbody) return;

    try {
        const categories = await getJSON("/api/categories");
        if (!categories || categories.length === 0) {
            tbody.innerHTML = "";
            empty.classList.remove("hidden");
            return;
        }
        empty.classList.add("hidden");
        tbody.innerHTML = categories.map(cat => `
            <tr data-id="${cat.category_id}">
                <td>${cat.category_name}</td>
                <td>${cat.description || '<span class="text-muted">—</span>'}</td>
                <td class="action-cell">
                    <button class="delete-btn" data-id="${cat.category_id}" title="Delete category">
                        🗑 Delete
                    </button>
                </td>
            </tr>
        `).join("");
    } catch (err) {
        console.error("Error fetching categories:", err);
        tbody.innerHTML = `<tr><td colspan="3" class="error-cell">Error loading categories: ${err.message}</td></tr>`;
        empty.classList.add("hidden");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("categoryForm");
    const message = document.getElementById("formMessage");
    const btn = document.getElementById("submitBtn");
    const tbody = document.getElementById("categoryTbody");

    if (!localStorage.getItem("currentAdmin")) {
        window.location.assign("/");
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        btn.disabled = true;
        message.className = "form-message hidden";

        try {
            const data = {
                category_name: document.getElementById("categoryName").value.trim(),
                description: document.getElementById("categoryDesc").value.trim(),
            };
            await postJSON("/api/categories", data);

            message.textContent = "Category created successfully!";
            message.className = "form-message success";
            form.reset();
            await fetchAndRenderCategories();
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
        if (!confirm("Delete this category? This cannot be undone.")) return;

        btn.disabled = true;
        try {
            await deleteResource(`/api/categories/${id}`);
            await fetchAndRenderCategories();
        } catch (err) {
            alert(`Failed to delete: ${err.message}`);
            btn.disabled = false;
        }
    });

    fetchAndRenderCategories();
});
