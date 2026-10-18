const SEVERITY_ORDER = {
    'Low': 1,
    'Medium': 2,
    'High': 3,
    'Critical': 4,
    'Unassigned': 0
};

let incidents        = [];
let investigators    = [];
let dateBounds       = { min: null, max: null };
let currentSortBy    = 'incident_id';
let currentSortOrder = 'asc';

// ── Date helpers ─────────────────────────────────────────────────────────────

function formatDate(date, forInput = false) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return forInput ? `${year}-${month}-${day}` : `${year}/${month}/${day}`;
}

function updateDateRangeFromSliders() {
    if (!dateBounds.min || !dateBounds.max) return;
    const minVal   = parseFloat(document.getElementById('minDateSlider').value);
    const maxVal   = parseFloat(document.getElementById('maxDateSlider').value);
    const minBound = new Date(dateBounds.min);
    const maxBound = new Date(dateBounds.max);
    const totalMs  = maxBound.getTime() - minBound.getTime();
    const currentMin = new Date(minBound.getTime() + (minVal / 100) * totalMs);
    const currentMax = new Date(minBound.getTime() + (maxVal / 100) * totalMs);

    const minStrFormatted = formatDate(currentMin);
    const maxStrFormatted = formatDate(currentMax);

    const minInput  = document.getElementById('minDate');
    const maxInput  = document.getElementById('maxDate');
    const minNative = document.getElementById('minDateNative');
    const maxNative = document.getElementById('maxDateNative');

    if (minInput)  minInput.value  = minStrFormatted;
    if (maxInput)  maxInput.value  = maxStrFormatted;
    if (minNative) minNative.value = formatDate(currentMin, true);
    if (maxNative) maxNative.value = formatDate(currentMax, true);

    const minLabel = document.getElementById('minDateLabel');
    const maxLabel = document.getElementById('maxDateLabel');
    if (minLabel) minLabel.textContent = minStrFormatted;
    if (maxLabel) maxLabel.textContent = maxStrFormatted;

    const highlight = document.getElementById('sliderTrackHighlight');
    if (highlight) {
        highlight.style.left = `${Math.min(minVal, maxVal)}%`;
        highlight.style.width = `${Math.abs(maxVal - minVal)}%`;
    }
}

function syncSlidersFromDateInputs() {
    if (!dateBounds.min || !dateBounds.max) return;
    const minBound = new Date(dateBounds.min).getTime();
    const maxBound = new Date(dateBounds.max).getTime();
    const totalMs  = maxBound - minBound;
    if (totalMs <= 0) return;

    const minRaw = document.getElementById('minDate')?.value.trim().replace(/\//g, '-');
    const maxRaw = document.getElementById('maxDate')?.value.trim().replace(/\//g, '-');

    if (minRaw) {
        const d = new Date(minRaw);
        if (!isNaN(d.getTime())) {
            const pct = Math.max(0, Math.min(100, ((d.getTime() - minBound) / totalMs) * 100));
            const slider = document.getElementById('minDateSlider');
            if (slider) slider.value = pct;
        }
    }
    if (maxRaw) {
        const d = new Date(maxRaw);
        if (!isNaN(d.getTime())) {
            const pct = Math.max(0, Math.min(100, ((d.getTime() - minBound) / totalMs) * 100));
            const slider = document.getElementById('maxDateSlider');
            if (slider) slider.value = pct;
        }
    }

    const minVal = parseFloat(document.getElementById('minDateSlider')?.value || 0);
    const maxVal = parseFloat(document.getElementById('maxDateSlider')?.value || 100);
    const highlight = document.getElementById('sliderTrackHighlight');
    if (highlight) {
        highlight.style.left = `${Math.min(minVal, maxVal)}%`;
        highlight.style.width = `${Math.abs(maxVal - minVal)}%`;
    }
}

// ── Sort header indicators ───────────────────────────────────────────────────

function updateSortIndicators() {
    document.querySelectorAll('th.sortable').forEach(th => {
        const field = th.dataset.sort;
        const indicator = th.querySelector('.sort-indicator');
        if (field === currentSortBy) {
            th.classList.add('active');
            if (indicator) {
                indicator.textContent = currentSortOrder === 'asc' ? '▲' : '▼';
            }
        } else {
            th.classList.remove('active');
            if (indicator) {
                indicator.textContent = '↕';
            }
        }
    });
}

// ── Data loading ──────────────────────────────────────────────────────────────

async function loadData() {
    try {
        const bounds = await CIIS.getJSON('/api/incidents/bounds');
        dateBounds = bounds;
        updateDateRangeFromSliders();

        // Populate investigator checkboxes (allows any combination like severity)
        investigators = await CIIS.getJSON('/api/investigators');
        const container = document.getElementById('investigatorCheckboxes');
        if (container) {
            container.innerHTML = `
                <label class="checkbox-label"><input type="checkbox" value="unassigned" checked> Unassigned</label>
            `;
            investigators.forEach(inv => {
                const label = document.createElement('label');
                label.className = 'checkbox-label';
                label.innerHTML = `<input type="checkbox" value="${inv.investigator_id}" checked> ${inv.name}`;
                container.appendChild(label);
            });
        }

        updateSortIndicators();
        await applyFiltersAndSort();
    } catch (err) {
        console.error('Error loading data:', err);
    }
}

// ── Filter + fetch ────────────────────────────────────────────────────────────

async function applyFiltersAndSort() {
    const checkedSeverities = Array.from(
        document.querySelectorAll('.severity-checkboxes input:checked')
    ).map(cb => cb.value);

    const allInvCbs = document.querySelectorAll('#investigatorCheckboxes input');
    const checkedInvestigators = Array.from(
        document.querySelectorAll('#investigatorCheckboxes input:checked')
    ).map(cb => cb.value);

    const minDateRaw = document.getElementById('minDate')?.value.trim();
    const maxDateRaw = document.getElementById('maxDate')?.value.trim();

    const params = new URLSearchParams();
    if (currentSortBy)    params.append('sort_by', currentSortBy);
    if (currentSortOrder) params.append('sort_order', currentSortOrder);

    checkedSeverities.forEach(s => params.append('severity', s));
    if (minDateRaw) params.append('date_min', minDateRaw.replace(/\//g, '-'));
    if (maxDateRaw) params.append('date_max', maxDateRaw.replace(/\//g, '-'));

    if (allInvCbs.length > 0) {
        if (checkedInvestigators.length === 0) {
            // Nothing checked -> match none
            params.append('investigator_id', '__none__');
        } else if (checkedInvestigators.length < allInvCbs.length) {
            // Partial combination checked
            checkedInvestigators.forEach(id => params.append('investigator_id', id));
        }
    }

    try {
        incidents = await CIIS.getJSON(`/api/incidents?${params.toString()}`);
        renderTable(incidents);
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

// ── Table rendering ───────────────────────────────────────────────────────────

function renderTable(data) {
    const tbody = document.getElementById('incidentTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No incidents found matching the filters.</td></tr>';
        return;
    }

    data.forEach(i => {
        // Use == (loose equality) so numeric API id matches string option value
        let invOptions = `<option value="">Unassigned</option>`;
        investigators.forEach(inv => {
            invOptions += `<option value="${inv.investigator_id}" ${i.investigator_id == inv.investigator_id ? 'selected' : ''}>${inv.name} (${inv.specialization || 'General'})</option>`;
        });

        tbody.innerHTML += `
            <tr>
                <td>${i.incident_id}</td>
                <td>${formatDate(new Date(i.incident_date))}</td>
                <td class="desc-cell">${i.description}</td>
                <td>
                    <select id="sev-${i.incident_id}" class="inline-select">
                        <option value=""       ${!i.severity                ? 'selected' : ''}>-- Select --</option>
                        <option value="Low"    ${i.severity === 'Low'       ? 'selected' : ''}>Low</option>
                        <option value="Medium" ${i.severity === 'Medium'    ? 'selected' : ''}>Medium</option>
                        <option value="High"   ${i.severity === 'High'      ? 'selected' : ''}>High</option>
                        <option value="Critical" ${i.severity === 'Critical'? 'selected' : ''}>Critical</option>
                    </select>
                </td>
                <td>
                    <select id="inv-${i.incident_id}" class="inline-select">
                        ${invOptions}
                    </select>
                </td>
                <td>
                    <button onclick="saveAssignment(${i.incident_id})" class="btn-action btn-save">Save</button>
                </td>
            </tr>
        `;
    });
}

// ── Save assignment ───────────────────────────────────────────────────────────

async function saveAssignment(id) {
    const severity = document.getElementById(`sev-${id}`).value;
    const invId    = document.getElementById(`inv-${id}`).value;
    try {
        await CIIS.putJSON(`/api/incidents/${id}/assign`, {
            severity:       severity || null,
            investigator_id: invId ? parseInt(invId) : null,
        });
        await applyFiltersAndSort();
    } catch (err) {
        alert('Error updating assignment: ' + err.message);
    }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('currentAdmin')) {
        window.location.assign('/');
    }

    // Accordion filter columns — one-at-a-time toggle
    document.querySelectorAll('.filter-col-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const expanded = trigger.getAttribute('aria-expanded') === 'true';
            const panel    = document.getElementById(trigger.getAttribute('aria-controls'));

            // Close any currently open panel
            document.querySelectorAll('.filter-col-trigger[aria-expanded="true"]').forEach(other => {
                if (other !== trigger) {
                    other.setAttribute('aria-expanded', 'false');
                    document.getElementById(other.getAttribute('aria-controls')).hidden = true;
                    other.closest('.filter-col').classList.remove('open');
                }
            });

            trigger.setAttribute('aria-expanded', String(!expanded));
            panel.hidden = expanded;
            trigger.closest('.filter-col').classList.toggle('open', !expanded);
        });
    });

    // Close panels when clicking outside the filter bar
    document.addEventListener('click', e => {
        if (!e.target.closest('.filter-col')) {
            document.querySelectorAll('.filter-col-trigger[aria-expanded="true"]').forEach(t => {
                t.setAttribute('aria-expanded', 'false');
                document.getElementById(t.getAttribute('aria-controls')).hidden = true;
                t.closest('.filter-col').classList.remove('open');
            });
        }
    });

    // Auto-apply filters when checkboxes change
    document.querySelector('.severity-checkboxes')?.addEventListener('change', applyFiltersAndSort);
    document.getElementById('investigatorCheckboxes')?.addEventListener('change', applyFiltersAndSort);

    // Sorting via clickable column headers
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (currentSortBy === field) {
                // Toggle between ascending and descending
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortBy = field;
                currentSortOrder = 'asc';
            }
            updateSortIndicators();
            applyFiltersAndSort();
        });
    });

    // Wire custom date inputs with calendar picker buttons (showing YYYY/MM/DD)
    function wireDateInput(textInputId, calBtnId, nativeInputId, labelId) {
        const textInput   = document.getElementById(textInputId);
        const calBtn      = document.getElementById(calBtnId);
        const nativeInput = document.getElementById(nativeInputId);
        const label       = document.getElementById(labelId);

        if (!textInput || !nativeInput) return;

        if (calBtn) {
            calBtn.addEventListener('click', (e) => {
                e.preventDefault();
                try {
                    nativeInput.showPicker();
                } catch {
                    nativeInput.focus();
                }
            });
        }

        nativeInput.addEventListener('change', () => {
            if (nativeInput.value) {
                const formatted = nativeInput.value.replace(/-/g, '/');
                textInput.value = formatted;
                if (label) label.textContent = formatted;
                syncSlidersFromDateInputs();
                applyFiltersAndSort();
            }
        });

        textInput.addEventListener('change', () => {
            let val = textInput.value.trim();
            if (val) {
                val = val.replace(/-/g, '/');
                textInput.value = val;
                if (label) label.textContent = val;
                nativeInput.value = val.replace(/\//g, '-');
            }
            syncSlidersFromDateInputs();
            applyFiltersAndSort();
        });

        textInput.addEventListener('input', () => {
            let val = textInput.value.trim();
            if (val.length === 10) {
                val = val.replace(/-/g, '/');
                textInput.value = val;
                if (label) label.textContent = val;
                nativeInput.value = val.replace(/\//g, '-');
                syncSlidersFromDateInputs();
                applyFiltersAndSort();
            }
        });
    }

    wireDateInput('minDate', 'minDateCalBtn', 'minDateNative', 'minDateLabel');
    wireDateInput('maxDate', 'maxDateCalBtn', 'maxDateNative', 'maxDateLabel');

    // Date slider triggers and clicking/dragging anywhere on the track bar
    const minSlider = document.getElementById('minDateSlider');
    const maxSlider = document.getElementById('maxDateSlider');
    const sliderContainer = document.getElementById('sliderContainer');

    if (minSlider && maxSlider) {
        minSlider.addEventListener('input', () => {
            if (parseFloat(minSlider.value) > parseFloat(maxSlider.value)) {
                minSlider.value = maxSlider.value;
            }
            updateDateRangeFromSliders();
        });
        maxSlider.addEventListener('input', () => {
            if (parseFloat(maxSlider.value) < parseFloat(minSlider.value)) {
                maxSlider.value = minSlider.value;
            }
            updateDateRangeFromSliders();
        });
        minSlider.addEventListener('change', applyFiltersAndSort);
        maxSlider.addEventListener('change', applyFiltersAndSort);
    }

    if (sliderContainer && minSlider && maxSlider) {
        sliderContainer.addEventListener('pointerdown', (e) => {
            // If user clicked directly on one of the range thumbs, let native drag proceed
            if (e.target.classList.contains('date-slider')) {
                return;
            }

            const rect = sliderContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));

            const minVal = parseFloat(minSlider.value);
            const maxVal = parseFloat(maxSlider.value);

            let activeSlider;
            if (pct < minVal) {
                activeSlider = minSlider;
            } else if (pct > maxVal) {
                activeSlider = maxSlider;
            } else {
                const distMin = Math.abs(pct - minVal);
                const distMax = Math.abs(pct - maxVal);
                activeSlider = distMin <= distMax ? minSlider : maxSlider;
            }

            activeSlider.value = pct;
            updateDateRangeFromSliders();
            applyFiltersAndSort();

            const onPointerMove = (moveEvent) => {
                const moveX = moveEvent.clientX - rect.left;
                const movePct = Math.max(0, Math.min(100, (moveX / rect.width) * 100));
                if (activeSlider === minSlider) {
                    activeSlider.value = Math.min(movePct, parseFloat(maxSlider.value));
                } else {
                    activeSlider.value = Math.max(movePct, parseFloat(minSlider.value));
                }
                updateDateRangeFromSliders();
            };

            const onPointerUp = () => {
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
                applyFiltersAndSort();
            };

            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        });
    }

    loadData();
});
