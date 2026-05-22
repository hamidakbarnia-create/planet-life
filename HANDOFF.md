# Planet Life — Handoff (22 May 2026)

> گزارش بستن روز و راهنمای ادامه کار جلسه بعد.

---

## ۱) امروز چی ساختیم

### معماری ۶ تب + Vault (R0 ✅)
- Sidebar پایین: **Today / Map / Ask / People / World / Me** (بدون Dashboard)
- **Vault** = پیل (pill) صورتی pulsating بالا راست — جدا از sidebar، curiosity engine
- **Free badge** کنار Vault → لینک به `/upgrade`

### Vault flow
- `/vault` → Step Inside → ۷ کارت (Sensuality, Cycle, Provider, Shadow, Look, Power, Lounge)
- `/vault/[section]` → ۴ آیتم در هر section
- آیتم‌ها expand می‌شن؛ آیتم‌های قفل = blur + دکمه «Unlock» → `/upgrade`

### Upgrade page
- `/upgrade` با ۴ پلن (Free/Pro/Premium/VIP) — ماهانه/سالانه
- توگل **«توضیحات کامل»** با `whoFor` + `details[]` در ۴ زبان
- مودال رزرو با ایمیل/شماره → کد `FOUNDER-{TIER}-{code}` در `localStorage`

### موتور تفسیر سه‌لایه (R8 — اولین اسلایس)
**Pipeline کامل:** Swiss Ephemeris → Rules Engine → Templates

#### بک‌اند
- `packages/astro_engine/vault_rules.py` — `build_mars_verdict()`  
  شرف/هبوط، خانه، دکان، اورب دقیق، شدت، کلیدهای آرکتایپ
- `packages/astro_engine/vault_templates.py` — `render_mars_reading()`  
  خروجی **سه‌لایه** (executive / strategic / technical) در **EN/FA/RU/AR**
- `apps/api/src/services/vault_readings.py` — orchestrator + Lilith (Mean Apogee)
- `apps/api/src/routes/vault.py` — `POST /api/vault/mars`

#### فرانت
- `apps/web/lib/vault-reading.ts` — کلاینت API
- `/vault/sensuality` → کارت **My Mars** با بج سبز **LIVE** — بدون blur، خوانش واقعی از چارت کاربر
- پروفایل خالی → لینک به `/profile`؛ API خاموش → پیام خطا

### نمونه خروجی واقعی (تست شده)
```json
{
  "headline": "جذابیت ولتاژ بالا",
  "intensity": "strong",
  "executive": "جذابیت ولتاژ بالا: Mars in Aries, house 6.",
  "strategic": "منتظر انتخاب شدن نمی‌مونی — خودت انتخاب می‌کنی...",
  "technical": "Mars 11.01° Aries · house 6 · dignity: rulership"
}
```

---

## ۲) چطور برگشتی پروژه را باز کنی

### پنجره ۱ — Backend (Python 3.11)
```powershell
cd c:\planet-life\apps\api\src
py -3.11 -m uvicorn main:app --reload --port 8000
```
انتظار: `Uvicorn running on http://127.0.0.1:8000`

تست سلامت:
```powershell
curl http://localhost:8000/api/vault/mars -Method POST -ContentType "application/json" -Body '{"birth_date":"1990-06-15","birth_time":"14:30","location":"Tehran","lang":"fa"}'
```

### پنجره ۲ — Frontend (Next.js 16)
```powershell
cd c:\planet-life\apps\web
npm run dev
```
باز کن: `http://localhost:3000`

### مسیر تست end-to-end
1. `/profile` → تاریخ / ساعت / شهر تولد را ذخیره کن
2. روی **پیل صورتی Vault** بالا راست کلیک کن
3. **Step Inside** → کارت **Sensuality**
4. کارت اول **My Mars** را باز کن → بج سبز **LIVE** + خوانش واقعی فارسی

---

## ۳) فایل‌های جدید/مهم امروز

| فایل | نقش |
|---|---|
| `packages/astro_engine/vault_rules.py` | Rules engine (Mars) |
| `packages/astro_engine/vault_templates.py` | Templates 4-lang |
| `apps/api/src/services/vault_readings.py` | Orchestrator |
| `apps/api/src/routes/vault.py` | `POST /api/vault/mars` |
| `apps/web/lib/vault-reading.ts` | Frontend client |
| `apps/web/app/vault/[section]/page.tsx` | LIVE integration |
| `apps/web/app/upgrade/page.tsx` | Paywall UI |
| `apps/web/components/AppShell.tsx` | VaultPill + Free badge |
| `apps/web/components/BottomNav.tsx` | ۶ تب جدید |

---

## ۴) کار باقی‌مانده (اولویت‌بندی شده)

### اولویت ۱ — تکمیل Vault (R8 ادامه)
- [ ] **Pluto** در Sensuality (کارت دوم) — همان pattern
- [ ] **Provider** — سناریوی «شوهر + پول پنهان» با ترانزیت Saturn/Neptune + پنجره زمانی دقیق
- [ ] **Lilith** کارت مستقل
- [ ] لایه LLM روی `verdict` + دیتابیس Mongo برای متن‌های عمیق‌تر

### اولویت ۲ — Paywall واقعی (R3)
- [ ] اتصال Stripe (یا ZarinPal برای ایران)
- [ ] tier ذخیره در backend (الان فقط localStorage)
- [ ] قفل واقعی روی کارت‌های Vault بر اساس tier

### اولویت ۳ — Today tab (R1)
- [ ] Personal Day Number
- [ ] تقویم شمسی/هجری/میلادی موازی
- [ ] Daily Brief واقعی (نه static)

### اولویت ۴ — تمیزکاری
- [ ] redirect یا حذف `/dashboard` legacy
- [ ] یکپارچه کردن `/profile` با `AppShell` (الان layout مستقل دارد)
- [ ] به‌روزرسانی `ROADMAP.md` با معماری ۶ تب + موتور ۳ لایه
- [ ] commit + push کارهای امروز

### اولویت ۵ — Typography polish (آینده)
- [ ] Persian digits خودکار برای اعداد در زبان فارسی (مثل امتیاز، تاریخ، قیمت)
- [ ] گزینه فونت premium (IRANSans / Estedad) به‌عنوان upgrade
- [ ] تست خوانایی اعداد روی موبایل (font-feature-settings)

### اولویت ۶ — i18n quality pass ادامه (FA/AR/RU/EN)
- [ ] بازنویسی native ترجمه‌های فارسی/عربی/روسی/انگلیسی در `home-i18n.ts` و صفحات اصلی
- [ ] اصلاح اصطلاحات ضعیف یا غلط: `Ask = وحی` مناسب نیست؛ گزینه‌های بهتر مثل «پرسش»، «راز»، «اوراکل» بررسی شود
- [ ] اصلاح اصطلاحات نجومی: `Whole Sign = برج کامل`، `Tropical/Sidereal` با معادل دقیق و قابل فهم
- [ ] لحن فارسی: روان، زنانه، حرفه‌ای، بدون حالت ماشینی و بدون بار مذهبی ناخواسته
- [ ] لحن عربی: عربی فصیح مدرن، طبیعی، غیرماشینی، مناسب GCC
- [ ] بعد از audit، طول متن‌ها با UI چک شود تا layout نشکند

---

## ۵) دستورات کاربردی

```powershell
# وضعیت git
cd c:\planet-life; git status

# کامیت کارهای امروز (وقتی آماده شدی)
git add .
git commit -m "feat: vault mars reading — rules engine + 4-lang templates + live API"

# تست سریع موتور بدون فرانت
cd c:\planet-life\apps\api\src
py -3.11 -c "import sys; sys.path.insert(0,r'C:\planet-life'); from services.vault_readings import mars_reading; print(mars_reading(birth_date='1990-06-15', birth_time='14:30', location='Tehran', lang='fa')['reading']['strategic'])"
```

---

## ۶) تصمیم‌های قفل‌شده (یادآوری)

- Vault = **تب جدا، بالا راست**، curiosity engine (نه آیتم sidebar)
- Paywall = گزینه ب → **بعد از R0، قبل از محتوای کامل Vault**
- خروجی‌ها باید **کاربردی** باشند («الان چی کار کنم؟») نه فال عمومی
- موتور: **Swiss Ephemeris (موجود) → Rules → Templates → LLM (بعداً)**
- زبان اصلی: **فارسی** (با پشتیبانی EN/RU/AR)

---

## ۷) برای استارت سریع جلسه بعد

پیامت به Cursor:
> «از HANDOFF.md ادامه بده. می‌خوام **[Pluto در Sensuality | Provider scenario | Stripe paywall | …]** را بسازیم.»

موتور آماده است. هر کارت Vault بعدی فقط ۲ فایل لازم دارد:
1. تابع `build_X_verdict()` در `vault_rules.py`
2. تابع `render_X_reading()` در `vault_templates.py`

بقیه (API، فرانت، multi-lang) zero-config گسترش پیدا می‌کند.
