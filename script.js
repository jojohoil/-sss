// أدوات عامة
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// التحقق السعودي (هوية 10 أرقام تبدأ بـ 1 أو 2 غالبًا)
function isSaudiId(val){
  return /^[12]\d{9}$/.test(val.trim());
}
function isSaPhone(val){
  return /^05\d{8}$/.test(val.trim());
}

function saveToLocal(record){
  const key = "hm_responses";
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  list.push(record);
  localStorage.setItem(key, JSON.stringify(list));
}

async function saveToAppsScript(record){
  try{
    const url = (window.APP_CONFIG && window.APP_CONFIG.APPS_SCRIPT_URL) || "";
    if(!url) return { ok:false, note:"no_url" };
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(record)
    });
    if(!resp.ok) throw new Error("HTTP "+resp.status);
    const data = await resp.json().catch(()=>({}));
    return { ok:true, data };
  }catch(err){
    console.error(err);
    return { ok:false, error:String(err) };
  }
}

// التدفق
const pages = ["#page-form", "#page-video1", "#page-video2", "#page-quiz", "#page-rating", "#page-done"];
function show(id){
  pages.forEach(p=> $(p).classList.add("hidden"));
  $(id).classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}

// بدء الدورة
$("#startBtn").addEventListener("click", () => {
  const name = $("#name").value.trim();
  const id = $("#idNumber").value.trim();
  const phone = $("#phone").value.trim();
  const email = $("#email").value.trim();
  const birth = $("#birthdate").value;

  if(!name) return alert("الرجاء إدخال الاسم الرباعي");
  if(!isSaudiId(id)) return alert("رقم الهوية غير صحيح (10 أرقام سعودية)");
  if(!isSaPhone(phone)) return alert("رقم الجوال السعودي يبدأ بـ05 ويتكون من 10 أرقام");
  if(!email) return alert("الرجاء إدخال البريد الإلكتروني");
  if(!birth) return alert("الرجاء اختيار تاريخ الميلاد");

  // حفظ مبدئي في الذاكرة أثناء التنقل
  sessionStorage.setItem("hm_user", JSON.stringify({name,id,phone,email,birth,ts:new Date().toISOString()}));
  show("#page-video1");
});

// تنقل الفيديو
$("#nextVideo1").addEventListener("click", ()=> show("#page-video2"));
$("#nextVideo2").addEventListener("click", ()=> show("#page-quiz"));

// نتيجة الاختبار
$("#resultBtn").addEventListener("click", () => {
  const q1 = $$("input[name=q1]").find(r=>r.checked)?.value;
  const q2 = $$("input[name=q2]").find(r=>r.checked)?.value;
  const q3 = $$("input[name=q3]").find(r=>r.checked)?.value;
  let score = 0;
  if(q1 === "نعم") score++;
  if(q2 === "نعم") score++;
  if(q3 === "خطأ") score++;

  $("#result").textContent = `نتيجتك: ${score} من 3`;
  $("#resultNote").innerHTML = score>=2 ? '<span class=\"badge\">ممتاز، انتقل للتقييم</span>' : '<span class=\"badge\">يفضل إعادة مشاهدة المقاطع</span>';
  $("#goRate").disabled = score < 2;
});

$("#goRate").addEventListener("click", ()=> show("#page-rating"));

// إنهاء الدورة وحفظ
$("#finishBtn").addEventListener("click", async () => {
  const user = JSON.parse(sessionStorage.getItem("hm_user") || "{}");
  const rate1 = $("#rate1").value;
  const rate2 = $("#rate2").value;
  const record = {
    ...user,
    quiz: {
      q1: $$("input[name=q1]").find(r=>r.checked)?.value || "",
      q2: $$("input[name=q2]").find(r=>r.checked)?.value || "",
      q3: $$("input[name=q3]").find(r=>r.checked)?.value || "",
    },
    score: $("#result").textContent.replace(/\D+/g,'') || "",
    ratings: { presenter: rate1, content: rate2 },
    finished_at: new Date().toISOString()
  };

  saveToLocal(record);
  const r = await saveToAppsScript(record);
  if(r.ok){ sessionStorage.removeItem("hm_user"); }
  $("#saveStatus").innerHTML = r.ok
    ? '<small class=\"muted\">تم الحفظ في Google Sheets بنجاح ✅</small>'
    : '<small class=\"muted\">تم الحفظ محليًا ✅ (يمكن تصديرها من صفحة الإدارة)</small>';
  show("#page-done");
});

// إدارة
window.openAdmin = function(){
  const pass = prompt("الرجاء إدخال كلمة المرور");
  if(pass === "0563"){
    location.href = "admin.html";
  }else{
    alert("كلمة المرور غير صحيحة");
  }
};