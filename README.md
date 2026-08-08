# JJHMC Website Redesign + Online Consulting — Setup Guide

## What's in this build
- `index.html`, `physicians.html`, `consulting.html`, `admin.html` — the redesigned site
- `css/style.css`, `js/app.js` — shared styling and logic
- `backend/Code.gs` — a Google Apps Script backend (free, no server to manage)

Right now the site runs in **demo mode** with sample physicians and fake bookings so
you can click through everything immediately. Follow the steps below to make it real
(real emails, real slot storage, real admin login).

---

## Why this stack (and not Zoom/WhatsApp APIs directly)
- **WhatsApp Business API** and the **Zoom API** both require a paid developer/business
  account, app review, and secret credentials that only your college can create — I can't
  generate those for you. So instead:
  - Patients reach physicians via **`wa.me` click-to-chat links** — no API, no approval,
    works the moment you put in a real WhatsApp number. This is the same mechanism
    "Chat on WhatsApp" buttons use on most business websites.
  - Each physician has **one personal Zoom Meeting link** (Zoom's free plan gives every
    account a Personal Meeting Room). The system emails that link to the patient — this
    is a real, working video consultation, just without dynamically generating a new
    Zoom meeting per booking. If you later get a paid Zoom account with API access, the
    `createBooking` function in `Code.gs` is exactly where you'd swap in a real
    Zoom-meeting-creation API call.
- **Google Forms / Sheets / Apps Script** cost nothing and need no hosting — a good fit
  since you already wanted a Google Form for intake.

---

## Step 1 — Create the Google Sheet + Apps Script backend
1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank sheet,
   name it e.g. **"JJHMC Consulting Data"**.
2. Extensions → Apps Script. Delete the placeholder code, paste in the full contents
   of `backend/Code.gs`.
3. In `Code.gs`, change `ADMIN_KEY` to a real secret password for your staff.
4. Click **Deploy → New deployment → type: Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click Deploy, and **authorize** the script when Google prompts you (it needs
     permission to send email as your Google account and edit the sheet).
5. Copy the **Web app URL** you're given — it looks like
   `https://script.google.com/macros/s/XXXXXXX/exec`.
6. Run the `listPhysicians` function once from the Apps Script editor (select it from
   the function dropdown, click Run) — this creates the `Physicians` and `Bookings`
   tabs in your sheet automatically.
7. Go to the **Physicians** tab in the sheet and add a row per real physician:
   `id, name, specialty, bio, whatsapp, email, zoom, slots`
   - `whatsapp`: country code + number, no `+` or spaces, e.g. `919812345678`
   - `zoom`: their personal Zoom link, e.g. `https://zoom.us/j/1234567890`
   - `slots`: comma-separated, e.g. `10:00 AM, 10:30 AM, 4:00 PM`

## Step 2 — Point the website at your backend
1. Open `js/app.js`.
2. Replace `PASTE_YOUR_DEPLOYED_APPS_SCRIPT_URL_HERE` with the Web app URL from Step 1.
3. That's it — demo mode turns off automatically and every page (booking, physicians,
   admin) now talks to your real Sheet.

## Step 3 — Add your Google Form for detailed medical intake/consent
1. Create a Google Form with your case-history / consent questions.
2. Form → Send → the `<>` embed icon → copy the `src="..."` URL.
3. In `consulting.html`, find the `<iframe id="intake-form-frame" ...>` and replace
   `PASTE_YOUR_GOOGLE_FORM_ID` with your real form's ID from that embed URL.
4. Optional: add an email question to the Form so you can match a Form response to a
   booking row in the `Bookings` sheet by email address.

## Step 4 — Set the admin key in the admin panel
`admin.html` currently checks the key against whatever `Code.gs` returns. Just make
sure the key you set in `ADMIN_KEY` in `Code.gs` is the one your staff enters on the
Admin Panel page. For anything more than a handful of staff, consider upgrading to
proper Google account-based login (Apps Script supports this too — ask if you want
this added).

## Step 5 — Publish the files
Upload the whole `site/` folder to your existing hosting (replacing/adding to the
current WordPress site), or host it as a separate subdomain such as
`consult.jjhmcgujarat.com` and link to it from the main WordPress menu. Any static
web host works — no server-side code runs outside Google's Apps Script.

---

## Daily use once set up
- **Patient books** on `consulting.html` → row added to `Bookings` sheet → email sent
  to patient (with Zoom link + WhatsApp button) and physician (with patient details +
  WhatsApp button).
- **Physician** opens the email, clicks "Open WhatsApp chat" to message the patient,
  and joins their own fixed Zoom room at the appointment time.
- **Admin/staff** open `admin.html`, enter the access key, and can add/edit physicians
  or see every booking (the `Bookings` sheet is also just a normal spreadsheet you can
  filter, sort, or export any time).

## Known limitations (flagged honestly)
- WhatsApp messaging is click-to-chat, not the paid WhatsApp Business API — no
  auto-replies or message templates, but no approval process needed either.
- Zoom links are fixed per physician, not a fresh meeting per booking.
- `MailApp` (Gmail) has a daily sending quota (100–1500 emails/day depending on
  account type) — plenty for a college OPD, but worth knowing.
- Admin login is a single shared password, not per-staff accounts.
