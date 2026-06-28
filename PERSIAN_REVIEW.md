# Persian (فارسی) review — one-pass fix sheet

How to use: under each item, write the corrected Persian after **✅** (leave blank to keep as-is).
When you're done, tell me and I'll apply every change at once.
⚠️ = I suspect this one needs work.

---

## 1) Navigation — `lib/home-i18n.ts` (fa.nav)

1. Today — `امروز`
   ✅
2. Map (calendar) — `نقشه`
   ✅
3. Ask — `پرسش`
   ✅
4. People — `افراد`
   ✅
5. Pathfinder — `مسیر`
   ✅
6. World — `جهان`
   ✅
7. Me (profile) — `من`
   ✅
8. ⚠️ Vault — `محرمانه`  (means "confidential"; "گنجینه" = vault/treasure may fit better)
   ✅
9. Dashboard — `داشبورد`
   ✅
10. Settings — `تنظیمات`
    ✅

## 2) Onboarding & Daily — `lib/home-i18n.ts` (fa)

11. onboardingTitle — `چطور می‌خواهید روزتان را شروع کنید؟`
    ✅
12. onboardingSub — `صفحهٔ پیش‌فرض را انتخاب کنید. هر زمان در تنظیمات قابل تغییر است.`
    ✅
13. optionA — `خلاصه روزانه`
    ✅
14. optionADesc — `امتیاز امروز، نکات، افراد و پرسش از AI`
    ✅
15. optionB — `تقویم استراتژیک`
    ✅
16. optionBDesc — `نقشه حرارتی ماه با پنجره‌های طلایی و خطر`
    ✅
17. optionC — `نقشه حرارتی ماهانه`
    ✅
18. optionCDesc — `نقشه حرارتی تمام‌عرض در خانه`
    ✅
19. continueBtn — `ادامه`
    ✅
20. dailyBrief — `خلاصه روزانه`
    ✅
21. todayScore — `امتیاز کیهانی امروز`
    ✅
22. goldenHours — `ساعات طلایی`
    ✅
23. warnings — `هشدارها`
    ✅
24. synergyAlerts — `هشدارهای هم‌افزایی`
    ✅
25. noGolden — `هنوز پنجره طلایی برای امروز یافت نشد.`
    ✅
26. noWarnings — `منطقه خطر برای امروز ثبت نشده.`
    ✅
27. noSynergy — `هشداری نیست — افراد را اضافه کنید.`
    ✅
28. askAi — `پرسش از هوش مصنوعی`
    ✅
29. askPlaceholder — `امروز روی چه چیزی تمرکز کنم؟`
    ✅
30. askLoading — `در حال خواندن آسمان…`
    ✅
31. bestWindow — `بهترین پنجره`
    ✅
32. avoidWindow — `پرهیز کنید`
    ✅
33. hourlyLabel — `پیش‌بینی ساعتی`
    ✅
34. todayLabel — `امروز`
    ✅
35. heatmapTitle — `نقشه حرارتی ماهانه`
    ✅
36. loading — `در حال خواندن آسمان…`
    ✅
37. noProfile — `ابتدا اطلاعات تولد را در پروفایل وارد کنید.`
    ✅
38. goProfile — `رفتن به پروفایل`
    ✅

## 3) Settings labels — `lib/home-i18n.ts` (fa)

39. settingsTitle — `تنظیمات`
    ✅
40. settingsSub — `تجربه Planet Life را شخصی‌سازی کنید`
    ✅
41. homeViewLabel — `نمای پیش‌فرض خانه`
    ✅
42. languageLabel — `زبان`
    ✅
43. houseLabel — `سیستم خانه‌ها`
    ✅
44. ⚠️ zodiacLabel — `زودیاک`  (loanword; "منطقةالبروج" is the Persian term)
    ✅
45. placidus — `پلاسیدوس`
    ✅
46. ⚠️ wholeSign — `برج کامل`  (maybe "خانه‌های برج کامل" / "برابر برج")
    ✅
47. tropical — `استوایی`
    ✅
48. sidereal — `نجومی`
    ✅
49. calendarLabel — `تقویم`
    ✅
50. calendarGregorian — `میلادی`
    ✅
51. calendarShamsi — `هجری شمسی`
    ✅
52. calendarHijri — `هجری قمری`
    ✅
53. saved — `ذخیره شد ✓`
    ✅
54. saveAll — `ذخیره تغییرات`
    ✅
55. discard — `لغو`
    ✅
56. unsaved — `تغییرات ذخیره‌نشده`
    ✅

## 4) Month names — `lib/home-i18n.ts` (fa.months)

57. ⚠️ Are these OK as Gregorian transliterations, or do you want Shamsi month names (فروردین…)?
    Current: `ژانویه، فوریه، مارس، آوریل، مه، ژوئن، ژوئیه، اوت، سپتامبر، اکتبر، نوامبر، دسامبر`
    ✅
58. ⚠️ weekdays — `یک، دو، سه، چه، پن، جم، شن`  (abbreviations; want full شنبه…؟)
    ✅

---

## 5) World page — `app/world/page.tsx` (fa) — already edited, please confirm

59. title — `جهان`
    ✅
60. subtitle — `هوش کیهانی دربارهٔ بازارها، رهبران جهان و شهرهایی که زندگی‌ات را شکل می‌دهند.`
    ✅
61. explore — `پیش‌نمایش`
    ✅
62. markets.title — `نبض بازارها`
    ✅
63. markets.sub — `نفت · طلا · بیت‌کوین · فارکس · سهام`
    ✅
64. markets.tagline — `وقتی مریخ در مقابلهٔ پلوتو قرار می‌گیرد، نفت نوسان می‌کند. هر ترانزیتی را که بازار را تکان داده رصد می‌کنیم و پنجرهٔ بعدی را نشان می‌دهیم.`
    ✅
65. geopolitics.title — `ژئوپلیتیک امروز`
    ✅
66. geopolitics.sub — `چارت کشورها · شاخص تنش · پنجره‌های جنگ`
    ✅
67. geopolitics.tagline — `ایران، آمریکا، اسرائیل، روسیه، چین — هر کشور زایچهٔ تولد دارد. چرخهٔ فشار، گشایش و بازآغاز را می‌خوانیم.`
    ✅
68. realEstate.title — `اختربینی املاک`
    ✅
69. realEstate.sub — `دبی · تهران · ریاض · استانبول · لندن`
    ✅
70. realEstate.tagline — `ملک دبی کی به کف می‌رسد؟ استانبول کی به اوج می‌رسد؟ مشتری و زحل این چرخه را رقم می‌زنند و ما آن را می‌خوانیم.`
    ✅
71. figures.title — `آسمان و قدرت`
    ✅
72. figures.sub — `پوتین · ترامپ · بن‌سلمان · خامنه‌ای · ماسک · نتانیاهو`
    ✅
73. figures.tagline — `حرکت بعدی را چه کسی می‌زند؟ سیاراتی را که بر پربیننده‌ترین چارت‌های دنیا فشار می‌آورند، می‌خوانیم.`
    ✅
74. dailyBrief.title — `خلاصهٔ جهان`
    ✅
75. dailyBrief.sub — `نگاهی کیهانی به امروز در ۶۰ ثانیه`
    ✅
76. dailyBrief.tagline — `هر صبح یک یادداشت کوتاه: چه کسی زیر فشار است، کدام دارایی در حرکت است و پنجرهٔ طلایی بعدی کجاست.`
    ✅

## 6) World live labels — `app/world/page.tsx` (LIVE_LABELS.fa)

77. live — `زنده`
    ✅
78. free — `رایگان`
    ✅
79. cosmic — `آسمان چه می‌گوید`
    ✅
80. context — `چه خبر است`
    ✅
81. noRead — `آسمان فعلاً در این موضوع آرام است.`
    ✅
82. loading — `در حال خواندن آسمان…`
    ✅
83. openFull — `باز کردن خوانش کامل`
    ✅
84. close — `بستن`
    ✅
85. fullRead — `خوانش کامل کیهانی`
    ✅
86. sources — `منابع زنده`
    ✅

## 7) World astrology overlay — `lib/world-i18n.ts` (fa)

Planets: 87. خورشید / 88. زهره / 89. مریخ / 90. مشتری / 91. زحل / 92. اورانوس / 93. نپتون / 94. پلوتو
✅ (note any changes)

Aspects: 95. مقارنه با / 96. تسدیس با / 97. تربیع با / 98. تثلیث با / 99. مقابله با
✅

Signs: 100. حمل، ثور، جوزا، سرطان، اسد، سنبله، میزان، عقرب، قوس، جدی، دلو، حوت
✅

Tone framing —
101. tension — `منتظر دوره‌ای پرفشار و پرنوسان باش:`
    ✅
102. supportive — `این به حرکت پایدار و سازنده کمک می‌کند:`
    ✅
103. context — `یک روند کند و بلندمدت بر کل این دوره اثر می‌گذارد:`
    ✅

Aspect meaning —
104. conjunction — `این نیروها را در یک تم شدید یکی می‌کند`
    ✅
105. sextile — `کانالی آسان و حمایتی میانشان باز می‌کند`
    ✅
106. square — `اصطکاک و فشاری می‌سازد که به کنش وادار می‌کند`
    ✅
107. trine — `انرژی‌شان را روان و سازنده جاری می‌کند`
    ✅
108. opposition — `آن‌ها را به تنش و رویارویی آشکار می‌کشد`
    ✅

Strength labels —
109. exact — `دقیق همین حالا`
    ✅
110. tight — `تنگ`
    ✅
111. wide — `در حال شکل‌گیری`
    ✅
112. orb — `اوربیس`
    ✅
113. retro — `رجعی`
    ✅

Topic conclusions (markets/geopolitics) —
114. economic_cycle — `چرخه رونق و رکود در اقتصاد`
    ✅
115. tech_breakout — `انرژی جهش در فناوری، رشد و کریپتو`
    ✅
116. structural_change — `فشار برای بازآرایی بازارها و نهادها`
    ✅
117. old_vs_new_order — `تنش میان نظم کهنه و نظم نو`
    ✅
118. oil_volatility — `نوسان شدید نفت و کالاها`
    ✅
119. power_struggle — `تشدید و کشمکش قدرت`
    ✅
120. sudden_shock — `خطر شوک‌های ناگهانی بازار`
    ✅
121. sudden_strike — `خطر حملات ناگهانی و نقاط بحرانی`
    ✅
122. military_pressure — `فشار نظامی و درگیری سخت`
    ✅
123. regime_power — `رویارویی بر سر قدرت و حکومت‌ها`
    ✅
124. debt_pressure — `فشار بر بدهی، بانک‌ها و منابع`
    ✅
125. power_focus — `تمرکز شدید بر قدرت و کنترل`
    ✅
126. currency_luxury — `حرکت ارزها و دارایی‌های لوکس`
    ✅
127. speculation — `سفته‌بازی، هیجان و قیمت‌گذاری مبهم`
    ✅
128. power_restructure — `بازسازی بلندمدت قدرت و نهادها`
    ✅
129. supply_shock — `اختلال در عرضه، انرژی و فناوری`
    ✅
130. hard_limits — `محدودیت‌های سخت، ریاضت و پاسخگویی`
    ✅

---

## 8) Pathfinder — `lib/pathfinder-i18n.ts` (fa)

Reason templates ({p}=planet, {a}=angle, {n}=house number) —
131. love_partner_support — `{p} روی {a} تو از رابطه و گشودگی عاطفی حمایت می‌کند.`
    ✅
132. love_intense — `{p} روی {a} تو پویایی رابطه را شدیدتر می‌کند.`
    ✅
133. career_drive — `{p} روی {a} تو دیده‌شدن، جاه‌طلبی و نتایج عمومی را فعال می‌کند.`
    ✅
134. career_unconventional — `{p} روی {a} تو مسیر شغلی غیرمتعارفی می‌آورد.`
    ✅
135. home_supportive — `{p} روی {a} تو حس می‌دهد که این شهر از نظر عاطفی حمایت‌گر است.`
    ✅
136. home_intense — `{p} روی {a} تو می‌تواند زندگی خانگی را پرفشار کند.`
    ✅
137. wellbeing_vitality — `{p} روی {a} تو از نشاط و آرامش بدن حمایت می‌کند.`
    ✅
138. wellbeing_pressure — `{p} روی {a} تو فشار بیشتری به انرژی و ریتم تو می‌آورد.`
    ✅
139. spirituality_open — `{p} روی {a} تو شهود، معنا و راهنمایی درونی را باز می‌کند.`
    ✅
140. community_people — `{p} روی {a} تو کمک می‌کند با آدم‌های مفید یا الهام‌بخش آشنا شوی.`
    ✅
141. wealth_support — `{p} روی {a} تو کسب‌وکار، دارایی یا اعتبار مالی را بهتر می‌کند.`
    ✅
142. wealth_boundaries — `{p} روی {a} تو نیاز به مرزهای مالی شفاف‌تر را نشان می‌دهد.`
    ✅
143. love_house7 — `{p} در خانه هفتم جابه‌جا‌شده‌ات از رابطه حمایت می‌کند.`
    ✅
144. career_house10 — `{p} در خانه دهم جابه‌جا‌شده‌ات تمرکز شغلی را تقویت می‌کند.`
    ✅
145. wealth_money_houses — `{p} در خانه‌های مالی جابه‌جا‌شده‌ات منابع را برجسته می‌کند.`
    ✅
146. home_house4 — `{p} در خانه چهارم جابه‌جا‌شده‌ات از ریشه و خانه حمایت می‌کند.`
    ✅
147. wellbeing_house — `{p} در خانه‌های سلامتی جابه‌جا‌شده‌ات از حال خوب روزانه حمایت می‌کند.`
    ✅
148. community_house11 — `{p} در خانه یازدهم جابه‌جا‌شده‌ات شبکه ارتباطی تو را باز می‌کند.`
    ✅
149. spirituality_house12 — `{p} در خانه دوازدهم جابه‌جا‌شده‌ات کار درونی را عمیق‌تر می‌کند.`
    ✅
150. sig_support — `{p} در خانه {n} جابه‌جا‌شده‌ات خوب نشسته و این حوزه را در این شهر تقویت می‌کند.`
    ✅
151. sig_quiet — `{p} در خانه {n} جابه‌جا‌شده‌ات است، پس این حوزه اینجا بیشتر به تلاش خودت بستگی دارد.`
    ✅
152. sig_strain — `{p} در خانه {n} جابه‌جا‌شده‌ات کمی فشار به این حوزه در این شهر می‌آورد.`
    ✅

(Pathfinder verdict leads, period labels, calendar labels, and the Pathfinder page UI strings — I'll add these as Batch 2 once you've done the above, so this sheet stays manageable.)

---

## Remaining files for Batch 2 (inline Persian, not yet listed here)

- `app/pathfinder/page.tsx` (UI labels)
- `app/profile/page.tsx`
- `app/vault/page.tsx` + `app/vault/[section]/page.tsx`
- `app/upgrade/page.tsx`
- `app/calendar/page.tsx`
- `app/ask/page.tsx`
- `app/login/page.tsx`
- `app/page.tsx` (landing)
- `components/AppShell.tsx`, `components/home/DailyBriefView.tsx`, `components/home/CosmosCard.tsx`
- `lib/astrology-i18n.ts`, `lib/people-i18n.ts`, `lib/oracle-questions.ts`, `lib/strategic-gps.ts`, `lib/disclaimers.ts`, `lib/moon-phase.ts`, `lib/chart-insights.ts`
