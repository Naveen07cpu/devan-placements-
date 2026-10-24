/* Devan Placements - Active Jobs Listing
   Live vacancies from Google Sheets
   Supports Local / Overseas filtering
*/

const PAGE_SIZE = 12;

let ALL_JOBS = [];
let shown = PAGE_SIZE;

const els = {
  q: () => $("#f-q"),
  country: () => $("#f-country"),
  category: () => $("#f-category"),
  exp: () => $("#f-exp"),
  location: () => document.getElementById("filter-job-location")
};

/* ---------- FILTER JOBS ---------- */

function matches(j) {

  const q = els.q().value.trim().toLowerCase();
  const country = els.country().value;
  const cat = els.category().value;
  const exp = els.exp().value;
  const jobLocation = els.location()?.value || "all";

  // Search by keyword
  if (
    q &&
    !`${j.title || ""} ${j.description || ""} ${j.role || ""}
       ${j.code || ""} ${j.category || ""}
       ${j.permitIndustry || ""} ${j.scope || ""}`
      .toLowerCase()
      .includes(q)
  ) {
    return false;
  }

  // Country filter
  if (country) {
    const selected = country.trim().toLowerCase();
    const actual = (j.country || "").trim().toLowerCase();

    const normalize = (value) =>
      ["uae", "united arab emirates"].includes(value)
        ? "uae"
        : value;

    if (normalize(selected) !== normalize(actual)) {
      return false;
    }
  }

  // Category filter
  if (cat && j.category !== cat) {
    return false;
  }

  // Local / Overseas filter
  const countryName = (j.country || "").trim().toLowerCase();

  if (jobLocation === "local" && countryName !== "india") {
    return false;
  }

  if (jobLocation === "overseas" && countryName === "india") {
    return false;
  }

  // Experience filter
  const m = Number(j.expMin) || 0;

  if (exp === "0-2" && m > 2) return false;

  if (exp === "3-5" && (m < 3 || m > 5)) return false;

  if (exp === "5+" && m < 5) return false;

  return true;
}

/* ---------- RENDER JOBS ---------- */

function render() {

  const list = ALL_JOBS.filter(matches);

  const visible = list.slice(0, shown);

  $("#job-grid").innerHTML =
    visible.map(jobCardHTML).join("");

  $("#job-empty").hidden = list.length > 0;

  $("#load-more").hidden = list.length <= shown;

  const filtered =
    els.q().value ||
    els.country().value ||
    els.category().value ||
    els.exp().value ||
    (els.location()?.value &&
      els.location().value !== "all");

  $("#clear-filters").hidden = !filtered;

  $("#result-count").textContent =
    list.length === 1
      ? "1 vacancy found"
      : `${list.length} vacancies found`;

  // Save selected filters in URL
  const p = new URLSearchParams();

  [
    ["q", els.q().value.trim()],
    ["country", els.country().value],
    ["category", els.category().value],
    ["exp", els.exp().value],
    ["location",
      els.location()?.value === "all"
        ? ""
        : els.location()?.value || ""]
  ].forEach(([key, value]) => {
    if (value) p.set(key, value);
  });

  history.replaceState(
    null,
    "",
    p.toString()
      ? `?${p.toString()}`
      : location.pathname
  );
}

/* ---------- INITIALIZE PAGE ---------- */

document.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(location.search);

  // Default countries
  els.country().insertAdjacentHTML(
    "beforeend",
    COUNTRY_LIST.map(
      c => `<option value="${esc(c)}">${esc(c)}</option>`
    ).join("")
  );

  // Default categories
  els.category().insertAdjacentHTML(
    "beforeend",
    CATEGORY_LIST.map(
      c => `<option value="${esc(c)}">${esc(c)}</option>`
    ).join("")
  );

  // Restore filters
  els.q().value = params.get("q") || "";
  els.country().value = params.get("country") || "";
  els.category().value = params.get("category") || "";
  els.exp().value = params.get("exp") || "";

  if (els.location()) {
    els.location().value = params.get("location") || "all";
  }

  /* ---------- LOAD GOOGLE SHEET JOBS ---------- */

  let data;

  try {
    data = await loadJobs();
  } catch (error) {
    console.error("Unable to load jobs:", error);
    $("#result-count").textContent =
      "Unable to load vacancies. Please try again.";
    return;
  }

  const { jobs = [], sample = false, failed = false } = data;

  ALL_JOBS = jobs;

  $("#sample-banner").hidden = !sample;

  if (failed) {
    $("#result-count").textContent =
      "We could not load vacancies right now. Please try again shortly or message us on WhatsApp.";
    return;
  }

  // Add countries/categories from Google Sheets
  const extra = (key, sel) => {

    [...new Set(
      jobs.map(j => j[key]).filter(Boolean)
    )]
      .filter(v =>
        ![...sel.options].some(
          o => o.value === v || o.text === v
        )
      )
      .forEach(v =>
        sel.insertAdjacentHTML(
          "beforeend",
          `<option value="${esc(v)}">${esc(v)}</option>`
        )
      );
  };

  extra("country", els.country());
  extra("category", els.category());

  els.country().value = params.get("country") || "";
  els.category().value = params.get("category") || "";

  render();

  /* ---------- FILTER EVENTS ---------- */

  $("#job-filter").addEventListener(
    "submit",
    e => e.preventDefault()
  );

  ["input", "change"].forEach(eventName => {

    $("#job-filter").addEventListener(
      eventName,
      () => {
        shown = PAGE_SIZE;
        render();
      }
    );

  });

  /* ---------- LOAD MORE ---------- */

  $("#load-more").addEventListener("click", () => {

    shown += PAGE_SIZE;

    render();

  });

  /* ---------- CLEAR FILTERS ---------- */

  $("#clear-filters").addEventListener("click", () => {

    $("#job-filter").reset();

    if (els.location()) {
      els.location().value = "all";
    }

    shown = PAGE_SIZE;

    render();

    els.q().focus();

  });

});
