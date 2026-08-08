/**
 * JJHMC Online Consulting — backend
 * Deploy this bound to a Google Sheet (see README.md for step-by-step).
 * It gives you, for free, on Google's infrastructure:
 *   - a "database" (two tabs: Physicians, Bookings)
 *   - real confirmation emails to patient + physician (MailApp)
 *   - a simple admin key check for the admin panel
 *   - JSON API the website's js/app.js talks to
 *
 * It deliberately does NOT call the Zoom API or WhatsApp Business API —
 * those need a paid developer account + OAuth credentials only you can
 * create. Instead each physician has ONE personal Zoom meeting link
 * (free Zoom account, Settings > Personal Meeting Room) stored in the
 * Physicians sheet, and patients reach physicians via a wa.me
 * click-to-chat link (no API/approval needed, works today).
 */

const ADMIN_KEY = "CHANGE-THIS-TO-A-SECRET-YOU-CHOOSE"; // set in admin.html too, or share out-of-band
const COLLEGE_NAME = "Jay Jalaram Homoeopathic Medical College & Hospital";
const SHEET_ID = ""; // leave blank if this script is bound to the Sheet (Extensions > Apps Script)

function _ss() {
  return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function _sheet(name, headers) {
  const ss = _ss();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}

function physiciansSheet() {
  return _sheet("Physicians", ["id","name","specialty","bio","whatsapp","email","zoom","slots"]);
}
function bookingsSheet() {
  return _sheet("Bookings", ["timestamp","bookingId","date","slot","physicianId","physicianName","physicianEmail",
    "patientName","patientPhone","patientEmail","patientAge","symptoms","consent","consentTimestamp","status"]);
}

function doGet(e) {
  return _json({ ok: true, message: "JJHMC backend is running. POST actions from the website." });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const payload = body.payload || {};
    switch (action) {
      case "listPhysicians": return _json(listPhysicians());
      case "createBooking": return _json(createBooking(payload));
      case "adminUnlock": return _json({ ok: payload.key === ADMIN_KEY });
      case "listBookings": return _json(requireAdmin(payload) ? listBookings() : { ok:false, error:"unauthorized" });
      case "upsertPhysician": return _json(requireAdmin(payload) ? upsertPhysician(payload) : { ok:false, error:"unauthorized" });
      default: return _json({ ok:false, error:"unknown action" });
    }
  } catch (err) {
    return _json({ ok:false, error: String(err) });
  }
}

function requireAdmin(payload){ return payload.key === ADMIN_KEY; }

function listPhysicians() {
  const sh = physiciansSheet();
  const rows = sh.getDataRange().getValues();
  const headers = rows.shift();
  const physicians = rows.filter(r => r[0]).map(r => {
    const obj = {};
    headers.forEach((h,i) => obj[h] = r[i]);
    obj.slots = String(obj.slots || "").split(",").map(s=>s.trim()).filter(Boolean);
    return obj;
  });
  return { ok:true, physicians };
}

function upsertPhysician(p) {
  const sh = physiciansSheet();
  const data = sh.getDataRange().getValues();
  const id = p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
  const row = [id, p.name, p.specialty, p.bio, p.whatsapp, p.email, p.zoom, (p.slots||[]).join(", ")];
  for (let i=1;i<data.length;i++){
    if (data[i][0] === id) { sh.getRange(i+1,1,1,row.length).setValues([row]); return { ok:true, id }; }
  }
  sh.appendRow(row);
  return { ok:true, id };
}

function createBooking(b) {
  const bookingId = "JJH-" + new Date().getTime();
  bookingsSheet().appendRow([
    new Date(), bookingId, b.date, b.slot, b.physicianId, b.physicianName, b.physicianEmail,
    b.patientName, b.patientPhone, b.patientEmail, b.patientAge, b.symptoms,
    b.consent ? "YES" : "NO", b.consentTimestamp, "confirmed"
  ]);

  const waLinkForPatient = "https://wa.me/" + b.physicianWhatsapp +
    "?text=" + encodeURIComponent("Hello Dr. " + b.physicianName.replace("Dr. ","") +
      ", this is " + b.patientName + ". I booked an online consultation on " + b.date + " at " + b.slot + ".");

  // Email to patient
  MailApp.sendEmail({
    to: b.patientEmail,
    subject: "Your online consultation is confirmed — " + COLLEGE_NAME,
    htmlBody: `
      <p>Dear ${b.patientName},</p>
      <p>Your online consultation with <strong>${b.physicianName}</strong> is confirmed:</p>
      <ul>
        <li><strong>Date:</strong> ${b.date}</li>
        <li><strong>Time:</strong> ${b.slot}</li>
        <li><strong>Video call (Zoom):</strong> <a href="${b.zoomLink}">${b.zoomLink}</a></li>
      </ul>
      <p>Message your physician directly on WhatsApp any time:
        <a href="${waLinkForPatient}">Chat with ${b.physicianName} on WhatsApp</a></p>
      <p>Booking reference: ${bookingId}</p>
      <p>— ${COLLEGE_NAME}</p>
    `
  });

  // Email to physician
  MailApp.sendEmail({
    to: b.physicianEmail,
    subject: "New patient booking — " + b.date + " " + b.slot,
    htmlBody: `
      <p>Dear ${b.physicianName},</p>
      <p>A new online consultation has been booked with you:</p>
      <ul>
        <li><strong>Patient:</strong> ${b.patientName} (age ${b.patientAge || "—"})</li>
        <li><strong>Phone:</strong> ${b.patientPhone}</li>
        <li><strong>Email:</strong> ${b.patientEmail}</li>
        <li><strong>Reason:</strong> ${b.symptoms || "—"}</li>
        <li><strong>Date / Time:</strong> ${b.date} at ${b.slot}</li>
        <li><strong>Consent given:</strong> ${b.consent ? "Yes, at " + b.consentTimestamp : "No"}</li>
      </ul>
      <p>Your Zoom room: <a href="${b.zoomLink}">${b.zoomLink}</a></p>
      <p>Message the patient on WhatsApp: <a href="https://wa.me/${b.patientPhone.replace(/[^0-9]/g,"")}">Open WhatsApp chat</a></p>
      <p>Booking reference: ${bookingId}</p>
    `
  });

  return { ok:true, bookingId };
}

function listBookings() {
  const sh = bookingsSheet();
  const rows = sh.getDataRange().getValues();
  const headers = rows.shift();
  const bookings = rows.filter(r=>r[1]).map(r => {
    const obj = {};
    headers.forEach((h,i)=> obj[h]=r[i]);
    obj.consent = obj.consent === "YES";
    return obj;
  }).reverse();
  return { ok:true, bookings };
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
