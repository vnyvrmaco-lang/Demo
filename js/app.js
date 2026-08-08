/* ============================================================
   JJHMC — site JS
   ============================================================
   IMPORTANT: set this to your deployed Google Apps Script Web
   App URL (see backend/Code.gs + README.md). Until you set it,
   the booking form runs in DEMO mode (works, but nothing is
   really saved/emailed — it just shows you the confirmation UI).
   ============================================================ */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxDIJvjH8iQ1Ip46234iZzH4016bxdW7iIPKeV_KP4qUAYqfihL7lFQibH8u-tqKjC9xA/exec";
const DEMO_MODE = APPS_SCRIPT_URL.indexOf("PASTE_YOUR") !== -1;

/* ---------- nav toggle ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }
});

/* ---------- sample physician data (used until the Apps Script
   backend is live, and as the format admin.html writes back) ---------- */
const SAMPLE_PHYSICIANS = [
  {
    id: "dr-mehta",
    name: "Dr. Aakash Mehta",
    specialty: "Practice of Medicine (General OPD)",
    bio: "12 years in homoeopathic general practice, focus on chronic and lifestyle conditions.",
    whatsapp: "919000000001",
    zoom: "https://zoom.us/j/0000000001",
    email: "dr.mehta@jjhmcgujarat.com",
    slots: ["10:00 AM", "10:30 AM", "11:00 AM", "4:00 PM", "4:30 PM"]
  },
  {
    id: "dr-solanki",
    name: "Dr. Priya Solanki",
    specialty: "Obstetrics & Gynaecology",
    bio: "Specialises in women's health, prenatal and menstrual-disorder homoeopathic care.",
    whatsapp: "919000000002",
    zoom: "https://zoom.us/j/0000000002",
    email: "dr.solanki@jjhmcgujarat.com",
    slots: ["11:00 AM", "11:30 AM", "12:00 PM", "5:00 PM"]
  },
  {
    id: "dr-patel",
    name: "Dr. Ronak Patel",
    specialty: "Paediatrics",
    bio: "Child health, growth, and gentle homoeopathic remedies for common childhood ailments.",
    whatsapp: "919000000003",
    zoom: "https://zoom.us/j/0000000003",
    email: "dr.patel@jjhmcgujarat.com",
    slots: ["9:30 AM", "10:00 AM", "3:00 PM", "3:30 PM", "4:00 PM"]
  },
  {
    id: "dr-joshi",
    name: "Dr. Nilam Joshi",
    specialty: "Skin & Dermatology",
    bio: "Homoeopathic management of chronic skin conditions, allergies and dermatitis.",
    whatsapp: "919000000004",
    zoom: "https://zoom.us/j/0000000004",
    email: "dr.joshi@jjhmcgujarat.com",
    slots: ["12:00 PM", "12:30 PM", "5:30 PM", "6:00 PM"]
  }
];

function whatsappLink(numberE164NoPlus, message) {
  return `https://wa.me/${numberE164NoPlus}?text=${encodeURIComponent(message)}`;
}

/* ---------- backend call helper ---------- */
async function callBackend(action, payload) {
  if (DEMO_MODE) {
    // Simulated response so the page is fully clickable before setup.
    await new Promise(r => setTimeout(r, 500));
    if (action === "listPhysicians") return { ok: true, physicians: SAMPLE_PHYSICIANS };
    if (action === "createBooking") return { ok: true, bookingId: "DEMO-" + Date.now() };
    return { ok: true };
  }
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight on Apps Script
    body: JSON.stringify({ action, payload })
  });
  return res.json();
}

window.JJHMC = { SAMPLE_PHYSICIANS, whatsappLink, callBackend, DEMO_MODE };

