/* ==========================================================
   Devan Placements – shared code (loaded on every page)
   EDIT THE SETTINGS BELOW. Empty values are simply hidden on the site.
   ========================================================== */

/* ---------- 1. SETTINGS ---------- */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMz6CfIquzkq3l9JwbIzjEJV-y_vSKlh5diG4T4f-TMQfqD6mSCQcB2zMEAH1dD0pU/exec";

const SITE = {
  name: "Devan Placements",
  legalName: "Devan Enterprises",
  phone: "+91 86810 22518",
  whatsappNumber: "918681022518",          // digits only, with country code
  email: "devanplacements@gmail.com",
  address: "No: 6, 1st Floor, Eswaran Koil St, Koyambedu, Landmark: Koyambedu Post Office",
  hours: "9:00 AM to 7:00 PM",
  mapsUrl: "https://maps.app.goo.gl/nekgwBp4pyBFWgqz5",   // Google Maps share link of the office
  registrationNo: "",                       // recruitment agency licence / registration number, if any
  domain: "https://www.devanplacements.in",// change when the real domain is live
  iconFolder: "images/icons/",              // folder that holds your social icons (svg, png or webp are all tried)
  iconFiles: {                              // only fill this if an icon has a different file name, e.g. Instagram: "images/icons/insta.png"
    Instagram: "", Facebook: "", WhatsApp: "", Telegram: "", LinkedIn: "", YouTube: "", "Google Maps": "",
  },
  logo: "images/devan%20placement%20logos.svg",   // logo file path (%20 = space). Must match the real file name exactly, including capitals
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

/* ---------- 2. LISTS ---------- */
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

/* ---------- 3. TINY HELPERS ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const waLink = (msg) => `https://wa.me/${SITE.whatsappNumber}` + (msg ? `?text=${encodeURIComponent(msg)}` : "");
const flagOf = (country) => COUNTRY_FLAGS[country] || "🌐";
const isHome = () => /(^|\/)(index\.html)?$/.test(location.pathname);

/* tries the next image type when an icon file is not found, then falls back to the text name */
function iconFallback(img) {
  const exts = ["svg", "png", "webp", "jpg"];
  const next = Number(img.dataset.i || 0) + 1;
  if (!img.dataset.custom && next < exts.length) {
    img.dataset.i = next;
    img.src = `${img.dataset.base}.${exts[next]}`;
  } else {
    img.replaceWith(document.createTextNode(img.dataset.name));
  }
}

/* ---------- 4. HEADER / FOOTER / FLOATING WHATSAPP ---------- */
function renderChrome() {
  const home = isHome() ? "" : "index.html";

  // social links: WhatsApp is filled from the number, Google Maps from mapsUrl
  const social = { ...SITE.social, WhatsApp: SITE.social.WhatsApp || waLink() };
  if (SITE.mapsUrl) social["googlemaps"] = SITE.mapsUrl;

  // Icon file for each link: <iconFolder>/<name>.svg (png, webp, jpg also tried). If no file is found, the text name is shown instead.
  const ICONS = { Instagram: "instagram", Facebook: "facebook", WhatsApp: "whatsapp", Telegram: "telegram", LinkedIn: "linkedin", YouTube: "youtube", "googlemaps": "googlemaps" };

  const socialHtml = Object.entries(social)
    .filter(([, url]) => typeof url === "string" && url.trim() !== "")
    .map(([name, url]) => {
      const custom = (SITE.iconFiles && SITE.iconFiles[name]) || "";
      const base = custom || (ICONS[name] ? SITE.iconFolder + ICONS[name] : "");
      const first = custom ? custom : base ? base + ".svg" : "";
      const inner = first
        ? `<img src="${esc(first)}" alt="" data-base="${esc(base)}" data-custom="${custom ? "1" : ""}" data-name="${esc(name)}" onerror="iconFallback(this)" /><span class="sr-only">${esc(name)}</span>`
        : esc(name);
      return `<li><a${first ? ' class="social-icon"' : ""} href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(name)}">${inner}</a></li>`;
    })
    .join("");

  /* header */
  const header = $("#site-header");
  if (header) {
    header.innerHTML = `
      <a class="skip-link" href="#main">Skip to main content</a>
      <header class="site-header">
        <div class="container header-inner">
          <a href="${home || "#home"}" class="brand"><img src="${esc(SITE.logo)}" alt="Devan Placements logo" class="brand-logo" onerror="this.style.display='none'"><span class="brand-text">Devan <span>Placements</span></span></a>
          <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-menu"><span aria-hidden="true">☰</span></button>
          <nav class="nav-menu" id="nav-menu" aria-label="Main">
            <a href="${home}#about">About</a>
            <a href="${home}#services">Services</a>
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

  /* footer */
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
              <li><a href="${home}#services">Training &amp; Placement</a></li>
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

/* ---------- 5. SEARCH-ENGINE DATA (JSON-LD) ---------- */
function injectStructuredData() {
  if (document.body.hasAttribute("data-noindex")) return;   // admin page: keep out of search results
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

/* ---------- 6. CLEAN UP WHAT COMES FROM THE SHEET ---------- */
// only https addresses are ever used as an image source
function safeImageUrl(u) { return /^https:\/\/\S+$/i.test(String(u || "").trim()) ? String(u).trim() : ""; }

function normalizeJob(j) {
  const o = {};
  Object.keys(j).forEach((k) => {
    let v = j[k];
    if (typeof v === "string" && /^#(ERROR|N\/A|REF|VALUE|NAME|DIV)/i.test(v.trim())) v = "";   // spreadsheet error cells
    o[k] = v;
  });
  const c = String(o.country || "").trim();
  const known = Object.keys(COUNTRY_FLAGS).find((x) => x.toLowerCase() === c.toLowerCase());
  o.country = known === "UAE" ? "United Arab Emirates" : (known || c.replace(/\b\w/g, (m) => m.toUpperCase()));
  const cat = CATEGORY_LIST.find((x) => x.toLowerCase() === String(o.category || "").trim().toLowerCase());
  if (cat) o.category = cat;
  o.image = safeImageUrl(o.image);
  return o;
}

/* ---------- 7. JOBS FROM GOOGLE SHEET ---------- */
async function loadJobs() {
  const key = "dp_jobs_v2";
  try {
    const c = JSON.parse(sessionStorage.getItem(key) || "null");
    if (c && Date.now() - c.t < 60000) return { jobs: c.jobs.map(normalizeJob), sample: false };
  } catch (e) { /* storage unavailable */ }

  try {
    if (SCRIPT_URL.startsWith("PASTE_")) throw new Error("SCRIPT_URL not set");
    const res = await fetch(`${SCRIPT_URL}?action=jobs`);
    const data = await res.json();
    if (data.result !== "success") throw new Error(data.message || "bad response");
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), jobs: data.jobs })); } catch (e) { /* ignore */ }
    return { jobs: data.jobs.map(normalizeJob), sample: false };
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
        ${safeImageUrl(j.image) ? `<a class="job-poster" href="${url}" tabindex="-1" aria-hidden="true"><img src="${esc(safeImageUrl(j.image))}" alt="" loading="lazy" /></a>` : ""}
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
      <div class="job-share-actions job-card-share">
        <button type="button" class="btn btn-outline btn-sm job-share-btn"
          data-share-job="${esc(j.code)}" data-title="${esc(j.title)}" data-country="${esc(j.country)}"
          aria-label="Share ${esc(j.title)} vacancy">↗ Share Job</button>
        <button type="button" class="btn btn-outline btn-sm job-copy-btn"
          data-copy-job="${esc(j.code)}"
          aria-label="Copy link to ${esc(j.title)} vacancy">🔗 Copy Link</button>
      </div>
    </article>`;
}

/* ---------- 8. FORMS ---------- */
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

/* ---------- 9. JOB SHARING ---------- */
function getJobShareUrl(code) {
  const url = new URL("job.html", window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("id", code);
  return url.href;
}

async function shareJob(code, title, country) {
  const url = getJobShareUrl(code);
  const text = `${title} - ${country}\nDevan Placements`;

  // Use the phone's native share menu when supported
  if (navigator.share) {
    try {
      await navigator.share({ title: `${title} | Devan Placements`, text, url });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  // Otherwise, share through WhatsApp
  const message = `${text}\n\nApply here:\n${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

async function copyJobLink(code) {
  const url = getJobShareUrl(code);
  try {
    await navigator.clipboard.writeText(url);
    alert("Job link copied successfully!");
  } catch (error) {
    window.prompt("Copy this job link:", url);
  }
}

/* Click handling for the share / copy buttons on job cards */
document.addEventListener("click", (event) => {
  const shareButton = event.target.closest("[data-share-job]");
  const copyButton = event.target.closest("[data-copy-job]");

  if (shareButton) {
    event.preventDefault();
    shareJob(shareButton.dataset.shareJob, shareButton.dataset.title || "Job Vacancy", shareButton.dataset.country || "");
  }
  if (copyButton) {
    event.preventDefault();
    copyJobLink(copyButton.dataset.copyJob);
  }
});

/* ---------- 10. START ---------- */
// runs now if the page is already loaded, otherwise when it finishes loading;
// try/catch so one problem can never stop the header and footer from showing
function startSite() {
  try { renderChrome(); } catch (err) { console.error("Header/footer error:", err); }
  try { injectStructuredData(); } catch (err) { console.error("Structured data error:", err); }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startSite);
else startSite();
