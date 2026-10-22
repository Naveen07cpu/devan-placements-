/**
 * Devan Placements — Google Apps Script backend (v3)
 * Bound to the Devan Placements Google spreadsheet.
 *
 * SETUP:
 * 1. Paste into Code.gs in the spreadsheet's Extensions > Apps Script.
 * 2. Save, select setup, and Run once (approve permissions).
 * 3. Deploy > Manage deployments > Edit > New version > Deploy.
 *    Execute as: Me; Access: Anyone (for a public site).
 * 4. Keep the /exec URL in site.js SCRIPT_URL.
 *
 * Website: GET ?action=jobs -> {result:"success", jobs:[...]}
 * Forms: POST JSON with formType candidate/application/enquiry/employer/contact.
 * India = local; other countries = overseas (filtered by jobs.js).
 *
 * WARNING: A public POST endpoint can be abused. Add spam/rate limiting
 * before production, and never put confidential credentials in this script.
 */

const NOTIFY_EMAIL = "devanplacements@gmail.com";
const RESUME_FOLDER_NAME = "Devan Placements - Resumes";
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ["pdf", "doc", "docx"];
const JOBS_CACHE_SECONDS = 60;
const JOB_CACHE_KEY = "jobs_json_v3";

const JOB_HEADERS = [
  "Job Code", "Status", "Posted Date", "Employer Name", "Show Employer (Yes/No)",
  "Country", "Job Title", "Category", "Vacancies", "Salary", "Working Hours",
  "Accommodation", "Food", "Contract Terms", "Eligibility", "Education",
  "Age Limit", "Experience", "Job Role", "Nature of Job", "Job Scope",
  "Contact Person", "Contact Phone", "Short Description"
];
const JOB_KEYS = [
  "code", "status", "postedDate", "employer", "showEmployer",
  "country", "title", "category", "vacancies", "salary", "hours",
  "accommodation", "food", "contract", "eligibility", "education",
  "ageLimit", "experience", "role", "nature", "scope",
  "contactPerson", "contactPhone", "description"
];

const SHEETS = {
  candidate: {
    name: "Candidates",
    headers: ["Timestamp", "Full Name", "Phone", "Email", "Location", "Preferred Country",
      "Job Category", "Qualification", "Experience", "Job Role", "Resume Link", "Consent", "Page URL"],
    row: (d, url) => [new Date(), d.fullName, d.phone, d.email, d.location, d.country,
      d.category, d.qualification, d.experience, d.jobRole, url, d.consent ? "Yes" : "No", d.pageUrl],
    subject: d => "New candidate: " + d.fullName + " (" + d.country + ")",
    required: ["fullName", "phone", "email", "location", "country", "category", "qualification", "experience"],
    needsResume: true
  },
  application: {
    name: "Applications",
    headers: ["Timestamp", "Job Code", "Job Title", "Country", "Full Name", "Phone", "Email",
      "Location", "Experience", "Resume Link", "Consent", "Page URL"],
    row: (d, url) => [new Date(), d.jobCode, d.jobTitle, d.jobCountry, d.fullName, d.phone,
      d.email, d.location, d.experience, url, d.consent ? "Yes" : "No", d.pageUrl],
    subject: d => "New application: " + d.jobTitle + " (" + d.jobCode + ") - " + d.fullName,
    required: ["jobCode", "jobTitle", "fullName", "phone", "email", "location"],
    needsResume: true
  },
  enquiry: {
    name: "Vacancy Enquiries",
    headers: ["Timestamp", "Job Code", "Job Title", "Name", "Phone", "Email", "Message", "Page URL"],
    row: d => [new Date(), d.jobCode, d.jobTitle, d.name, d.phone, d.email, d.message, d.pageUrl],
    subject: d => "Vacancy enquiry: " + d.jobTitle + " (" + d.jobCode + ") - " + d.name,
    required: ["jobCode", "jobTitle", "name", "phone", "message"]
  },
  employer: {
    name: "Employers",
    headers: ["Timestamp", "Company", "Contact Person", "Country", "Email", "Phone",
      "Required Positions", "Number of Workers", "Requirements", "Page URL"],
    row: d => [new Date(), d.company, d.contactPerson, d.country, d.email, d.phone,
      d.positions, d.workers, d.requirements, d.pageUrl],
    subject: d => "New employer enquiry: " + d.company + " (" + d.country + ")",
    required: ["company", "contactPerson", "country", "email", "phone", "positions", "workers"]
  },
  contact: {
    name: "Contacts",
    headers: ["Timestamp", "Name", "Email", "Phone", "Enquiry Type", "Message", "Page URL"],
    row: d => [new Date(), d.name, d.email, d.phone, d.enquiryType, d.message, d.pageUrl],
    subject: d => "New message (" + d.enquiryType + ") from " + d.name,
    required: ["name", "email", "phone", "enquiryType", "message"]
  }
};

/** Run once. Does not overwrite or insert sample jobs into existing data. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Open Apps Script from Extensions > Apps Script inside your spreadsheet.");
  Object.keys(SHEETS).forEach(k => getSheet_(ss, SHEETS[k]));
  const jobs = getJobsSheet_(ss);
  ensureJobValidations_(jobs);
  // Backfill missing defaults on existing rows without modifying filled cells.
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    for (let r = 2; r <= jobs.getLastRow(); r++) fillJobDefaults_(jobs, r);
    CacheService.getScriptCache().remove(JOB_CACHE_KEY);
  } finally {
    lock.releaseLock();
  }
  getResumeFolder_();
}

/** Handles single-cell edits AND multiple pasted rows. */
function onEdit(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  if (sh.getName() !== "Jobs" || e.range.getLastRow() < 2) return;
  const lock = LockService.getDocumentLock() || LockService.getScriptLock();
  if (!lock.tryLock(15000)) return;
  try {
    const start = Math.max(2, e.range.getRow());
    for (let row = start; row <= e.range.getLastRow(); row++) {
      fillJobDefaults_(sh, row);
    }
    CacheService.getScriptCache().remove(JOB_CACHE_KEY);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Generate unique job codes. Existing codes are never changed.
 * Code numbers may have gaps, which is safe.
 */
function fillJobDefaults_(sh, row) {
  const title = String(sh.getRange(row, 7).getDisplayValue() || "").trim();
  if (!title) return;
  const codeCell = sh.getRange(row, 1);
  if (!String(codeCell.getDisplayValue() || "").trim()) {
    const last = sh.getLastRow();
    const existing = last > 1
      ? sh.getRange(2, 1, last - 1, 1).getDisplayValues().flat()
      : [];
    let max = 0;
    existing.forEach(value => {
      const m = /^JOB-(\d+)$/i.exec(String(value).trim());
      if (m) max = Math.max(max, Number(m[1]));
    });
    codeCell.setValue("JOB-" + String(max + 1).padStart(3, "0"));
  }
  if (!sh.getRange(row, 2).getValue()) sh.getRange(row, 2).setValue("Active");
  if (!sh.getRange(row, 3).getValue()) sh.getRange(row, 3).setValue(new Date());
  if (!sh.getRange(row, 5).getValue()) sh.getRange(row, 5).setValue("No");
}

function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;
    if (action === "jobs") return json_({ result: "success", jobs: getJobs_() });
    return ContentService.createTextOutput("Devan Placements web app is running.");
  } catch (err) {
    return json_({ result: "error", message: String(err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    lock.waitLock(20000);
    locked = true;
    if (!e || !e.postData || !e.postData.contents) throw new Error("Empty request");
    const d = JSON.parse(e.postData.contents);
    const cfg = SHEETS[d.formType];
    if (!cfg) throw new Error("Unknown form type");
    const problem = validate_(cfg, d);
    if (problem) throw new Error(problem);

    const resumeUrl = cfg.needsResume ? saveResume_(d) : "";
    getSheet_(SpreadsheetApp.getActiveSpreadsheet(), cfg).appendRow(cfg.row(d, resumeUrl));
    // A notification failure must not turn a successfully saved submission into an error.
    try {
      notify_(cfg, d, resumeUrl);
    } catch (mailErr) {
      console.error("Notification email failed: " + mailErr);
    }
    return json_({ result: "success" });
  } catch (err) {
    console.error(err);
    return json_({ result: "error", message: String(err.message || err) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

function getJobsSheet_(ss) {
  let sh = ss.getSheetByName("Jobs");
  if (!sh) {
    sh = ss.insertSheet("Jobs", 0);
    sh.getRange(1, 1, 1, JOB_HEADERS.length).setValues([JOB_HEADERS]);
    sh.getRange(1, 1, 1, JOB_HEADERS.length)
      .setFontWeight("bold").setBackground("#0b1f3a").setFontColor("#ffffff");
    sh.setFrozenRows(1);
  }
  return sh;
}

function ensureJobValidations_(sh) {
  const rows = Math.max(1, sh.getMaxRows() - 1);
  const ruleStatus = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Active", "Closed"], true).build();
  const ruleEmployer = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Yes", "No"], true).build();
  sh.getRange(2, 2, rows, 1).setDataValidation(ruleStatus);
  sh.getRange(2, 5, rows, 1).setDataValidation(ruleEmployer);
}

function getJobs_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(JOB_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const sh = getJobsSheet_(SpreadsheetApp.getActiveSpreadsheet());
  const last = sh.getLastRow();
  const rows = last > 1
    ? sh.getRange(2, 1, last - 1, JOB_HEADERS.length).getValues()
    : [];
  const tz = Session.getScriptTimeZone();
  const jobs = rows
    .filter(r => String(r[6] || "").trim() &&
      String(r[1] || "").trim().toLowerCase() === "active")
    .map(r => {
      const j = {};
      JOB_KEYS.forEach((key, i) => {
        const v = r[i];
        j[key] = v instanceof Date
          ? Utilities.formatDate(v, tz, "yyyy-MM-dd")
          : String(v == null ? "" : v).trim();
      });
      if (j.showEmployer.toLowerCase() !== "yes") j.employer = "";
      delete j.showEmployer;
      const m = String(j.experience).match(/\d+/);
      j.expMin = m ? Number(m[0]) : 0;
      return j;
    })
    .sort((a, b) =>
      b.postedDate.localeCompare(a.postedDate) ||
      b.code.localeCompare(a.code, undefined, { numeric: true }));

  // CacheService entries have a size limit; skip caching if too large.
  const serialized = JSON.stringify(jobs);
  if (serialized.length < 90000) {
    try { cache.put(JOB_CACHE_KEY, serialized, JOBS_CACHE_SECONDS); }
    catch (err) { console.warn("Job cache skipped: " + err); }
  }
  return jobs;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(ss, cfg) {
  let sh = ss.getSheetByName(cfg.name);
  if (!sh) {
    sh = ss.insertSheet(cfg.name);
    sh.appendRow(cfg.headers);
    sh.getRange(1, 1, 1, cfg.headers.length)
      .setFontWeight("bold").setBackground("#0b1f3a").setFontColor("#ffffff");
    sh.setFrozenRows(1);
  }
  return sh;
}

function getResumeFolder_() {
  const folders = DriveApp.getFoldersByName(RESUME_FOLDER_NAME);
  return folders.hasNext()
    ? folders.next()
    : DriveApp.createFolder(RESUME_FOLDER_NAME);
}

function validate_(cfg, d) {
  for (const field of cfg.required) {
    if (!d[field] || !String(d[field]).trim()) return "Missing field: " + field;
  }
  if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) return "Invalid email address";
  if (cfg.needsResume && !d.resumeBase64) return "Resume is required";
  // Base64 expands file size by about one third.
  if (d.resumeBase64 && d.resumeBase64.length > Math.ceil(MAX_RESUME_BYTES * 4 / 3) + 8)
    return "Resume is larger than 5MB";
  return "";
}

function saveResume_(d) {
  const ext = String(d.resumeName || "").split(".").pop().toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) throw new Error("Only PDF, DOC or DOCX resumes are allowed.");
  const bytes = Utilities.base64Decode(d.resumeBase64);
  if (bytes.length > MAX_RESUME_BYTES) throw new Error("Resume is larger than 5MB.");
  const safeName = String(d.fullName || d.name || "candidate")
    .replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "_") || "candidate";
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
  const blob = Utilities.newBlob(bytes, d.resumeMime || "application/octet-stream",
    safeName + "_" + stamp + "." + ext);
  return getResumeFolder_().createFile(blob).getUrl();
}

function notify_(cfg, d, resumeUrl) {
  const skip = ["resumeBase64", "resumeMime", "pageUrl", "formType"];
  const lines = Object.keys(d)
    .filter(key => !skip.includes(key))
    .map(key => key + ": " + d[key]);
  if (resumeUrl) lines.push("Resume: " + resumeUrl);
  const mail = {
    to: NOTIFY_EMAIL,
    subject: cfg.subject(d),
    body: lines.join("\n")
  };
  if (d.email && /^\S+@\S+\.\S+$/.test(d.email)) mail.replyTo = d.email;
  MailApp.sendEmail(mail);
}
