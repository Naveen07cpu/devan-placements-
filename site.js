/* ==========================================================
   Devan Placements – shared code (loaded on every page)
   EDIT THE SETTINGS BELOW. Empty values are simply hidden on the site.
   ========================================================== */

const SCRIPT_URL = "https://script.google.com/macros/library/d/1XHWQPAUy12liITR2AJStt87c_JGuxKSlYoXcgBQ2tAR-J7IXrl5yZIzl/4";

const SITE = {
  name: "Devan Placements",
  legalName: "Devan Enterprises",
  phone: "+91 86810 22518",
  whatsappNumber: "918681022518",          // digits only, with country code
  email: "devanplacements@gmail.com",
  address: "no:6 1st floor eswaran koil st landmark: koyambedu post office ch-600107",                              // e.g. "12, Anna Salai, Chennai, Tamil Nadu 600002, India"
  hours: "9.00AM - 7.00PM",                                // e.g. "Mon - Sat, 9:30 AM - 6:30 PM"
  mapsUrl: "https://maps.app.goo.gl/xMuHyDChv8bxYiMg8?g_st=com.google.maps.preview.copy",                              // Google Maps share link of the office
  registrationNo: "",                       // recruitment agency licence / registration number, if any
  domain: "https://www.devanplacements.com",// change when the real domain is live
  social: {
    Instagram: "https://www.instagram.com/devanplacements007?vrfl=aThzcTRjeG5ubTdu",
    Facebook: "https://www.facebook.com/profile.php?id=100094139439605&mibextid=ZbWKwL",
    WhatsApp: "",                           // filled automatically from whatsappNumber
    Telegram: "https://t.me/Devanplacements",
    LinkedIn: "",
    YouTube: "",
  },
  // While testing, show sample vacancies if the Google Sheet cannot be reached.
  // Set to false before launch so visitors never see sample jobs.
  sampleJobsOnError: true,
};

const COUNTRY_FLAGS = {
  "Singapore": "🇸🇬", "Malaysia": "🇲🇾", "United Arab Emirates": "🇦🇪", "UAE": "🇦🇪", "Saudi Arabia": "🇸🇦",
  "Qatar": "🇶🇦", "Kuwait": "🇰🇼", "Oman": "🇴🇲", "Bahrain": "🇧🇭", "Ireland": "🇮🇪",
  "Canada": "🇨🇦", "USA": "🇺🇸", "Europe": "🇪🇺",
};
const COUNTRY_LIST = Object.keys(COUNTRY_FLAGS).filter((c) => c !== "UAE");
const CATEGORY_LIST = ["Skilled Manpower", "Construction & Shipyard", "Technical & Engineering", "Hospitality & F&B",
  "Drivers & Logistics", "Semi-Skilled & General", "Healthcare & Professional"];

const SAMPLE_JOBS = [
  { code: "JOB-001", status: "Active", postedDate: "2026-10-15", employer: "", country: "Singapore", title: "Senior Electrical Maintenance Technician",
    category: "Skilled Manpower", vacancies: "5", salary: "Competitive / As per visa", hours: "8 hours/day, 6 days/week", accommodation: "Provided",
    food: "Provided / allowance", contract: "2 years, renewable", eligibility: "Licensed technician, trade test required", education: "ITI / Diploma in Electrical",
    ageLimit: "25 - 45", experience: "3 - 5 Years", expMin: 3, role: "Maintain commercial building electrical and low-voltage systems",
    nature: "Full time, on-site", scope: "Fault finding, preventive maintenance, installation, reporting", contactPerson: "Recruitment Desk", contactPhone: "+91 86810 22518",
    description: "Leading contractor seeking licensed technicians for commercial building MEP systems and low-voltage controls." },
  { code: "JOB-002", status: "Active", postedDate: "2026-10-14", employer: "", country: "United Arab Emirates", title: "Heavy Vehicle Trailer Driver",
    category: "Drivers & Logistics", vacancies: "10", salary: "Standard scale + allowances", hours: "10 hours/day, 6 days/week", accommodation: "Provided",
    food: "Allowance", contract: "2 years", eligibility: "Valid heavy license, GCC license preferred", education: "10th pass",
    ageLimit: "25 - 50", experience: "2+ Years", expMin: 2, role: "Drive tractor-trailer on regional freight routes", nature: "Full time, long distance",
    scope: "Loading checks, safe driving, trip log maintenance", contactPerson: "Recruitment Desk", contactPhone: "+91 86810 22518",
    description: "Logistics conglomerate recruiting experienced tractor-trailer drivers for regional freight distribution routes." },
  { code: "JOB-003", status: "Active", postedDate: "2026-10-13", employer: "", country: "Saudi Arabia", title: "Structural Steel Welder / Fabricator",
    category: "Construction & Shipyard", vacancies: "20", salary: "Per trade test scale", hours: "10 hours/day, 6 days/week", accommodation: "Camp housing",
    food: "Mess provided", contract: "2 years", eligibility: "Certified 3G/4G/6G welders", education: "ITI Welder",
    ageLimit: "25 - 45", experience: "3+ Years", expMin: 3, role: "Welding and fabrication of steel structures", nature: "Full time, site based",
    scope: "SMAW and MIG welding, fit-up, following drawings", contactPerson: "Recruitment Desk", contactPhone: "+91 86810 22518",
    description: "Major EPC contractor seeking certified SMAW and MIG welders for petrochemical structure assembly." },
  { code: "JOB-004", status: "Active", postedDate: "2026-10-12", employer: "", country: "Malaysia", title: "Sous Chef & Kitchen Supervisor",
    category: "Hospitality & F&B", vacancies: "3", salary: "Competitive MYR + service charge", hours: "9 hours/day, 6 days/week", accommodation: "Housing allowance",
    food: "Duty meals", contract: "2 years", eligibility: "Hotel or restaurant kitchen experience", education: "Diploma in Hotel Management / equivalent",
    ageLimit: "25 - 45", experience: "4+ Years", expMin: 4, role: "Supervise kitchen prep and staff", nature: "Full time, shift based",
    scope: "Menu prep, hygiene compliance, staff scheduling", contactPerson: "Recruitment Desk", contactPhone: "+91 86810 22518",
    description: "Reputed international dining group in Kuala Lumpur hiring experienced supervisors to oversee culinary prep." },
];

/* ---------- tiny helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const waLink = (msg) => `https://wa.me/${SITE.whatsappNumber}` + (msg ? `?text=${encodeURIComponent(msg)}` : "");
const flagOf = (country) => COUNTRY_FLAGS[country] || "🌐";
const isHome = () => /(^|\/)(index\.html)?$/.test(location.pathname);

/* ---------- header / footer / floating WhatsApp ---------- */
function renderChrome() {
  const home = isHome() ? "" : "index.html";
  const social = { ...SITE.social, WhatsApp: SITE.social.WhatsApp || waLink() };
  if (SITE.mapsUrl) social["Google Maps"] = SITE.mapsUrl;
  const socialHtml = Object.entries(social)
    .filter(([, url]) => url)
    .map(([name, url]) => `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}<span class="sr-only"> (opens in a new tab)</span></a></li>`)
    .join("");

  const header = $("#site-header");
  if (header) {
    header.innerHTML = `
      <a class="skip-link" href="#main">Skip to main content</a>
      <header class="site-header">
        <div class="container header-inner">
          <a href="${home || "#home"}" class="brand">Devan <span>Placements</span></a>
          <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-menu"><span aria-hidden="true">☰</span></button>
          <nav class="nav-menu" id="nav-menu" aria-label="Main">
            <a href="${home}#about">About</a>
            <a href="${home}#countries">Countries</a>
            <a href="jobs.html">Active Jobs</a>
            <a href="${home}#how">Process</a>
            <a href="${home}#employers">Employers</a>
            <a href="${home}#faq">FAQ</a>
            <a href="${home}#contact">Contact</a>
            <a href="${home}#register" class="btn btn-gold btn-sm">Register</a>
          </nav>
        </div>
      </header>`;
    const toggle = $(".nav-toggle", header);
    const menu = $("#nav-menu", header);
    const setOpen = (open) => {
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open);
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => setOpen(!menu.classList.contains("open")));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("open")) { setOpen(false); toggle.focus(); } });
  }

  const footer = $("#site-footer");
  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid">
          <div>
            <a href="${home || "#home"}" class="brand">Devan <span>Placements</span></a>
            <p class="foot-text">Overseas manpower recruitment and placement consultancy, operated by ${esc(SITE.legalName)}.</p>
            ${SITE.registrationNo ? `<p class="foot-text"><strong>Registration No:</strong> ${esc(SITE.registrationNo)}</p>` : ""}
          </div>
          <nav aria-label="Footer">
            <h2 class="foot-h">Quick links</h2>
            <ul>
              <li><a href="jobs.html">Active Jobs</a></li>
              <li><a href="${home}#register">Candidate Registration</a></li>
              <li><a href="${home}#employers">For Employers</a></li>
              <li><a href="${home}#faq">FAQ</a></li>
              <li><a href="privacy.html">Privacy Policy</a></li>
              <li><a href="terms.html">Terms &amp; Conditions</a></li>
            </ul>
          </nav>
          <div>
            <h2 class="foot-h">Contact</h2>
            <ul class="foot-contact">
              ${SITE.address ? `<li><span class="sr-only">Address: </span>📍 ${esc(SITE.address)}</li>` : ""}
              <li>📞 <a href="tel:+${SITE.whatsappNumber}">${esc(SITE.phone)}</a></li>
              <li>✉️ <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></li>
              ${SITE.hours ? `<li>🕘 ${esc(SITE.hours)}</li>` : ""}
            </ul>
          </div>
          <div>
            <h2 class="foot-h">Follow us</h2>
            <ul class="social-list">${socialHtml}</ul>
          </div>
        </div>
        <div class="container foot-bottom">© ${new Date().getFullYear()} ${esc(SITE.name)} · Operated by ${esc(SITE.legalName)}. All rights reserved.</div>
      </footer>
      <a class="wa-float" href="${waLink("Hello Devan Placements, I need some information.")}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">
        <span aria-hidden="true">💬</span> <span class="wa-text">WhatsApp</span>
      </a>`;
  }

  // fill any [data-site] placeholders in the page body
  $$("[data-site]").forEach((el) => {
    const v = SITE[el.dataset.site];
    if (v) el.textContent = v; else (el.closest("[data-hide-empty]") || el).hidden = true;
  });
  $$("[data-site-href]").forEach((el) => {
    const k = el.dataset.siteHref;
    if (k === "tel") el.href = `tel:+${SITE.whatsappNumber}`;
    else if (k === "mailto") el.href = `mailto:${SITE.email}`;
    else if (k === "wa") el.href = waLink("Hello Devan Placements, I need some information.");
    else if (SITE[k]) el.href = SITE[k]; else (el.closest("[data-hide-empty]") || el).hidden = true;
  });
}

/* ---------- search-engine data (JSON-LD) ---------- */
function injectStructuredData() {
  const sameAs = Object.values(SITE.social).filter(Boolean);
  const data = {
    "@context": "https://schema.org", "@type": "EmploymentAgency", name: SITE.name, legalName: SITE.legalName,
    url: SITE.domain, telephone: SITE.phone, email: SITE.email,
    description: "Overseas manpower recruitment and placement consultancy connecting candidates with international jobs.",
  };
  if (sameAs.length) data.sameAs = sameAs;
  if (SITE.address) data.address = { "@type": "PostalAddress", streetAddress: SITE.address, addressCountry: "IN" };
  if (SITE.hours) data.openingHours = SITE.hours;
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
}

/* ---------- jobs from Google Sheet ---------- */
async function loadJobs() {
  const key = "dp_jobs_v2";
  try {
    const c = JSON.parse(sessionStorage.getItem(key) || "null");
    if (c && Date.now() - c.t < 60000) return { jobs: c.jobs, sample: false };
  } catch (e) { /* storage unavailable */ }

  try {
    if (SCRIPT_URL.startsWith("PASTE_")) throw new Error("SCRIPT_URL not set");
    const res = await fetch(`${SCRIPT_URL}?action=jobs`);
    const data = await res.json();
    if (data.result !== "success") throw new Error(data.message || "bad response");
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), jobs: data.jobs })); } catch (e) { /* ignore */ }
    return { jobs: data.jobs, sample: false };
  } catch (err) {
    console.warn("Could not load live jobs:", err);
    if (SITE.sampleJobsOnError) return { jobs: SAMPLE_JOBS, sample: true };
    return { jobs: [], sample: false, failed: true };
  }
}

function benefitsText(j) {
  const parts = [];
  if (j.accommodation) parts.push("Accommodation: " + j.accommodation);
  if (j.food) parts.push("Food: " + j.food);
  return parts.join(" • ") || "Ask our team";
}

function jobCardHTML(j) {
  const url = `job.html?id=${encodeURIComponent(j.code)}`;
  return `
    <article class="card job">
      <div>
        <div class="job-top"><span class="code">CODE: ${esc(j.code)}</span><span class="loc">${esc(j.country)} ${flagOf(j.country)}</span></div>
        <h3><a href="${url}">${esc(j.title)}</a></h3>
        <p class="desc">${esc(j.description || j.role || "")}</p>
        <div class="job-meta">
          <div><small>Salary</small><b>${esc(j.salary || "On request")}</b></div>
          <div><small>Experience</small><b>${esc(j.experience || "Any")}</b></div>
          <div class="benefits"><small>Benefits</small>${esc(benefitsText(j))}</div>
        </div>
      </div>
      <div class="job-actions">
        <a class="apply" href="${url}#apply">Apply Now<span class="sr-only"> for ${esc(j.title)}</span></a>
        <a class="details" href="${url}">View Details<span class="sr-only"> of ${esc(j.title)}</span></a>
      </div>
    </article>`;
}

/* ---------- forms ---------- */
const MAX_FILE_MB = 5;
const ALLOWED_EXT = ["pdf", "doc", "docx"];

function showStatus(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className = "form-status" + (type ? " " + type : "");
}

function validateForm(form) {
  let first = null;
  $$("input, select, textarea", form).forEach((el) => {
    el.classList.remove("invalid");
    el.removeAttribute("aria-invalid");
    if (el.type === "file" || el.type === "hidden") return;
    const empty = el.type === "checkbox" ? !el.checked : !el.value.trim();
    const badEmail = el.type === "email" && el.value && !/^\S+@\S+\.\S+$/.test(el.value);
    const badPhone = el.type === "tel" && el.value && !/^[+\d][\d\s\-()]{6,}$/.test(el.value);
    if ((el.required && empty) || badEmail || badPhone) {
      el.classList.add("invalid");
      el.setAttribute("aria-invalid", "true");
      if (!first) first = el;
    }
  });
  if (first) first.focus();
  return !first;
}

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result.split(",")[1]);
  r.onerror = () => reject(new Error("Could not read the file."));
  r.readAsDataURL(file);
});

/* Resume upload box: keyboard accessible + drag & drop. Returns {get(), reset()} */
function initResumeField(form) {
  const zone = $(".dropzone", form);
  if (!zone) return null;
  const input = $("input[type=file]", zone);
  const label = $(".dz-text", zone);
  const status = $(".form-status", form);
  const idle = 'Drag &amp; drop your resume here or <u>browse files</u>';
  let file = null;

  const set = (f) => {
    const ext = f.name.split(".").pop().toLowerCase();
    let err = "";
    if (!ALLOWED_EXT.includes(ext)) err = "Please upload a PDF, DOC or DOCX file.";
    else if (f.size > MAX_FILE_MB * 1024 * 1024) err = `File is larger than ${MAX_FILE_MB}MB.`;
    if (err) { file = null; label.innerHTML = idle; showStatus(status, err, "err"); return; }
    file = f;
    label.textContent = `Selected: ${f.name} (${Math.round(f.size / 1024)} KB)`;
    showStatus(status, "", "");
  };
  input.addEventListener("change", () => input.files[0] && set(input.files[0]));
  ["dragenter", "dragover"].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove("drag"); }));
  zone.addEventListener("drop", (e) => e.dataTransfer.files[0] && set(e.dataTransfer.files[0]));
  return { get: () => file, reset: () => { file = null; input.value = ""; label.innerHTML = idle; } };
}

async function submitToSheet(payload) {
  if (SCRIPT_URL.startsWith("PASTE_")) throw new Error("SCRIPT_URL is not set in site.js");
  // text/plain avoids the CORS preflight that Apps Script cannot answer
  const res = await fetch(SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
  const data = await res.json();
  if (data.result !== "success") throw new Error(data.message || "Server error");
  return data;
}

function bindForm(selector, formType, { successMsg, extra, needsResume } = {}) {
  const form = $(selector);
  if (!form) return;
  const status = $(".form-status", form);
  const btn = $("button[type='submit']", form);
  const resume = needsResume ? initResumeField(form) : null;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return showStatus(status, "Please fill the highlighted fields correctly.", "err");
    if (needsResume && !resume.get()) return showStatus(status, "Please upload your resume (PDF, DOC or DOCX).", "err");

    const payload = Object.fromEntries(new FormData(form).entries());
    delete payload.resume;
    payload.formType = formType;
    payload.pageUrl = location.href;
    if (extra) Object.assign(payload, extra());

    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Sending...";
    showStatus(status, "", "");
    try {
      if (needsResume) {
        const f = resume.get();
        payload.resumeName = f.name;
        payload.resumeMime = f.type || "application/octet-stream";
        payload.resumeBase64 = await fileToBase64(f);
      }
      await submitToSheet(payload);
      showStatus(status, successMsg || "Thank you! We will contact you shortly.", "ok");
      form.reset();
      resume && resume.reset();
    } catch (err) {
      console.error(err);
      showStatus(status, err.message.includes("SCRIPT_URL") ? err.message : "Something went wrong. Please try again or contact us on WhatsApp.", "err");
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderChrome();
  injectStructuredData();
});
