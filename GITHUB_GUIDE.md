# رفع تطبيق Sakina على GitHub — دليل خطوة بخطوة

## الخطوة 1 — أنشئ حساب GitHub (لو مش موجود)
- افتح https://github.com/signup وسجّل حساب جديد (مجاني).

## الخطوة 2 — أنشئ مستودعًا جديدًا (Repository)
1. ادخل على https://github.com/new
2. Repository name: `sakina-quran-app`
3. اختر **Public** (أو Private لو حابب)
4. **لا تضع علامة** على "Add a README file" (فيه عندنا README جاهز)
5. اضغط **Create repository**

## الخطوة 3 — ثبّت Git على جهازك (لو مش مثبّت)
- **Windows**: نزّل من https://git-scm.com/download/win وشغّل المثبّت (الخيارات الافتراضية)
- **Mac**: `brew install git` (أو من git-scm.com)
- **Linux**: `sudo apt install git`

## الخطوة 4 — افتح Terminal داخل مجلد التطبيق
- **Windows**: افتح مجلد `quran-app` → اضغط كليك يمين → **"Open Git Bash here"** أو اكتب `cmd` في شريط العنوان وادخل.
- **Mac**: افتح Terminal واكتب `cd ` (بعدها مسافة) واسحب مجلد `quran-app` عليه → Enter.
- تأكد إنك داخل المجلد: `ls` يجب أن تظهر `index.html` و `js/` و `css/`.

## الخطوة 5 — اربط هويتك (مرة واحدة فقط)
```
git config --global user.name "اسمك"
git config --global user.email "بريدك@example.com"
```

## الخطوة 6 — ارفع الملفات
انسخ الأسطر دي بالترتيب (وغيّر `USERNAME` لاسم مستخدمك):

```
git init -b main
git add .
git commit -m "Sakina — premium Quran audio app"
git branch -M main
git remote add origin https://github.com/USERNAME/sakina-quran-app.git
git push -u origin main
```

عند الطلب:
- **Username**: اسم مستخدم GitHub
- **Password**: مش كلمة السر — اعمل **Personal Access Token** من:
  https://github.com/settings/tokens → **Generate new token (classic)** → علّم على `repo` → انسخه والصقه هنا.

## الخطوة 7 — افتح التطبيق من الرابط
بعد الرفع، هيظهر عندك في الصفحة:
`https://USERNAME.github.io` بعد تفعيل Pages، أو ببساطة اعرض الكود من المستودع.

---

### طريقة أسهل: GitHub Desktop (بدون Terminal)
1. نزّل https://desktop.github.com وسجّل الدخول
2. **File → Add local repository** → اختر مجلد `quran-app`
3. **Publish repository** → Public → Publish
4. خلاص! هتلاقي الكود على حسابك.

### طريقة التشغيل بعد التنزيل من GitHub
```bash
node server.mjs     # ثم افتح http://localhost:8080
```
أو لو معندكش Node:
```bash
python3 -m http.server 8080
```

---

# طريقة التابلت (Android / iPad) — بدون Terminal نهائيًا

لو شغال على تابلت، استخدم **النسخة ذات الملف الواحد** `sakina-single.html`
(كل حاجة مدمجة جوه الملف: الصور + الصوتيات + المصحف + الخطوط — 13 MB).

## الرفع على GitHub من متصفح التابلت:
1. نزّل ملف `sakina-single.html` على التابلت.
2. **أعد تسميته إلى `index.html`** (في مدير الملفات).
3. افتح https://github.com على متصفح التابلت وسجّل الدخول (أو اعمل حساب من
   https://github.com/signup).
4. اضغط **+** (أعلى يمين) → **New repository**:
   - الاسم: `sakina-quran`
   - Public → **Create repository**
5. في الصفحة الجديدة اضغط **uploading an existing file** → **Add file → Upload files**.
6. اختر ملف `index.html` من التابلت → **Commit changes**.
7. ادخل **Settings** (تبويب فوق) → **Pages** (من القائمة الجانبية):
   - Source: **Deploy from a branch** → **main** → **/ (root)** → **Save**.
8. انتظر دقيقة أو دقيقتين، ثم افتح:
   **https://اسمك.github.io/sakina-quran/**
   (لو سميت المستودع `اسمك.github.io` هيكون الرابط https://اسمك.github.io مباشرة)

## شغّله على التابلت مباشرة (من غير GitHub):
- نزّل `sakina-single.html` وافتحه في أي متصفح — يشتغل فورًا (الفاتحة للقراء الـ11
  مدمجة وتشتغل بدون إنترنت، وبقية السور محتاجة إنترنت للبث).
