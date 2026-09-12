"""
Vault template engine — turns structured verdicts into strategic prose.

No LLM required for the first slice. Templates are keyed by
archetype + dignity + aspect patterns so output is always chart-specific.
"""

from __future__ import annotations

from typing import Any

# ── Sign archetypes (localized) ─────────────────────────────────────────────

SIGN_COPY: dict[str, dict[str, str]] = {
    "warrior": {
        "en": "Mars in Aries symbolically emphasizes initiative, direct expression and the choice of pace.",
        "fa": "مریخ در حمل به‌طور نمادین بر پیش‌قدم‌شدن، بیان روشن و انتخاب ریتم تأکید دارد.",
        "ru": "Марс в Овне символически подчёркивает инициативу, прямое выражение и выбор темпа.",
        "ar": "يرمز المريخ في الحمل إلى المبادرة والتعبير المباشر واختيار الإيقاع."
    },
    "slow_burn": {
        "en": "Mars in Taurus symbolically emphasizes steadiness, physical comfort and allowing time for change.",
        "fa": "مریخ در ثور به‌طور نمادین بر ثبات، آسودگی جسمی و فرصت‌دادن به تغییر تأکید دارد.",
        "ru": "Марс в Тельце символически подчёркивает устойчивость, телесный комфорт и время на перемены.",
        "ar": "يرمز المريخ في الثور إلى الثبات والراحة الجسدية وإتاحة الوقت للتغيير."
    },
    "verbal_seducer": {
        "en": "Mars in Gemini symbolically emphasizes curiosity, conversation and exploring more than one perspective.",
        "fa": "مریخ در جوزا به‌طور نمادین بر کنجکاوی، گفت‌وگو و دیدن چند زاویهٔ متفاوت تأکید دارد.",
        "ru": "Марс в Близнецах символически подчёркивает любопытство, диалог и разные точки зрения.",
        "ar": "يرمز المريخ في الجوزاء إلى الفضول والحوار واستكشاف وجهات نظر متعددة."
    },
    "tender_predator": {
        "en": "Mars in Cancer symbolically emphasizes care, emotional shelter and boundaries around private space.",
        "fa": "مریخ در سرطان به‌طور نمادین بر مراقبت، پناه عاطفی و مرزهای فضای خصوصی تأکید دارد.",
        "ru": "Марс в Раке символически подчёркивает заботу, эмоциональную защищённость и границы личного пространства.",
        "ar": "يرمز المريخ في السرطان إلى الرعاية والأمان العاطفي وحدود المساحة الخاصة."
    },
    "spotlight_lover": {
        "en": "Mars in Leo symbolically emphasizes creative expression, recognition and making room for another voice.",
        "fa": "مریخ در اسد به‌طور نمادین بر بیان خلاق، دیده‌شدن و جا بازکردن برای صدای دیگری تأکید دارد.",
        "ru": "Марс в Льве символически подчёркивает творческое выражение, признание и место для другого голоса.",
        "ar": "يرمز المريخ في الأسد إلى التعبير الإبداعي والتقدير وإفساح المجال لصوت آخر."
    },
    "perfectionist_lover": {
        "en": "Mars in Virgo symbolically emphasizes careful attention, practical gestures and flexibility about imperfection.",
        "fa": "مریخ در سنبله به‌طور نمادین بر توجه دقیق، همراهی عملی و پذیرش بی‌نقص‌نبودن تأکید دارد.",
        "ru": "Марс в Деве символически подчёркивает внимание к деталям, практическую заботу и принятие несовершенства.",
        "ar": "يرمز المريخ في العذراء إلى الاهتمام بالتفاصيل واللفتات العملية وتقبّل عدم الكمال."
    },
    "diplomat_lover": {
        "en": "Mars in Libra symbolically emphasizes reciprocity, negotiation and balancing initiative with agreement.",
        "fa": "مریخ در میزان به‌طور نمادین بر دوسویگی، مذاکره و تعادل میان ابتکار و توافق تأکید دارد.",
        "ru": "Марс в Весах символически подчёркивает взаимность, переговоры и баланс инициативы с согласием.",
        "ar": "يرمز المريخ في الميزان إلى التبادل والتفاوض والتوازن بين المبادرة والاتفاق."
    },
    "obsessive_lover": {
        "en": "Mars in Scorpio symbolically emphasizes intensity, privacy and the difference between closeness and control.",
        "fa": "مریخ در عقرب به‌طور نمادین بر شدت، حریم خصوصی و تفاوت صمیمیت با کنترل تأکید دارد.",
        "ru": "Марс в Скорпионе символически подчёркивает интенсивность, приватность и различие между близостью и контролем.",
        "ar": "يرمز المريخ في العقرب إلى العمق والخصوصية والفرق بين القرب والتحكم."
    },
    "free_lover": {
        "en": "Mars in Sagittarius symbolically emphasizes exploration, shared meaning and room for independence.",
        "fa": "مریخ در قوس به‌طور نمادین بر کشف تجربه‌های تازه، معنای مشترک و مجال استقلال تأکید دارد.",
        "ru": "Марс в Стрельце символически подчёркивает исследование нового, общий смысл и пространство для самостоятельности.",
        "ar": "يرمز المريخ في القوس إلى الاستكشاف والمعنى المشترك ومساحة الاستقلال."
    },
    "powerful_lover": {
        "en": "Mars in Capricorn symbolically emphasizes sustained effort, clear commitments and realistic limits.",
        "fa": "مریخ در جدی به‌طور نمادین بر تلاش پیوسته، تعهد روشن و محدودیت‌های واقعی تأکید دارد.",
        "ru": "Марс в Козероге символически подчёркивает последовательные усилия, ясные обязательства и реальные ограничения.",
        "ar": "يرمز المريخ في الجدي إلى الجهد المستمر والالتزامات الواضحة والحدود الواقعية."
    },
    "rebel_lover": {
        "en": "Mars in Aquarius symbolically emphasizes experimentation, equality and questioning familiar conventions.",
        "fa": "مریخ در دلو به‌طور نمادین بر تجربه‌کردن، برابری و بازنگری در عرف‌های آشنا تأکید دارد.",
        "ru": "Марс в Водолее символически подчёркивает эксперимент, равенство и пересмотр привычных правил.",
        "ar": "يرمز المريخ في الدلو إلى التجربة والمساواة ومراجعة الأعراف المألوفة."
    },
    "dream_lover": {
        "en": "Mars in Pisces symbolically emphasizes imagination, sensitivity and translating an ideal into a clear request.",
        "fa": "مریخ در حوت به‌طور نمادین بر تخیل، حساسیت و تبدیل تصویر آرمانی به درخواستی روشن تأکید دارد.",
        "ru": "Марс в Рыбах символически подчёркивает воображение, чуткость и перевод идеала в ясную просьбу.",
        "ar": "يرمز المريخ في الحوت إلى الخيال والحساسية وتحويل التصوّر المثالي إلى طلب واضح."
    }
}

DIGNITY_COPY: dict[str, dict[str, str]] = {
    "rulership": {
        "en": "In its own sign, Mars symbolically highlights initiative and how to give it direction.",
        "fa": "مریخ در برجِ تحت فرمان خود، نماد ابتکار و جهت‌دادن به آن است.",
        "ru": "В своём знаке Марс символически выделяет инициативу и выбор её направления.",
        "ar": "يرمز المريخ في برجه إلى المبادرة واختيار وجهتها."
    },
    "exaltation": {
        "en": "Exaltation symbolically links effort with structure: a prompt to consider sustainable commitments.",
        "fa": "شرف مریخ، تلاش را به‌طور نمادین به نظم پیوند می‌دهد؛ فرصتی برای تأمل دربارهٔ تعهدهای پایدار.",
        "ru": "Экзальтация символически связывает усилие со структурой и предлагает подумать о посильных обязательствах.",
        "ar": "يربط الشرف رمزياً بين الجهد والتنظيم، كموضوع للتأمل في الالتزامات القابلة للاستمرار."
    },
    "detriment": {
        "en": "Detriment symbolically sets initiative beside compromise; neither side needs to erase the other.",
        "fa": "وبال مریخ، ابتکار را به‌طور نمادین کنار سازش می‌گذارد؛ هیچ‌یک نیاز نیست دیگری را حذف کند.",
        "ru": "Изгнание символически сопоставляет инициативу с компромиссом: одно не должно отменять другое.",
        "ar": "يقابل الوبال رمزياً بين المبادرة والتسوية، دون أن يلغي أحدهما الآخر."
    },
    "fall": {
        "en": "Fall symbolically brings action into dialogue with care and emotional context.",
        "fa": "هبوط مریخ، اقدام را به‌طور نمادین در گفت‌وگو با مراقبت و زمینهٔ عاطفی قرار می‌دهد.",
        "ru": "Падение символически связывает действие с заботой и эмоциональным контекстом.",
        "ar": "يربط الهبوط رمزياً بين الفعل والرعاية والسياق العاطفي."
    }
}

HOUSE_COPY: dict[str, dict[str, str]] = {
    "self_warrior": {
        "en": "Mars in house 1 symbolically emphasizes self-expression, initiative and personal space.",
        "fa": "مریخ در خانهٔ 1 به‌طور نمادین بر بیان خود، پیش‌قدم‌شدن و فضای شخصی تأکید دارد.",
        "ru": "Марс в доме 1 символически подчёркивает самовыражение, инициативу и личное пространство.",
        "ar": "يرمز المريخ في البيت 1 إلى التعبير عن النفس والمبادرة والمساحة الشخصية."
    },
    "money_drive": {
        "en": "Mars in house 2 symbolically emphasizes personal values, resources and what feels worth protecting.",
        "fa": "مریخ در خانهٔ 2 به‌طور نمادین بر ارزش‌های شخصی، منابع و آنچه ارزش مراقبت دارد تأکید دارد.",
        "ru": "Марс в доме 2 символически подчёркивает личные ценности, ресурсы и то, что стоит беречь.",
        "ar": "يرمز المريخ في البيت 2 إلى القيم الشخصية والموارد وما يستحق الحماية."
    },
    "voice_warrior": {
        "en": "Mars in house 3 symbolically emphasizes everyday dialogue, learning and the impact of words.",
        "fa": "مریخ در خانهٔ 3 به‌طور نمادین بر گفت‌وگوی روزمره، یادگیری و اثر کلمات تأکید دارد.",
        "ru": "Марс в доме 3 символически подчёркивает повседневный диалог, обучение и влияние слов.",
        "ar": "يرمز المريخ في البيت 3 إلى الحوار اليومي والتعلّم وأثر الكلمات."
    },
    "private_fire": {
        "en": "Mars in house 4 symbolically emphasizes home, privacy and the foundations of a sense of safety.",
        "fa": "مریخ در خانهٔ 4 به‌طور نمادین بر خانه، حریم خصوصی و پایه‌های احساس امنیت تأکید دارد.",
        "ru": "Марс в доме 4 символически подчёркивает дом, приватность и основы чувства безопасности.",
        "ar": "يرمز المريخ في البيت 4 إلى المنزل والخصوصية وأسس الشعور بالأمان."
    },
    "creative_fire": {
        "en": "Mars in house 5 symbolically emphasizes play, creativity and expression without pressure to perform.",
        "fa": "مریخ در خانهٔ 5 به‌طور نمادین بر بازی، خلاقیت و بیان بدون فشار برای نمایش تأکید دارد.",
        "ru": "Марс в доме 5 символически подчёркивает игру, творчество и выражение без необходимости впечатлять.",
        "ar": "يرمز المريخ في البيت 5 إلى اللعب والإبداع والتعبير دون ضغط لإثبات الذات."
    },
    "work_drive": {
        "en": "Mars in house 6 symbolically emphasizes daily routines, practical support and sustainable effort.",
        "fa": "مریخ در خانهٔ 6 به‌طور نمادین بر روال روزانه، حمایت عملی و تلاش پایدار تأکید دارد.",
        "ru": "Марс в доме 6 символически подчёркивает повседневный ритм, практическую поддержку и посильные усилия.",
        "ar": "يرمز المريخ في البيت 6 إلى الروتين اليومي والدعم العملي والجهد القابل للاستمرار."
    },
    "partner_attractor": {
        "en": "Mars in house 7 symbolically emphasizes partnership, negotiation and explicit mutual agreements.",
        "fa": "مریخ در خانهٔ 7 به‌طور نمادین بر همراهی، مذاکره و توافق‌های روشن دوطرفه تأکید دارد.",
        "ru": "Марс в доме 7 символически подчёркивает партнёрство, переговоры и ясные взаимные договорённости.",
        "ar": "يرمز المريخ في البيت 7 إلى الشراكة والتفاوض والاتفاقات المتبادلة الواضحة."
    },
    "deep_intensity": {
        "en": "Mars in house 8 symbolically emphasizes intensity, shared boundaries and vulnerability.",
        "fa": "مریخ در خانهٔ 8 به‌طور نمادین بر شدت، مرزهای مشترک و آسیب‌پذیری تأکید دارد.",
        "ru": "Марс в доме 8 символически подчёркивает интенсивность, общие границы и уязвимость.",
        "ar": "يرمز المريخ في البيت 8 إلى العمق والحدود المشتركة والانفتاح العاطفي."
    },
    "global_drive": {
        "en": "Mars in house 9 symbolically emphasizes learning, exploration and questioning inherited beliefs.",
        "fa": "مریخ در خانهٔ 9 به‌طور نمادین بر یادگیری، کشف و بازنگری در باورهای به‌ارث‌رسیده تأکید دارد.",
        "ru": "Марс в доме 9 символически подчёркивает обучение, исследование и пересмотр унаследованных убеждений.",
        "ar": "يرمز المريخ في البيت 9 إلى التعلّم والاستكشاف ومراجعة المعتقدات الموروثة."
    },
    "career_warrior": {
        "en": "Mars in house 10 symbolically emphasizes public responsibility, ambition and boundaries around work.",
        "fa": "مریخ در خانهٔ 10 به‌طور نمادین بر مسئولیت اجتماعی، بلندپروازی و مرزهای کار تأکید دارد.",
        "ru": "Марс в доме 10 символически подчёркивает общественную ответственность, стремления и границы работы.",
        "ar": "يرمز المريخ في البيت 10 إلى المسؤولية العامة والطموح وحدود العمل."
    },
    "social_fire": {
        "en": "Mars in house 11 symbolically emphasizes friendship, collective projects and balancing belonging with autonomy.",
        "fa": "مریخ در خانهٔ 11 به‌طور نمادین بر دوستی، کار گروهی و تعادل تعلق با استقلال تأکید دارد.",
        "ru": "Марс в доме 11 символически подчёркивает дружбу, общие проекты и баланс принадлежности с самостоятельностью.",
        "ar": "يرمز المريخ في البيت 11 إلى الصداقة والمشاريع الجماعية والتوازن بين الانتماء والاستقلال."
    },
    "hidden_drive": {
        "en": "Mars in house 12 symbolically emphasizes solitude, rest and giving unfinished thoughts time to develop.",
        "fa": "مریخ در خانهٔ 12 به‌طور نمادین بر خلوت، استراحت و فرصت‌دادن به فکرهای ناتمام تأکید دارد.",
        "ru": "Марс в доме 12 символически подчёркивает уединение, отдых и время для созревания незавершённых мыслей.",
        "ar": "يرمز المريخ في البيت 12 إلى الخلوة والراحة وإتاحة الوقت للأفكار غير المكتملة."
    }
}

ASPECT_SNIPPETS: dict[str, dict[str, str]] = {
    "mars_venus_conjunction": {
        "en": "The Mars–Venus conjunction symbolically brings initiative and connection together, inviting a look at their balance.",
        "fa": "هم‌نشینی مریخ و زهره، ابتکار و پیوند را به‌طور نمادین کنار هم می‌آورد؛ موضوعی برای سنجیدن تعادلشان.",
        "ru": "Соединение Марса и Венеры символически сближает инициативу и контакт, предлагая рассмотреть их баланс.",
        "ar": "يجمع اقتران المريخ والزهرة رمزياً بين المبادرة والتواصل، كدعوة للنظر في توازنهما."
    },
    "mars_pluto_square": {
        "en": "The Mars–Pluto square symbolically contrasts intensity with shared boundaries; it does not establish controlling behavior.",
        "fa": "مربع مریخ و پلوتو، شدت را به‌طور نمادین در برابر مرزهای مشترک قرار می‌دهد؛ این به معنای رفتار کنترل‌گرانه نیست.",
        "ru": "Квадрат Марса и Плутона символически сопоставляет интенсивность с общими границами; он не указывает на контролирующее поведение.",
        "ar": "يقابل تربيع المريخ وبلوتو رمزياً بين الشدة والحدود المشتركة؛ ولا يثبت سلوكاً تحكمياً."
    },
    "mars_lilith_conjunction": {
        "en": "The Mars–Lilith conjunction symbolically opens questions about autonomy and social expectations, without defining identity or preference.",
        "fa": "هم‌نشینی مریخ و لیلیت، پرسش‌هایی نمادین دربارهٔ استقلال و انتظارهای اجتماعی مطرح می‌کند، بدون تعریف هویت یا ترجیح.",
        "ru": "Соединение Марса и Лилит предлагает символические вопросы о самостоятельности и общественных ожиданиях, не определяя идентичность или предпочтения.",
        "ar": "يفتح اقتران المريخ وليليث أسئلة رمزية حول الاستقلال والتوقعات الاجتماعية، دون تعريف الهوية أو التفضيلات."
    },
    "mars_saturn_square": {
        "en": "The Mars–Saturn square symbolically contrasts momentum with limits, offering a prompt about pacing and realistic commitments.",
        "fa": "مربع مریخ و زحل، حرکت را به‌طور نمادین در برابر محدودیت می‌گذارد؛ موضوعی برای تأمل دربارهٔ ریتم و تعهدهای واقع‌بینانه.",
        "ru": "Квадрат Марса и Сатурна символически сопоставляет движение с ограничениями и предлагает подумать о темпе и реалистичных обязательствах.",
        "ar": "يقابل تربيع المريخ وزحل رمزياً بين الاندفاع والحدود، كموضوع للتأمل في الإيقاع والالتزامات الواقعية."
    }
}

INTENSITY_HEADLINE: dict[str, dict[str, str]] = {
    "subtle": {
        "en": "Optional reflection on desire",
        "fa": "تأمل اختیاری دربارهٔ میل",
        "ru": "Необязательное размышление о желании",
        "ar": "تأمل اختياري في الرغبة"
    },
    "moderate": {
        "en": "Optional reflection on desire",
        "fa": "تأمل اختیاری دربارهٔ میل",
        "ru": "Необязательное размышление о желании",
        "ar": "تأمل اختياري في الرغبة"
    },
    "strong": {
        "en": "Optional reflection on desire",
        "fa": "تأمل اختیاری دربارهٔ میل",
        "ru": "Необязательное размышление о желании",
        "ar": "تأمل اختياري في الرغبة"
    },
    "extreme": {
        "en": "Optional reflection on desire",
        "fa": "تأمل اختیاری دربارهٔ میل",
        "ru": "Необязательное размышление о желании",
        "ar": "تأمل اختياري في الرغبة"
    }
}


def _pick_lang(lang: str) -> str:
    return lang if lang in ("en", "fa", "ru", "ar") else "en"


def _archetype_from_keys(keys: list[str], prefix: str) -> str | None:
    for k in keys:
        if k.startswith(prefix + ":"):
            return k.split(":", 1)[1]
    return None


def _aspect_snippet(aspects: list[dict], lang: str) -> list[str]:
    lang = _pick_lang(lang)
    lines: list[str] = []
    for a in aspects:
        if not a.get("is_exact"):
            continue
        key = f"{a['a']}_{a['b']}_{a['kind']}"
        if key in ASPECT_SNIPPETS:
            lines.append(ASPECT_SNIPPETS[key][lang])
        # reverse order venus_mars -> mars_venus
        key2 = f"{a['b']}_{a['a']}_{a['kind']}"
        if key2 in ASPECT_SNIPPETS and ASPECT_SNIPPETS[key2][lang] not in lines:
            lines.append(ASPECT_SNIPPETS[key2][lang])
    return lines




_SYMBOLIC_LIMITATION = {
    "en": "This symbolic timing score describes strength, not a probability of success. Real circumstances remain decisive.",
    "fa": "این امتیاز زمان‌بندی نمادین بیانگر شدت است، نه احتمال موفقیت. شرایط واقعی تعیین‌کننده‌اند.",
    "ru": "Этот символический балл времени описывает силу сигнала, а не вероятность успеха. Решают реальные обстоятельства.",
    "ar": "تصف درجة التوقيت الرمزية قوة الإشارة، لا احتمال النجاح. الظروف الواقعية هي الحاسمة."
}
_PREDICTIVE_RELIABILITY = {
    "en": "Predictive reliability is unvalidated. Supplied birth details are unverified inputs, not observed behavior.",
    "fa": "اعتبار پیش‌بینی تأیید نشده است. اطلاعات تولد، ورودی تأییدنشده‌اند و رفتار مشاهده‌شده نیستند.",
    "ru": "Надёжность прогноза не подтверждена. Данные рождения — непроверенные исходные сведения, а не наблюдаемое поведение.",
    "ar": "موثوقية التنبؤ غير مثبتة. تفاصيل الميلاد مدخلات غير متحقق منها، وليست سلوكاً ملاحظاً."
}
_MONEY_LIMITATION = {
    "en": "The score measures symbolic timing strength, not the probability of receiving money or financial success—even at 100/100. Commercial terms, affordability and real evidence remain decisive.",
    "fa": "این امتیاز قدرت نمادینِ زمان‌بندی را نشان می‌دهد، نه احتمال دریافت پول یا موفقیت مالی؛ حتی امتیاز 100/100. شرایط معامله، توان مالی و شواهد واقعی تعیین‌کننده‌اند.",
    "ru": "Балл отражает символическую оценку времени, а не вероятность получения денег или финансового успеха — даже при 100/100. Решающее значение имеют условия сделки, посильность расходов и реальные факты.",
    "ar": "تقيس الدرجة قوة التوقيت الرمزي، لا احتمال تلقي المال أو النجاح المالي، حتى عند 100/100. شروط التعامل والقدرة المالية والأدلة الواقعية هي الحاسمة."
}
_DESIRE_LIMITATION = {
    "en": "Treat this as a prompt for reflection, not a definition of identity or preference. It cannot establish orientation, consent, behavior or relationship intent.",
    "fa": "این را دعوتی به تأمل بدان، نه تعریف هویت یا ترجیح. گرایش، رضایت، رفتار یا قصد رابطه را تعیین نمی‌کند.",
    "ru": "Это приглашение к размышлению, а не определение идентичности или предпочтений. Оно не устанавливает ориентацию, согласие, поведение или намерения в отношениях.",
    "ar": "هذا مدخل للتأمل، وليس تعريفاً للهوية أو التفضيلات. لا يحدد الميول أو الموافقة أو السلوك أو نية العلاقة."
}
_TRUST_LIMITATION = {
    "en": "Actual behavior and fidelity are unknown. Birth data cannot detect cheating, secrecy or loyalty. Use direct conversation and observable behavior; do not accuse, surveil or confront someone on this basis.",
    "fa": "رفتار واقعی و وفاداری نامشخص‌اند. دادهٔ تولد خیانت، پنهان‌کاری یا وفاداری را تشخیص نمی‌دهد. بر گفت‌وگوی مستقیم و رفتار قابل مشاهده تکیه کن؛ بر این اساس اتهام، نظارت یا مقابله نکن.",
    "ru": "Реальное поведение и верность неизвестны. Данные рождения не выявляют измену, скрытность или верность. Опирайтесь на прямой разговор и наблюдаемое поведение; не обвиняйте, не следите и не вступайте в конфронтацию на этой основе.",
    "ar": "السلوك الفعلي والوفاء غير معروفين. بيانات الميلاد لا تكشف الخيانة أو الكتمان أو الوفاء. يلزم الاعتماد على الحوار المباشر والسلوك الملحوظ، دون اتهام أو مراقبة أو مواجهة على هذا الأساس."
}
_TRUST_LIMITATION_FRIEND = {
    "en": "Actual behavior is unknown. These symbolic weights are conversation prompts for a friendship, not evidence of hidden conduct. Use direct conversation and observable behavior; do not accuse, surveil or confront someone on this basis.",
    "fa": "رفتار واقعی نامشخص است. این وزن‌های نمادین موضوع گفت‌وگو برای دوستی‌اند، نه شاهد رفتار پنهان. بر گفت‌وگوی مستقیم و رفتار قابل مشاهده تکیه کن؛ بر این اساس اتهام، نظارت یا مقابله نکن.",
    "ru": "Реальное поведение неизвестно. Эти символические веса — темы для разговора о дружбе, а не доказательство скрытого поведения. Опирайтесь на прямой разговор и наблюдаемое поведение; не обвиняйте, не следите и не вступайте в конфронтацию на этой основе.",
    "ar": "السلوك الفعلي غير معروف. هذه الأوزان الرمزية موضوعات لحوار صداقة، وليست دليلاً على سلوك خفي. يلزم الاعتماد على الحوار المباشر والسلوك الملحوظ، دون اتهام أو مراقبة أو مواجهة على هذا الأساس."
}
_TRUST_LIMITATION_BUSINESS = {
    "en": "Actual working behavior is unknown. These symbolic weights are conversation prompts for a business partnership, not evidence of hidden conduct, competence or contract risk. Use direct discussion and observable work; do not accuse, surveil or confront someone on this basis.",
    "fa": "رفتار کاری واقعی نامشخص است. این وزن‌های نمادین موضوع گفت‌وگو برای شراکت کاری‌اند، نه شاهد رفتار پنهان، شایستگی یا ریسک قرارداد. بر گفت‌وگوی مستقیم و کار قابل مشاهده تکیه کنید؛ بر این اساس اتهام، نظارت یا مقابله نکنید.",
    "ru": "Реальное рабочее поведение неизвестно. Эти символические веса — темы для разговора о деловом партнёрстве, а не доказательство скрытого поведения, компетентности или договорного риска. Опирайтесь на прямое обсуждение и наблюдаемую работу; не обвиняйте, не следите и не вступайте в конфронтацию на этой основе.",
    "ar": "السلوك المهني الفعلي غير معروف. هذه الأوزان الرمزية موضوعات لحوار شراكة عمل، وليست دليلاً على سلوك خفي أو كفاءة أو مخاطر تعاقدية. يلزم الاعتماد على النقاش المباشر والعمل الملحوظ، دون اتهام أو مراقبة أو مواجهة على هذا الأساس."
}
_TRUST_TITLE = {
    "en": "Trust & Clarity Signals",
    "fa": "نشانه‌های اعتماد و وضوح",
    "ru": "Сигналы доверия и ясности",
    "ar": "إشارات الثقة والوضوح"
}


def _trust_limitation_for(relationship_type: str, lang: str) -> str:
    if relationship_type == "friendship":
        return _TRUST_LIMITATION_FRIEND[lang]
    if relationship_type == "business":
        return _TRUST_LIMITATION_BUSINESS[lang]
    return _TRUST_LIMITATION[lang]


def _safe_reading(
    *, lang: str, headline: str, body: str, action: str, avoid: str,
    intensity: str, technical: str, limitation: str, **extra: Any,
) -> dict[str, Any]:
    """Deprecated confidence is retained for existing enum/Yes Day consumers.

    Its conservative legacy value is not the evidence contract and may change
    with a client migration. evidence_status is authoritative, independent of
    intensity and input completeness. No scientific validation is implied.
    """
    action_label = {"en": "Action", "fa": "اقدام", "ru": "Действие", "ar": "الإجراء"}[lang]
    avoid_label = {"en": "Avoid", "fa": "پرهیز", "ru": "Избегать", "ar": "ما ينبغي تجنّبه"}[lang]
    return {
        "executive": f"{headline}. {action_label}: {action}. {avoid_label}: {avoid}.",
        "strategic": body,
        "technical": technical,
        "headline": headline,
        "action": action,
        "avoid": avoid,
        "intensity": intensity,
        "confidence": "low",
        "confidence_basis": "unvalidated_symbolic_guidance",
        "confidence_explanation": _PREDICTIVE_RELIABILITY[lang],
        "evidence_status": "unvalidated",
        "data_completeness": "incomplete",
        "interpretation": body,
        "limitation": limitation,
        "explanation": limitation,  # Legacy alias; the web renders only limitation.
        **extra,
    }


def render_mars_reading(verdict: dict[str, Any], lang: str = "en") -> dict[str, Any]:
    lang = _pick_lang(lang)
    keys = verdict.get("archetype_keys", [])
    sign_key = _archetype_from_keys(keys, "sign") or "warrior"
    house_key = _archetype_from_keys(keys, "house") or "self_warrior"
    sign = verdict.get("sign", "aries")
    house = verdict.get("house", 1)
    body = " ".join([
        SIGN_COPY.get(sign_key, SIGN_COPY["warrior"])[lang],
        HOUSE_COPY.get(house_key, HOUSE_COPY["self_warrior"])[lang],
        DIGNITY_COPY.get(verdict.get("dignity"), {}).get(lang, ""),
        *_aspect_snippet(verdict.get("aspects", []), lang),
    ])
    action = {
        "en": "Choose a theme to reflect on, only if it fits your own experience",
        "fa": "فقط اگر با تجربهٔ خودت سازگار است موضوعی برای تأمل انتخاب کن",
        "ru": "Выберите тему для размышления, только если она соответствует вашему опыту",
        "ar": "يمكن مقارنة هذه الموضوعات بالتجربة الشخصية واختيار ما يناسب منها"
    }[lang]
    return _safe_reading(
        lang=lang, headline=INTENSITY_HEADLINE["moderate"][lang], body=body,
        action=action, avoid={
            "en": "treating a symbolic pattern as a definition of yourself or another person",
            "fa": "تعریف خود یا دیگری بر اساس الگوی نمادین",
            "ru": "определения себя или другого человека по символическому паттерну",
            "ar": "تعريف نفسك أو شخص آخر بنمط رمزي"
        }[lang], intensity=verdict.get("intensity", "subtle"),
        technical=f"Mars {verdict.get('degree', 0)}° {sign} · house {house} · dignity: {verdict.get('dignity')}",
        limitation=_DESIRE_LIMITATION[lang], sign=SIGN_LABEL.get(sign, {}).get(lang, sign), house=house,
    )


# ── Ghost Days (Power Calendar — strategic distance) ─────────────────────────

GHOST_HEADLINE: dict[str, dict[str, str]] = {
    "strong": {
        "en": "A window for a communicated pause",
        "fa": "بازه مناسب برای یک مکثِ هماهنگ‌شده",
        "ru": "Возможность для согласованной паузы",
        "ar": "فرصة اختيارية لاستراحة مع توضيح"
    },
    "moderate": {
        "en": "A window for a communicated pause",
        "fa": "بازه مناسب برای یک مکثِ هماهنگ‌شده",
        "ru": "Возможность для согласованной паузы",
        "ar": "فرصة اختيارية لاستراحة مع توضيح"
    },
    "subtle": {
        "en": "A window for a communicated pause",
        "fa": "بازه مناسب برای یک مکثِ هماهنگ‌شده",
        "ru": "Возможность для согласованной паузы",
        "ar": "فرصة اختيارية لاستراحة مع توضيح"
    }
}

GHOST_STRATEGY: dict[str, str] = {
    "en": "Reduce pressure if you need space. Briefly communicate the pause and agree when to return to the conversation. Do not use distance to influence another person.",
    "fa": "اگر به فضا نیاز دارید فشار را کم کنید. مکث را کوتاه توضیح دهید و دربارهٔ زمان بازگشت به گفت‌وگو توافق کنید. از فاصله برای اثرگذاری بر دیگری استفاده نکنید.",
    "ru": "Если нужно пространство, снизьте давление. Кратко объясните паузу и договоритесь о возвращении к разговору. Не используйте дистанцию для влияния на другого.",
    "ar": "عند الحاجة إلى مساحة، يمكن تخفيف الضغط وتوضيح الاستراحة بإيجاز والاتفاق على وقت العودة للحوار. المسافة ليست وسيلة للتأثير على شخص آخر."
}


def _window_confidence(score: int) -> str:
    if score >= 75:
        return "high"
    if score >= 60:
        return "medium"
    return "low"


def _confidence_clause(confidence: str, lang: str) -> str:
    lang = _pick_lang(lang)
    band = confidence if confidence in {"high", "medium", "low"} else "medium"
    return {
        "high": {
            "en": "Confidence: high — clear enough to act on, still not a guarantee.",
            "fa": "اطمینان: high — برای عمل کافی است، هنوز قطعی نیست.",
            "ru": "Уверенность: high — достаточно для действия, не гарантия.",
            "ar": "الثقة: high — كافية للتصرف، وليست ضماناً.",
        },
        "medium": {
            "en": "Confidence: medium — usable signal; leave room to adjust.",
            "fa": "اطمینان: medium — سیگنال قابل استفاده؛ جا برای تنظیم بگذارید.",
            "ru": "Уверенность: medium — рабочий сигнал; оставьте запас.",
            "ar": "الثقة: medium — إشارة قابلة للاستخدام؛ مع هامش للتعديل.",
        },
        "low": {
            "en": "Confidence: low — a soft lean, not a green light.",
            "fa": "اطمینان: low — تمایل ملایم، نه چراغ سبز.",
            "ru": "Уверенность: low — мягкий наклон, не зелёный свет.",
            "ar": "الثقة: low — ميل خفيف، لا ضوء أخضر.",
        },
    }[band][lang]


def _window_bundle(
    *,
    lang: str,
    headline: str,
    signal: str,
    interpretation: str,
    impact: str,
    action: str,
    avoid: str,
    confidence: str,
    score_note: str = "",
    windows_note: str = "",
) -> tuple[str, str]:
    lang = _pick_lang(lang)
    conf = _confidence_clause(confidence, lang)
    score_bit = f" {score_note}" if score_note else ""
    windows_bit = f" {windows_note}" if windows_note else ""
    executive = {
        "en": (
            f"{headline}. {signal}{score_bit} "
            f"Action: {action}. Avoid: {avoid}. {conf}"
        ),
        "fa": (
            f"{headline}. {signal}{score_bit} "
            f"اقدام: {action}. پرهیز: {avoid}. {conf}"
        ),
        "ru": (
            f"{headline}. {signal}{score_bit} "
            f"Действие: {action}. Избегать: {avoid}. {conf}"
        ),
        "ar": (
            f"{headline}. {signal}{score_bit} "
            f"الإجراء: {action}. تجنّب: {avoid}. {conf}"
        ),
    }[lang]
    strategic = {
        "en": (
            f"{interpretation}{windows_bit} {conf} "
            f"{impact} Action: {action}. Avoid: {avoid}."
        ),
        "fa": (
            f"{interpretation}{windows_bit} {conf} "
            f"{impact} اقدام: {action}. پرهیز: {avoid}."
        ),
        "ru": (
            f"{interpretation}{windows_bit} {conf} "
            f"{impact} Действие: {action}. Избегать: {avoid}."
        ),
        "ar": (
            f"{interpretation}{windows_bit} {conf} "
            f"{impact} الإجراء: {action}. تجنّب: {avoid}."
        ),
    }[lang]
    return executive, strategic


_GHOST_AVOID: dict[str, str] = {
    "en": "unexplained withdrawal, pressure and using silence to influence someone",
    "fa": "فاصلهٔ بی‌توضیح، فشار و استفاده از سکوت برای اثرگذاری",
    "ru": "необъяснённого ухода, давления и влияния молчанием",
    "ar": "الانسحاب دون توضيح والضغط واستخدام الصمت للتأثير"
}


def render_ghost_days_reading(windows: list[dict[str, Any]], *, lang: str = "en", horizon_days: int = 14) -> dict[str, Any]:
    lang = _pick_lang(lang)
    score = int(windows[0].get("score", 0)) if windows else 0
    intensity = "strong" if score >= 75 else "moderate" if score >= 60 else "subtle"
    dates = ", ".join(f"{w['date']} ({int(w.get('score', 0))}/100)" for w in windows[:5])
    return _safe_reading(
        lang=lang, headline=GHOST_HEADLINE[intensity][lang],
        body=GHOST_STRATEGY[lang], action={
            "en": "If useful, take an intentional pause, briefly explain it and agree a return time",
            "fa": "اگر مفید است آگاهانه مکث کنید، کوتاه توضیح دهید و دربارهٔ زمان بازگشت توافق کنید",
            "ru": "Если полезно, сделайте осознанную паузу, кратко объясните её и согласуйте время возвращения",
            "ar": "عند الحاجة، يمكن أخذ استراحة مقصودة مع توضيح قصير واتفاق على موعد العودة"
        }[lang], avoid=_GHOST_AVOID[lang],
        intensity=intensity, technical=f"action=rest_recovery · horizon={horizon_days}d · windows={dates or '0'}",
        limitation=_SYMBOLIC_LIMITATION[lang],
        strongest_window=dict(windows[0]) if windows else None,
        secondary_windows=[dict(w) for w in windows[1:5]],
    )


# ── Money-Ask Days (Power Calendar — Venus money windows) ────────────────────

MONEY_ASK_HEADLINE: dict[str, dict[str, str]] = {
    "strong": {
        "en": "Symbolic timing for a money discussion",
        "fa": "زمان‌بندی نمادین گفت‌وگو دربارهٔ پول",
        "ru": "Символическое окно для разговора о деньгах",
        "ar": "توقيت رمزي لمناقشة المال"
    },
    "moderate": {
        "en": "Symbolic timing for a money discussion",
        "fa": "زمان‌بندی نمادین گفت‌وگو دربارهٔ پول",
        "ru": "Символическое окно для разговора о деньгах",
        "ar": "توقيت رمزي لمناقشة المال"
    },
    "subtle": {
        "en": "Symbolic timing for a money discussion",
        "fa": "زمان‌بندی نمادین گفت‌وگو دربارهٔ پول",
        "ru": "Символическое окно для разговора о деньгах",
        "ar": "توقيت رمزي لمناقشة المال"
    }
}

MONEY_ASK_STRATEGY: dict[str, str] = {
    "en": "If you choose to discuss money, first check the amount, terms, affordability and evidence. A timing rank is only a symbolic comparison of the dates evaluated.",
    "fa": "اگر گفت‌وگو دربارهٔ پول را انتخاب کردی، اول مبلغ، شروط، توان مالی و شواهد را بررسی کن. رتبه فقط مقایسهٔ نمادین تاریخ‌های بررسی‌شده است.",
    "ru": "Если решите обсудить деньги, сначала проверьте сумму, условия, посильность расходов и подтверждающие факты. Место в списке отражает только символическое сравнение рассмотренных дат.",
    "ar": "قبل مناقشة المال، من المفيد مراجعة المبلغ والشروط والقدرة المالية والأدلة. الترتيب مجرد مقارنة رمزية بين التواريخ المدروسة."
}

_MONEY_ASK_AVOID: dict[str, str] = {
    "en": "apologizing for the ask, stacking follow-ups, and vague amounts",
    "fa": "عذرخواهی بابت درخواست، پیگیری‌های پیاپی و مبلغ‌های مبهم",
    "ru": "извинения за просьбу, серии напоминаний и размытые суммы",
    "ar": "الاعتذار عن الطلب وتكرار المتابعة والمبالغ المبهمة"
}


def render_money_ask_days_reading(windows: list[dict[str, Any]], *, lang: str = "en", horizon_days: int = 14) -> dict[str, Any]:
    lang = _pick_lang(lang)
    score = int(windows[0].get("score", 0)) if windows else 0
    intensity = "strong" if score >= 75 else "moderate" if score >= 60 else "subtle"
    dates = ", ".join(f"{w['date']} ({int(w.get('score', 0))}/100)" for w in windows[:5])
    return _safe_reading(
        lang=lang, headline=MONEY_ASK_HEADLINE[intensity][lang],
        body=MONEY_ASK_STRATEGY[lang], action={
            "en": "Choose whether to discuss money after reviewing the real terms and evidence",
            "fa": "پس از بررسی شروط واقعی و شواهد دربارهٔ گفت‌وگوی مالی تصمیم بگیر",
            "ru": "Решите, обсуждать ли деньги, после проверки реальных условий и фактов",
            "ar": "يمكن اتخاذ قرار بشأن مناقشة المال بعد مراجعة الشروط والأدلة الواقعية"
        }[lang], avoid=_MONEY_ASK_AVOID[lang],
        intensity=intensity, technical=f"action=finance_transaction · horizon={horizon_days}d · windows={dates or '0'}",
        limitation=_MONEY_LIMITATION[lang],
        strongest_window=dict(windows[0]) if windows else None,
        secondary_windows=[dict(w) for w in windows[1:5]],
    )


# ── Yes Day (Power Calendar — ask / commit / sign) ───────────────────────────

_YES_AVOID: dict[str, str] = {
    "en": "rushing the ask, vague terms, and signing under pressure",
    "fa": "عجله در درخواست، شروط مبهم و امضا زیر فشار",
    "ru": "спешка в просьбе, размытые условия и подпись под давлением",
    "ar": "استعجال الطلب وشروط مبهمة والتوقيع تحت ضغط",
}


def render_yes_day_reading(*, ask: dict[str, Any], commit: dict[str, Any], sign: dict[str, Any], horizon_days: int = 14, lang: str = "en") -> dict[str, Any]:
    """The scorer returns independent maxima, never a chronological plan."""
    lang = _pick_lang(lang)
    avg = sum(int(slot.get("score", 0)) for slot in (ask, commit, sign)) // 3
    reason = {
        "en": "Each date is selected independently for its own symbolic score. An earlier signing window is not advice to sign before asking or agreeing terms. Same-day windows do not require same-day decisions.",
        "fa": "هر تاریخ بر اساس امتیاز نمادین خودش مستقل انتخاب شده است. پنجرهٔ زودتر امضا توصیه به امضا پیش از درخواست یا توافق نیست. پنجره‌های هم‌روز تصمیم هم‌روز را الزام نمی‌کنند.",
        "ru": "Каждая дата выбрана независимо по своему символическому баллу. Раннее окно подписи не советует подписывать до просьбы или согласования условий. Окна одного дня не требуют решений в один день.",
        "ar": "اختير كل تاريخ مستقلاً وفق درجته الرمزية. نافذة التوقيع المبكرة ليست نصيحة بالتوقيع قبل الطلب أو الاتفاق. النوافذ في يوم واحد لا تفرض قرارات في اليوم نفسه."
    }[lang]
    return _safe_reading(
        lang=lang, headline={
            "en": "Independent symbolic windows, not a sequence",
            "fa": "پنجره‌های نمادین مستقل، نه یک توالی",
            "ru": "Независимые символические окна, не последовательность",
            "ar": "نوافذ رمزية مستقلة، وليست تسلسلاً"
        }[lang], body=reason,
        action={
            "en": "Choose only a window relevant to your actual stage; do not sign before the terms are understood and agreed",
            "fa": "فقط پنجرهٔ مرتبط با مرحلهٔ واقعی را انتخاب کن؛ پیش از فهم و توافق بر شروط امضا نکن",
            "ru": "Выбирайте окно только для фактического этапа; не подписывайте до понимания и согласования условий",
            "ar": "اختر النافذة المناسبة لمرحلتك الفعلية فقط؛ لا توقع قبل فهم الشروط والاتفاق عليها"
        }[lang], avoid=_YES_AVOID[lang],
        intensity="strong" if avg >= 75 else "moderate" if avg >= 60 else "subtle",
        technical=f"horizon={horizon_days}d · ask=negotiation@{ask.get('date')} · commit=negotiation+contract_signing@{commit.get('date')} · sign=contract_signing@{sign.get('date')} · window_relationship=independent",
        limitation=_SYMBOLIC_LIMITATION[lang], reason=reason,
        ask=ask.get("date"), commit=commit.get("date"), sign=sign.get("date"), window_relationship="independent",
    )


# ── Hot Attraction Days (Power Calendar — Mars-ruled heat) ───────────────────

HOT_HEADLINE: dict[str, dict[str, str]] = {
    "strong": {
        "en": "High heat — attraction peaks",
        "fa": "حرارت بالا — اوج جذابیت",
        "ru": "Высокий жар — пик притяжения",
        "ar": "حرارة عالية — ذروة الجذب",
    },
    "moderate": {
        "en": "Warm attraction windows",
        "fa": "پنجره‌های جذابیت گرم",
        "ru": "Тёплые окна притяжения",
        "ar": "نوافذ جذب دافئة",
    },
    "subtle": {
        "en": "Soft spark timing",
        "fa": "زمان‌بندی جرقه ملایم",
        "ru": "Мягкий тайминг искры",
        "ar": "توقيت شرارة خفيفة",
    },
}

HOT_STRATEGY: dict[str, str] = {
    "en": (
        "Presence beats over-explaining. "
        "Lean into chemistry, touch, and selective silence — show up where you can be felt."
    ),
    "fa": (
        "حضور بهتر از توضیح زیاد است. "
        "روی شیمی، لمس و سکوت انتخابی تکیه کن — جایی حاضر شو که حس شوی."
    ),
    "ru": (
        "Присутствие сильнее лишних слов. "
        "Химия, касание, избирательная тишина — будьте там, где вас чувствуют."
    ),
    "ar": (
        "الحضور أقوى من الإفراط في الشرح. "
        "اعتمدي على الكيمياء واللمس والصمت الانتقائي — احضري حيث تُحسّين."
    ),
}


_HOT_AVOID: dict[str, str] = {
    "en": "cold distance, over-scheduling, and muted presence",
    "fa": "فاصلهٔ سرد، برنامه‌ریزی زیاد و حضور کم‌رمق",
    "ru": "холодная дистанция, перегруз расписания и тусклое присутствие",
    "ar": "المسافة الباردة وكثرة المواعيد والحضور الباهت",
}


def render_hot_attraction_days_reading(
    windows: list[dict[str, Any]],
    *,
    lang: str = "en",
    horizon_days: int = 14,
) -> dict[str, Any]:
    lang = _pick_lang(lang)
    ordered = sorted(windows, key=lambda w: w.get("score", 0), reverse=True)
    top = ordered[0] if ordered else None
    return _quality_reading("heat", lang, strongest_window=top, secondary_windows=ordered[1:5],
                            intensity="strong" if top and top.get("score", 0) >= 80 else "moderate" if top else "subtle",
                            technical=f"action=hot_attraction · horizon={horizon_days}d")


# ── Today's Color (Style Timing — Moon dress code) ───────────────────────────

# Primary + accent color names per transit Moon sign (localized).
MOON_SIGN_COLORS: dict[str, dict[str, dict[str, str]]] = {
    "aries": {
        "en": {"primary": "Scarlet red", "accent": "Warm coral"},
        "fa": {"primary": "قرمز شعله‌ای", "accent": "مرجانی گرم"},
        "ru": {"primary": "Алый красный", "accent": "Тёплый коралл"},
        "ar": {"primary": "أحمر قرمزي", "accent": "مرجاني دافئ"},
    },
    "taurus": {
        "en": {"primary": "Rose pink", "accent": "Soft sage green"},
        "fa": {"primary": "صورتی گل‌سرخی", "accent": "سبز مریم‌گلی"},
        "ru": {"primary": "Розовый", "accent": "Мягкий шалфей"},
        "ar": {"primary": "وردي وردي", "accent": "أخضر مريمية"},
    },
    "gemini": {
        "en": {"primary": "Butter yellow", "accent": "Light mint"},
        "fa": {"primary": "زرد کره‌ای", "accent": "نعنایی روشن"},
        "ru": {"primary": "Масляно-жёлтый", "accent": "Светлая мята"},
        "ar": {"primary": "أصفر زبدي", "accent": "نعناع فاتح"},
    },
    "cancer": {
        "en": {"primary": "Pearl silver", "accent": "Soft white"},
        "fa": {"primary": "نقره‌ای مرواریدی", "accent": "سفید نرم"},
        "ru": {"primary": "Жемчужное серебро", "accent": "Мягкий белый"},
        "ar": {"primary": "فضي لؤلؤي", "accent": "أبيض ناعم"},
    },
    "leo": {
        "en": {"primary": "Gold", "accent": "Sunset orange"},
        "fa": {"primary": "طلایی", "accent": "نارنجی غروب"},
        "ru": {"primary": "Золото", "accent": "Закатный оранжевый"},
        "ar": {"primary": "ذهبي", "accent": "برتقالي غروب"},
    },
    "virgo": {
        "en": {"primary": "Stone beige", "accent": "Navy"},
        "fa": {"primary": "بژ سنگی", "accent": "سرمه‌ای"},
        "ru": {"primary": "Каменный беж", "accent": "Тёмно-синий"},
        "ar": {"primary": "بيج حجري", "accent": "كحلي"},
    },
    "libra": {
        "en": {"primary": "Blush rose", "accent": "Powder blue"},
        "fa": {"primary": "صورتی ملایم", "accent": "آبی پودری"},
        "ru": {"primary": "Нежная роза", "accent": "Пудрово-голубой"},
        "ar": {"primary": "وردي خفيف", "accent": "أزرق بودري"},
    },
    "scorpio": {
        "en": {"primary": "Deep burgundy", "accent": "Black"},
        "fa": {"primary": "شرابی تیره", "accent": "مشکی"},
        "ru": {"primary": "Глубокий бордо", "accent": "Чёрный"},
        "ar": {"primary": "خمري عميق", "accent": "أسود"},
    },
    "sagittarius": {
        "en": {"primary": "Royal purple", "accent": "Cobalt blue"},
        "fa": {"primary": "بنفش سلطنتی", "accent": "آبی کبالت"},
        "ru": {"primary": "Королевский фиолетовый", "accent": "Кобальт"},
        "ar": {"primary": "بنفسجي ملكي", "accent": "أزرق كوبالت"},
    },
    "capricorn": {
        "en": {"primary": "Charcoal", "accent": "Dark chocolate"},
        "fa": {"primary": "ذغالی", "accent": "شکلاتی تیره"},
        "ru": {"primary": "Угольный", "accent": "Тёмный шоколад"},
        "ar": {"primary": "فحمي", "accent": "شوكولا داكن"},
    },
    "aquarius": {
        "en": {"primary": "Electric blue", "accent": "Turquoise"},
        "fa": {"primary": "آبی الکتریکی", "accent": "فیروزه‌ای"},
        "ru": {"primary": "Электрический синий", "accent": "Бирюза"},
        "ar": {"primary": "أزرق كهربائي", "accent": "فيروزي"},
    },
    "pisces": {
        "en": {"primary": "Seafoam green", "accent": "Lavender"},
        "fa": {"primary": "سبز دریایی", "accent": "اسطوخودوس"},
        "ru": {"primary": "Морская пена", "accent": "Лаванда"},
        "ar": {"primary": "أخضر بحري", "accent": "لافندر"},
    },
}

SIGN_LABEL: dict[str, dict[str, str]] = {
    "aries": {"en": "Aries", "fa": "حمل", "ru": "Овен", "ar": "الحمل"},
    "taurus": {"en": "Taurus", "fa": "ثور", "ru": "Телец", "ar": "الثور"},
    "gemini": {"en": "Gemini", "fa": "جوزا", "ru": "Близнецы", "ar": "الجوزاء"},
    "cancer": {"en": "Cancer", "fa": "سرطان", "ru": "Рак", "ar": "السرطان"},
    "leo": {"en": "Leo", "fa": "اسد", "ru": "Лев", "ar": "الأسد"},
    "virgo": {"en": "Virgo", "fa": "سنبله", "ru": "Дева", "ar": "العذراء"},
    "libra": {"en": "Libra", "fa": "میزان", "ru": "Весы", "ar": "الميزان"},
    "scorpio": {"en": "Scorpio", "fa": "عقرب", "ru": "Скорпион", "ar": "العقرب"},
    "sagittarius": {"en": "Sagittarius", "fa": "قوس", "ru": "Стрелец", "ar": "القوس"},
    "capricorn": {"en": "Capricorn", "fa": "جدی", "ru": "Козерог", "ar": "الجدي"},
    "aquarius": {"en": "Aquarius", "fa": "دلو", "ru": "Водолей", "ar": "الدلو"},
    "pisces": {"en": "Pisces", "fa": "حوت", "ru": "Рыбы", "ar": "الحوت"},
}


def render_todays_color_reading(
    *,
    moon_sign: str,
    moon_degree: float,
    target_date: str,
    lang: str = "en",
) -> dict[str, Any]:
    lang = _pick_lang(lang)
    sign = moon_sign.lower() if moon_sign.lower() in MOON_SIGN_COLORS else "cancer"
    colors = MOON_SIGN_COLORS[sign][lang]
    return _quality_reading("color", lang, sign=SIGN_LABEL[sign][lang], details=[
        {"label": _quality_label("date", lang), "value": target_date},
        {"label": _quality_label("palette", lang), "value": colors["primary"] + " · " + colors["accent"]}],
        technical=f"transit_moon={sign} · date={target_date}",
        data_completeness="supplied_unverified" if moon_sign.lower() in MOON_SIGN_COLORS else "incomplete")


# ── Today's Perfume (Style Timing — Venus/Moon/Asc + transit Moon) ───────────

# Scent note families per sign (localized). Reuses SIGN_LABEL for sign names.
SIGN_SCENT_NOTES: dict[str, dict[str, dict[str, str]]] = {
    "aries": {
        "en": {"note": "pepper + ginger", "family": "spicy"},
        "fa": {"note": "فلفل + زنجبیل", "family": "تند"},
        "ru": {"note": "перец + имбирь", "family": "пряный"},
        "ar": {"note": "فلفل + زنجبيل", "family": "حار"},
    },
    "taurus": {
        "en": {"note": "rose + sandalwood", "family": "floral-woody"},
        "fa": {"note": "رز + صندل", "family": "گلی-چوبی"},
        "ru": {"note": "роза + сандал", "family": "цветочно-древесный"},
        "ar": {"note": "ورد + صندل", "family": "زهري-خشبي"},
    },
    "gemini": {
        "en": {"note": "bergamot + tea", "family": "citrus-aromatic"},
        "fa": {"note": "برگاموت + چای", "family": "مرکباتی-آروماتیک"},
        "ru": {"note": "бергамот + чай", "family": "цитрусово-ароматический"},
        "ar": {"note": "برغموت + شاي", "family": "حمضي-عطري"},
    },
    "cancer": {
        "en": {"note": "white musk + lotus", "family": "soft-musk"},
        "fa": {"note": "مشک سفید + نیلوفر", "family": "مشکی نرم"},
        "ru": {"note": "белый мускус + лотос", "family": "мягкий мускус"},
        "ar": {"note": "مسك أبيض + لوتس", "family": "مسك ناعم"},
    },
    "leo": {
        "en": {"note": "jasmine + amber", "family": "solar-amber"},
        "fa": {"note": "یاس + عنبر", "family": "کهربایی خورشیدی"},
        "ru": {"note": "жасмин + амбра", "family": "солнечная амбра"},
        "ar": {"note": "ياسمين + عنبر", "family": "عنبري شمسي"},
    },
    "virgo": {
        "en": {"note": "iris + clean cedar", "family": "powdery-green"},
        "fa": {"note": "آیریس + سدر تمیز", "family": "پودری-سبز"},
        "ru": {"note": "ирис + чистый кедр", "family": "пудрово-зелёный"},
        "ar": {"note": "سوسن + أرز نظيف", "family": "بودري-أخضر"},
    },
    "libra": {
        "en": {"note": "peony + soft vanilla", "family": "balanced-floral"},
        "fa": {"note": "پیونی + وانیل نرم", "family": "گلی متعادل"},
        "ru": {"note": "пион + мягкая ваниль", "family": "сбалансированный цветочный"},
        "ar": {"note": "فاوانيا + فانيلا ناعمة", "family": "زهري متوازن"},
    },
    "scorpio": {
        "en": {"note": "dark rose + incense", "family": "oriental"},
        "fa": {"note": "رز تیره + عود", "family": "شرقی"},
        "ru": {"note": "тёмная роза + ладан", "family": "восточный"},
        "ar": {"note": "ورد داكن + بخور", "family": "شرقي"},
    },
    "sagittarius": {
        "en": {"note": "tonka + smoky woods", "family": "warm-woody"},
        "fa": {"note": "تونکا + چوب دودی", "family": "چوبی گرم"},
        "ru": {"note": "тонка + дымное дерево", "family": "тёплый древесный"},
        "ar": {"note": "تونكا + أخشاب مدخنة", "family": "خشبي دافئ"},
    },
    "capricorn": {
        "en": {"note": "vetiver + leather", "family": "dry-woody"},
        "fa": {"note": "وتیور + چرم", "family": "چوبی خشک"},
        "ru": {"note": "ветивер + кожа", "family": "сухой древесный"},
        "ar": {"note": "فيتيفر + جلد", "family": "خشبي جاف"},
    },
    "aquarius": {
        "en": {"note": "ozonic air + violet", "family": "modern-ozonic"},
        "fa": {"note": "هوای اوزونی + بنفشه", "family": "مدرن-اوزونی"},
        "ru": {"note": "озоновый воздух + фиалка", "family": "современный озоновый"},
        "ar": {"note": "هواء أوزوني + بنفسج", "family": "أوزوني حديث"},
    },
    "pisces": {
        "en": {"note": "aquatic florals + soft incense", "family": "aquatic-mystic"},
        "fa": {"note": "گل‌های آبی + عود نرم", "family": "آبی-عرفانی"},
        "ru": {"note": "водные цветы + мягкий ладан", "family": "водно-мистический"},
        "ar": {"note": "زهور مائية + بخور ناعم", "family": "مائي-صوفي"},
    },
}

_SIGN_ELEMENT = {
    "aries": "fire", "leo": "fire", "sagittarius": "fire",
    "taurus": "earth", "virgo": "earth", "capricorn": "earth",
    "gemini": "air", "libra": "air", "aquarius": "air",
    "cancer": "water", "scorpio": "water", "pisces": "water",
}

_SIGN_OPPOSITE = {
    "aries": "libra", "taurus": "scorpio", "gemini": "sagittarius",
    "cancer": "capricorn", "leo": "aquarius", "virgo": "pisces",
    "libra": "aries", "scorpio": "taurus", "sagittarius": "gemini",
    "capricorn": "cancer", "aquarius": "leo", "pisces": "virgo",
}

# Occasion keyed by Ascendant element (projection / setting).
_ELEMENT_OCCASION: dict[str, dict[str, str]] = {
    "fire": {
        "en": "bold night out",
        "fa": "شب بیرون جسورانه",
        "ru": "смелый вечер вне дома",
        "ar": "سهرة جريئة خارجاً",
    },
    "earth": {
        "en": "intimate dinner",
        "fa": "شام صمیمی",
        "ru": "камерный ужин",
        "ar": "عشاء حميمي",
    },
    "air": {
        "en": "social evening",
        "fa": "عصر اجتماعی",
        "ru": "светский вечер",
        "ar": "أمسية اجتماعية",
    },
    "water": {
        "en": "romantic close setting",
        "fa": "فضای رمانتیک نزدیک",
        "ru": "романтичная близкая обстановка",
        "ar": "أجواء رومانسية قريبة",
    },
}


def render_todays_perfume_reading(
    *,
    natal_venus_sign: str,
    natal_moon_sign: str,
    ascendant_sign: str,
    transit_moon_sign: str,
    target_date: str,
    lang: str = "en",
) -> dict[str, Any]:
    """
    Style Timing — Today's Perfume.

    Fragrance from Natal Venus + Natal Moon + Ascendant + Transit Moon
    (local day). Not transit Moon alone.
    """
    lang = _pick_lang(lang)

    def _norm(sign: str, fallback: str) -> str:
        s = (sign or fallback).lower()
        return s if s in SIGN_SCENT_NOTES else fallback

    venus = _norm(natal_venus_sign, "taurus")
    n_moon = _norm(natal_moon_sign, "cancer")
    asc = _norm(ascendant_sign, "libra")
    t_moon = _norm(transit_moon_sign, "cancer")

    base = SIGN_SCENT_NOTES[venus][lang]
    heart = SIGN_SCENT_NOTES[n_moon][lang]
    aura = SIGN_SCENT_NOTES[asc][lang]
    accent_src = SIGN_SCENT_NOTES[t_moon][lang]

    # Weighted element vote: Venus 3, natal Moon 2, Asc 2, transit Moon 1.
    weights = ((venus, 3), (n_moon, 2), (asc, 2), (t_moon, 1))
    element_score: dict[str, int] = {}
    for sign, w in weights:
        el = _SIGN_ELEMENT[sign]
        element_score[el] = element_score.get(el, 0) + w
    dominant_element = max(
        element_score.items(), key=lambda kv: (kv[1], kv[0] == _SIGN_ELEMENT[venus])
    )[0]

    candidates = [s for s, _w in weights if _SIGN_ELEMENT[s] == dominant_element]
    priority = {venus: 4, n_moon: 3, asc: 2, t_moon: 1}
    lead_sign = max(candidates, key=lambda s: priority.get(s, 0))
    lead = SIGN_SCENT_NOTES[lead_sign][lang]

    fragrance_family = lead["family"]
    primary_notes = f"{base['note']} · {heart['note']}"
    # Optional accent: transit Moon note when it differs from Venus primary.
    accent_note = "" if t_moon == venus else accent_src["note"]
    occasion = _ELEMENT_OCCASION[_SIGN_ELEMENT[asc]][lang]
    result = _quality_reading("perfume", lang, sign=SIGN_LABEL[lead_sign][lang],
        fragrance_family=fragrance_family, primary_notes=primary_notes, accent_note=accent_note,
        occasion=occasion, reason=_quality_label("notes", lang),
        details=[{"label": _quality_label("date", lang), "value": target_date},
                 {"label": _quality_label("notes", lang), "value": " · ".join(dict.fromkeys([base["note"], heart["note"], aura["note"], accent_src["note"]]))}],
        technical=f"venus={venus} · moon={n_moon} · asc={asc} · transit_moon={t_moon}")
    return result


# ── Live / Reel Time (Style Timing — hourly content windows) ─────────────────

_LIVE_REEL_FOCUS: dict[str, dict[str, str]] = {
    "posting": {
        "en": "reach and shareability",
        "fa": "دسترسی و اشتراک‌پذیری",
        "ru": "охват и шарабельность",
        "ar": "الوصول وقابلية المشاركة",
    },
    "filming": {
        "en": "creative flow and distinctive capture",
        "fa": "جریان خلاق و ضبط متمایز",
        "ru": "творческий поток и выразительная съёмка",
        "ar": "التدفق الإبداعي والتصوير المميز",
    },
    "live_stream": {
        "en": "visibility, presence, and live momentum",
        "fa": "دیده‌شدن، حضور و شتاب لایو",
        "ru": "видимость, присутствие и живой импульс",
        "ar": "الظهور والحضور وزخم البث المباشر",
    },
}


def _live_reel_confidence(score: int) -> str:
    if score >= 75:
        return "high"
    if score >= 60:
        return "medium"
    return "low"


def render_live_reel_time_reading(
    *,
    posting: dict[str, Any],
    filming: dict[str, Any],
    live_stream: dict[str, Any],
    target_date: str,
    lang: str = "en",
) -> dict[str, Any]:
    lang = _pick_lang(lang)
    grouped = {}
    for key, slot in (("posting", posting), ("filming", filming), ("live_stream", live_stream)):
        window, score = slot.get("window"), slot.get("score")
        if window and isinstance(score, (int, float)):
            grouped.setdefault((window, score), []).append(_quality_label(key, lang))
    details = [{"label": _quality_label("date", lang), "value": target_date}]
    details += [{"label": " / ".join(labels), "value": f"{window} · {score}/100"} for (window, score), labels in grouped.items()]
    return _quality_reading("post", lang, details=details, reason=_quality_label("weights", lang),
                            technical=f"date={target_date} · actions={posting.get('action_type')},{filming.get('action_type')},{live_stream.get('action_type')}")


def _safe_window(slot: dict[str, Any]) -> str:
    return str(slot.get("window") or "—")


# ── Date Outfit (Style Timing — Venus/Asc + Moon color + meeting hour) ───────

# style / accessory / avoid keyed by sign (localized). Reuses MOON_SIGN_COLORS
# + SIGN_SCENT_NOTES for color and fragrance family.
SIGN_DATE_LOOK: dict[str, dict[str, dict[str, str]]] = {
    "aries": {
        "en": {
            "style": "defined lines and bold details",
            "accessory": "metallic cuff",
            "avoid": "overly soft pastels",
        },
        "fa": {
            "style": "خطوط مشخص و جزئیات چشمگیر",
            "accessory": "دستبند فلزی",
            "avoid": "پاستل‌های خیلی نرم",
        },
        "ru": {
            "style": "чёткие линии и выразительные детали",
            "accessory": "металлический браслет",
            "avoid": "слишком мягкие пастели",
        },
        "ar": {
            "style": "خطوط واضحة وتفاصيل بارزة",
            "accessory": "سوار معدني",
            "avoid": "الباستيل الناعم جداً",
        },
    },
    "taurus": {
        "en": {
            "style": "soft fabrics with refined details",
            "accessory": "silk scarf",
            "avoid": "harsh neon",
        },
        "fa": {
            "style": "پارچه‌های لطیف با جزئیات ظریف",
            "accessory": "شال ابریشمی",
            "avoid": "نئون تند",
        },
        "ru": {
            "style": "мягкие ткани и изящные детали",
            "accessory": "шёлковый шарф",
            "avoid": "резкий неон",
        },
        "ar": {
            "style": "أقمشة ناعمة بتفاصيل أنيقة",
            "accessory": "وشاح حريري",
            "avoid": "النيون الحاد",
        },
    },
    "gemini": {
        "en": {
            "style": "colourful layered pieces",
            "accessory": "statement earrings",
            "avoid": "one heavy costume look",
        },
        "fa": {
            "style": "ترکیب چندلایه با رنگ‌های متنوع",
            "accessory": "گوشواره شاخص",
            "avoid": "یک استایل کاستیوم سنگین",
        },
        "ru": {
            "style": "многослойный образ с яркими деталями",
            "accessory": "яркие серьги",
            "avoid": "один тяжёлый костюмный образ",
        },
        "ar": {
            "style": "تنسيق متعدد الطبقات بألوان متنوعة",
            "accessory": "أقراط مميزة",
            "avoid": "إطلالة تنكر ثقيلة واحدة",
        },
    },
    "cancer": {
        "en": {
            "style": "soft fabrics with delicate accents",
            "accessory": "pearl detail",
            "avoid": "cold hard edges",
        },
        "fa": {
            "style": "پارچه‌های لطیف با تزئینات ظریف",
            "accessory": "جزئیات مروارید",
            "avoid": "لبه‌های سرد و سخت",
        },
        "ru": {
            "style": "романтика и мягкость",
            "accessory": "жемчужный акцент",
            "avoid": "холодные жёсткие линии",
        },
        "ar": {
            "style": "أقمشة ناعمة بلمسات رقيقة",
            "accessory": "لمسة لؤلؤ",
            "avoid": "الحواف الباردة الصلبة",
        },
    },
    "leo": {
        "en": {
            "style": "lustrous fabrics and gold accents",
            "accessory": "gold hoop earrings",
            "avoid": "muted beige-only",
        },
        "fa": {
            "style": "پارچه‌های براق با جزئیات طلایی",
            "accessory": "گوشواره حلقه‌ای طلایی",
            "avoid": "فقط بژ بی‌روح",
        },
        "ru": {
            "style": "блестящие ткани и золотые акценты",
            "accessory": "золотые серьги-кольца",
            "avoid": "только тусклый беж",
        },
        "ar": {
            "style": "أقمشة لامعة ولمسات ذهبية",
            "accessory": "أقراط حلقية ذهبية",
            "avoid": "البيج الباهت وحده",
        },
    },
    "virgo": {
        "en": {
            "style": "neat tailoring and simple lines",
            "accessory": "fine chain without a pendant",
            "avoid": "messy layering",
        },
        "fa": {
            "style": "دوخت مرتب و خطوط ساده",
            "accessory": "زنجیر ظریف بدون آویز",
            "avoid": "لایه‌بندی شلخته",
        },
        "ru": {
            "style": "чистый крой",
            "accessory": "тонкая цепочка без подвесок",
            "avoid": "хаотичное многослойе",
        },
        "ar": {
            "style": "قَصّات مرتبة وخطوط بسيطة",
            "accessory": "سلسلة بسيطة",
            "avoid": "الطبقات الفوضوية",
        },
    },
    "libra": {
        "en": {
            "style": "coordinated separates with balanced proportions",
            "accessory": "delicate bracelet",
            "avoid": "harsh contrast clash",
        },
        "fa": {
            "style": "ترکیب هماهنگ لباس‌ها با تناسب متعادل",
            "accessory": "دستبند ظریف",
            "avoid": "کنتراست خشن",
        },
        "ru": {
            "style": "сочетающиеся вещи и уравновешенные пропорции",
            "accessory": "тонкий браслет",
            "avoid": "резкий цветовой конфликт",
        },
        "ar": {
            "style": "أناقة متوازنة",
            "accessory": "سوار رقيق",
            "avoid": "التضاد الحاد",
        },
    },
    "scorpio": {
        "en": {
            "style": "dark tones with defined details",
            "accessory": "smoky-stone ring",
            "avoid": "cute cartoon prints",
        },
        "fa": {
            "style": "رنگ‌های تیره با جزئیات مشخص",
            "accessory": "انگشتر با سنگ دودی",
            "avoid": "چاپ‌های کارتونی بامزه",
        },
        "ru": {
            "style": "тёмные тона и выразительные детали",
            "accessory": "кольцо с дымчатым камнем",
            "avoid": "милые мультяшные принты",
        },
        "ar": {
            "style": "ألوان داكنة وتفاصيل محددة",
            "accessory": "خاتم بحجر دخاني",
            "avoid": "طباعات كرتونية لطيفة",
        },
    },
    "sagittarius": {
        "en": {
            "style": "relaxed clothing for a walk",
            "accessory": "statement boots or a wide bracelet",
            "avoid": "stiff formal armour",
        },
        "fa": {
            "style": "پوشش راحت مناسب پیاده‌روی",
            "accessory": "بوت چشمگیر یا دستبند پهن",
            "avoid": "زره رسمی خشک",
        },
        "ru": {
            "style": "непринуждённая одежда для прогулки",
            "accessory": "выразительные ботинки или широкий браслет",
            "avoid": "жёсткий формальный панцирь",
        },
        "ar": {
            "style": "ملابس مريحة مناسبة للمشي",
            "accessory": "حذاء بتفاصيل بارزة أو سوار عريض",
            "avoid": "الدرع الرسمي الصلب",
        },
    },
    "capricorn": {
        "en": {
            "style": "structured tailoring and a defined silhouette",
            "accessory": "leather strap watch",
            "avoid": "frilly excess",
        },
        "fa": {
            "style": "لباس خوش‌دوخت با خطوط مشخص",
            "accessory": "ساعت بند چرمی",
            "avoid": "زیادی چین‌دار",
        },
        "ru": {
            "style": "чёткий силуэт и строгий крой",
            "accessory": "часы на кожаном ремешке",
            "avoid": "избыточная оборка",
        },
        "ar": {
            "style": "قَصّات محددة وخطوط واضحة",
            "accessory": "ساعة بحزام جلد",
            "avoid": "الزخرفة المفرطة",
        },
    },
    "aquarius": {
        "en": {
            "style": "modern geometric cuts",
            "accessory": "geometric jewellery",
            "avoid": "dated matchy sets",
        },
        "fa": {
            "style": "برش‌های مدرن و هندسی",
            "accessory": "زیورآلات با طرح هندسی",
            "avoid": "ست‌های هم‌رنگ قدیمی",
        },
        "ru": {
            "style": "современный геометричный крой",
            "accessory": "украшение геометрической формы",
            "avoid": "устаревшие парные комплекты",
        },
        "ar": {
            "style": "قَصّات عصرية وهندسية",
            "accessory": "حُلي بتصميم هندسي",
            "avoid": "أطقم متطابقة قديمة",
        },
    },
    "pisces": {
        "en": {
            "style": "flowing fabrics and delicate details",
            "accessory": "sheer or iridescent fabric detail",
            "avoid": "rigid corporate lines",
        },
        "fa": {
            "style": "پارچه‌های رها با جزئیات لطیف",
            "accessory": "جزئیات پارچه شفاف یا رنگین‌تاب",
            "avoid": "خطوط خشک شرکتی",
        },
        "ru": {
            "style": "струящиеся ткани и нежные детали",
            "accessory": "прозрачный или переливчатый акцент",
            "avoid": "жёсткие корпоративные линии",
        },
        "ar": {
            "style": "أقمشة انسيابية وتفاصيل رقيقة",
            "accessory": "تفصيل بقماش شفاف أو متلألئ",
            "avoid": "الخطوط المؤسسية الصلبة",
        },
    },
}


def render_date_outfit_reading(
    *,
    natal_venus_sign: str,
    ascendant_sign: str,
    transit_moon_sign: str,
    meeting_window: str,
    meeting_score: int,
    target_date: str,
    lang: str = "en",
    meeting_timezone: str | None = None,
) -> dict[str, Any]:
    """
    Style Timing — Date Outfit.

    Style = Natal Venus, colors = Transit Moon, accessories = Ascendant,
    fragrance = Venus scent family, meeting = best romantic_meeting hour,
    avoid = Transit Moon caution.
    """
    lang = _pick_lang(lang)

    def _norm(sign: str, fallback: str) -> str:
        s = (sign or fallback).lower()
        return s if s in SIGN_DATE_LOOK else fallback

    venus = _norm(natal_venus_sign, "taurus")
    asc = _norm(ascendant_sign, "libra")
    t_moon = _norm(transit_moon_sign, "cancer")

    style = SIGN_DATE_LOOK[venus][lang]["style"]
    accessories = SIGN_DATE_LOOK[asc][lang]["accessory"]
    colors = MOON_SIGN_COLORS[t_moon][lang]
    primary = colors["primary"]
    accent = colors["accent"]
    fragrance = SIGN_SCENT_NOTES[venus][lang]["family"]
    window = meeting_window or "—"

    return _quality_reading("outfit", lang, outfit_style=style, primary_color=primary,
        accent_color=accent, accessories=accessories, fragrance_family=fragrance,
        best_meeting_time=window,
        details=[{"label": _quality_label("meeting", lang), "value": f"{window} · {meeting_score}/100" + (f" · {meeting_timezone}" if meeting_timezone else ""), "direction": "ltr"},
                 {"label": _quality_label("date", lang), "value": target_date},
                 {"label": _quality_label("style", lang), "value": style},
                 {"label": _quality_label("palette", lang), "value": primary + " · " + accent},
                 {"label": _quality_label("accessory", lang), "value": accessories}],
        technical=f"venus={venus} · asc={asc} · transit_moon={t_moon}")


_AREA_LABEL: dict[str, dict[str, str]] = {
    "love": {"en": "relationship", "fa": "رابطه", "ru": "отношения", "ar": "علاقة"},
    "career": {"en": "career", "fa": "شغل", "ru": "карьера", "ar": "مهنة"},
    "wealth": {"en": "wealth", "fa": "ثروت", "ru": "богатство", "ar": "ثروة"},
    "home": {"en": "stability / home", "fa": "ثبات / خانه", "ru": "стабильность / дом", "ar": "استقرار / منزل"},
    "wellbeing": {"en": "wellbeing", "fa": "سلامت", "ru": "самочувствие", "ar": "عافية"},
    "community": {"en": "community", "fa": "جامعه", "ru": "сообщество", "ar": "مجتمع"},
    "spirituality": {"en": "spirituality", "fa": "معنویت", "ru": "духовность", "ar": "روحانية"},
}

_GOAL_LABEL: dict[str, dict[str, str]] = {
    "wealth": {"en": "wealth", "fa": "ثروت", "ru": "богатство", "ar": "ثروة"},
    "career": {"en": "career", "fa": "شغل", "ru": "карьера", "ar": "مهنة"},
    "relationship": {"en": "relationship", "fa": "رابطه", "ru": "отношения", "ar": "علاقة"},
    "visibility": {"en": "visibility", "fa": "دیده‌شدن", "ru": "видимость", "ar": "ظهور"},
    "stability": {"en": "stability", "fa": "ثبات", "ru": "стабильность", "ar": "استقرار"},
}


def render_best_countries_reading(
    ranked: list[dict[str, Any]],
    *,
    goal: str = "wealth",
    lang: str = "en",
    missing_inputs: list[str] | None = None,
) -> dict[str, Any]:
    return _quality_geography(ranked, goal, _pick_lang(lang), missing_inputs)


_BUSINESS_GOAL_LABEL: dict[str, dict[str, str]] = {
    "sales": {"en": "sales", "fa": "فروش", "ru": "продажи", "ar": "مبيعات"},
    "networking": {
        "en": "networking",
        "fa": "شبکه‌سازی",
        "ru": "нетворкинг",
        "ar": "تواصل",
    },
    "credibility": {
        "en": "credibility",
        "fa": "اعتبار",
        "ru": "авторитет",
        "ar": "مصداقية",
    },
    "expansion": {
        "en": "expansion",
        "fa": "گسترش",
        "ru": "расширение",
        "ar": "توسع",
    },
    "investment": {
        "en": "investment",
        "fa": "سرمایه‌گذاری",
        "ru": "инвестиции",
        "ar": "استثمار",
    },
}

_BUSINESS_USE_LABEL: dict[str, dict[str, str]] = {
    "wealth": {
        "en": "revenue & capital",
        "fa": "درآمد و سرمایه",
        "ru": "доход и капитал",
        "ar": "إيراد ورأس مال",
    },
    "career": {
        "en": "authority & credibility",
        "fa": "اقتدار و اعتبار",
        "ru": "авторитет и статус",
        "ar": "سلطة ومصداقية",
    },
    "community": {
        "en": "markets & networking",
        "fa": "بازار و شبکه",
        "ru": "рынки и связи",
        "ar": "أسواق وتواصل",
    },
}


def render_business_geography_reading(
    ranked: list[dict[str, Any]],
    *,
    goal: str = "expansion",
    lang: str = "en",
    missing_inputs: list[str] | None = None,
) -> dict[str, Any]:
    return _quality_geography(ranked, goal, _pick_lang(lang), missing_inputs, business=True)


_PARTNERSHIP_GOAL_LABEL: dict[str, dict[str, str]] = {
    "romantic": {
        "en": "romantic",
        "fa": "رمانتیک",
        "ru": "романтика",
        "ar": "رومانسي",
    },
    "marriage": {
        "en": "marriage",
        "fa": "ازدواج",
        "ru": "брак",
        "ar": "زواج",
    },
    "business": {
        "en": "business partnership",
        "fa": "شراکت کاری",
        "ru": "деловое партнёрство",
        "ar": "شراكة عمل",
    },
    "financial_support": {
        "en": "financial support",
        "fa": "پشتیبانی مالی",
        "ru": "финансовая поддержка",
        "ar": "دعم مالي",
    },
    "long_term_stability": {
        "en": "long-term stability",
        "fa": "ثبات بلندمدت",
        "ru": "долгосрочная стабильность",
        "ar": "استقرار طويل الأمد",
    },
}


def render_partner_profile_reading(
    *,
    mode: str,
    goal: str,
    lang: str = "en",
    ideal_traits: list[str] | None = None,
    compatibility_patterns: list[str] | None = None,
    friction_points: list[str] | None = None,
    dynamics: dict[str, str] | None = None,
    verify_questions: list[str] | None = None,
    missing_inputs: list[str] | None = None,
    confidence: str = "medium",
    synastry_score: int | None = None,
) -> dict[str, Any]:
    lang = _pick_lang(lang)
    business = goal in {"business", "business_partner"}
    return _quality_reading("business" if business else "partner", lang,
                             mode=mode, missing_inputs=list(missing_inputs or []),
                             technical=f"relationship_profile={goal}",
                             data_completeness="incomplete" if missing_inputs else "supplied_unverified",
                             ideal_traits=list(ideal_traits or []), compatibility_patterns=list(compatibility_patterns or []),
                             friction_points=list(friction_points or []), dynamics=dict(dynamics or {}),
                             verify_questions=list(verify_questions or []))


_COMPAT_CONTEXT_COPY = {
    "business": {
        "en": {
            "body": "The weights compare chart themes for a working partnership, not qualities measured in the collaboration.",
            "action": "Discuss one shared work priority and one difference using concrete examples from the collaboration",
            "avoid": "Using a score to hire, fire, assign ownership or decide whether to continue a business partnership",
        },
        "ru": {
            "body": "Веса сравнивают темы карт для рабочего партнёрства, а не измеренные качества сотрудничества.",
            "action": "Обсудите один общий рабочий приоритет и одно различие на конкретных примерах из сотрудничества",
            "avoid": "Решение нанять, уволить, распределить доли или продолжать деловое партнёрство на основании балла",
        },
        "fa": {
            "body": "وزن‌ها مضمون‌های نمودار را برای شراکت کاری مقایسه می‌کنند، نه ویژگی‌های اندازه‌گیری‌شده همکاری را.",
            "action": "یک اولویت کاری مشترک و یک تفاوت را با مثال‌های مشخص از همکاری بررسی کنید",
            "avoid": "تصمیم برای استخدام، پایان همکاری، تقسیم مالکیت یا ادامه شراکت کاری بر اساس امتیاز",
        },
        "ar": {
            "body": "تقارن الأوزان موضوعات الخرائط لشراكة عمل، لا صفات مقاسة في التعاون.",
            "action": "يمكن مناقشة أولوية عمل مشتركة واختلاف واحد بأمثلة محددة من التعاون",
            "avoid": "اتخاذ قرار بالتوظيف أو إنهاء التعاون أو توزيع الملكية أو استمرار الشراكة بناءً على درجة",
        },
    },
    "friendship": {
        "en": {
            "body": "The weights compare chart themes for a friendship, not qualities measured in the friendship.",
            "action": "Discuss one shared friendship priority and one difference using concrete examples from the friendship",
            "avoid": "Using a score to decide whether to keep, distance or end a friendship",
        },
        "ru": {
            "body": "Веса сравнивают темы карт для дружбы, а не измеренные качества дружбы.",
            "action": "Обсудите один общий приоритет дружбы и одно различие на конкретных примерах",
            "avoid": "Решение сохранить, отдалить или прекратить дружбу на основании балла",
        },
        "fa": {
            "body": "وزن‌ها مضمون‌های نمودار را برای دوستی مقایسه می‌کنند، نه ویژگی‌های اندازه‌گیری‌شده دوستی را.",
            "action": "یک اولویت مشترک دوستی و یک تفاوت را با مثال‌های مشخص بررسی کنید",
            "avoid": "تصمیم برای حفظ، فاصله‌گرفتن یا پایان دوستی بر اساس امتیاز",
        },
        "ar": {
            "body": "تقارن الأوزان موضوعات الخرائط للصداقة، لا صفات مقاسة في الصداقة.",
            "action": "يمكن مناقشة أولوية مشتركة في الصداقة واختلاف واحد بأمثلة محددة",
            "avoid": "اتخاذ قرار بالإبقاء على الصداقة أو الإبعاد أو إنهائها بناءً على درجة",
        },
    },
}

_COMPAT_REL_LABEL: dict[str, dict[str, str]] = {
    "romantic": {
        "en": "romantic",
        "fa": "رمانتیک",
        "ru": "романтика",
        "ar": "رومانسي",
    },
    "marriage": {
        "en": "marriage",
        "fa": "ازدواج",
        "ru": "брак",
        "ar": "زواج",
    },
    "business": {
        "en": "business",
        "fa": "کاری",
        "ru": "деловые отношения",
        "ar": "عمل",
    },
    "friendship": {
        "en": "friendship",
        "fa": "دوستی",
        "ru": "дружба",
        "ar": "صداقة",
    },
}

_BAND_LABEL: dict[str, dict[str, str]] = {
    "harmony": {
        "en": "harmony",
        "fa": "هماهنگی",
        "ru": "гармония",
        "ar": "انسجام",
    },
    "tension": {
        "en": "tension",
        "fa": "تنش",
        "ru": "напряжение",
        "ar": "توتر",
    },
    "mixed": {
        "en": "mixed",
        "fa": "ترکیبی",
        "ru": "смешанно",
        "ar": "مختلط",
    },
    "unknown": {
        "en": "unknown",
        "fa": "نامشخص",
        "ru": "неясно",
        "ar": "غير معروف",
    },
}


def render_compatibility_reading(
    *,
    lang: str = "en",
    relationship_type: str = "romantic",
    dimensions: dict[str, dict[str, Any]] | None = None,
    strengths: list[str] | None = None,
    friction_points: list[str] | None = None,
    verify_questions: list[str] | None = None,
    missing_inputs: list[str] | None = None,
    confidence: str = "medium",
    overall_score: int | None = None,
    concern: str | None = None,
    time_precision_note: str | None = None,
) -> dict[str, Any]:
    lang = _pick_lang(lang)
    dims = dict(dimensions or {})
    details = [{"label": _quality_label(key, lang), "value": f"{dim['score']}/100"}
               for key, dim in dims.items() if isinstance(dim.get("score"), (int, float))]
    result = _quality_reading("compatibility", lang, details=details, dimensions=dims, overall_score=overall_score,
                            technical=f"relationship_profile={relationship_type}",
                            missing_inputs=list(missing_inputs or []), strengths=list(strengths or []),
                            friction_points=list(friction_points or []), verify_questions=list(verify_questions or []),
                            data_completeness="incomplete" if missing_inputs else "supplied_unverified")
    result["score_formula"] = {
        "en": "If theme scores are present, Overall is 45% of the full two-chart comparison plus 55% of the mean of those themes, then rounded. If no themes are present, Overall is the full two-chart comparison only. If required partner date or place is missing, Overall is not calculated. Unknown birth time uses a 12:00 placeholder and does not validate astrological-house claims. Overall is not measured relationship quality.",
        "ru": "Если есть баллы тем, «Общий вес» — это 45% полного сравнения двух карт плюс 55% среднего этих тем, затем округление. Если тем нет, остаётся только полное сравнение. Если нет даты или места второго человека, общий балл не считается. Неизвестное время рождения заменяется на 12:00 и не подтверждает астрологические дома. Это не измеренное качество отношений.",
        "fa": "اگر امتیاز مضمون‌ها باشد، کلی برابر است با ۴۵٪ مقایسهٔ کامل دو نمودار به‌اضافهٔ ۵۵٪ میانگین همان مضمون‌ها، سپس گرد می‌شود. اگر مضمونی نباشد، فقط مقایسهٔ کامل است. اگر تاریخ یا مکان طرف دیگر نباشد، کلی محاسبه نمی‌شود. ساعت نامشخص تولد با ۱۲:۰۰ جایگزین می‌شود و خانه‌های نجومی را تأیید نمی‌کند. کیفیت واقعی رابطه را اندازه نمی‌گیرد.",
        "ar": "إذا وُجدت درجات الموضوعات، فإن الإجمالي هو ٤٥٪ من مقارنة الرسمين الكاملة زائد ٥٥٪ من متوسط تلك الموضوعات، ثم يُقرَّب. إن لم توجد موضوعات، يبقى الإجمالي مقارنة الرسمين فقط. إذا نقص تاريخ أو مكان الطرف الآخر فلا يُحسَب الإجمالي. الوقت غير المعروف يُستبدل بـ ١٢:٠٠ ولا يثبت البيوت الفلكية. هذا ليس جودة علاقة مقيسة.",
    }[lang]
    overlay = _COMPAT_CONTEXT_COPY.get(relationship_type)
    if overlay:
        action_label = {"en": "Action", "fa": "اقدام", "ru": "Действие", "ar": "الإجراء"}[lang]
        avoid_label = {"en": "Avoid", "fa": "پرهیز", "ru": "Избегать", "ar": "ما ينبغي تجنّبه"}[lang]
        result["action"] = overlay[lang]["action"]
        result["avoid"] = overlay[lang]["avoid"]
        result["strategic"] = overlay[lang]["body"]
        result["executive"] = (
            f"{result['headline']}. {action_label}: {result['action']}. {avoid_label}: {result['avoid']}."
        )
    return result


def render_cheating_radar_reading(
    *,
    lang: str = "en",
    mode: str = "self",
    relationship_type: str = "romantic",
    signals: dict[str, dict[str, Any]] | None = None,
    observed: list[str] | None = None,
    inferred: list[str] | None = None,
    unknown: list[str] | None = None,
    behaviors: list[str] | None = None,
    questions: list[str] | None = None,
    missing_inputs: list[str] | None = None,
    confidence: str = "medium",
    concern: str | None = None,
    time_precision_note: str | None = None,
    planet_roles: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    lang = _pick_lang(lang)
    sigs = dict(signals or {})
    prompts = trust_reflections(sigs, lang)
    limitation = _trust_limitation_for(relationship_type, lang)
    action = {
        "en": "Verify your understanding through observable behavior and a direct, calm conversation",
        "fa": "برداشتت را با رفتار قابل مشاهده و گفت‌وگوی مستقیم و آرام بررسی کن",
        "ru": "Проверьте своё понимание по наблюдаемому поведению и в прямом спокойном разговоре",
        "ar": "يمكن مراجعة الفهم بالاستناد إلى السلوك الملحوظ وحوار مباشر وهادئ"
    }[lang]
    reading = _safe_reading(
        lang=lang, headline=_TRUST_TITLE[lang], body=" ".join(prompts + list(questions or [])),
        action=action, avoid={
            "en": "accusations, surveillance and treating symbolic weights as facts",
            "fa": "اتهام، نظارت و واقعی دانستن وزن‌های نمادین",
            "ru": "обвинений, слежки и принятия символических весов за факты",
            "ar": "الاتهامات والمراقبة واعتبار الأوزان الرمزية حقائق"
        }[lang],
        intensity="moderate" if any(v.get("hits", 0) for v in sigs.values()) else "subtle",
        technical=f"mode={mode} · rel={relationship_type} · legacy_signal_keys={','.join(sigs)} · verdict=never",
        limitation=limitation, mode=mode,
        signals=sigs, planet_roles=dict(planet_roles or {}), observed=[], inferred=prompts,
        unknown=list(unknown or []), behaviors=list(behaviors or []), questions=list(questions or []),
        missing_inputs=list(missing_inputs or []),
    )
    return reading


def render_trust_patterns_reading(
    *,
    lang: str = "en",
    mode: str = "self",
    relationship_type: str = "romantic",
    signals: dict[str, dict[str, Any]] | None = None,
    observed: list[str] | None = None,
    inferred: list[str] | None = None,
    unknown: list[str] | None = None,
    behaviors: list[str] | None = None,
    questions: list[str] | None = None,
    missing_inputs: list[str] | None = None,
    confidence: str = "medium",
    concern: str | None = None,
    time_precision_note: str | None = None,
    planet_roles: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    lang = _pick_lang(lang)
    details = [{"label": _quality_label(key, lang), "value": f"{value['score']}/100"}
               for key, value in (signals or {}).items() if isinstance(value.get("score"), (int, float))]
    return _quality_reading("trust", lang, mode=mode, signals=dict(signals or {}), details=details,
                            technical="moon,mercury,venus,jupiter,saturn · verdict=never",
                            planet_roles=dict(planet_roles or {}), observed=[], inferred=[],
                            unknown=list(unknown or []), behaviors=[], questions=list(questions or []),
                            missing_inputs=list(missing_inputs or []),
                            data_completeness="incomplete" if missing_inputs else "supplied_unverified")


_COMM_RISK_BAND_LABEL: dict[str, dict[str, str]] = {
    "low": {"en": "low level", "fa": "سطح پایین", "ru": "низкий уровень", "ar": "مستوى منخفض"},
    "moderate": {
        "en": "moderate level",
        "fa": "سطح متوسط",
        "ru": "умеренный уровень",
        "ar": "مستوى متوسط",
    },
    "elevated": {
        "en": "elevated level",
        "fa": "سطح بالا",
        "ru": "повышенный уровень",
        "ar": "مستوى مرتفع",
    },
    "unknown": {
        "en": "unknown level",
        "fa": "سطح نامشخص",
        "ru": "неясный уровень",
        "ar": "مستوى غير معروف",
    },
}


def render_communication_risk_reading(
    *,
    lang: str = "en",
    mode: str = "self",
    relationship_type: str = "romantic",
    signals: dict[str, dict[str, Any]] | None = None,
    observed: list[str] | None = None,
    inferred: list[str] | None = None,
    unknown: list[str] | None = None,
    behaviors: list[str] | None = None,
    questions: list[str] | None = None,
    missing_inputs: list[str] | None = None,
    confidence: str = "medium",
    concern: str | None = None,
    time_precision_note: str | None = None,
    planet_roles: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Shadow Room — Communication Risk.
    Risk bands only — never lying, manipulation, abuse, or silence-as-fact claims.
    """
    lang = _pick_lang(lang)
    missing = list(missing_inputs or [])
    sigs = dict(signals or {})
    roles = dict(planet_roles or {})
    obs = list(observed or [])
    inf = list(inferred or [])
    unk = list(unknown or [])
    behaviors_l = list(behaviors or [])
    questions_l = list(questions or [])
    confidence = "low"  # Deprecated compatibility enum; evidence_status is authoritative.

    disclaimer = {
        "en": (
            "Risk patterns only — never a verdict. No factual character claim about "
            "lying, manipulation, abuse, silence, avoidance, or deception."
        ),
        "fa": (
            "فقط الگوی ریسک — هرگز حکم نیست. هیچ ادعای شخصیتی واقعی درباره دروغ، "
            "دستکاری، آزار، سکوت، اجتناب یا فریب مطرح نمی‌شود."
        ),
        "ru": (
            "Только паттерны риска — не приговор. Нет фактических утверждений о характере "
            "в вопросах лжи, манипуляции, насилия, тишины, избегания или обмана."
        ),
        "ar": (
            "أنماط مخاطر فقط — ليست حكماً. لا ادعاء شخصي واقعي حول الكذب أو التلاعب أو "
            "الأذى أو الصمت أو التجنّب أو الخداع."
        ),
    }[lang]

    rel_l = _COMPAT_REL_LABEL.get(
        relationship_type, _COMPAT_REL_LABEL["romantic"]
    )[lang]

    def _sig_line(key: str, label: str) -> str:
        s = sigs.get(key) or {}
        layer = str(s.get("layer") or "unknown")
        band = str(s.get("band") or "unknown")
        bl = _COMM_RISK_BAND_LABEL.get(band, _COMM_RISK_BAND_LABEL["unknown"])[lang]
        return f"{label}: {bl}/{layer}"

    labels = {
        "clarity_risk": {
            "en": "Symbolic unclear-message weight",
            "fa": "وزن نمادین پیام مبهم",
            "ru": "Символический вес неясности сообщения",
            "ar": "وزن رمزي لرسالة غير واضحة",
        },
        "misunderstanding_risk": {
            "en": "Symbolic misunderstanding weight",
            "fa": "وزن نمادین سوءتفاهم",
            "ru": "Символический вес недопонимания",
            "ar": "وزن رمزي لسوء الفهم",
        },
        "emotional_reactivity": {
            "en": "Symbolic emotional-reactivity weight",
            "fa": "وزن نمادین واکنش عاطفی",
            "ru": "Символический вес эмоциональной реактивности",
            "ar": "وزن رمزي لردة الفعل العاطفية",
        },
        "avoidance_silence": {
            "en": "Symbolic withdrawal/silence theme",
            "fa": "مضمون نمادین کناره‌گیری/سکوت",
            "ru": "Символическая тема ухода/тишины",
            "ar": "موضوع رمزي للانسحاب/الصمت",
        },
        "escalation_risk": {
            "en": "Symbolic escalation weight",
            "fa": "وزن نمادین تشدید",
            "ru": "Символический вес эскалации",
            "ar": "وزن رمزي للتصعيد",
        },
        "repair_capacity": {
            "en": "Symbolic repair difficulty",
            "fa": "وزن نمادین سختی برگشتن به گفت‌وگو",
            "ru": "Символическая трудность восстановления",
            "ar": "رمزية: صعوبة العودة إلى الحوار",
        },
    }
    order = (
        "clarity_risk",
        "misunderstanding_risk",
        "emotional_reactivity",
        "avoidance_silence",
        "escalation_risk",
        "repair_capacity",
    )
    sig_block = " · ".join(_sig_line(k, labels[k][lang]) for k in order)

    obs_txt = "; ".join(obs[:3]) if obs else "—"
    inf_txt = "; ".join(inf[:3]) if inf else "—"
    unk_txt = "; ".join(unk[:3]) if unk else "—"
    beh_txt = "; ".join(behaviors_l[:3]) if behaviors_l else "—"
    q_txt = " / ".join(questions_l[:3]) if questions_l else "—"
    concern_bit = ""
    if concern and concern.strip():
        concern_bit = {
            "en": f" Concern (observed input): {concern.strip()[:80]}.",
            "fa": f" دغدغه (ورودی مشاهده‌شده): {concern.strip()[:80]}.",
            "ru": f" Запрос (наблюдаемый ввод): {concern.strip()[:80]}.",
            "ar": f" القلق (مدخل ملاحظ): {concern.strip()[:80]}.",
        }[lang]
    time_bit = f" {time_precision_note}" if time_precision_note else ""

    action = {
        "en": "Slow the next hard talk — one clear ask, one check on how to return to the conversation, no accusation",
        "fa": "در گفت‌وگوی دشوار بعدی عجله نکنید؛ یک درخواست روشن مطرح کنید و بدون اتهام، دربارهٔ راه بازگشت به گفت‌وگو توافق کنید",
        "ru": "Не торопите следующий трудный разговор: сформулируйте одну ясную просьбу и обсудите, как восстановить контакт, без обвинений",
        "ar": "من المفيد التمهّل في الحديث الصعب التالي: طلب واضح واحد واتفاق على استعادة الحوار، دون اتهام",
    }[lang]

    mode_l = {
        "self": {
            "en": "self-pattern",
            "fa": "الگوی خود",
            "ru": "свой паттерн",
            "ar": "نمط ذاتي",
        },
        "synastry": {
            "en": "two-chart comparison (synastry) risk patterns",
            "fa": "الگوهای ریسک مقایسهٔ دو نمودار (سیناستری)",
            "ru": "риски сравнения двух карт (синастрия)",
            "ar": "أنماط مخاطر مقارنة الرسمين (السيناستري)",
        },
    }.get(mode, {}).get(lang, mode)

    headline = {
        "en": f"Communication Risk themes · {rel_l} · {mode_l}",
        "fa": f"موضوع‌های ریسک در گفت‌وگو · {rel_l} · {mode_l}",
        "ru": f"Темы риска общения · {rel_l} · {mode_l}",
        "ar": f"موضوعات مخاطر التواصل · {rel_l} · {mode_l}",
    }[lang]

    elev = sum(
        1
        for s in sigs.values()
        if str(s.get("band") or "") == "elevated"
        and str(s.get("layer") or "") == "inferred"
    )
    if elev >= 3:
        intensity = "strong"
    elif elev >= 1:
        intensity = "moderate"
    else:
        intensity = "subtle"

    role_bits = []
    for planet in ("mercury", "moon", "mars", "saturn", "jupiter", "venus"):
        r = roles.get(planet) or {}
        role_bits.append(
            f"{planet}:{r.get('role') or '—'}={r.get('band') or 'unknown'}"
        )
    roles_txt = " · ".join(role_bits) if role_bits else "—"

    impact = {
        "en": "What this changes today: gather observable proof before you escalate meaning.",
        "fa": "تأثیر امروز: قبل از بزرگ‌کردن معنا، شاهد قابل مشاهده جمع کنید.",
        "ru": "Что меняется сегодня: соберите наблюдаемые факты до эскалации смысла.",
        "ar": "قبل استخلاص أي معنى، يلزم الرجوع إلى الوقائع القابلة للملاحظة.",
    }[lang]
    executive = {
        "en": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Observed: {obs_txt}. Inferred: {inf_txt}. Unknown: {unk_txt}. "
            f"Verify behaviours: {beh_txt}. Questions: {q_txt}. "
            f"Next: {action}. Action: {action}."
        ),
        "fa": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"مشاهده: {obs_txt}. استنباط: {inf_txt}. نامشخص: {unk_txt}. "
            f"رفتار برای راستی‌آزمایی: {beh_txt}. سوالات: {q_txt}. "
            f"قدم بعد: {action}. اقدام: {action}."
        ),
        "ru": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Наблюдаемо: {obs_txt}. Вывод: {inf_txt}. Неизвестно: {unk_txt}. "
            f"Проверить поведение: {beh_txt}. Вопросы: {q_txt}. "
            f"Далее: {action}. Действие: {action}."
        ),
        "ar": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"ملاحظ: {obs_txt}. مستنتج: {inf_txt}. غير معروف: {unk_txt}. "
            f"سلوك للتحقق: {beh_txt}. أسئلة: {q_txt}. "
            f"التالي: {action}. الإجراء: {action}."
        ),
    }[lang]

    strategic = {
        "en": (
            f"Communication risk map: {sig_block}. Roles: {roles_txt}. "
            f"Keep observed ({obs_txt}) separate from inferred ({inf_txt}) and unknown ({unk_txt}). "
            f"{impact} Action: {action}. Ask calmly: {q_txt}."
        ),
        "fa": (
            f"نقشه ریسک گفت‌وگو: {sig_block}. نقش‌ها: {roles_txt}. "
            f"مشاهده ({obs_txt}) را از استنباط ({inf_txt}) و نامشخص ({unk_txt}) جدا نگه دارید. "
            f"{impact} اقدام: {action}. آرام بپرسید: {q_txt}."
        ),
        "ru": (
            f"Карта риска общения: {sig_block}. Роли: {roles_txt}. "
            f"Отделяйте наблюдаемое ({obs_txt}) от вывода ({inf_txt}) и неизвестного ({unk_txt}). "
            f"{impact} Действие: {action}. Спокойно спросите: {q_txt}."
        ),
        "ar": (
            f"خريطة مخاطر التواصل: {sig_block}. الأدوار: {roles_txt}. "
            f"يلزم الفصل بين الملاحظ ({obs_txt}) والمستنتج ({inf_txt}) وغير المعروف ({unk_txt}). "
            f"{impact} الإجراء: {action}. أسئلة لحوار هادئ: {q_txt}."
        ),
    }[lang]
    if missing:
        strategic += {
            "en": f" Missing inputs: {', '.join(missing)}.",
            "fa": f" ورودی ناقص: {', '.join(missing)}.",
            "ru": f" Не хватает: {', '.join(missing)}.",
            "ar": f" ناقص: {', '.join(missing)}.",
        }[lang]

    technical = (
        f"engine=relationship_profile+synastry_aspects · mode={mode} · "
        f"rel={relationship_type} · signals={','.join(sigs.keys())} · "
        f"planets=mercury,moon,mars,saturn,jupiter,venus · roles={roles_txt} · "
        f"confidence={confidence} · missing={','.join(missing) if missing else 'none'} · "
        f"verdict=never"
    )

    reflection_intro = {
        "en": "Symbolic prompts for a conversation, not observed communication behavior.",
        "fa": "موضوع‌هایی نمادین برای گفت‌وگو، نه توصیف رفتار ارتباطی مشاهده‌شده.",
        "ru": "Символические темы для разговора, а не описание наблюдаемого поведения в общении.",
        "ar": "موضوعات رمزية للحوار، وليست وصفاً لسلوك تواصل مُلاحظ.",
    }[lang]
    display_bands = " · ".join(
        f"{labels[key][lang]}: {_COMM_RISK_BAND_LABEL.get(str((sigs.get(key) or {}).get('band')), _COMM_RISK_BAND_LABEL['unknown'])[lang]}"
        for key in order
    )
    theme_details = [
        {
            "label": labels[key][lang],
            "value": _COMM_RISK_BAND_LABEL.get(
                str((sigs.get(key) or {}).get("band")),
                _COMM_RISK_BAND_LABEL["unknown"],
            )[lang],
        }
        for key in order
    ]
    question_label = {
        "en": "Question",
        "fa": "پرسش",
        "ru": "Вопрос",
        "ar": "سؤال",
    }[lang]
    question_details = [
        {"label": f"{question_label} {index}", "value": question}
        for index, question in enumerate(questions_l, start=1)
        if question.strip()
    ]
    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "interpretation": reflection_intro,
        "details": theme_details + question_details,
        "intensity": intensity,
        "confidence": confidence,
        "evidence_status": "unvalidated",
        "confidence_basis": "unvalidated_symbolic_guidance",
        "confidence_explanation": _PREDICTIVE_RELIABILITY[lang],
        "data_completeness": "incomplete" if missing else "supplied_unverified",
        "limitation": disclaimer,
        "action": action,
        "missing_inputs": missing,
        "signals": sigs,
        "planet_roles": roles,
        "observed": obs,
        "inferred": inf,
        "unknown": unk,
        "behaviors": behaviors_l,
        "questions": questions_l,
        "explanation": disclaimer,
        "mode": mode,
    }


_TRUST_REFLECTION_TOPICS = {
    "trust_pressure": {
        "en": "boundaries",
        "fa": "مرزها",
        "ru": "границы",
        "ar": "الحدود"
    },
    "communication_ambiguity": {
        "en": "clarifying expectations",
        "fa": "روشن‌کردن انتظارها",
        "ru": "прояснение ожиданий",
        "ar": "توضيح التوقعات"
    },
    "emotional_withdrawal": {
        "en": "communicating space",
        "fa": "توضیح نیاز به فضا",
        "ru": "обсуждение личного пространства",
        "ar": "توضيح الحاجة للمساحة"
    },
    "secrecy_avoidance": {
        "en": "direct questions",
        "fa": "پرسش مستقیم",
        "ru": "прямые вопросы",
        "ar": "الأسئلة المباشرة"
    }
}


def trust_reflections(signals: dict, lang: str) -> list[str]:
    """Legacy keys are retained for clients; weights are reflection prompts only."""
    lang = _pick_lang(lang)
    prompts = []
    for key, topic in _TRUST_REFLECTION_TOPICS.items():
        signal = signals.get(key, {})
        score = signal.get("score")
        value = str(score) + "/100" if score is not None else "—"
        prompts.append({
            "en": f"Optional reflection: {topic[lang]} (symbolic comparison weight {value}; not behavioral evidence).",
            "fa": f"تأمل اختیاری: {topic[lang]} (وزن مقایسهٔ نمادین {value}؛ نه شاهد رفتار).",
            "ru": f"Тема по выбору: {topic[lang]} (символический вес сравнения {value}; не свидетельство поведения).",
            "ar": f"تأمل اختياري: {topic[lang]} (وزن مقارنة رمزي {value}؛ ليس دليلاً سلوكياً).",
        }[lang])
    return prompts


def _quality_reading(card: str, lang: str, *, details=None, **extra):
    from .vault_quality_copy import QUALITY_COPY, LANGS
    headline, body, action, avoid, limitation = QUALITY_COPY[card][LANGS.index(lang)]
    # Structured details preserve calculated values without legacy narrative parsing.
    rows = [row for row in (details or []) if any(c.isalnum() for c in str(row.get("label", ""))) and any(c.isalnum() for c in str(row.get("value", "")))]
    return _safe_reading(lang=lang, headline=headline, body=body, action=action.rstrip(". "),
                         avoid=avoid.rstrip(". "), limitation=limitation,
                         intensity=extra.pop("intensity", "moderate"),
                         technical=extra.pop("technical", "symbolic_template"),
                         data_completeness=extra.pop("data_completeness", "supplied_unverified"),
                         details=rows, **extra)


def _quality_label(key, lang):
    labels = {
        "meeting": ("Symbolic meeting window", "Символическое окно встречи", "بازه نمادین دیدار", "فترة رمزية للقاء"),
        "timezone": ("Timezone", "Часовой пояс", "منطقه زمانی", "المنطقة الزمنية"),
        "trust_building": ("Symbolic weight: reciprocity", "Символический вес: взаимность", "وزن نمادین: همراهی متقابل", "وزن رمزي: التبادل"),
        "trust_pressure": ("Symbolic weight: expectations", "Символический вес: ожидания", "وزن نمادین: انتظارها", "وزن رمزي: التوقعات"),
        "communication_reliability": ("Symbolic weight: clear agreements", "Символический вес: ясные договорённости", "وزن نمادین: توافق‌های روشن", "وزن رمزي: وضوح الاتفاقات"),
        "boundary_risks": ("Symbolic weight: boundaries", "Символический вес: границы", "وزن نمادین: مرزها", "وزن رمزي: الحدود"),
        "repair_opportunities": ("Symbolic weight: revisiting agreements", "Символический вес: пересмотр договорённостей", "وزن نمادین: بازنگری توافق‌ها", "وزن رمزي: مراجعة الاتفاقات"),
        "date": ("Date", "Дата", "تاریخ", "التاريخ"),
        "palette": ("Palette", "Палитра", "پالت", "الألوان"),
        "notes": ("Scent notes", "Ноты аромата", "نت‌های رایحه", "النغمات العطرية"),
        "style": ("Clothing", "Одежда", "پوشش", "الملابس"),
        "accessory": ("Accessory", "Аксессуар", "اکسسوری", "الإكسسوار"),
        "posting": ("Posting", "Публикация", "انتشار", "النشر"),
        "filming": ("Filming", "Съёмка", "فیلم‌برداری", "التصوير"),
        "live_stream": ("Live stream", "Эфир", "پخش زنده", "البث المباشر"),
        "weights": ("Symbolic comparison weights", "Символические веса сравнения", "وزن‌های مقایسه نمادین", "أوزان المقارنة الرمزية"),
        "overall": ("Overall", "Общий вес", "کلی", "الإجمالي"),
        "chemistry": ("Attraction theme", "Тема притяжения", "مضمون جذب", "موضوع الانجذاب"),
        "stability": ("Stability theme", "Тема стабильности", "مضمون ثبات", "موضوع الاستقرار"),
        "growth": ("Growth theme", "Тема роста", "مضمون رشد", "موضوع النمو"),
        "communication": ("Communication theme", "Тема общения", "مضمون گفتگو", "موضوع التواصل"),
        "emotional": ("Emotional theme", "Эмоциональная тема", "مضمون عاطفی", "الموضوع العاطفي"),
        "business": ("Working arrangements", "Рабочие договорённости", "توافق‌های کاری", "ترتيبات العمل"),
        "romantic": ("Shared expectations", "Общие ожидания", "انتظارهای مشترک", "التوقعات المشتركة"),
        "friendship": ("Friendship expectations", "Ожидания от дружбы", "انتظارها از دوستی", "توقعات الصداقة"),
    }
    return labels.get(key, labels["weights"])[("en", "ru", "fa", "ar").index(lang)]


def _quality_geography(ranked, goal, lang, missing_inputs, business=False):
    from .vault_quality_copy import collapse_repeated_reason
    rows = []
    for item in ranked:
        label, score = item.get("label"), item.get("score")
        if isinstance(label, str) and label.strip() and isinstance(score, (int, float)):
            reason = item.get("symbolic_reason")
            extra = {}
            if isinstance(reason, str) and reason.strip():
                extra["reason"] = collapse_repeated_reason(reason)
            rows.append({"label": label, "value": f"{score}/100", **extra})
    result = _quality_reading("places", lang, details=rows,
                             technical=f"pathfinder.relocation · mode={'business' if business else goal} · jupiter,mercury,sun,saturn · houses=2,6,10,11",
                             intensity="strong" if rows and max(r.get("score", 0) for r in ranked) >= 75 else "moderate" if rows else "subtle",
                             ranked=ranked, missing_inputs=list(missing_inputs or []),
                             data_completeness="incomplete" if missing_inputs or not rows else "supplied_unverified")
    # Preserve the two products' different comparison contexts without asserting outcomes.
    result["headline"] = {
        "en": "Symbolic business location comparison" if business else "Symbolic location comparison: " + _quality_label("romantic" if goal == "relationship" else "weights", lang),
        "ru": "Символическое сравнение мест для бизнеса" if business else "Символическое сравнение мест: " + _quality_label("romantic" if goal == "relationship" else "weights", lang),
        "fa": "مقایسه نمادین مکان‌های کاری" if business else "مقایسه نمادین مکان‌ها: " + _quality_label("romantic" if goal == "relationship" else "weights", lang),
        "ar": "مقارنة رمزية لأماكن العمل" if business else "مقارنة رمزية للأماكن: " + _quality_label("romantic" if goal == "relationship" else "weights", lang),
    }[lang]
    if business:
        result["interpretation"] = {
            "en": "Ranks order symbolic weights for work and expansion within this candidate-city shortlist only. They are not a forecast of profit or a recommendation to move.",
            "ru": "Рейтинг упорядочивает символические веса для работы и расширения только внутри этого короткого списка городов. Это не прогноз прибыли и не совет переезжать.",
            "fa": "رتبه‌ها فقط وزن نمادین کار و گسترش را در همین فهرست کوتاه شهرها مرتب می‌کنند؛ پیش‌بینی سود یا توصیهٔ جابه‌جایی نیستند.",
            "ar": "ترتّب الدرجات أوزاناً رمزية للعمل والتوسع داخل قائمة المدن المرشحة فقط، وليست توقعاً للربح ولا توصية بالانتقال.",
        }[lang]
        result["action"] = {
            "en": "Compare the listed places with independently researched commercial, legal and financial evidence.",
            "ru": "Сопоставьте места с коммерческими, правовыми и финансовыми данными из независимого исследования.",
            "fa": "مکان‌ها را با شواهد تجاری، حقوقی و مالی که جداگانه بررسی کرده‌اید مقایسه کنید.",
            "ar": "يمكن مقارنة الأماكن بأدلة تجارية وقانونية ومالية جُمعت بشكل مستقل.",
        }[lang]
        result["avoid"] = {
            "en": "Choosing a market on the ranking alone.",
            "ru": "Выбор рынка только по рейтингу.",
            "fa": "انتخاب بازار صرفاً بر اساس رتبه.",
            "ar": "اختيار سوق بناءً على الترتيب وحده.",
        }[lang]
    else:
        result["interpretation"] = {
            "en": "Ranks order symbolic weights for shared-life place themes within this candidate-city shortlist only. They are not a prediction of love or a recommendation to move.",
            "ru": "Рейтинг упорядочивает символические веса тем совместной жизни только внутри этого короткого списка городов. Это не прогноз любви и не совет переезжать.",
            "fa": "رتبه‌ها فقط وزن نمادین مضمون‌های زندگی مشترک را در همین فهرست کوتاه شهرها مرتب می‌کنند؛ پیش‌بینی عشق یا توصیهٔ جابه‌جایی نیستند.",
            "ar": "ترتّب الدرجات أوزاناً رمزية لموضوعات الحياة المشتركة داخل قائمة المدن المرشحة فقط، وليست توقعاً للحب ولا توصية بالانتقال.",
        }[lang]
        result["action"] = {
            "en": "Compare the listed places with independently researched relationship, safety and practical evidence.",
            "ru": "Сопоставьте места с данными об отношениях, безопасности и быте из независимого исследования.",
            "fa": "مکان‌ها را با شواهد رابطه، ایمنی و امور عملی که جداگانه بررسی کرده‌اید مقایسه کنید.",
            "ar": "يمكن مقارنة الأماكن بأدلة عن العلاقة والسلامة والواقع العملي جُمعت بشكل مستقل.",
        }[lang]
        result["avoid"] = {
            "en": "Choosing a destination on the ranking alone.",
            "ru": "Выбор места только по рейтингу.",
            "fa": "انتخاب مقصد صرفاً بر اساس رتبه.",
            "ar": "اختيار الوجهة بناءً على الترتيب وحده.",
        }[lang]
    result["place_scope"] = {
        "en": "Ranking applies only to this candidate-city shortlist. It is not a global ranking or advice to move.",
        "ru": "Рейтинг действует только для этого короткого списка городов-кандидатов. Это не мировой рейтинг и не совет переезжать.",
        "fa": "رتبه‌بندی فقط برای همین فهرست کوتاه شهرهای نامزد است؛ رتبهٔ جهانی یا توصیهٔ جابه‌جایی نیست.",
        "ar": "الترتيب ينطبق فقط على قائمة المدن المرشحة هذه، وليس ترتيباً عالمياً ولا نصيحة بالانتقال.",
    }[lang]
    result["executive"] = result["headline"] + ". " + result["action"] + " " + result["place_scope"]
    result["strategic"] = result["interpretation"]
    return result
