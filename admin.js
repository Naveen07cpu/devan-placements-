/* Admin dashboard: talks to the Apps Script backend with the admin password.
   The password is only kept for this browser tab (sessionStorage) and is checked on the server. */
const PW_KEY = "dp_admin_pw";
let PW = "";
let JOBS = [];
let SUBS = { headers: [], rows: [], total: 0, type: "application" };

const FIELDS = [
  ["code", "Job code (leave empty to create it automatically)", "text", false, { ph: "e.g. JOB-010 or DP-QA-001" }],
  ["title", "Job title", "text", true],
  ["country", "Country", "text", true, { list: "country-list" }],
  ["category", "Category", "select", false, { options: CATEGORY_LIST, blank: "Choose category" }],
  ["vacancies", "Vacancies (number)", "number"],
  ["employer", "Employer name", "text"],
  ["showEmployer", "Show employer name on the website?", "select", false, { options: ["No", "Yes"] }],
  ["salary", "Salary", "text"],
  ["hours", "Working hours", "text", false, { ph: "e.g. 8 hours/day, 6 days/week" }],
  ["accommodation", "Accommodation", "text"],
  ["food", "Food", "text"],
  ["contract", "Contract terms", "text", false, { ph: "e.g. 2 years, renewable" }],
  ["eligibility", "Eligibility", "text"],
  ["education", "Education", "text"],
  ["ageLimit", "Age limit", "text", false, { ph: "e.g. 25 - 45" }],
  ["experience", "Experience (start with a number)", "text", false, { ph: "e.g. 3 - 5 Years" }],
  ["nature", "Nature of job", "text", false, { ph: "e.g. Full time, on-site" }],
  ["contactPerson", "Contact person", "text"],
  ["contactPhone", "Contact phone", "tel"],
  ["role", "Job role", "textarea"],
  ["scope", "Job scope", "textarea"],
  ["description", "Short description (shown on the job card)", "textarea"],
  ["status", "Status", "select", false, { options: ["Active", "Closed"] }],
];

/* ---------- helpers ---------- */
const adminCall = (action, extra = {}) => submitToSheet({ formType: "admin", action, password: PW, ...extra });

function toast(msg, isError) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast" + (isError ? " err" : "");
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 5000);
}

function showView(loggedIn) {
  $("#login-view").hidden = loggedIn;
  $("#app-view").hidden = !loggedIn;
  $("#admin-nav").hidden = !loggedIn;
}

function logout(message) {
  PW = "";
  try { sessionStorage.removeItem(PW_KEY); } catch (e) { /* ignore */ }
  showView(false);
  $("#password").value = "";
  showStatus($("#login-status"), message || "", message ? "err" : "");
  $("#password").focus();
}

// a wrong password on any call sends the user back to the login screen
function handleError(err) {
  console.error(err);
  if (/password|attempts/i.test(err.message)) return logout(err.message);
  toast(err.message || "Something went wrong. Please try again.", true);
}

function cellHTML(header, value) {
  const v = String(value == null ? "" : value);
  if (/^https?:\/\//i.test(v)) return `<a href="${esc(v)}" target="_blank" rel="noopener">Open<span class="sr-only"> (new tab)</span></a>`;
  if (/phone|whatsapp/i.test(header) && /^[+\d][\d\s\-()]{6,}$/.test(v)) return `<a href="tel:${esc(v.replace(/[^\d+]/g, ""))}">${esc(v)}</a>`;
  if (/email/i.test(header) && /^\S+@\S+\.\S+$/.test(v)) return `<a href="mailto:${esc(v)}">${esc(v)}</a>`;
  return esc(v);
}

function tableHTML(headers, rows, caption) {
  if (!rows.length) return '<p class="empty-state">Nothing here yet.</p>';
  return `<table class="data-table"><caption class="sr-only">${esc(caption)}</caption>
    <thead><tr>${headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((v, i) => `<td title="${esc(v)}">${cellHTML(headers[i], v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

/* ---------- tabs ---------- */
function openTab(name) {
  $$("#admin-nav [data-tab]").forEach((b) => b.toggleAttribute("aria-current", b.dataset.tab === name));
  $$("#admin-nav [data-tab]").forEach((b) => b.dataset.tab === name ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"));
  ["overview", "jobs", "subs"].forEach((t) => ($("#tab-" + t).hidden = t !== name));
  if (name === "overview") loadOverview();
  if (name === "jobs") loadJobsList();
  if (name === "subs") loadSubs();
  window.scrollTo(0, 0);
}

/* ---------- overview ---------- */
async function loadOverview() {
  try {
    const d = await adminCall("overview");
    const c = d.counts;
    const stats = [
      ["Active jobs", c.activeJobs], ["Closed jobs", c.closedJobs], ["Job applications", c.application],
      ["Candidate registrations", c.candidate], ["Vacancy enquiries", c.enquiry], ["Employer enquiries", c.employer], ["Contact messages", c.contact],
    ];
    $("#stat-grid").innerHTML = stats.map(([l, n]) => `<div class="stat"><b>${n}</b><span>${esc(l)}</span></div>`).join("");
    const keep = ["Timestamp", "Job Title", "Full Name", "Phone", "Resume Link"];
    const idx = keep.map((k) => d.recent.headers.indexOf(k));
    $("#recent-wrap").innerHTML = tableHTML(keep.filter((k, i) => idx[i] > -1), d.recent.rows.map((r) => idx.filter((i) => i > -1).map((i) => r[i])), "Latest applications");
  } catch (err) { handleError(err); }
}

/* ---------- jobs ---------- */
async function loadJobsList() {
  try {
    const d = await adminCall("listJobs");
    JOBS = d.jobs.slice().sort((a, b) => String(b.postedDate).localeCompare(String(a.postedDate)) || String(b.code).localeCompare(String(a.code)));
    renderJobs();
  } catch (err) { handleError(err); }
}

function renderJobs() {
  const q = $("#job-search").value.trim().toLowerCase();
  const st = $("#job-status-filter").value;
  const list = JOBS.filter((j) => (!st || j.status === st) && (!q || `${j.code} ${j.title} ${j.country} ${j.category}`.toLowerCase().includes(q)));
  $("#job-count").textContent = `${list.length} of ${JOBS.length} jobs`;
  if (!list.length) { $("#jobs-wrap").innerHTML = '<p class="empty-state">No jobs found. Click "Post a new job" to add one.</p>'; return; }
  $("#jobs-wrap").innerHTML = `<table class="data-table jobs-table"><caption class="sr-only">All jobs</caption>
    <thead><tr><th scope="col">Code</th><th scope="col">Job title</th><th scope="col">Country</th><th scope="col">Vacancies</th><th scope="col">Posted</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
    <tbody>${list.map((j) => {
      const active = j.status.toLowerCase() === "active";
      return `<tr>
        <td>${esc(j.code)}</td><td class="wide">${safeImageUrl(j.image) ? `<img class="thumb" src="${esc(safeImageUrl(j.image))}" alt="" loading="lazy" />` : ""}<strong>${esc(j.title)}</strong></td><td>${esc(j.country)}</td><td>${esc(j.vacancies)}</td><td>${esc(j.postedDate)}</td>
        <td><span class="status ${active ? "on" : "off"}">${active ? "Active" : "Closed"}</span></td>
        <td class="actions">
          <button type="button" data-act="edit" data-code="${esc(j.code)}">Edit<span class="sr-only"> ${esc(j.title)}</span></button>
          <button type="button" data-act="toggle" data-code="${esc(j.code)}">${active ? "Close" : "Reopen"}<span class="sr-only"> ${esc(j.title)}</span></button>
          <a href="job.html?id=${encodeURIComponent(j.code)}" target="_blank" rel="noopener">View<span class="sr-only"> ${esc(j.title)} on the website (new tab)</span></a>
          <button type="button" class="danger" data-act="delete" data-code="${esc(j.code)}">Delete<span class="sr-only"> ${esc(j.title)}</span></button>
        </td></tr>`;
    }).join("")}</tbody></table>`;
}

function buildForm() {
  $("#country-list").innerHTML = COUNTRY_LIST.map((c) => `<option value="${esc(c)}"></option>`).join("");
  $("#job-fields").innerHTML = FIELDS.map(([key, label, type, req, o = {}]) => {
    const id = "f-" + key, attrs = `id="${id}" name="${key}"${req ? " required" : ""}`;
    let control;
    if (type === "select") control = `<select ${attrs}>${o.blank ? `<option value="">${esc(o.blank)}</option>` : ""}${o.options.map((x) => `<option>${esc(x)}</option>`).join("")}</select>`;
    else if (type === "textarea") control = `<textarea ${attrs} rows="3"></textarea>`;
    else control = `<input ${attrs} type="${type}"${o.list ? ` list="${o.list}"` : ""}${o.ph ? ` placeholder="${esc(o.ph)}"` : ""}${type === "number" ? ' min="0"' : ""} />`;
    return `<label class="${type === "textarea" ? "full" : ""}">${esc(label)}${req ? " *" : ""}${control}</label>`;
  }).join("");
}

let editingCode = "";
function openJobForm(job) {
  editingCode = job ? job.code : "";
  $("#dlg-title").textContent = job ? `Edit ${job.code}` : "Post a new job";
  FIELDS.forEach(([key]) => {
    const el = $("#f-" + key);
    el.classList.remove("invalid"); el.removeAttribute("aria-invalid");
    el.value = job ? (job[key] || "") : (key === "status" ? "Active" : key === "showEmployer" ? "No" : "");
  });
  showStatus($("#job-status"), "", "");
  setPoster(job ? job.image || "" : "");
  $("#job-dialog").showModal();
  $("#f-title").focus();
}

async function saveJob(e) {
  e.preventDefault();
  const form = $("#job-form");
  if (!validateForm(form)) return showStatus($("#job-status"), "Please fill the highlighted fields.", "err");
  const job = Object.fromEntries(FIELDS.map(([k]) => [k, $("#f-" + k).value.trim()]));
  const original = editingCode ? JOBS.find((j) => j.code === editingCode) : null;
  if (original) { job.code = job.code || original.code; job.postedDate = original.postedDate; }   // a changed code renames the job
  const btn = $("#job-save");
  btn.disabled = true; btn.textContent = "Saving...";
  try {
    if (poster.pending) {                      // upload the new poster first, then save the job with its link
      const up = await adminCall("uploadJobImage", poster.pending);
      poster.url = up.url; poster.pending = null;
    }
    job.image = poster.url;
    const d = await adminCall("saveJob", { job, originalCode: editingCode });
    $("#job-dialog").close();
    toast(`${d.created ? "Job posted" : "Job updated"} (${d.code}). It is live on the website within about a minute.`);
    loadJobsList();
  } catch (err) {
    if (/password|attempts/i.test(err.message)) { $("#job-dialog").close(); return handleError(err); }
    showStatus($("#job-status"), err.message, "err");
  } finally { btn.disabled = false; btn.textContent = "Save job"; }
}

async function jobAction(act, code) {
  const job = JOBS.find((j) => j.code === code);
  if (!job) return;
  if (act === "edit") return openJobForm(job);
  try {
    if (act === "toggle") {
      const next = job.status.toLowerCase() === "active" ? "Closed" : "Active";
      await adminCall("setStatus", { code, status: next });
      toast(`${code} is now ${next}.`);
    } else if (act === "delete") {
      if (!confirm(`Delete ${code} (${job.title}) for good?\n\nThis cannot be undone. Closing the job is safer because it keeps the record.`)) return;
      await adminCall("deleteJob", { code });
      toast(`${code} deleted.`);
    }
    loadJobsList();
  } catch (err) { handleError(err); }
}

/* ---------- poster image ---------- */
const poster = { url: "", pending: null };

function showPoster(src) {
  const img = $("#poster-preview");
  if (src) { img.src = src; img.hidden = false; } else { img.removeAttribute("src"); img.hidden = true; }
  $("#poster-remove").hidden = !src;
}

function setPoster(url) {
  poster.url = url || ""; poster.pending = null;
  $("#poster-file").value = ""; $("#poster-msg").textContent = "";
  showPoster(safeImageUrl(poster.url));
}

// shrink big photos to max 1200px wide JPEG so uploads are fast and small
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1200 / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const dataUrl = c.toDataURL("image/jpeg", 0.85);
      resolve({ dataUrl, imageBase64: dataUrl.split(",")[1], imageMime: "image/jpeg", imageName: "poster.jpg" });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read this image.")); };
    img.src = url;
  });
}

async function onPosterChosen(file) {
  const msg = $("#poster-msg");
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { msg.textContent = "Please choose a JPG, PNG or WebP image."; return; }
  if (file.size > 15 * 1024 * 1024) { msg.textContent = "That image is too big (over 15MB)."; return; }
  try {
    const r = await resizeImage(file);
    poster.pending = { imageBase64: r.imageBase64, imageMime: r.imageMime, imageName: r.imageName };
    showPoster(r.dataUrl);
    msg.textContent = "Image ready. It uploads when you click Save job.";
  } catch (err) { msg.textContent = err.message; }
}

/* ---------- applications & enquiries ---------- */
async function loadSubs() {
  const type = $("#sub-type").value;
  $("#subs-wrap").innerHTML = '<p class="empty-state">Loading…</p>';
  try {
    const d = await adminCall("listSubmissions", { type });
    SUBS = { headers: d.headers, rows: d.rows, total: d.total, type };
    renderSubs();
  } catch (err) { handleError(err); }
}

function visibleSubs() {
  const q = $("#sub-search").value.trim().toLowerCase();
  return SUBS.rows.filter((r) => !q || r.join(" ").toLowerCase().includes(q));
}

function renderSubs() {
  const rows = visibleSubs();
  const more = SUBS.total > SUBS.rows.length ? ` (showing the latest ${SUBS.rows.length})` : "";
  $("#sub-count").textContent = `${rows.length} of ${SUBS.total}${more}`;
  $("#subs-wrap").innerHTML = tableHTML(SUBS.headers, rows, $("#sub-type").selectedOptions[0].text);
}

function downloadCsv() {
  const rows = visibleSubs();
  if (!rows.length) return toast("Nothing to download.", true);
  const safe = (v) => { v = String(v); if (/^[=@\t\r]/.test(v) || /^[+-](?![\d\s()-]+$)/.test(v)) v = "'" + v; return `"${v.replace(/"/g, '""')}"`; };
  const csv = [SUBS.headers, ...rows].map((r) => r.map(safe).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = `devan-${SUBS.type}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- boot ---------- */
async function enter(pw, statusEl) {
  PW = pw;
  await adminCall("login");
  try { sessionStorage.setItem(PW_KEY, pw); } catch (e) { /* ignore */ }
  showView(true);
  openTab("overview");
}

document.addEventListener("DOMContentLoaded", async () => {
  buildForm();

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = $("#login-status"), btn = $("#login-form button");
    const pw = $("#password").value;
    if (!pw) { $("#password").setAttribute("aria-invalid", "true"); return showStatus(status, "Please enter the password.", "err"); }
    btn.disabled = true; btn.textContent = "Checking..."; showStatus(status, "", "");
    try { await enter(pw, status); }
    catch (err) { PW = ""; showStatus(status, err.message.includes("SCRIPT_URL") ? err.message : (err.message || "Could not log in."), "err"); }
    finally { btn.disabled = false; btn.textContent = "Log in"; }
  });

  $("#logout").addEventListener("click", () => logout());
  $$("#admin-nav [data-tab]").forEach((b) => b.addEventListener("click", () => openTab(b.dataset.tab)));
  $("#new-job").addEventListener("click", () => openJobForm(null));
  $("#poster-file").addEventListener("change", (e) => e.target.files[0] && onPosterChosen(e.target.files[0]));
  $("#poster-remove").addEventListener("click", () => { poster.url = ""; poster.pending = null; $("#poster-file").value = ""; $("#poster-msg").textContent = "Image removed. Click Save job to apply."; showPoster(""); });
  $("#job-form").addEventListener("submit", saveJob);
  $("#dlg-close").addEventListener("click", () => $("#job-dialog").close());
  $("#dlg-cancel").addEventListener("click", () => $("#job-dialog").close());
  $("#job-search").addEventListener("input", renderJobs);
  $("#job-status-filter").addEventListener("change", renderJobs);
  $("#jobs-wrap").addEventListener("click", (e) => { const b = e.target.closest("button[data-act]"); if (b) jobAction(b.dataset.act, b.dataset.code); });
  $("#sub-type").addEventListener("change", () => { $("#sub-search").value = ""; loadSubs(); });
  $("#sub-search").addEventListener("input", renderSubs);
  $("#csv-btn").addEventListener("click", downloadCsv);

  // stay logged in while this tab is open
  let saved = "";
  try { saved = sessionStorage.getItem(PW_KEY) || ""; } catch (e) { /* ignore */ }
  if (saved) { try { await enter(saved); } catch (err) { logout(); } }
  else $("#password").focus();
});
