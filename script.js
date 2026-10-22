/* ==========================================================
   Devan Placements – home page logic
   (shared settings, header/footer, jobs API and form helpers
    live in site.js, which loads first)
   ========================================================== */

/* ---------- Content (edit here, the page re-renders) ---------- */
const COUNTRIES = [
  ["🇸🇬", "High Demand", "Singapore", "Explore eligible opportunities in technical services, construction, hospitality, and logistics."],
  ["🇲🇾", "Active", "Malaysia", "Opportunities in electronics manufacturing, service industries, construction, and plantations."],
  ["🇦🇪", "Top Destination", "United Arab Emirates", "Positions across Dubai & Abu Dhabi in hospitality, facilities management, MEP, and drivers."],
  ["🇸🇦", "Megaprojects", "Saudi Arabia", "Rapid hiring for infrastructure projects, EPC engineering, heavy drivers, and technicians."],
  ["🇶🇦", "Gulf Hub", "Qatar", "Skilled recruitment in industrial maintenance, facilities management, and hospitality."],
  ["🇰🇼", "Active", "Kuwait", "Positions for maintenance technicians, riggers, food retail, and healthcare assistants."],
  ["🇴🇲", "GCC", "Oman", "Opportunities in manufacturing, automotive mechanics, civil engineering, and trade roles."],
  ["🇧🇭", "GCC", "Bahrain", "Vacancies across manufacturing plants, retail, hospitality, logistics, and skilled trades."],
  ["🇮🇪", "Europe", "Ireland", "Critical skills opportunities for chefs, healthcare staff, and industrial electricians."],
  ["🇨🇦", "Americas", "Canada", "Pathways for certified trade professionals, heavy mechanics, and long-haul drivers."],
  ["🇺🇸", "Americas", "USA", "Enquiries for qualified technical specialists, specialty culinary staff, and STEM roles."],
  ["🇪🇺", "Schengen & UK", "Europe", "Seasonal and long-term contracts across Poland, Romania, Croatia, and Malta."],
];
const LOCAL_JOBS = [
  ["CHN", "High Demand", "Chennai, Tamil Nadu", "IT, BPO, customer support and manufacturing jobs"],
  ["BLR", "Tech Hub", "Bengaluru, Karnataka", "Software, IT support and engineering jobs"],
  ["HYD", "IT Hub", "Hyderabad, Telangana", "IT, healthcare and customer service jobs"],
  ["MUM", "Business Hub", "Mumbai, Maharashtra", "Finance, sales and administration jobs"],
  ["DEL", "Opportunities", "Delhi NCR", "IT, logistics and customer support jobs"],
  ["PUN", "Manufacturing Hub", "Pune, Maharashtra", "Engineering, automotive and manufacturing jobs"],
  ["CBE", "Industrial Hub", "Coimbatore, Tamil Nadu", "Textiles, manufacturing and technical jobs"],
  ["TRI", "Industrial Hub", "Tiruchirappalli, Tamil Nadu", "Engineering and industrial jobs"]
];
const CATEGORIES = [
  ["🔧", "Skilled Manpower", "Electricians, welders, plumbers, HVAC technicians, instrumentation mechanics, and precision tool makers."],
  ["🏗️", "Construction & Shipyard", "Construction workers, fabricators, fitters, crane riggers, scaffolding crews, and shipyard personnel."],
  ["📐", "Technical & Engineering", "Mechanical, electrical, civil, and industrial engineers, CAD draughtsmen, and QA/QC inspectors."],
  ["🍽️", "Hospitality & F&B", "Executive chefs, kitchen assistants, baristas, waitstaff, front desk associates, and housekeeping staff."],
  ["🚛", "Drivers & Logistics", "Heavy vehicle trailer drivers, forklift operators, dispatch coordinators, warehouse staff, and couriers."],
  ["🏭", "Semi-Skilled & General", "Factory assemblers, packers, agricultural workers, cleaning technicians, and loading assistants."],
];

const TESTIMONIALS = [
  ["AK", "Arun Kumar", "MEP Maintenance • Singapore 🇸🇬", "Devan Placements explained the Singapore work visa process with complete clarity. Everything from medical testing to contract terms matched what was discussed on day one."],
  ["MR", "Mansoor Al-Rumaithi", "Operations Director • Dubai, UAE 🇦🇪", "As a contracting firm in UAE, we required 40 certified structural welders on tight notice. Devan Enterprises provided pre-screened, capable candidates who passed trade testing."],
  ["SS", "Saravanan S.", "Culinary Team • Malaysia 🇲🇾", "The communication over WhatsApp and phone was prompt. They guided me through document attestation and paperwork systematically for Malaysia."],
];

/* The Figma frame only had the questions. Answers below are placeholders: review before launch. */
const FAQS = [
  ["How can I apply for overseas jobs?", "Browse the latest vacancies, then complete the Candidate Registration Form and upload your updated resume. Our recruitment officers will review your profile against active employer requirements."],
  ["Which countries does Devan Placements serve?", "We support recruitment across Singapore, Malaysia, the GCC countries, Ireland, Canada, the USA, and selected European destinations. Availability depends on verified employer mandates."],
  ["What documents are required?", "Typically an updated resume, a valid passport, educational and trade certificates, and experience proof. Exact requirements vary by country and employer, and our team will guide you."],
  ["Is work experience mandatory?", "It depends on the role. Skilled and technical positions usually need relevant experience or trade certification, while some semi-skilled roles accept freshers."],
  ["Does registration guarantee employment?", "No. Registration allows our team to evaluate your profile for suitable openings. Selection is made by the employer based on requirements, trade tests, and eligibility."],
  ["Can Devan Placements assist with recruitment documentation?", "Yes. We guide candidates through profile evaluation, trade testing preparation, and the documentation procedures involved in the recruitment process."],
];

/* ---------- Render sections ---------- */
function renderCountries() {
  $("#country-grid").innerHTML = COUNTRIES.map(([flag, tag, name, text]) => `
    <article class="country">
      <div class="country-top"><span class="flag" aria-hidden="true">${flag}</span><span class="tag">${esc(tag)}</span></div>
      <h3>${esc(name)}</h3><p>${esc(text)}</p>
      <a href="jobs.html?country=${encodeURIComponent(name)}">Explore jobs in ${esc(name)} →</a>
    </article>`).join("");

  const options = COUNTRIES.map(([, , name]) => `<option>${esc(name)}</option>`).join("");
  $("#filter-country").insertAdjacentHTML("beforeend", options);
  $("#reg-country").insertAdjacentHTML("beforeend", options);
}

function renderCategories() {
  $("#category-grid").innerHTML = CATEGORIES.map(([icon, title, text]) => `
    <article class="card cat">
      <i class="icon-box" aria-hidden="true">${icon}</i><h3>${esc(title)}</h3><p>${esc(text)}</p>
      <a href="jobs.html?category=${encodeURIComponent(title)}">Explore opportunities in ${esc(title)} →</a>
    </article>`).join("");
}

async function renderLatestJobs() {
  const grid = $("#job-grid");
  const { jobs, sample, failed } = await loadJobs();
  $("#sample-banner").hidden = !sample;
  if (failed) { grid.innerHTML = '<p class="empty-state">We could not load vacancies right now. Please try again shortly or message us on WhatsApp.</p>'; return; }
  const latest = jobs.slice(0, 4);
  grid.innerHTML = latest.length ? latest.map(jobCardHTML).join("") : '<p class="empty-state">No active vacancies right now. Please check again soon or register your profile.</p>';
}

function renderTestimonials() {
  $("#testimonial-grid").innerHTML = TESTIMONIALS.map(([init, name, role, text]) => `
    <article class="card quote">
      <div><span class="mark" aria-hidden="true">“</span><p>${esc(text)}</p></div>
      <div class="who"><b aria-hidden="true">${init}</b><div><strong>${esc(name)}</strong><span>${esc(role)}</span></div></div>
    </article>`).join("");
}

function renderFaq() {
  $("#faq-list").innerHTML = FAQS.map(([q, a]) =>
    `<details class="faq-item"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");
  $$(".faq-item").forEach((d) =>
    d.addEventListener("toggle", () => { if (d.open) $$(".faq-item").forEach((o) => o !== d && (o.open = false)); }));
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderCountries();
  renderCategories();
  renderLatestJobs();
  renderTestimonials();
  renderFaq();

  bindForm("#candidate-form", "candidate", {
    needsResume: true,
    successMsg: "Application received. Our recruitment desk will contact you shortly.",
  });
  bindForm("#employer-form", "employer", { successMsg: "Enquiry sent. Our corporate desk will respond promptly." });
  bindForm("#contact-form", "contact", { successMsg: "Message sent. We will get back to you soon." });
});
