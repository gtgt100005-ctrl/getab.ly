[Uploading admin.html…]()
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>لوحة الكنترول</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="wrap">
  <h1>لوحة الكنترول</h1>

  <div id="login" class="card login">
    <form id="loginForm" autocomplete="on">
      <label for="pw">كلمة السر</label>
      <input id="pw" name="password" type="password" autocomplete="current-password">
      <label style="display:flex;gap:8px;align-items:center;cursor:pointer">
        <input id="showPw" type="checkbox" style="width:auto;margin:0"> إظهار كلمة السر
      </label>
      <button id="go" type="submit" class="btn" style="width:100%;margin-top:12px">دخول</button>
      <p id="err" class="err"></p>
    </form>
  </div>

  <div id="panel" class="hide">

    <div class="card">
      <h2>إدارة اللافتة الإعلانية (الصفحة الرئيسية)</h2>
      <label for="bannerText">نص اللافتة أو التنبيه</label>
      <textarea id="bannerText" rows="3" placeholder="اكتب نص الإعلان هنا..." style="width:100%;padding:10px;background:#0b1024;color:#fff;border:1px solid var(--line);border-radius:10px;font-family:'Cairo',sans-serif;margin-bottom:12px"></textarea>
      <button id="saveBannerBtn" type="button" class="btn green" style="width:100%">حفظ ونشر اللافتة</button>
    </div>

    <div class="card">
      <div class="top"><h2>إضافة مادة</h2><button id="out" type="button" class="btn red sm">خروج</button></div>
      <form id="add" class="form">
        <div><label for="name">اسم المادة</label><input id="name" required></div>
        <div><label for="code">كود المادة</label><input id="code" required></div>
        <div><label for="year">السنة الدراسية</label><select id="year"></select></div>
        <div><label for="day">اليوم</label><select id="day"></select></div>
        <div><label for="slot">الفترة الزمنية</label><input id="slot" placeholder="08:00 - 10:00" required></div>
        <div><label for="room">القاعة</label><input id="room" required></div>
        <div><label for="teacher">اسم الأستاذ</label><input id="teacher" required></div>
        <div><label for="tcode">كود الأستاذ</label><input id="tcode" required></div>
        <div style="grid-column:1/-1"><button type="submit" class="btn green" style="width:100%">إضافة</button></div>
      </form>
    </div>

    <div class="card">
      <h2>المواد المضافة</h2>
      <div class="tw"><table>
        <thead><tr><th>السنة</th><th>اليوم</th><th>الوقت</th><th>المادة</th><th>الأستاذ</th><th>كود الأستاذ</th><th>الحالة</th><th></th></tr></thead>
        <tbody id="rows"></tbody>
      </table></div>
    </div>

    <div class="card">
      <h2>تغيير كلمة السر</h2>
      <form id="pwf" class="form">
        <div><label for="old">الحالية</label><input id="old" type="password" required></div>
        <div><label for="new1">الجديدة (6 أحرف على الأقل)</label><input id="new1" type="password" minlength="6" required></div>
        <div><label for="new2">تأكيد الجديدة</label><input id="new2" type="password" minlength="6" required></div>
        <div style="grid-column:1/-1"><button type="submit" class="btn" style="width:100%">تغيير</button></div>
      </form>
    </div>
  </div>

  <div class="links"><a class="btn" href="index.html">الرئيسية</a></div>
</div>

<script type="module">
import { db, DAYS, YEARS, watchLectures, addLecture, deleteLecture, setStatus, checkAdmin, changeAdmin, esc, badge } from "./app.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = id => document.getElementById(id);
let watching = false;

$("year").innerHTML = YEARS.map(y => `<option>${esc(y)}</option>`).join("");
$("day").innerHTML = DAYS.map(d => `<option>${esc(d)}</option>`).join("");

$("showPw").addEventListener("change", e => {
  $("pw").type = e.target.checked ? "text" : "password";
});

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("err").textContent = "";
  const pw = $("pw").value;
  if (!pw) { $("err").textContent = "اكتب كلمة السر"; return; }
  $("go").disabled = true;
  try {
    if (await checkAdmin(pw)) {
      $("login").classList.add("hide");
      $("panel").classList.remove("hide");
      startPanel();
    } else {
      $("err").textContent = "كلمة السر غير صحيحة";
    }
  } catch (x) {
    console.error(x);
    $("err").textContent = "تعذر الاتصال بقاعدة البيانات";
  } finally {
    $("go").disabled = false;
  }
});

$("out").addEventListener("click", () => location.reload());

function startPanel() {
  loadBanner();
  if (watching) return;
  watching = true;
  watchLectures(null, null, renderRows, err => {
    console.error(err);
    $("rows").innerHTML = `<tr><td colspan="8" class="msg">تعذر تحميل المواد</td></tr>`;
  });
}

async function loadBanner() {
  try {
    const s = await getDoc(doc(db, "settings", "banner"));
    if (s.exists()) $("bannerText").value = s.data().text || "";
  } catch (e) { console.error(e); }
}

$("saveBannerBtn").addEventListener("click", async () => {
  try {
    await setDoc(doc(db, "settings", "banner"), { text: $("bannerText").value.trim() });
    alert("تم نشر اللافتة الإعلانية بنجاح!");
  } catch (x) {
    console.error(x);
    alert("تعذر حفظ اللافتة");
  }
});

function renderRows(list) {
  if (!list.length) {
    $("rows").innerHTML = `<tr><td colspan="8" class="msg">لا توجد مواد</td></tr>`;
    return;
  }
  $("rows").innerHTML = list.map(l => `
    <tr class="${esc(l.status || "pending")}">
      <td>${esc(l.year)}</td>
      <td>${esc(l.day)}</td>
      <td>${esc(l.slot)}</td>
      <td>${esc(l.name)}<br><small>${esc(l.code)} - ${esc(l.room)}</small></td>
      <td>${esc(l.teacher)}</td>
      <td>${esc(l.tcode)}</td>
      <td>${badge(l.status)}</td>
      <td style="white-space:nowrap">
        <button type="button" class="btn green sm" data-act="confirmed" data-id="${esc(l.id)}">تأكيد</button>
        <button type="button" class="btn sm" data-act="cancelled" data-id="${esc(l.id)}">إلغاء</button>
        <button type="button" class="btn red sm" data-act="delete" data-id="${esc(l.id)}">حذف</button>
      </td>
    </tr>`).join("");
}

$("rows").addEventListener("click", async e => {
  const b = e.target.closest("button[data-act]");
  if (!b) return;
  const { act, id } = b.dataset;
  try {
    if (act === "delete") {
      if (confirm("حذف هذه المادة؟")) await deleteLecture(id);
    } else {
      await setStatus(id, act);
    }
  } catch (x) {
    console.error(x);
    alert("تعذر تنفيذ العملية");
  }
});

$("add").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await addLecture({
      name: $("name").value.trim(),
      code: $("code").value.trim(),
      year: $("year").value,
      day: $("day").value,
      slot: $("slot").value.trim(),
      room: $("room").value.trim(),
      teacher: $("teacher").value.trim(),
      tcode: $("tcode").value.trim(),
      status: "pending"
    });
    e.target.reset();
  } catch (x) {
    console.error(x);
    alert("تعذرت إضافة المادة");
  }
});

$("pwf").addEventListener("submit", async e => {
  e.preventDefault();
  if ($("new1").value !== $("new2").value) { alert("كلمتا السر الجديدتان غير متطابقتين"); return; }
  try {
    if (await changeAdmin($("old").value, $("new1").value)) {
      alert("تم تغيير كلمة السر");
      e.target.reset();
    } else {
      alert("كلمة السر الحالية غير صحيحة");
    }
  } catch (x) {
    console.error(x);
    alert("تعذر تغيير كلمة السر");
  }
});
</script>
</body>
</html>

<!-- قسم إدارة اللافتة الإعلانية (مرة واحدة فقط) -->
<div class="card" style="margin-top: 20px; padding: 20px; background: #131b2e; border-radius: 12px; border: 1px solid rgba(0,229,255,0.2);">
  <h3 style="color: #00e5ff; margin-bottom: 10px;">📢 إدارة اللافتة الإعلانية (الصفحة الرئيسية)</h3>
  <textarea id="bannerText" placeholder="اكتب نص الإعلان أو التنبيه هنا..." style="width: 100%; height: 80px; background: #0b0f19; color: #fff; border: 1px solid #38bdf8; border-radius: 8px; padding: 10px; font-family: 'Cairo';"></textarea>
  <button id="saveBannerBtn" class="btn" style="margin-top: 10px; cursor: pointer;">حفظ ونشر اللافتة</button>
</div>

<script type="module">
  import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
  const db = getFirestore();

  // جلب النص الحالي عند فتح لوحة التحكم
  async function loadBanner() {
    const docSnap = await getDoc(doc(db, "settings", "banner"));
    if (docSnap.exists()) {
      document.getElementById('bannerText').value = docSnap.data().text || "";
    }
  }
  loadBanner();

  // حفظ النص الجديد عند الضغط
  document.getElementById('saveBannerBtn').onclick = async () => {
    const text = document.getElementById('bannerText').value;
    await setDoc(doc(db, "settings", "banner"), { text: text });
    alert("تم نشر اللافتة الإعلانية بنجاح في الصفحة الرئيسية!");
  };
</script>o

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, addDoc, getDoc, setDoc, deleteDoc, updateDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDMqDQWkQI0Pj3HkQs0bqmT0JTmi8mVfJk",
  authDomain: "moez-125d2.firebaseapp.com",
  projectId: "moez-125d2",
  storageBucket: "moez-125d2.firebasestorage.app",
  messagingSenderId: "340855843654",
  appId: "1:340855843654:web:cc672b26682c19903e5347",
  measurementId: "G-FNYMMC3Z6V"
};

export const db = getFirestore(initializeApp(firebaseConfig));
const lecturesRef = collection(db, "lectures");
const adminRef = doc(db, "settings", "admin");

export const DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
export const YEARS = ["السنة الأولى", "السنة الثانية", "السنة الثالثة", "السنة الرابعة"];
export const STATUS = { confirmed: "✔ مؤكدة", cancelled: "✖ ملغاة", pending: "● غير محددة" };

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const badge = s => `<span class="b ${STATUS[s] ? s : "pending"}">${STATUS[s] || STATUS.pending}</span>`;
export const sortLectures = l => [...l].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || String(a.slot).localeCompare(b.slot, "ar"));

export function watchLectures(field, value, cb, onError = console.error) {
  const q = field ? query(lecturesRef, where(field, "==", value)) : lecturesRef;
  return onSnapshot(q, snap => cb(sortLectures(snap.docs.map(d => ({ id: d.id, ...d.data() })))), onError);
}
export const addLecture = data => addDoc(lecturesRef, data);
export const deleteLecture = id => deleteDoc(doc(db, "lectures", id));
export const setStatus = (id, status) => updateDoc(doc(db, "lectures", id), { status });

export async function sha256(t) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function checkAdmin(pw) {
  let s = await getDoc(adminRef);
  if (!s.exists()) { 
    await setDoc(adminRef, { hash: await sha256("admin123") }); 
    s = await getDoc(adminRef); 
  }
  return s.data().hash === await sha256(pw);
}

export async function changeAdmin(oldPw, newPw) {
  if (!(await checkAdmin(oldPw))) return false;
  await setDoc(adminRef, { hash: await sha256(newPw) });
  return true;
}

<!-- مكان عرض اللافتة الإعلانية (قراءة فقط) -->
<div id="announcementBanner" style="display: none; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; padding: 12px 20px; border-radius: 10px; font-weight: bold; text-align: center; margin: 15px auto; max-width: 900px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
  🚨 <span id="bannerContent"></span>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
  
  const db = getFirestore(initializeApp({
    apiKey: "AIzaSyDMqDQWkQI0Pj3HkQs0bqmT0JTmi8mVfJk",
    authDomain: "moez-125d2.firebaseapp.com",
    projectId: "moez-125d2",
    storageBucket: "moez-125d2.firebasestorage.app",
    messagingSenderId: "340855843654",
    appId: "1:340855843654:web:cc672b26682c19903e5347",
    measurementId: "G-FNYMMC3Z6V"
  }));

  // الاستماع اللحظي للكتلة العارضة فقط
  onSnapshot(doc(db, "settings", "banner"), (docSnap) => {
    if (docSnap.exists() && docSnap.data().text) {
      const banner = document.getElementById('announcementBanner');
      document.getElementById('bannerContent').innerText = docSnap.data().text;
      banner.style.display = "block";
    } else {
      document.getElementById('announcementBanner').style.display = "none";
    }
  });
</script><!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>جداول المحاضرات</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="wrap">
  <h1>جداول المحاضرات الدراسية</h1>
  <div class="card">
    <h2>اختر سنتك الدراسية</h2>
    <div class="grid">
      <a class="btn big" href="schedule.html?year=1">السنة الأولى</a>
      <a class="btn big" href="schedule.html?year=2">السنة الثانية</a>
      <a class="btn big" href="schedule.html?year=3">السنة الثالثة</a>
      <a class="btn big" href="schedule.html?year=4">السنة الرابعة</a>
    </div>
  </div>
  <div class="links">
    <a class="btn green" href="teacher.html">دخول الأستاذ</a>
    <a class="btn red" href="admin.html">لوحة الكنترول</a>
  </div>
</div>
</body>
</html>

k<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>جدول المحاضرات الشبكي</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<style>
  body { font-family: 'Cairo', sans-serif; background-color: #0b0f19; color: #fff; margin: 0; padding: 20px; }
  .wrap { max-width: 1200px; margin: auto; text-align: center; }
  h1 { color: #00e5ff; margin-bottom: 5px; }
  p.subtitle { color: #94a3b8; margin-bottom: 20px; font-size: 14px; }
  .card { background: #131b2e; padding: 20px; border-radius: 16px; box-shadow: 0 4px 30px rgba(0, 229, 255, 0.15); overflow-x: auto; border: 1px solid rgba(0, 229, 255, 0.2); }
  
  table.matrix-table { width: 100%; border-collapse: separate; border-spacing: 8px; text-align: center; }
  table.matrix-table th, table.matrix-table td { padding: 12px; font-size: 14px; }
  table.matrix-table th { background: rgba(0, 229, 255, 0.05); color: #00e5ff; font-weight: 700; border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 10px; }
  
  .slot-cell {
    background: rgba(255, 255, 255, 0.02);
    border: 2px solid rgba(0, 229, 255, 0.3);
    border-radius: 12px;
    height: 120px;
    vertical-align: middle;
    transition: 0.3s;
    padding: 8px;
  }
  .slot-cell:hover {
    border-color: #00e5ff;
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
  }
  
  .has-lecture {
    background: rgba(2, 132, 199, 0.15);
    border: 2px solid #38bdf8;
  }

  /* تمييز المربعات بحسب الحالة */
  .lec-confirmed {
    border-color: #22c55e !important;
    background: rgba(34, 197, 94, 0.15) !important;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.2);
  }
  .lec-cancelled {
    border-color: #ef4444 !important;
    background: rgba(239, 68, 68, 0.15) !important;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
  }

  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 6px;
  }
  .status-confirmed { background: rgba(34, 197, 94, 0.25); color: #4ade80; border: 1px solid #22c55e; }
  .status-cancelled { background: rgba(239, 68, 68, 0.25); color: #f87171; border: 1px solid #ef4444; }
  .status-pending { background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid #eab308; }

  .lec-name { font-weight: 900; color: #fff; font-size: 14px; margin-bottom: 4px; }
  .lec-code { font-size: 11px; color: #38bdf8; background: rgba(56, 189, 248, 0.1); display: inline-block; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; }
  .lec-room, .lec-teacher { font-size: 11px; color: #cbd5e1; }

  .btn { display: inline-block; padding: 10px 25px; background: #0284c7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; transition: 0.3s; margin-top: 20px; }
</style>
</head>
<body>
<div class="wrap">
  <h1 id="yearTitle">جدول المحاضرات</h1>
  <p class="subtitle">خطوتك الأولى: جدول الأسبوع المعتمد</p>
  
  <div class="card">
    <table class="matrix-table">
      <thead>
        <tr>
          <th style="width: 120px;">Days</th>
          <th>08:30 - 10:30</th>
          <th>10:30 - 12:30</th>
          <th>12:30 - 02:30</th>
          <th>02:30 - 04:30</th>
        </tr>
      </thead>
      <tbody id="tableBody">
      </tbody>
    </table>
  </div>

  <div class="links">
    <a class="btn" href="index.html">الصفحة الرئيسية</a>
  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDMqDQWkQI0Pj3HkQs0bqmT0JTmi8mVfJk",
    authDomain: "moez-125d2.firebaseapp.com",
    projectId: "moez-125d2",
    storageBucket: "moez-125d2.firebasestorage.app",
    messagingSenderId: "340855843654",
    appId: "1:340855843654:web:cc672b26682c19903e5347",
    measurementId: "G-FNYMMC3Z6V"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const urlParams = new URLSearchParams(window.location.search);
  const yearParam = parseInt(urlParams.get('year') || "1");

  const yearNames = { 1: "السنة الأولى", 2: "السنة الثانية", 3: "السنة الثالثة", 4: "السنة الرابعة" };
  document.getElementById('yearTitle').innerText = `جدول محاضرات ${yearNames[yearParam] || 'الدراسة'}`;

  const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

  function getSlotIndex(slotStr) {
    if (!slotStr) return -1;
    let s = slotStr.trim();
    if (s.includes("08:30") || s.includes("8:30")) return 0;
    if (s.includes("10:30")) return 1;
    if (s.includes("12:30")) return 2;
    if (s.includes("02:30") || s.includes("2:30")) return 3;
    return -1;
  }

  // الاستماع اللحظي الفوري لأي تغيير في Firebase
  onSnapshot(collection(db, "lectures"), (snapshot) => {
    let grid = {};
    days.forEach(d => { grid[d] = [null, null, null, null]; });

    snapshot.forEach(doc => {
      const item = doc.data();
      if (Number(item.year) === yearParam) {
        let dayKey = item.day ? item.day.trim() : "";
        let idx = getSlotIndex(item.slot);
        if (grid[dayKey] && idx !== -1) {
          grid[dayKey][idx] = item;
        }
      }
    });

    let html = "";
    days.forEach(day => {
      html += `<tr><th style="font-weight: 900; color: #fff;">${day}</th>`;
      
      for (let i = 0; i < 4; i++) {
        let lec = grid[day][i];
        if (lec) {
          let statusHTML = "";
          let extraClass = "";

          // الفحص الدقيق لخاصية status المحدثة من الأستاذ
          if (lec.status === "مؤكدة" || lec.status === "confirmed") {
            statusHTML = `<div class="status-badge status-confirmed">✓ مؤكدة</div>`;
            extraClass = "lec-confirmed";
          } else if (lec.status === "ملغاة" || lec.status === "cancelled") {
            statusHTML = `<div class="status-badge status-cancelled">✕ ملغاة</div>`;
            extraClass = "lec-cancelled";
          } else {
            statusHTML = `<div class="status-badge status-pending">غير محددة</div>`;
          }

          html += `
            <td class="slot-cell has-lecture ${extraClass}">
              ${statusHTML}
              <div class="lec-name">${lec.name}</div>
              <div class="lec-code">${lec.code}</div>
              <div class="lec-room">📍 ${lec.room}</div>
              <div class="lec-teacher">👨‍🏫 ${lec.teacher}</div>
            </td>
          `;
        } else {
          html += `<td class="slot-cell"></td>`;
        }
      }
      html += `</tr>`;
    });

    document.getElementById('tableBody').innerHTML = html;
  });
</script>
</body>
</html>

:root{--bg:#0a0e1a;--card:#121830;--line:#232c52;--txt:#e8ecff;--mut:#8b95c0;--c1:#00e5ff;--c2:#b45cff;--ok:#2dff9a;--no:#ff4d6d;--wait:#ffc233}
*{box-sizing:border-box;margin:0}
body{font-family:'Cairo',sans-serif;background:radial-gradient(circle at 20% 0,#16204a,var(--bg) 55%) fixed;color:var(--txt);min-height:100vh;padding:20px;line-height:1.7}
.wrap{max-width:1000px;margin:auto}
h1{text-align:center;font-size:clamp(1.6rem,5vw,2.6rem);font-weight:900;color:var(--c1);text-shadow:0 0 18px var(--c1);margin:24px 0}
h2{color:var(--c2);margin-bottom:14px;text-shadow:0 0 12px rgba(180,92,255,.5)}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;margin-bottom:20px;box-shadow:0 0 25px rgba(0,229,255,.06)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
.btn{display:inline-block;font:inherit;font-weight:700;color:var(--txt);background:transparent;border:1px solid var(--c1);border-radius:12px;padding:12px 18px;cursor:pointer;text-decoration:none;text-align:center;transition:.25s}
.btn:hover,.btn:focus-visible{background:var(--c1);color:#001018;box-shadow:0 0 20px var(--c1);outline:0}
.btn.big{padding:34px 10px;font-size:1.3rem}
.btn.red{border-color:var(--no)}.btn.red:hover{background:var(--no);color:#fff;box-shadow:0 0 20px var(--no)}
.btn.green{border-color:var(--ok)}.btn.green:hover{background:var(--ok);color:#001810;box-shadow:0 0 20px var(--ok)}
.btn.sm{padding:5px 12px;font-size:.9rem}
input,select{width:100%;font:inherit;color:var(--txt);background:#0b1024;border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:12px}
input:focus,select:focus{outline:0;border-color:var(--c1);box-shadow:0 0 12px rgba(0,229,255,.4)}
label{display:block;color:var(--mut);font-size:.9rem;margin-bottom:4px}
.form{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0 16px}
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse;min-width:640px}
th,td{padding:12px;text-align:center;border-bottom:1px solid var(--line)}
th{color:var(--c1);white-space:nowrap}
tr:hover td{background:rgba(255,255,255,.03)}
tr.cancelled td:not(:last-child){opacity:.55}
.b{display:inline-block;padding:2px 12px;border-radius:99px;font-size:.85rem;font-weight:700;white-space:nowrap;border:1px solid currentColor}
.b.confirmed{color:var(--ok);box-shadow:0 0 10px var(--ok)}
.b.cancelled{color:var(--no);box-shadow:0 0 10px var(--no)}
.b.pending{color:var(--wait);box-shadow:0 0 10px var(--wait)}
.links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:30px}
.top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.msg{text-align:center;color:var(--mut);padding:20px}
.err{color:var(--no);min-height:1.6em}
.hide{display:none!important}
.login{max-width:380px;margin:60px auto}
@media(max-width:600px){body{padding:12px}.card{padding:14px}}

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>واجهة الأستاذ</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="wrap">
  <h1>واجهة الأستاذ</h1>
  <div id="login" class="card login">
    <label for="code">كود الأستاذ</label>
    <input id="code" autocomplete="off">
    <button id="go" class="btn" style="width:100%">دخول</button>
    <p id="err" class="err"></p>
  </div>
  <div id="panel" class="card hide">
    <div class="top"><h2>محاضراتي</h2><button id="out" class="btn red sm">خروج</button></div>
    <div class="tw"><table>
      <thead><tr><th>السنة</th><th>اليوم</th><th>الوقت</th><th>المادة</th><th>القاعة</th><th>الحالة</th><th>إجراء</th></tr></thead>
      <tbody id="rows"></tbody>
    </table></div>
  </div>
  <div class="links"><a class="btn" href="index.html">الرئيسية</a></div>
</div>
<script type="module">
import { YEARS, watchLectures, setStatus, esc, badge } from "./app.js";
const $ = id => document.getElementById(id);
let stop = null;
function start(code) {
  $("login").classList.add("hide"); $("panel").classList.remove("hide");
  stop = watchLectures("teacherCode", code, list => {
    if (!list.length) { sessionStorage.removeItem("tcode"); }
    $("rows").innerHTML = list.length ? list.map(l => `<tr class="${esc(l.status)}">
      <td>${esc(YEARS[l.year - 1])}</td><td>${esc(l.day)}</td><td>${esc(l.slot)}</td><td>${esc(l.name)}</td><td>${esc(l.room)}</td><td>${badge(l.status)}</td>
      <td><button class="btn green sm" data-id="${l.id}" data-s="confirmed">تأكيد</button>
          <button class="btn red sm" data-id="${l.id}" data-s="cancelled">إلغاء</button>
          <button class="btn sm" data-id="${l.id}" data-s="pending">إعادة</button></td></tr>`).join("")
      : '<tr><td colspan="7" class="msg err">لا توجد محاضرات بهذا الكود. تأكد من الكود وسجّل الدخول مجدداً.</td></tr>';
  }, e => $("rows").innerHTML = `<tr><td colspan="7" class="msg err">${esc(e.message)}</td></tr>`);
}
$("go").onclick = () => {
  const c = $("code").value.trim();
  if (!c) { $("err").textContent = "أدخل كود الأستاذ"; return; }
  sessionStorage.tcode = c; start(c);
};
$("code").onkeydown = e => e.key === "Enter" && $("go").click();
$("out").onclick = () => { sessionStorage.removeItem("tcode"); stop && stop(); location.reload(); };
$("rows").onclick = async e => {
  const b = e.target.closest("button[data-id]"); if (!b) return;
  try { await setStatus(b.dataset.id, b.dataset.s); } catch (x) { alert("تعذر التحديث: " + x.message); }
};
if (sessionStorage.tcode) start(sessionStorage.tcode);
</script>
</body>
</html>
