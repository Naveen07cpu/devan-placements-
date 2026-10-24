/* Single job page: reads ?id=JOB-001 and shows that vacancy from the Jobs sheet */
document.addEventListener("DOMContentLoaded", async () => {
  const id = (new URLSearchParams(location.search).get("id") || "").trim();
  const { jobs, sample, failed } = await loadJobs();
  const job = jobs.find((j) => j.code.toLowerCase() === id.toLowerCase());

  if (!job) {
    $("#job-title").textContent = failed ? "Could not load this vacancy" : "Vacancy not found";
    $("#crumb").textContent = "Not found";
    document.title = "Vacancy not found | Devan Placements";
    $("#notfound").hidden = false;
    return;
  }
  $("#sample-banner").hidden = !sample;

  // titles and search-engine text
  document.title = `${job.title} in ${job.country} | Devan Placements`;
  const desc = job.description || `${job.title} vacancy in ${job.country}. Apply online with Devan Placements.`;
  $('meta[name="description"]').setAttribute("content", desc.slice(0, 155));
  $("#job-title").textContent = job.title;
  $("#crumb").textContent = job.title;
  $("#job-badges").innerHTML = [`CODE: ${job.code}`, `${job.country} ${flagOf(job.country)}`, job.category, job.postedDate && `Posted ${job.postedDate}`]
    .filter(Boolean).map((b) => `<span class="badge">${esc(b)}</span>`).join("");

  // poster image (optional)
  const poster = safeImageUrl(job.image);
  if (poster) {
    $("#job-poster").src = poster;
    $("#job-poster").alt = `${job.title} job poster (opens full size)`;
    $("#poster-link").href = poster;
    $("#sec-poster").hidden = false;
  }

  // overview
  $("#job-desc").textContent = desc;

  // key facts (empty values are skipped)
  const facts = [
    ["Employer", job.employer], ["Country", job.country], ["Job title", job.title], ["Vacancies", job.vacancies],
    ["Salary", job.salary], ["Working hours", job.hours], ["Accommodation", job.accommodation], ["Food", job.food],
    ["Contract terms", job.contract], ["Education", job.education], ["Age limit", job.ageLimit],
    ["Experience", job.experience], ["Nature of job", job.nature],
  ].filter(([, v]) => v);
  $("#facts").innerHTML = facts.map(([k, v]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");

  const fill = (sec, el, text) => { if (text) $(el).textContent = text; else $(sec).hidden = true; };
  fill("#sec-role", "#job-role", job.role);
  fill("#sec-scope", "#job-scope", job.scope);
  fill("#sec-elig", "#job-elig", job.eligibility);
  const contact = [job.contactPerson, job.contactPhone].filter(Boolean).join(" · ");
  fill("#sec-contact", "#job-contact", contact);

  // WhatsApp enquiry with the job already typed in
  $("#wa-enquiry").href = waLink(`Hello Devan Placements, I have an enquiry about ${job.title} (${job.code}) in ${job.country}.`);

  // job fields travel with both forms
  const jobFields = () => ({ jobCode: job.code, jobTitle: job.title, jobCountry: job.country });
  bindForm("#apply-form", "application", { needsResume: true, extra: jobFields, successMsg: "Application received. Our team will contact you shortly." });
  bindForm("#enquiry-form", "enquiry", { extra: jobFields, successMsg: "Enquiry sent. We will reply soon." });

  $("#detail").hidden = false;
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
});
