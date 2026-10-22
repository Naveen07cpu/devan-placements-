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
 * HOW TO POST A NEW VACANCY: open the "Jobs" sheet and fill a new row.
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
  "Contact Person", "Contact Phone", "Short Description",
];
// JSON key for each column above (same order)
const JOB_KEYS = [
  "code", "status", "postedDate", "employer", "showEmployer",
  "country", "title", "category", "vacancies", "salary", "hours",
  "accommodation", "food", "contract", "eligibility", "education",
  "ageLimit", "experience", "role", "nature", "scope",
  "contactPerson", "contactPhone", "description",
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
  if (jobs.getLastRow() < 2) {
    JOB_SAMPLES.forEach(function (row) { jobs.appendRow(row); fillJobDefaults_(jobs, jobs.getLastRow()); });
  }
  getResumeFolder_();
  const first = ss.getSheetByName("Sheet1");
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);
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
  if (!sh.getRange(row, 1).getValue()) {
    const n = ("000" + (row - 1)).slice(-3);
    sh.getRange(row, 1).setValue("JOB-" + n);
  }
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
    const cfg = SHEETS[data.formType];
    if (!cfg) return json_({ result: "error", message: "Unknown form type" });

    const problem = validate_(cfg, data);
    if (problem) return json_({ result: "error", message: problem });

    let resumeUrl = "";
    if (cfg.needsResume) resumeUrl = saveResume_(data);

    getSheet_(SpreadsheetApp.getActiveSpreadsheet(), cfg).appendRow(cfg.row(data, resumeUrl));
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

/* ---------------- Helpers ---------------- */
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
