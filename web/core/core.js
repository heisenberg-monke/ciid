/**
 * CIIS Common Utilities
 */
const CIIS = {
    // API Helpers
    async getJSON(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GET ${url} failed: ${response.status}`);
        return response.json();
    },

    async postJSON(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`POST ${url} failed: ${response.status}`);
        return response.json();
    },

    async putJSON(url, data) {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`PUT ${url} failed: ${response.status}`);
        return response.json();
    },

    async deleteJSON(url) {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) throw new Error(`DELETE ${url} failed: ${response.status}`);
        return response.json();
    },

    // Session Helpers
    session: {
        get(key) { return localStorage.getItem(key); },
        set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
        remove(key) { localStorage.removeItem(key); },
        clear() { localStorage.clear(); }
    },

    // UI Helpers
    ui: {
        showMsg(el, text, type = 'error') {
            if (!el) return;
            el.textContent = text;
            el.className = `form-message ${type}`;
            el.classList.remove('hidden');
        },
        hideMsg(el) {
            if (el) el.classList.add('hidden');
        }
    }
};
