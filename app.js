(() => {
  "use strict";

  const API_URL = "https://api.usaspending.gov/api/v2/spending/";
  const DATA_SOURCE = "USAspending.gov Spending Explorer API";
  const amountInput = document.getElementById("amountInput");
  const amountRange = document.getElementById("amountRange");
  const breakdown = document.getElementById("breakdown");
  const dataStatus = document.getElementById("dataStatus");
  const fiscalYearPill = document.getElementById("fiscalYearPill");
  const dataAsOf = document.getElementById("dataAsOf");
  const resultTitle = document.getElementById("resultTitle");
  const refreshButton = document.getElementById("refreshButton");
  let spendingRows = [];
  let totalAmount = 0;
  let selectedFY = null;
  let selectedQuarter = null;
  let asOfDate = null;

  const money = (value) => new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);

  function setStatus(message, state = "") {
    dataStatus.className = "data-status " + state;
    dataStatus.replaceChildren();
    if (state !== "error" && state !== "success") {
      const spinner = document.createElement("span");
      spinner.className = "spinner";
      spinner.setAttribute("aria-hidden", "true");
      dataStatus.appendChild(spinner);
    }
    const text = document.createElement("span");
    text.textContent = message;
    dataStatus.appendChild(text);
  }

  async function requestQuarter(fy, quarter) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "budget_function",
        filters: { fy: String(fy), quarter: String(quarter) }
      })
    });
    if (!response.ok) throw new Error(`USAspending returned HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.results) || !payload.results.length || !(Number(payload.total) > 0)) {
      throw new Error("No spending records returned for this period.");
    }
    return payload;
  }

  async function loadData() {
    setStatus("Loading the latest available federal spending data…");
    refreshButton.disabled = true;
    const now = new Date();
    // The federal fiscal year begins October 1. Try the current FY first,
    // then the preceding FY. API documentation notes a 45-day delay for a
    // complete quarter, so we fall back automatically if the latest is not ready.
    const currentFY = now.getUTCMonth() >= 9 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
    const candidates = [];
    for (const fy of [currentFY, currentFY - 1]) {
      for (const q of [4, 3, 2, 1]) candidates.push({ fy, q });
    }

    let lastError = null;
    for (const candidate of candidates) {
      try {
        const payload = await requestQuarter(candidate.fy, candidate.q);
        const rows = payload.results
          .filter(row => row && row.name && Number(row.amount) > 0)
          .map(row => ({ name: row.name, amount: Number(row.amount), code: row.code || "" }))
          .sort((a, b) => b.amount - a.amount);
        if (!rows.length) throw new Error("No usable budget-function rows were returned.");
        spendingRows = rows;
        totalAmount = Number(payload.total);
        selectedFY = candidate.fy;
        selectedQuarter = candidate.q;
        asOfDate = payload.end_date || null;
        fiscalYearPill.textContent = `FY ${selectedFY} · Q${selectedQuarter}`;
        dataAsOf.textContent = asOfDate ? `Data through ${asOfDate}` : "Period data loaded";
        setStatus(`${DATA_SOURCE} loaded successfully.`, "success");
        renderBreakdown();
        return;
      } catch (error) {
        lastError = error;
      }
    }
    spendingRows = [];
    totalAmount = 0;
    fiscalYearPill.textContent = "Data unavailable";
    dataAsOf.textContent = "Could not retrieve data";
    setStatus("We couldn't load the official dataset right now. Please try refreshing, or use the source links below.", "error");
    breakdown.innerHTML = '<div class="empty-state">No figures are shown rather than inventing estimates. Check your connection or open USAspending.gov directly.</div>';
    console.error("Unable to load USAspending data:", lastError);
  }

  function renderBreakdown() {
    if (!spendingRows.length || !(totalAmount > 0)) return;
    const amount = Math.max(0.01, Math.min(1000000000, Number(amountInput.value) || 1));
    resultTitle.textContent = `How ${money(amount)} is distributed`;
    breakdown.replaceChildren();

    spendingRows.forEach(row => {
      const share = row.amount / totalAmount;
      const allocated = amount * share;
      const line = document.createElement("div");
      line.className = "breakdown-row";

      const name = document.createElement("div");
      name.className = "breakdown-name";
      name.textContent = row.name;

      const track = document.createElement("div");
      track.className = "bar-track";
      track.setAttribute("role", "img");
      track.setAttribute("aria-label", `${row.name}: ${(share * 100).toFixed(2)} percent`);
      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.width = `${Math.max(0, Math.min(100, share * 100))}%`;
      track.appendChild(fill);

      const value = document.createElement("div");
      value.className = "breakdown-value";
      value.textContent = money(allocated);
      const shareLabel = document.createElement("span");
      shareLabel.className = "breakdown-share";
      shareLabel.textContent = `${(share * 100).toFixed(2)}% of reported total`;
      value.appendChild(shareLabel);

      line.append(name, track, value);
      breakdown.appendChild(line);
    });
  }

  function syncAmount(value, fromRange = false) {
    const parsed = Math.max(0.01, Math.min(1000000000, Number(value) || 1));
    amountInput.value = String(parsed);
    if (!fromRange) amountRange.value = String(Math.min(10000, Math.max(1, parsed)));
    document.querySelectorAll(".quick-amount").forEach(button => {
      button.classList.toggle("active", Number(button.dataset.amount) === parsed);
    });
    renderBreakdown();
  }

  amountInput.addEventListener("input", () => syncAmount(amountInput.value));
  amountRange.addEventListener("input", () => syncAmount(amountRange.value, true));
  document.querySelectorAll(".quick-amount").forEach(button => {
    button.addEventListener("click", () => syncAmount(button.dataset.amount));
  });
  refreshButton.addEventListener("click", loadData);
  syncAmount(1);
  loadData();
})();