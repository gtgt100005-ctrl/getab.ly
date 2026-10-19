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

// مراقبة المحاضرات مع الفحص التلقائي لإعادة المحاضرات الملغاة لحالتها الطبيعية بعد مرور أسبوع
export function watchLectures(field, value, cb, onError = console.error) {
  const q = field ? query(lecturesRef, where(field, "==", value)) : lecturesRef;
  return onSnapshot(q, async snap => {
    const now = new Date();
    const list = [];

    for (const d of snap.docs) {
      const data = d.data();
      let currentStatus = data.status || "pending";

      // إذا كانت المحاضرة ملغاة ولديها تاريخ تحديث، نفحص الفارق الزمني
      if (currentStatus === "cancelled" && data.updatedAt) {
        const lastUpdate = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
        const diffDays = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
        
        // إذا مر أكثر من 6 أيام (انتقلنا للأسبوع القادم)، نرجعها تلقائياً إلى "pending"
        if (diffDays >= 6) {
          currentStatus = "pending";
          // تحديث قاعدة البيانات في الخلفية
          updateDoc(doc(db, "lectures", d.id), { status: "pending", updatedAt: new Date() }).catch(console.error);
        }
      }

      list.push({ id: d.id, ...data, status: currentStatus });
    }

    cb(sortLectures(list));
  }, onError);
}

export const addLecture = data => addDoc(lecturesRef, data);
export const deleteLecture = id => deleteDoc(doc(db, "lectures", id));

// تحديث الحالة مع حفظ وقت التغيير (updatedAt)
export const setStatus = (id, status) => updateDoc(doc(db, "lectures", id), { 
  status, 
  updatedAt: new Date() 
});

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
