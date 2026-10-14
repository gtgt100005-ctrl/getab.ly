[admin.html](https://github.com/user-attachments/files/33441087/admin.html)
[app.js](https://github.com/user-attachments/files/33441102/app.js)[index.html](https://github.com/user-attachments/files/33441104/index.html)[schedule.html](https://github.com/user-attachments/files/33441106/schedule.html)[style.css](https://github.com/user-attachments/files/33441133/style.css)[teacher.html](https://github.com/user-attachments/files/33441138/teacher.html)<!DOCTYPE html>
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
