/* Active Jobs listing page: live data from the "Jobs" Google Sheet */
const PAGE_SIZE = 12;
let ALL_JOBS = [];
let shown = PAGE_SIZE;

const els = {
  q: () => $("#f-q"), country: () => $("#f-country"), category: () => $("#f-category"), exp: () => $("#f-exp"),
};fun

function matches(j) {
    const q = els.q().value.trim().toLowerCase();
    const country = els.country().value;
    const cat = els.category().value;
    const exp = els.exp().value;

    // Job location filter
    const jobLocation =
        document.getElementById("filter-job-location")?.value || "all";

    // Search jobs
    if (
        q &&
        !`${j.title} ${j.description} ${j.role} ${j.code} ${j.category}`
            .toLowerCase()
            .includes(q)
    ) return false;

    // Country filter
    if (
        country &&
        j.country !== country &&
        !(country === "United Arab Emirates" && j.country === "UAE")
    ) return false;

    // Category filter
    if (cat && j.category !== cat) return false;

    // Local and overseas filter
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

function render() {
  const list = ALL_JOBS.filter(matches);
  const visible = list.slice(0, shown);
  $("#job-grid").innerHTML = visible.map(jobCardHTML).join("");
  $("#job-empty").hidden = list.length > 0;
  $("#load-more").hidden = list.length <= shown;
  const filtered = els.q().value || els.country().value || els.category().value || els.exp().value;
  $("#clear-filters").hidden = !filtered;
  $("#result-count").textContent = list.length === 1 ? "1 vacancy found" : `${list.length} vacancies found`;

  // keep the filters in the address bar so a filtered page can be shared
  const p = new URLSearchParams();
  [["q", els.q().value.trim()], ["country", els.country().value], ["category", els.category().value], ["exp", els.exp().value]]
    .forEach(([k, v]) => v && p.set(k, v));
  history.replaceState(null, "", p.toString() ? `?${p}` : location.pathname);
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  els.country().insertAdjacentHTML("beforeend", COUNTRY_LIST.map((c) => `<option>${esc(c)}</option>`).join(""));
  els.category().insertAdjacentHTML("beforeend", CATEGORY_LIST.map((c) => `<option>${esc(c)}</option>`).join(""));
  els.q().value = params.get("q") || "";
  els.country().value = params.get("country") || "";
  els.category().value = params.get("category") || "";
  els.exp().value = params.get("exp") || "";

  const { jobs, sample, failed } = await loadJobs();
  ALL_JOBS = jobs;
  $("#sample-banner").hidden = !sample;
  if (failed) { $("#result-count").textContent = "We could not load vacancies right now. Please try again shortly or message us on WhatsApp."; return; }

  // add any country/category from the sheet that is not in the default lists
  const extra = (key, sel) => [...new Set(jobs.map((j) => j[key]).filter(Boolean))]
    .filter((v) => ![...sel.options].some((o) => o.value === v || o.text === v))
    .forEach((v) => sel.insertAdjacentHTML("beforeend", `<option>${esc(v)}</option>`));
  extra("country", els.country()); extra("category", els.category());
  els.country().value = params.get("country") || ""; els.category().value = params.get("category") || "";

  render();

  $("#job-filter").addEventListener("submit", (e) => e.preventDefault());
  ["input", "change"].forEach((ev) => $("#job-filter").addEventListener(ev, () => { shown = PAGE_SIZE; render(); }));
  $("#load-more").addEventListener("click", () => { shown += PAGE_SIZE; render(); });
  $("#clear-filters").addEventListener("click", () => { $("#job-filter").reset(); shown = PAGE_SIZE; render(); els.q().focus(); });
});
