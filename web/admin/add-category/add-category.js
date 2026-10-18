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
    console.log(`Fetching from: ${url}`);
    const response = await fetch(url);
    console.log(`Response status: ${response.status}`);
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    const data = await response.json();
    console.log(`Received data:`, data);
    return data;
}

async function fetchAndRenderCategories() {
    const listDiv = document.getElementById("categoryList");
    if (!listDiv) return;

    try {
        const categories = await getJSON("/api/categories");
        if (!categories || categories.length === 0) {
            listDiv.innerHTML = '<p class="text-muted text-center p-4">No categories found in database.</p>';
            return;
        }
        listDiv.innerHTML = categories.map(cat => `
            <div class="category-item">
                <div class="category-info">
                    <span class="cat-name">${cat.category_name}</span>
                    <span class="cat-desc">${cat.description || 'No description'}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Error fetching categories:", err);
        listDiv.innerHTML = `<p class="text-red-600 text-center p-4">Error loading categories: ${err.message}</p>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("categoryForm");
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
                category_name: document.getElementById("categoryName").value.trim(),
                description: document.getElementById("categoryDesc").value.trim(),
            };
            await postJSON("/api/categories", data);

            message.textContent = "Category created successfully!";
            message.className = "mt-4 text-center text-green-600 font-medium";
            message.classList.remove("hidden");
            form.reset();
            await fetchAndRenderCategories();
        } catch (err) {
            message.textContent = err.message;
            message.className = "mt-4 text-center text-red-600 font-medium";
            message.classList.remove("hidden");
        } finally {
            btn.disabled = false;
        }
    });

    fetchAndRenderCategories();
});
