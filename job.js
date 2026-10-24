/* ==================================================
   DEVAN PLACEMENTS - JOB DETAILS PAGE
   Displays complete job information from Google Sheets
   ================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  const id = (
    new URLSearchParams(location.search).get("id") || ""
  ).trim();

  /* ---------- LOAD JOBS ---------- */

  let data;

  try {
    data = await loadJobs();
  } catch (error) {
    console.error("Job loading error:", error);

    $("#job-title").textContent = "Unable to load vacancy";
    $("#crumb").textContent = "Loading error";
    $("#notfound").hidden = false;

    return;
  }

  const {
    jobs = [],
    sample = false,
    failed = false
  } = data;

  const job = jobs.find(
    j => String(j.code || "").toLowerCase() === id.toLowerCase()
  );

  if (!job) {

    $("#job-title").textContent =
      failed ? "Could not load this vacancy" : "Vacancy not found";

    $("#crumb").textContent = "Not found";

    document.title =
      "Vacancy not found | Devan Placements";

    $("#notfound").hidden = false;

    return;
  }

  $("#sample-banner").hidden = !sample;

  /* ---------- PAGE TITLE ---------- */

  document.title =
    `${job.title} in ${job.country} | Devan Placements`;

  const desc =
    job.description ||
    `${job.title} vacancy in ${job.country}. Apply online with Devan Placements.`;

  const meta = $('meta[name="description"]');

  if (meta) {
    meta.setAttribute("content", desc.slice(0, 155));
  }

  $("#job-title").textContent = job.title;

  $("#crumb").textContent = job.title;

  /* ---------- JOB BADGES ---------- */

  const badges = [
    `CODE: ${job.code}`,
    `${job.country} ${flagOf(job.country)}`,
    job.category,
    job.permitIndustry,
    job.postedDate && `Posted ${job.postedDate}`
  ].filter(Boolean);

  $("#job-badges").innerHTML = badges
    .map(b => `<span class="badge">${esc(b)}</span>`)
    .join("");

  /* ---------- JOB POSTER ---------- */

  const poster = safeImageUrl(job.image);

  if (poster) {

    $("#job-poster").src = poster;

    $("#job-poster").alt =
      `${job.title} job poster`;

    $("#poster-link").href = poster;

    $("#sec-poster").hidden = false;
  }

  /* ---------- DESCRIPTION ---------- */

  $("#job-desc").textContent = desc;

  /* ---------- COMPLETE JOB FACTS ---------- */

  const facts = [

    // BASIC INFORMATION
    ["Job Code", job.code],
    ["Country", job.country],
    ["Permit / Industry", job.permitIndustry],
    ["Position", job.title],
    ["Category", job.category],
    ["Vacancies", job.vacancies],
    ["Salary", job.salary],

    // CANDIDATE REQUIREMENTS
    ["Freshers / Experienced", job.candidateType],
    ["Experience", job.experience],
    ["Gender", job.gender],
    ["Age Limit", job.ageLimit],
    ["Education", job.education],

    // FACILITIES
    ["Housing / Accommodation", job.accommodation],
    ["Food", job.food],
    ["Transport", job.transport],
    ["Allowances", job.allowances],
    ["Other Benefits", job.otherBenefits],
    ["Deductions", job.deductions],

    // WORKING CONDITIONS
    ["Working Hours", job.hours],
    ["Weekly / Monthly Off", job.weeklyOff],
    ["Overtime", job.overtime],
    ["Contract", job.contract],
    ["Nature of Job", job.nature],

    // INTERVIEW DETAILS
    ["Interview Date", job.interviewDate],
    ["Selection Process", job.selectionProcess],

    // DOCUMENTS
    ["Documents Required", job.documentsRequired],

    // EMPLOYER
    ["Employer", job.employer]

  ].filter(([, value]) =>
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
  );

  $("#facts").innerHTML = facts
    .map(([label, value]) => `
      <div class="fact">
        <dt>${esc(label)}</dt>
        <dd>${esc(value)}</dd>
      </div>
    `)
    .join("");

  /* ---------- ADDITIONAL JOB SECTIONS ---------- */

  const fill = (section, element, value) => {

    if (value) {
      $(element).textContent = value;
    } else {
      $(section).hidden = true;
    }

  };

  fill("#sec-role", "#job-role", job.role);

  fill("#sec-scope", "#job-scope", job.scope);

  fill("#sec-elig", "#job-elig", job.eligibility);

  const contact = [
    job.contactPerson,
    job.contactPhone
  ].filter(Boolean).join(" · ");

  fill(
    "#sec-contact",
    "#job-contact",
    contact
  );

  /* ---------- WHATSAPP ENQUIRY ---------- */

  $("#wa-enquiry").href = waLink(
    `Hello Devan Placements, I have an enquiry about ${job.title} (${job.code}) in ${job.country}.`
  );

  /* ---------- APPLICATION FORMS ---------- */

  const jobFields = () => ({
    jobCode: job.code,
    jobTitle: job.title,
    jobCountry: job.country
  });

  bindForm(
    "#apply-form",
    "application",
    {
      needsResume: true,
      extra: jobFields,
      successMsg:
        "Application received. Our team will contact you shortly."
    }
  );

  bindForm(
    "#enquiry-form",
    "enquiry",
    {
      extra: jobFields,
      successMsg:
        "Enquiry sent. We will reply soon."
    }
  );

  /* ---------- SHOW JOB DETAILS ---------- */

  $("#detail").hidden = false;

  if (location.hash) {

    document
      .getElementById(location.hash.slice(1))
      ?.scrollIntoView();

  }

});
