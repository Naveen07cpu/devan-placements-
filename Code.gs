/**
 * Devan Placements – Google Apps Script backend (v2)
 *
 * WHAT THIS DOES
 *  1. Saves form submissions into Google Sheets (+ resumes into Google Drive)
 *       candidate  -> "Candidates"
 *       employer   -> "Employers"
 *       contact    -> "Contacts"
 *       application-> "Applications"        (Apply Now on a job page)
 *       enquiry    -> "Vacancy Enquiries"   (vacancy enquiry on a job page)
 *  2. Serves the job vacancies to the website from the "Jobs" sheet
 *       GET ?action=jobs  -> all rows where Status = Active
 *
 * ADMIN DASHBOARD (admin.html): post / edit / close jobs and view applications.
 *   Set the password once: Project Settings (gear icon) > Script properties > Add
 *   property ADMIN_PASSWORD = a long password only you know. Never put it in the code.
 *
 * HOW TO POST A NEW VACANCY (without the dashboard): open the "Jobs" sheet and fill a new row.
 * Job Code, Posted Date and Status fill themselves when you type the Job Title.
 *
 * SETUP: run setup() once, then Deploy -> New deployment -> Web app
 *        (Execute as: Me, Who has access: Anyone). After any later edit use
 *        Deploy -> Manage deployments -> Edit -> New version.
 */

const NOTIFY_EMAIL = "devanplacements@gmail.com";
const RESUME_FOLDER_NAME = "Devan Placements - Resumes";
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ["pdf", "doc", "docx"];
const JOBS_CACHE_SECONDS = 60;

/* ---------------- Jobs sheet layout ---------------- */
const JOB_HEADERS = [
  "Job Code", "Status", "Posted Date", "Employer Name", "Show Employer (Yes/No)",
  "Country", "Job Title", "Category", "Vacancies", "Salary", "Working Hours",
  "Accommodation", "Food", "Contract Terms", "Eligibility", "Education",
  "Age Limit", "Experience", "Job Role", "Nature of Job", "Job Scope",
  "Contact Person", "Contact Phone", "Short Description", "Job Image",
];
// JSON key for each column above (same order)
const JOB_KEYS = [
  "code", "status", "postedDate", "employer", "showEmployer",
  "country", "title", "category", "vacancies", "salary", "hours",
  "accommodation", "food", "contract", "eligibility", "education",
  "ageLimit", "experience", "role", "nature", "scope",
  "contactPerson", "contactPhone", "description", "image",
];
const JOB_SAMPLES = [
  ["", "Active", "", "Leading MEP Contractor", "No", "Singapore", "Senior Electrical Maintenance Technician", "Skilled Manpower", 5,
   "Competitive / As per visa", "8 hours/day, 6 days/week", "Provided", "Provided / allowance", "2 years, renewable",
   "Licensed technician, trade test required", "ITI / Diploma in Electrical", "25 - 45", "3 - 5 Years",
   "Maintain commercial building electrical and low-voltage systems", "Full time, on-site",
   "Fault finding, preventive maintenance, installation, reporting", "Recruitment Desk", "+91 86810 22518",
   "Licensed technicians for commercial building MEP systems and low-voltage controls."],
  ["", "Active", "", "Logistics Group", "No", "United Arab Emirates", "Heavy Vehicle Trailer Driver", "Drivers & Logistics", 10,
   "Standard scale + allowances", "10 hours/day, 6 days/week", "Provided", "Allowance", "2 years",
   "Valid heavy license, GCC license preferred", "10th pass", "25 - 50", "2+ Years",
   "Drive tractor-trailer on regional freight routes", "Full time, long distance",
   "Loading checks, safe driving, trip log maintenance", "Recruitment Desk", "+91 86810 22518",
   "Experienced tractor-trailer drivers for regional freight distribution."],
];

/* ---------------- Form layout ---------------- */
const SHEETS = {
  candidate: {
    name: "Candidates",
    headers: ["Timestamp", "Full Name", "Phone", "Email", "Location", "Preferred Country",
              "Job Category", "Qualification", "Experience", "Job Role", "Resume Link", "Consent", "Page URL"],
    row: (d, resumeUrl) => [new Date(), d.fullName, d.phone, d.email, d.location, d.country,
                            d.category, d.qualification, d.experience, d.jobRole, resumeUrl,
                            d.consent ? "Yes" : "No", d.pageUrl],
    subject: (d) => "New candidate: " + d.fullName + " (" + d.country + ")",
    required: ["fullName", "phone", "email", "location", "country", "category", "qualification", "experience"],
    needsResume: true,
  },
  application: {
    name: "Applications",
    headers: ["Timestamp", "Job Code", "Job Title", "Country", "Full Name", "Phone", "Email",
              "Location", "Experience", "Resume Link", "Consent", "Page URL"],
    row: (d, resumeUrl) => [new Date(), d.jobCode, d.jobTitle, d.jobCountry, d.fullName, d.phone, d.email,
                            d.location, d.experience, resumeUrl, d.consent ? "Yes" : "No", d.pageUrl],
    subject: (d) => "New application: " + d.jobTitle + " (" + d.jobCode + ") - " + d.fullName,
    required: ["jobCode", "jobTitle", "fullName", "phone", "email", "location"],
    needsResume: true,
  },
  enquiry: {
    name: "Vacancy Enquiries",
    headers: ["Timestamp", "Job Code", "Job Title", "Name", "Phone", "Email", "Message", "Page URL"],
    row: (d) => [new Date(), d.jobCode, d.jobTitle, d.name, d.phone, d.email, d.message, d.pageUrl],
    subject: (d) => "Vacancy enquiry: " + d.jobTitle + " (" + d.jobCode + ") - " + d.name,
    required: ["jobCode", "jobTitle", "name", "phone", "message"],
  },
  employer: {
    name: "Employers",
    headers: ["Timestamp", "Company", "Contact Person", "Country", "Email", "Phone",
              "Required Positions", "Number of Workers", "Requirements", "Page URL"],
    row: (d) => [new Date(), d.company, d.contactPerson, d.country, d.email, d.phone,
                 d.positions, d.workers, d.requirements, d.pageUrl],
    subject: (d) => "New employer enquiry: " + d.company + " (" + d.country + ")",
    required: ["company", "contactPerson", "country", "email", "phone", "positions", "workers"],
  },
  contact: {
    name: "Contacts",
    headers: ["Timestamp", "Name", "Email", "Phone", "Enquiry Type", "Message", "Page URL"],
    row: (d) => [new Date(), d.name, d.email, d.phone, d.enquiryType, d.message, d.pageUrl],
    subject: (d) => "New message (" + d.enquiryType + ") from " + d.name,
    required: ["name", "email", "phone", "enquiryType", "message"],
  },
};

/* ---------------- One-time setup ---------------- */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (k) { getSheet_(ss, SHEETS[k]); });
  const jobs = getJobsSheet_(ss);
  ensureJobHeaders_(jobs);                       // adds the "Job Image" column header to an existing sheet
  jobs.getRange(2, 23, 1000, 1).setNumberFormat("@");   // Contact Phone = plain text (a leading + would otherwise become a formula)
  if (jobs.getLastRow() < 2) {
    JOB_SAMPLES.forEach(function (row) { jobs.appendRow(row); fillJobDefaults_(jobs, jobs.getLastRow()); });
  }
  getResumeFolder_();
  const first = ss.getSheetByName("Sheet1");
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);
}

function ensureJobHeaders_(sh) {
  JOB_HEADERS.forEach(function (h, i) {
    const cell = sh.getRange(1, i + 1);
    if (!cell.getValue()) {
      cell.setValue(h);
      cell.setFontWeight("bold").setBackground("#0b1f3a").setFontColor("#ffffff");
    }
  });
}

/* ---------------- Auto-fill Job Code / Date / Status ---------------- */
// Simple trigger: runs by itself whenever you edit the sheet.
function onEdit(e) {
  try {
    const sh = e.range.getSheet();
    if (sh.getName() !== "Jobs" || e.range.getRow() < 2) return;
    fillJobDefaults_(sh, e.range.getRow());
    CacheService.getScriptCache().remove("jobs_json");
  } catch (err) { /* never block the editor */ }
}

function fillJobDefaults_(sh, row) {
  const title = sh.getRange(row, 7).getValue();
  if (!title) return;
  if (!sh.getRange(row, 1).getValue()) sh.getRange(row, 1).setValue(nextJobCode_(sh));
  if (!sh.getRange(row, 2).getValue()) sh.getRange(row, 2).setValue("Active");
  if (!sh.getRange(row, 3).getValue()) sh.getRange(row, 3).setValue(new Date());
  if (!sh.getRange(row, 5).getValue()) sh.getRange(row, 5).setValue("No");
}

/* ---------------- Web app entry points ---------------- */
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === "jobs") return json_({ result: "success", jobs: getJobs_() });
  return ContentService.createTextOutput("Devan Placements web app is running.");
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = JSON.parse(e.postData.contents);
    if (data.formType === "admin") return handleAdmin_(data);
    const cfg = SHEETS[data.formType];
    if (!cfg) return json_({ result: "error", message: "Unknown form type" });

    const problem = validate_(cfg, data);
    if (problem) return json_({ result: "error", message: problem });

    let resumeUrl = "";
    if (cfg.needsResume) resumeUrl = saveResume_(data);

    appendTextRow_(getSheet_(SpreadsheetApp.getActiveSpreadsheet(), cfg), cfg.row(data, resumeUrl));
    notify_(cfg, data, resumeUrl);
    return json_({ result: "success" });
  } catch (err) {
    return json_({ result: "error", message: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- Jobs ---------------- */
function getJobsSheet_(ss) {
  let sh = ss.getSheetByName("Jobs");
  if (!sh) {
    sh = ss.insertSheet("Jobs", 0);
    sh.appendRow(JOB_HEADERS);
    sh.getRange(1, 1, 1, JOB_HEADERS.length).setFontWeight("bold").setBackground("#0b1f3a").setFontColor("#ffffff");
    sh.setFrozenRows(1);
    sh.getRange(2, 2, 500, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(["Active", "Closed"], true).build());
    sh.getRange(2, 5, 500, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(["Yes", "No"], true).build());
  }
  return sh;
}

function getJobs_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get("jobs_json");
  if (hit) return JSON.parse(hit);

  const sh = getJobsSheet_(SpreadsheetApp.getActiveSpreadsheet());
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, JOB_HEADERS.length).getValues() : [];
  const tz = Session.getScriptTimeZone();
  const jobs = rows
    .filter(function (r) { return r[6] && String(r[1]).toLowerCase() === "active"; })
    .map(function (r) {
      const j = {};
      JOB_KEYS.forEach(function (k, i) {
        const v = r[i];
        j[k] = v instanceof Date ? Utilities.formatDate(v, tz, "yyyy-MM-dd") : String(v === null ? "" : v).trim();
      });
      // keep employer private unless the row says Yes (never leaves the server otherwise)
      if (String(j.showEmployer).toLowerCase() !== "yes") j.employer = "";
      delete j.showEmployer;
      const m = String(j.experience).match(/\d+/);
      j.expMin = m ? Number(m[0]) : 0;
      return j;
    })
    .sort(function (a, b) {   // newest first; same day -> higher job code first
      return String(b.postedDate).localeCompare(String(a.postedDate)) || String(b.code).localeCompare(String(a.code));
    });

  cache.put("jobs_json", JSON.stringify(jobs), JOBS_CACHE_SECONDS);
  return jobs;
}

/* ---------------- Admin dashboard API ---------------- */
const SUBMISSION_TYPES = {
  application: "Applications", candidate: "Candidates", enquiry: "Vacancy Enquiries",
  employer: "Employers", contact: "Contacts",
};
const JOB_TEXT_LIMIT = 2000;
const POSTER_FOLDER_NAME = "Devan Placements - Job Posters";
const MAX_POSTER_BYTES = 5 * 1024 * 1024;
const POSTER_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// returns "" when the password is right, otherwise a message
function checkAdmin_(password) {
  const real = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  if (!real) return "Admin password is not set yet. In Apps Script open Project Settings > Script properties and add ADMIN_PASSWORD.";
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get("admin_fails") || 0);
  if (fails >= 5) return "Too many wrong attempts. Please try again in 15 minutes.";
  if (!password || !safeEqual_(String(password), String(real))) {
    cache.put("admin_fails", String(fails + 1), 900);
    Utilities.sleep(700);                       // slows down guessing
    return "Wrong password.";
  }
  cache.remove("admin_fails");
  return "";
}

function handleAdmin_(d) {
  const problem = checkAdmin_(d.password);
  if (problem) return json_({ result: "error", message: problem });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  switch (d.action) {
    case "login": return json_({ result: "success" });
    case "overview": return json_(Object.assign({ result: "success" }, overview_(ss)));
    case "listJobs": return json_({ result: "success", jobs: readAllJobs_(ss) });
    case "saveJob": return json_(saveJob_(ss, d.job || {}, d.originalCode || ""));
    case "setStatus": return json_(setJobStatus_(ss, d.code, d.status));
    case "deleteJob": return json_(deleteJob_(ss, d.code));
    case "uploadJobImage": return json_(uploadJobImage_(d));
    case "listSubmissions": return json_(listSubmissions_(ss, d.type, 300));
    default: return json_({ result: "error", message: "Unknown admin action" });
  }
}

function cellText_(v, tz) {
  if (v instanceof Date) return Utilities.formatDate(v, tz, "yyyy-MM-dd");
  return String(v === null || v === undefined ? "" : v).trim();
}

function readAllJobs_(ss) {
  const sh = getJobsSheet_(ss);
  if (sh.getLastRow() < 2) return [];
  const tz = Session.getScriptTimeZone();
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, JOB_HEADERS.length).getValues();
  return rows.map(function (r) {
    const j = {};
    JOB_KEYS.forEach(function (k, i) { j[k] = cellText_(r[i], tz); });
    return j;
  }).filter(function (j) { return j.title || j.code; });
}

function findJobRow_(sh, code) {
  if (!code || sh.getLastRow() < 2) return 0;
  const codes = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  const want = String(code).trim().toLowerCase();
  for (let i = 0; i < codes.length; i++) {
    if (String(codes[i][0]).trim().toLowerCase() === want) return i + 2;
  }
  return 0;
}

function nextJobCode_(sh) {
  let max = 0;
  if (sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) {
      const m = String(r[0]).match(/(\d+)\s*$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
  }
  return "JOB-" + ("000" + (max + 1)).slice(-3);
}

function saveJob_(ss, job, originalCode) {
  const sh = getJobsSheet_(ss);
  const tz = Session.getScriptTimeZone();
  const clean = {};
  JOB_KEYS.forEach(function (k) {
    clean[k] = String(job[k] === undefined || job[k] === null ? "" : job[k]).trim().slice(0, JOB_TEXT_LIMIT);
  });
  if (!clean.title) return { result: "error", message: "Job title is required." };
  if (!clean.country) return { result: "error", message: "Country is required." };
  if (clean.image && !/^https:\/\/\S+$/i.test(clean.image)) return { result: "error", message: "Poster link must start with https://" };
  if (clean.code && !/^[A-Za-z0-9_-]{2,30}$/.test(clean.code)) return { result: "error", message: "Job code can use only letters, numbers, dashes and underscores (2 to 30 characters, no spaces)." };
  clean.status = clean.status === "Closed" ? "Closed" : "Active";
  clean.showEmployer = String(clean.showEmployer).toLowerCase() === "yes" ? "Yes" : "No";

  let row = 0;
  if (originalCode) {
    row = findJobRow_(sh, originalCode);
    if (!row) return { result: "error", message: "That job no longer exists. Refresh the list." };
    if (!clean.code) clean.code = String(originalCode);
  } else {
    clean.code = clean.code || nextJobCode_(sh);
  }
  const dup = findJobRow_(sh, clean.code);
  if (dup && dup !== row) return { result: "error", message: "Job code " + clean.code + " is already used by another job." };
  if (!clean.postedDate) clean.postedDate = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");

  if (!row) row = Math.max(sh.getLastRow(), 1) + 1;
  const rng = sh.getRange(row, 1, 1, JOB_HEADERS.length);
  rng.setNumberFormat("@");                      // plain text: nothing is read as a formula
  rng.setValues([JOB_KEYS.map(function (k) { return clean[k]; })]);
  CacheService.getScriptCache().remove("jobs_json");
  return { result: "success", code: clean.code, created: !originalCode };
}

function getPosterFolder_() {
  const it = DriveApp.getFoldersByName(POSTER_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(POSTER_FOLDER_NAME);
}

// Saves a poster image in Drive, makes it viewable by link, and returns an address the website can show.
function uploadJobImage_(d) {
  const ext = POSTER_TYPES[String(d.imageMime || "").toLowerCase()];
  if (!ext) return { result: "error", message: "Poster must be a JPG, PNG or WebP image." };
  if (!d.imageBase64) return { result: "error", message: "No image received." };
  const bytes = Utilities.base64Decode(d.imageBase64);
  if (bytes.length > MAX_POSTER_BYTES) return { result: "error", message: "Poster is larger than 5MB." };
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
  const file = getPosterFolder_().createFile(Utilities.newBlob(bytes, d.imageMime, "poster_" + stamp + "." + ext));
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    return { result: "error", message: "Google would not make the poster public (a school or company Google account can block this). " + err.message };
  }
  return { result: "success", url: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1200" };
}

function setJobStatus_(ss, code, status) {
  const sh = getJobsSheet_(ss);
  const row = findJobRow_(sh, code);
  if (!row) return { result: "error", message: "That job no longer exists. Refresh the list." };
  sh.getRange(row, 2).setValue(status === "Closed" ? "Closed" : "Active");
  CacheService.getScriptCache().remove("jobs_json");
  return { result: "success" };
}

function deleteJob_(ss, code) {
  const sh = getJobsSheet_(ss);
  const row = findJobRow_(sh, code);
  if (!row) return { result: "error", message: "That job no longer exists. Refresh the list." };
  sh.deleteRow(row);
  CacheService.getScriptCache().remove("jobs_json");
  return { result: "success" };
}

function listSubmissions_(ss, type, limit) {
  const name = SUBMISSION_TYPES[type];
  if (!name) return { result: "error", message: "Unknown list." };
  const sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() < 1) return { result: "success", headers: [], rows: [], total: 0 };
  const tz = Session.getScriptTimeZone();
  const cols = sh.getLastColumn();
  const total = Math.max(0, sh.getLastRow() - 1);
  const n = Math.min(total, limit || 300);
  const headers = sh.getRange(1, 1, 1, cols).getValues()[0].map(String);
  const rows = n ? sh.getRange(sh.getLastRow() - n + 1, 1, n, cols).getValues() : [];
  return {
    result: "success", headers: headers, total: total,
    rows: rows.reverse().map(function (r) {
      return r.map(function (v) {
        return v instanceof Date ? Utilities.formatDate(v, tz, "yyyy-MM-dd HH:mm") : String(v === null || v === undefined ? "" : v);
      });
    }),
  };
}

function overview_(ss) {
  const counts = {};
  Object.keys(SUBMISSION_TYPES).forEach(function (k) {
    const sh = ss.getSheetByName(SUBMISSION_TYPES[k]);
    counts[k] = sh ? Math.max(0, sh.getLastRow() - 1) : 0;
  });
  const jobs = readAllJobs_(ss);
  counts.activeJobs = jobs.filter(function (j) { return j.status.toLowerCase() === "active"; }).length;
  counts.closedJobs = jobs.length - counts.activeJobs;
  const recent = listSubmissions_(ss, "application", 5);
  return { counts: counts, recent: { headers: recent.headers, rows: recent.rows } };
}

/* ---------------- Helpers ---------------- */
// Writes a row as plain text so values such as "+91 98765 43210" or "=SUM(...)" are never read as formulas.
function appendTextRow_(sh, values) {
  const tz = Session.getScriptTimeZone();
  const vals = values.map(function (v) {
    if (v instanceof Date) return Utilities.formatDate(v, tz, "yyyy-MM-dd HH:mm:ss");
    return v === null || v === undefined ? "" : String(v);
  });
  const row = sh.getLastRow() + 1;
  const rng = sh.getRange(row, 1, 1, vals.length);
  rng.setNumberFormat("@");
  rng.setValues([vals]);
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(ss, cfg) {
  let sheet = ss.getSheetByName(cfg.name);
  if (!sheet) {
    sheet = ss.insertSheet(cfg.name);
    sheet.appendRow(cfg.headers);
    sheet.getRange(1, 1, 1, cfg.headers.length).setFontWeight("bold").setBackground("#0b1f3a").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getResumeFolder_() {
  const it = DriveApp.getFoldersByName(RESUME_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(RESUME_FOLDER_NAME);
}

function validate_(cfg, d) {
  for (let i = 0; i < cfg.required.length; i++) {
    const v = d[cfg.required[i]];
    if (!v || !String(v).trim()) return "Missing field: " + cfg.required[i];
  }
  if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) return "Invalid email address";
  if (cfg.needsResume && !d.resumeBase64) return "Resume is required";
  return "";
}

function saveResume_(d) {
  const ext = String(d.resumeName || "").split(".").pop().toLowerCase();
  if (ALLOWED_EXT.indexOf(ext) === -1) throw new Error("Only PDF, DOC or DOCX resumes are allowed.");

  const bytes = Utilities.base64Decode(d.resumeBase64);
  if (bytes.length > MAX_RESUME_BYTES) throw new Error("Resume is larger than 5MB.");

  const who = d.fullName || d.name || "candidate";
  const safeName = String(who).replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "_");
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
  const blob = Utilities.newBlob(bytes, d.resumeMime || "application/octet-stream", safeName + "_" + stamp + "." + ext);
  return getResumeFolder_().createFile(blob).getUrl();
}

function notify_(cfg, d, resumeUrl) {
  const skip = ["resumeBase64", "resumeMime", "pageUrl", "formType"];
  const lines = Object.keys(d)
    .filter(function (k) { return skip.indexOf(k) === -1; })
    .map(function (k) { return k + ": " + d[k]; });
  if (resumeUrl) lines.push("Resume: " + resumeUrl);
  const mail = { to: NOTIFY_EMAIL, subject: cfg.subject(d), body: lines.join("\n") };
  if (d.email && /^\S+@\S+\.\S+$/.test(d.email)) mail.replyTo = d.email;
  MailApp.sendEmail(mail);   // note: free Gmail accounts can send ~100 emails/day
}
