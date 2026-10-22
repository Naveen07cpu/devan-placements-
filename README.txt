DEVAN PLACEMENTS - website v2

FILES
  index.html, jobs.html, job.html, privacy.html, terms.html   pages
  style.css                                                   all styling
  site.js    SETTINGS (phone, address, social links, Apps Script URL) + header/footer + shared code
  script.js  home page code      jobs.js  jobs list page      job.js  single job page
  Code.gs    paste into Google Apps Script (NOT uploaded to the website)
  robots.txt, sitemap.xml, favicon.svg                        search engines + browser tab icon
  images/hero.jpg                                             export from Figma (you must add this)

BEFORE YOU PUBLISH
  1. Open site.js and fill SITE: address, hours, mapsUrl, Facebook / Telegram / LinkedIn, registrationNo.
  2. In Google Apps Script: paste Code.gs, run setup() once, then Deploy > Manage deployments > Edit > New version.
  3. In the "Jobs" sheet, delete the 2 sample rows and add your real vacancies.
  4. In site.js set sampleJobsOnError: false.
  5. When the real domain is ready, replace https://www.devanplacements.com in site.js, the <head> of the pages,
     sitemap.xml and robots.txt.
  6. Have privacy.html and terms.html checked by a legal professional, then remove the yellow "Draft" notice.
