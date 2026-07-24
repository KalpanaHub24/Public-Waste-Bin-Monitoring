/* ===========================================================
   Bin Watch — script.js
   Loads data.json, renders the list view (search + filter),
   and the detail view (with the derived "days since emptied"
   figure). Handles loading / empty / error states throughout.
   =========================================================== */

let allReadings = [];   // full dataset, loaded once
let currentView = "list";

// ---------- DOM references ----------
const searchInput   = document.getElementById("search-input");
const wardFilter     = document.getElementById("ward-filter");
const statusFilter   = document.getElementById("status-filter");
const resultCount    = document.getElementById("result-count");
const loadingState   = document.getElementById("loading-state");
const emptyState     = document.getElementById("empty-state");
const errorState     = document.getElementById("error-state");
const tableWrap       = document.getElementById("table-wrap");
const binsTbody       = document.getElementById("bins-tbody");
const listView        = document.getElementById("list-view");
const detailView      = document.getElementById("detail-view");
const detailContent   = document.getElementById("detail-content");
const backBtn         = document.getElementById("back-btn");
const lastUpdatedEl   = document.getElementById("last-updated");

// ---------- Load data ----------
async function loadData() {
  showState("loading");
  try {
    const res = await fetch("data.json");
    if (!res.ok) throw new Error("Network response was not OK");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      // Data file loaded but is empty — that's a legitimate empty state,
      // not an error.
      allReadings = [];
      populateWardFilter([]);
      renderList();
      lastUpdatedEl.textContent = "No data available";
      return;
    }

    allReadings = data;
    populateWardFilter(allReadings);
    renderList();
    lastUpdatedEl.textContent = "Loaded " + allReadings.length + " readings";
  } catch (err) {
    // Covers "no data.json found" AND "network / offline" cases so the
    // screen never fails silently — Task 5 requires this.
    console.error("Failed to load data.json:", err);
    showState("error");
  }
}

function populateWardFilter(readings) {
  const wards = [...new Set(readings.map(r => r.ward))].sort();
  wardFilter.innerHTML = '<option value="">All wards</option>';
  wards.forEach(w => {
    const opt = document.createElement("option");
    opt.value = w;
    opt.textContent = w;
    wardFilter.appendChild(opt);
  });
}

// ---------- Status classification ----------
// A single place that decides what "OK / filling up / needs collection /
// flagged" means, so the list and detail view always agree.
function classify(reading) {
  const fill = reading.fill_pct;

  if (fill === null || fill === undefined || fill === "") {
    return { key: "flagged", label: "No reading" };
  }
  if (fill < 0 || fill > 100) {
    return { key: "flagged", label: "Implausible (" + fill + "%)" };
  }
  if (fill >= 85) return { key: "critical", label: "Needs collection" };
  if (fill >= 60) return { key: "warning", label: "Filling up" };
  return { key: "ok", label: "OK" };
}

// ---------- Filtering ----------
function getFilteredReadings() {
  const query = searchInput.value.trim().toLowerCase();
  const ward = wardFilter.value;
  const status = statusFilter.value;

  return allReadings.filter(r => {
    const matchesQuery =
      !query ||
      r.bin_id.toLowerCase().includes(query) ||
      r.ward.toLowerCase().includes(query);

    const matchesWard = !ward || r.ward === ward;

    const matchesStatus = !status || classify(r).key === status;

    return matchesQuery && matchesWard && matchesStatus;
  });
}

// ---------- Render: list view ----------
function renderList() {
  const filtered = getFilteredReadings();

  resultCount.textContent =
    "Showing " + filtered.length + " of " + allReadings.length + " records";

  if (allReadings.length === 0) {
    showState("empty-no-data");
    return;
  }
  if (filtered.length === 0) {
    showState("empty");
    return;
  }
  showState("table");

  binsTbody.innerHTML = "";
  filtered
    .slice()
    .sort((a, b) => (b.fill_pct ?? -1) - (a.fill_pct ?? -1)) // most urgent first
    .forEach(r => {
      const status = classify(r);
      const tr = document.createElement("tr");
      tr.tabIndex = 0;
      tr.setAttribute("role", "button");
      tr.setAttribute("aria-label", "Open details for " + r.bin_id);

      const safeFill = (r.fill_pct === null || r.fill_pct === undefined || r.fill_pct === "")
        ? 0
        : Math.max(0, Math.min(100, r.fill_pct));

      const fillDisplay = (r.fill_pct === null || r.fill_pct === undefined || r.fill_pct === "")
        ? "—"
        : r.fill_pct + "%";

      tr.innerHTML = `
        <td class="bin-id">${r.bin_id}</td>
        <td>${r.ward}</td>
        <td>
          <div class="gauge-cell">
            <div class="gauge-track">
              <div class="gauge-fill ${status.key}" style="width:${safeFill}%"></div>
            </div>
            <span class="gauge-label">${fillDisplay}</span>
          </div>
        </td>
        <td class="recorded-at">${r.recorded_at}</td>
        <td class="chevron">
          <span class="badge ${status.key}">${status.label}</span>
        </td>
      `;
      tr.addEventListener("click", () => openDetail(r.reading_id));
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail(r.reading_id);
        }
      });
      binsTbody.appendChild(tr);
    });
}

// ---------- Render: detail view ----------
function openDetail(readingId) {
  const r = allReadings.find(x => x.reading_id === readingId);
  if (!r) return;

  currentView = "detail";
  listView.hidden = true;
  detailView.hidden = false;

  const status = classify(r);

  // Derived figure: days since the bin was last emptied.
  const lastEmptiedDate = new Date(r.last_emptied.replace(" ", "T"));
  const now = new Date();
  const daysSince = Math.floor((now - lastEmptiedDate) / (1000 * 60 * 60 * 24));
  const daysDisplay = isNaN(daysSince) ? "—" : daysSince;

  let flagNote = "";
  if (status.key === "flagged") {
    flagNote = `<div class="flag-note">⚠ This reading is flagged: ${status.label}.
      It has been excluded from the fill-level gauge and should be
      re-checked rather than acted on directly.</div>`;
  }

  detailContent.innerHTML = `
    <div class="detail-card">
      <div class="derived-figure">
        <span class="value">${daysDisplay}</span>
        <span class="label">day${daysDisplay === 1 ? "" : "s"} since last emptied</span>
      </div>

      <div class="detail-heading">
        <h2>${r.bin_id}</h2>
        <span class="badge ${status.key}">${status.label}</span>
      </div>

      <div class="detail-grid">
        <div class="detail-field"><div class="k">Reading ID</div><div class="v">${r.reading_id}</div></div>
        <div class="detail-field"><div class="k">Ward</div><div class="v">${r.ward}</div></div>
        <div class="detail-field"><div class="k">Fill level</div><div class="v">${r.fill_pct === null || r.fill_pct === undefined || r.fill_pct === "" ? "No reading" : r.fill_pct + "%"}</div></div>
        <div class="detail-field"><div class="k">Last emptied</div><div class="v">${r.last_emptied}</div></div>
        <div class="detail-field"><div class="k">Recorded at</div><div class="v">${r.recorded_at}</div></div>
      </div>

      ${flagNote}
    </div>
  `;
}

function closeDetail() {
  currentView = "list";
  detailView.hidden = true;
  listView.hidden = false;
}

// ---------- State switcher ----------
function showState(state) {
  loadingState.hidden = state !== "loading";
  errorState.hidden = state !== "error";
  emptyState.hidden = !(state === "empty" || state === "empty-no-data");
  tableWrap.hidden = state !== "table";

  if (state === "empty-no-data") {
    emptyState.textContent = "No bin readings available yet.";
  } else if (state === "empty") {
    emptyState.textContent = "No readings match your search or filters.";
  }
}

// ---------- Events ----------
searchInput.addEventListener("input", renderList);     // live, no button needed
wardFilter.addEventListener("change", renderList);
statusFilter.addEventListener("change", renderList);
backBtn.addEventListener("click", closeDetail);

// ---------- Boot ----------
loadData();
