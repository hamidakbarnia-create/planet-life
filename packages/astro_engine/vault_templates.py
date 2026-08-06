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
        "en": "You don't wait to be chosen — you choose. Your desire ignites fast, burns hot, and expects a match who can keep pace without flinching.",
        "fa": "منتظر انتخاب شدن نمی‌مونی — خودت انتخاب می‌کنی. میلت سریع روشن می‌شه، داغ می‌سوزه، و شریک می‌خواد که هم‌قدم باشه و نلرزه.",
        "ru": "Вы не ждёте, когда вас выберут — выбираете сами. Желание вспыхивает быстро, горит жарко и требует партнёра, который не дрогнет.",
        "ar": "لا تنتظرين أن يُختاركِ أحد — أنتِ من تختارين. رغبتكِ تشتعل بسرعة وتحترق بحرارة وتطلبين شريكاً لا يرتعد.",
    },
    "slow_burn": {
        "en": "Your magnetism is slow, physical, and impossible to rush. You seduce through presence and touch — not words. Men who push too fast lose you.",
        "fa": "مگنتیسمت آهسته، جسمی و غیرقابل عجله‌ست. با حضور و لمس جذب می‌کنی — نه با حرف. مردی که عجله کنه از دست می‌ره.",
        "ru": "Ваш магнетизм медленный, телесный, его нельзя ускорить. Вы соблазняете присутствием и прикосновением — не словами.",
        "ar": "جاذبيتكِ بطيئة، جسدية، لا يمكن استعجالها. تغوين بالحضور واللمس — لا بالكلام.",
    },
    "verbal_seducer": {
        "en": "Words are your foreplay. You attract through wit, teasing, and the intelligence behind your eyes. Boredom is your only turn-off.",
        "fa": "کلمات پیش‌درآمد توئن. با هوش، شوخی و نگاه پشت چشمات جذب می‌کنی. تنها چیزی که خاموشت می‌کنه حوصله‌سریه.",
        "ru": "Слова — ваша прелюдия. Вы притягиваете остроумием, поддразниванием и умом в глазах. Скука — единственный выключатель.",
        "ar": "الكلمات هي مقدمتكِ. تجذبين بالذكاء والممازحة وما وراء عينيكِ. الملل وحده يطفئكِ.",
    },
    "tender_predator": {
        "en": "You protect what you want before you claim it. Your desire is wrapped in care — but once you commit, you do not let go easily.",
        "fa": "قبل از تصاحب، از چیزی که می‌خوای محافظت می‌کنی. میلت توی مراقبت پیچیده — ولی وقتی تعهد کردی، رها نمی‌کنی.",
        "ru": "Вы защищаете то, чего хотите, прежде чем забрать. Желание обёрнуто заботой — но если решились, не отпускаете легко.",
        "ar": "تحمين ما تريدينه قبل أن تستولي عليه. رغبتكِ ملفوفة بالرعاية — لكن حين تلتزمين، لا تتركين بسهولة.",
    },
    "spotlight_lover": {
        "en": "You want to be seen wanting. Romance for you is theatre — generous, dramatic, and only worth it when the audience is worthy.",
        "fa": "می‌خوای دیده بشی که می‌خوای. عشق برات تئاتره — سخاوتمند، دراماتیک، و فقط وقتی ارزشش رو داشته باشه.",
        "ru": "Вы хотите, чтобы вас видели в желании. Романтика для вас — театр: щедрый, драматичный, только с достойной аудиторией.",
        "ar": "تريدين أن يُرى رغبتكِ. الرومانسية لكِ مسرح — كريمة، درامية، حين يستحق الجمهور ذلك.",
    },
    "perfectionist_lover": {
        "en": "You notice everything — the hesitation, the breath, the detail. Your standards filter weak men out before they get close.",
        "fa": "همه چیز رو می‌بینی — مکث، نفس، جزئیات. استانداردت مردهای ضعیف رو قبل از نزدیک شدن حذف می‌کنه.",
        "ru": "Вы замечаете всё — паузу, дыхание, деталь. Ваши стандарты отсеивают слабых до близости.",
        "ar": "تلاحظين كل شيء — التردد، النفس، التفصيل. معاييركِ تُبعد الضعفاء قبل اقترابهم.",
    },
    "diplomat_lover": {
        "en": "You seduce through balance and aesthetic. You want harmony in bed and power at the table — both.",
        "fa": "با تعادل و زیبایی‌شناسی جذب می‌کنی. هماهنگی توی رابطه و قدرت سر میز — هر دو.",
        "ru": "Вы соблазняете балансом и эстетикой. Гармония в близости и сила за столом — оба.",
        "ar": "تغوين بالتوازن والجمال. تريدين انسجاماً في العلاقة وقوة على المائدة — معاً.",
    },
    "obsessive_lover": {
        "en": "When you want someone, you want all of them — layers, secrets, shadow. Surface charm does not survive your gaze.",
        "fa": "وقتی کسی رو می‌خوای، همه‌ش رو می‌خوای — لایه‌ها، رازها، سایه. جذابیت سطحی زیر نگاهت زنده نمی‌مونه.",
        "ru": "Когда вы хотите кого-то — хотите всего: слои, тайны, тень. Поверхностное очарование не выдержит вашего взгляда.",
        "ar": "حين تريدين أحداً، تريدين كلّه — الطبقات، الأسرار، الظل. السحر السطحي لا يصمد أمام نظركِ.",
    },
    "free_lover": {
        "en": "You need space inside desire. Possessive men suffocate you; the right one learns that freedom is your aphrodisiac.",
        "fa": "توی میل به فضا نیاز داری. مردهای مالک‌طلب خفه‌ات می‌کنن؛ درستی یاد می‌گیره آزادی افروسیون توئه.",
        "ru": "Вам нужно пространство внутри желания. Собственники душат; правильный учится, что свобода — ваш афродизиак.",
        "ar": "تحتاجين مساحة داخل الرغبة. الرجال المالكون يخنقونكِ؛ الصحيح يتعلم أن الحرية هي إثارتكِ.",
    },
    "powerful_lover": {
        "en": "You treat desire like a career — strategic, patient, high-stakes. You respect strength and despise chaos.",
        "fa": "میل رو مثل شغل می‌بینی — استراتژیک، صبور، پرریسک. قدرت رو احترام می‌ذاری و آشوب رو تحقیر.",
        "ru": "Вы относитесь к желанию как к карьере — стратегично, терпеливо, на высоких ставках.",
        "ar": "تعاملين الرغبة كمهنة — استراتيجية، صبورة، بمخاطر عالية.",
    },
    "rebel_lover": {
        "en": "Predictable men bore you. You are turned on by difference, intelligence, and anyone who refuses the script society wrote.",
        "fa": "مردهای قابل پیش‌بینی حوصله‌ات رو سر می‌برن. تفاوت، هوش و کسی که سناریوی جامعه رو نپذیره روشن‌ات می‌کنه.",
        "ru": "Предсказуемые скучают. Вас заводят разница, ум и тот, кто отказывается от сценария общества.",
        "ar": "الرجال المتوقعون يملّونكِ. يشعلكِ الاختلاف والذكاء ومن يرفض نصّ المجتمع.",
    },
    "dream_lover": {
        "en": "You merge before you touch. Fantasy, music, and emotional current pull you in — the body follows the soul.",
        "fa": "قبل از لمس ادغام می‌شی. فانتزی، موسیقی و جریان احساسی می‌کشه‌ات — بدن دنبال روح میاد.",
        "ru": "Вы сливаетесь раньше, чем касаетесь. Фантазия, музыка, эмоциональный поток — тело следует за душой.",
        "ar": "تندمجين قبل أن تلمسي. الخيال والموسيقى والتيار العاطفي يجذبكِ — الجسد يتبع الروح.",
    },
}

DIGNITY_COPY: dict[str, dict[str, str]] = {
    "rulership": {
        "en": "Mars is in full command in your chart — raw desire runs clean and strong.",
        "fa": "مریخ تو چارتت کاملاً فرمانرواست — میل خام تمیز و قوی جریان داره.",
        "ru": "Марс в полной власти в вашей карте — чистое сильное желание.",
        "ar": "المريخ بكامل سلطته في خريطتكِ — رغبة خام قوية ونقية.",
    },
    "exaltation": {
        "en": "Mars is exalted — your drive peaks in structured, high-reward situations. You perform under pressure.",
        "fa": "مریخ در شرفه — انگیزه‌ات در موقعیت‌های ساختارمند و پرپاداش اوج می‌گیره.",
        "ru": "Марс в экзальтации — драйв на пике в структурированных ситуациях.",
        "ar": "المريخ في شرفه — دافعكِ يبلغ ذروته في مواقف منظمة عالية المكافأة.",
    },
    "detriment": {
        "en": "Mars is in detriment — desire fights the sign. You may chase the wrong intensity or swallow anger that belongs in action.",
        "fa": "مریخ در هبوطه — میل با نشان می‌جنگه. ممکنه شدت اشتباه رو دنبال کنی یا خشمی که باید عمل بشه رو قورت بدی.",
        "ru": "Марс в изгнании — желание борется со знаком. Возможна погоня за неверной интенсивностью.",
        "ar": "المريخ في وباله — الرغبة تحارب البرج. قد تطاردين شدة خاطئة.",
    },
    "fall": {
        "en": "Mars is in fall — fire turned inward. Attraction can feel like vulnerability you punish yourself for.",
        "fa": "مریخ در سقوطه — آتش به درون برگشته. جذابیت می‌تونه مثل آسیب‌پذیری باشه که خودت رو براش تنبیه می‌کنی.",
        "ru": "Марс в падении — огонь внутрь. Притяжение может ощущаться как уязвимость.",
        "ar": "المريخ في سقوطه — النار للداخل. الجاذبية قد تشعركِ بالضعف.",
    },
}

HOUSE_COPY: dict[str, dict[str, str]] = {
    "self_warrior": {
        "en": "Mars in the 1st house: desire is written on your body. People feel your hunger before you speak.",
        "fa": "مریخ خانه ۱: میل روی بدنت نوشته شده. مردم گرسنگی‌ات رو قبل از حرف حس می‌کنن.",
        "ru": "Марс в 1 доме: желание написано на теле. Его чувствуют до слов.",
        "ar": "المريخ في البيت 1: الرغبة مكتوبة على جسدكِ. يشعرون بجوعكِ قبل الكلام.",
    },
    "money_drive": {
        "en": "Mars in the 2nd: you fight for worth — money, pleasure, and proof that you are not cheap.",
        "fa": "مریخ خانه ۲: برای ارزش می‌جنگی — پول، لذت، و اینکه ارزون نیستی.",
        "ru": "Марс во 2 доме: борьба за ценность — деньги, удовольствие, доказательство.",
        "ar": "المريخ في البيت 2: تكافحين من أجل القيمة — المال والمتعة.",
    },
    "voice_warrior": {
        "en": "Mars in the 3rd: you argue, flirt, and negotiate desire in language. Silence is not your seduction style.",
        "fa": "مریخ خانه ۳: با زبان دعوا، فلرت و مذاکره می‌کنی. سکوت استایل اغوای تو نیست.",
        "ru": "Марс в 3 доме: желание через язык — флирт, спор, переговоры.",
        "ar": "المريخ في البيت 3: الرغبة عبر اللغة — مغازلة وجدال.",
    },
    "private_fire": {
        "en": "Mars in the 4th: private fire. Your deepest want lives at home — safety first, then intensity.",
        "fa": "مریخ خانه ۴: آتش خصوصی. عمیق‌ترین خواسته‌ات خونه‌ست — اول امنیت، بعد شدت.",
        "ru": "Марс в 4 доме: огонь дома. Глубочайшее желание — безопасность, потом интенсивность.",
        "ar": "المريخ في البيت 4: نار خاصة. أعمق رغبة في البيت — الأمان أولاً.",
    },
    "creative_fire": {
        "en": "Mars in the 5th: romance, play, and creative risk. You fall in love with the chase as much as the person.",
        "fa": "مریخ خانه ۵: عشق، بازی و ریسک خلاق. هم عشق داشتن به تعقیب، هم به آدم.",
        "ru": "Марс в 5 доме: романтика, игра, творческий риск. Влюбляет погоня.",
        "ar": "المريخ في البيت 5: رومانسية ولعب ومخاطرة. تحبين المطاردة كما الشخص.",
    },
    "work_drive": {
        "en": "Mars in the 6th: desire channels through routine and service. You attract when you are useful — watch that trap.",
        "fa": "مریخ خانه ۶: میل از روتین و خدمت رد می‌شه. وقتی مفیدی جذب می‌شی — مراقب این تله باش.",
        "ru": "Марс в 6 доме: желание через рутину. Притягиваете, когда полезны — ловушка.",
        "ar": "المريخ في البيت 6: الرغبة عبر الروتين. تجذبين حين تكونين مفيدة — احذري الفخ.",
    },
    "partner_attractor": {
        "en": "Mars in the 7th: partners mirror your fire. You often project desire onto others — choose who actually carries it.",
        "fa": "مریخ خانه ۷: شریک آینه آتشتونه. اغلب میل رو روی دیگران می‌اندازی — انتخاب کن کی واقعاً حملش می‌کنه.",
        "ru": "Марс в 7 доме: партнёры отражают огонь. Часто проецируете желание — выбирайте, кто несёт.",
        "ar": "المريخ في البيت 7: الشريك مرآة ناركِ. غالباً تنعكس الرغبة — اختاري من يحملها.",
    },
    "deep_intensity": {
        "en": "Mars in the 8th: obsession, merge, other people's money and secrets. Your sexuality is transformational — not casual.",
        "fa": "مریخ خانه ۸: وسواس، ادغام، پول و راز دیگران. جنسیتت تحول‌آفرینه — نه تفریحی.",
        "ru": "Марс в 8 доме: одержимость, слияние, чужие деньги и тайны. Сексуальность трансформационная.",
        "ar": "المريخ في البيت 8: هوس واندماج وأسرار ومال الآخرين. جنسيتكِ تحويلية.",
    },
    "global_drive": {
        "en": "Mars in the 9th: desire through travel, belief, and men who expand your world.",
        "fa": "مریخ خانه ۹: میل از سفر، باور و مردی که دنیا رو گسترش می‌ده.",
        "ru": "Марс в 9 доме: желание через путешествия и мужчин, расширяющих мир.",
        "ar": "المريخ في البيت 9: الرغبة عبر السفر والرجال الذين يوسّعون عالمكِ.",
    },
    "career_warrior": {
        "en": "Mars in the 10th: public reputation carries sexual charge. Power and visibility are part of your attraction formula.",
        "fa": "مریخ خانه ۱۰: شهرت عمومی بار جنسی داره. قدرت و دیده‌شدن بخشی از فرمول جذابیتته.",
        "ru": "Марс в 10 доме: репутация несёт сексуальный заряд. Власть и видимость — часть формулы.",
        "ar": "المريخ في البيت 10: السمعة تحمل شحنة جنسية. القوة والظهور جزء من جاذبيتكِ.",
    },
    "social_fire": {
        "en": "Mars in the 11th: you want friends who are also allies. Groups, networks, and shared causes turn you on.",
        "fa": "مریخ خانه ۱۱: دوست می‌خوای که متحد هم باشه. گروه‌ها و شبکه‌ها روشن‌ات می‌کنن.",
        "ru": "Марс в 11 доме: друзья-союзники. Группы и сети возбуждают.",
        "ar": "المريخ في البيت 11: تريدين أصدقاء حلفاء. المجموعات تشعلكِ.",
    },
    "hidden_drive": {
        "en": "Mars in the 12th: hidden fire. Much of your desire runs underground — fantasy, secrecy, or spiritual longing.",
        "fa": "مریخ خانه ۱۲: آتش پنهان. بخش زیادی از میل زیرزمینیه — فانتزی، راز، یا اشتیاق معنوی.",
        "ru": "Марс в 12 доме: скрытый огонь. Желание под землёй — фантазия, тайна, духовность.",
        "ar": "المريخ في البيت 12: نار خفية. كثير من رغبتكِ تحت الأرض — خيال وسرّ.",
    },
}

ASPECT_SNIPPETS: dict[str, dict[str, str]] = {
    "mars_venus_conjunction": {
        "en": "Mars conjunct Venus: charm and heat fuse. You attract without trying — but can confuse lust with love.",
        "fa": "مریخ مرتبط ونوس: جذابیت و حرارت یکی شدن. بدون تلاش جذب می‌کنی — ولی شهوت رو با عشق قاطی نکن.",
        "ru": "Марс соединён с Венерой: обаяние и жар слились. Притягиваете без усилий.",
        "ar": "المريخ مقترن بالزهرة: سحر وحرارة اندمجا. تجذبين بلا جهد.",
    },
    "mars_pluto_square": {
        "en": "Mars square Pluto: power struggles in intimacy. You can magnetize dangerous dynamics — choose consciously.",
        "fa": "مریخ مربع پلوتو: جنگ قدرت توی صمیمیت. دینامیک خطرناک جذب می‌کنی — آگاهانه انتخاب کن.",
        "ru": "Марс квадрат Плутон: борьба за власть в близости. Магнит опасной динамики.",
        "ar": "المريخ مربع بلوتو: صراع قوة في الحميمية. تنجذبين لديناميكيات خطرة.",
    },
    "mars_lilith_conjunction": {
        "en": "Mars conjunct Lilith: raw, untamed feminine fire. You refuse to shrink desire to please anyone.",
        "fa": "مریخ مرتبط لیلیت: آتش زنانه خام و رام‌نشده. از کوچک کردن میل برای راضی کردن کسی خودداری می‌کنی.",
        "ru": "Марс с Лилит: дикий женский огонь. Вы не уменьшаете желание ради других.",
        "ar": "المريخ مقترن بليليث: نار أنثوية جامحة. ترفضين تصغير رغبتكِ لإرضاء أحد.",
    },
    "mars_saturn_square": {
        "en": "Mars square Saturn: desire meets delay. Frustration can sharpen you — or turn cold. Patience is strategic, not passive.",
        "fa": "مریخ مربع زحل: میل با تأخیر روبرو می‌شه. ناامیدی می‌تونه تیز کنه — یا سرد. صبر استراتژیکه، نه انفعال.",
        "ru": "Марс квадрат Сатурн: желание встречает задержку. Терпение стратегично.",
        "ar": "المريخ مربع زحل: الرغبة تلتقي التأخير. الصبر استراتيجي.",
    },
}

INTENSITY_HEADLINE: dict[str, dict[str, str]] = {
    "subtle": {
        "en": "Subtle magnetism",
        "fa": "مگنتیسم ظریف",
        "ru": "Тонкий магнетизм",
        "ar": "جاذبية خفية",
    },
    "moderate": {
        "en": "Clear, steady fire",
        "fa": "آتش شفاف و پایدار",
        "ru": "Ясный устойчивый огонь",
        "ar": "نار واضحة ثابتة",
    },
    "strong": {
        "en": "High-voltage attraction",
        "fa": "جذابیت ولتاژ بالا",
        "ru": "Притяжение высокого напряжения",
        "ar": "جذب عالي الجهد",
    },
    "extreme": {
        "en": "Magnetic — handle with strategy",
        "fa": "مگنتیسم شدید — با استراتژی مدیریتش کن",
        "ru": "Магнетизм — управляйте стратегически",
        "ar": "جاذبية شديدة — تعاملي باستراتيجية",
    },
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


def render_mars_reading(verdict: dict[str, Any], lang: str = "en") -> dict[str, Any]:
    lang = _pick_lang(lang)
    keys = verdict.get("archetype_keys", [])
    sign_key = _archetype_from_keys(keys, "sign") or "warrior"
    house_key = _archetype_from_keys(keys, "house") or "self_warrior"
    dignity = verdict.get("dignity", "peregrine")
    intensity = verdict.get("intensity", "moderate")
    sign_name = verdict.get("sign", "aries").capitalize()
    house = verdict.get("house", 1)
    degree = verdict.get("degree", 0)
    retro = verdict.get("retrograde", False)

    sign_line = SIGN_COPY.get(sign_key, SIGN_COPY["warrior"])[lang]
    house_line = HOUSE_COPY.get(house_key, HOUSE_COPY["self_warrior"])[lang]
    dignity_line = DIGNITY_COPY.get(dignity, {}).get(lang, "")
    aspect_lines = _aspect_snippet(verdict.get("aspects", []), lang)

    headline = INTENSITY_HEADLINE.get(intensity, INTENSITY_HEADLINE["moderate"])[lang]
    conf_map = {
        "extreme": "high",
        "strong": "high",
        "moderate": "medium",
        "subtle": "low",
    }
    confidence = conf_map.get(str(intensity), "medium")
    conf = _confidence_clause(confidence, lang)

    action = {
        "en": "Choose one pursuit today and drop the rest",
        "fa": "امروز یک پیگیری را انتخاب کن و بقیه را رها کن",
        "ru": "Выберите одно стремление сегодня и отпустите остальное",
        "ar": "اختاري مطاردة واحدة اليوم واتركي الباقي",
    }[lang]
    impact = {
        "en": "What this changes today: your desire pattern is a filter — use it before you invest.",
        "fa": "تأثیر امروز: الگوی میلت فیلتر است — قبل از سرمایه‌گذاری از آن استفاده کن.",
        "ru": "Что меняется сегодня: паттерн желания — фильтр; используйте его до вложений.",
        "ar": "ما يتغيّر اليوم: نمط رغبتك فلتر — استخدميه قبل أن تستثمري.",
    }[lang]
    signal = {
        "en": f"Your desire signature sits in {sign_name}, house {house}.",
        "fa": f"امضای میلت در {sign_name}، خانه {house} است.",
        "ru": f"Ваш код желания — {sign_name}, дом {house}.",
        "ar": f"بصمة رغبتك في {sign_name}، البيت {house}.",
    }[lang]

    executive = {
        "en": f"{headline}. {signal} Action: {action}. {conf}",
        "fa": f"{headline}. {signal} اقدام: {action}. {conf}",
        "ru": f"{headline}. {signal} Действие: {action}. {conf}",
        "ar": f"{headline}. {signal} الإجراء: {action}. {conf}",
    }[lang]

    body_parts = [sign_line, house_line]
    if dignity_line:
        body_parts.append(dignity_line)
    body_parts.extend(aspect_lines)
    if retro:
        body_parts.append(
            {
                "en": "Retrograde tone: desire can revisit old scripts until you choose a cleaner pattern.",
                "fa": "لحن برگشتی: میل ممکن است سناریوهای قدیمی را تکرار کند تا الگوی تمیزتری انتخاب کنی.",
                "ru": "Ретроградный тон: желание может возвращать старые сценарии, пока не выберете чище.",
                "ar": "نبرة رجعية: قد تعيد الرغبة سيناريوهات قديمة حتى تختاري نمطاً أنظف.",
            }[lang]
        )
    strategic = (
        f"{signal} {' '.join(body_parts)} {conf} {impact} "
        + {
            "en": f"Action: {action}.",
            "fa": f"اقدام: {action}.",
            "ru": f"Действие: {action}.",
            "ar": f"الإجراء: {action}.",
        }[lang]
    )

    technical = (
        f"Mars {degree}° {sign_name} · house {house}"
        + (" · Rx" if retro else "")
        + f" · dignity: {dignity}"
    )
    for a in verdict.get("aspects", []):
        technical += f" · {a['a'].title()} {a['kind']} {a['b'].title()} (orb {a['orb']}°)"

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "sign": sign_name,
        "house": house,
        "confidence": confidence,
        "action": action,
    }


# ── Ghost Days (Power Calendar — strategic distance) ─────────────────────────

GHOST_HEADLINE: dict[str, dict[str, str]] = {
    "strong": {
        "en": "Pull back — distance works",
        "fa": "عقب‌نشینی کن — فاصله کار می‌کند",
        "ru": "Отойдите — дистанция работает",
        "ar": "انسحبي — المسافة تعمل",
    },
    "moderate": {
        "en": "Quiet windows ahead",
        "fa": "پنجره‌های سکوت در پیش",
        "ru": "Впереди тихие окна",
        "ar": "نوافذ صمت قادمة",
    },
    "subtle": {
        "en": "Soft ghost timing",
        "fa": "زمان‌بندی غیبت ملایم",
        "ru": "Мягкий тайминг дистанции",
        "ar": "توقيت غياب خفيف",
    },
}

GHOST_STRATEGY: dict[str, str] = {
    "en": (
        "Distance works better than explanation here. "
        "Fewer messages, fewer justifications, more room for pull to rebuild on its own."
    ),
    "fa": (
        "اینجا فاصله بهتر از توضیح کار می‌کند. "
        "پیام کمتر، توجیه کمتر، فضای بیشتر تا کشش خودش برگردد."
    ),
    "ru": (
        "Здесь дистанция работает лучше объяснений. "
        "Меньше сообщений и оправданий — больше пространства, чтобы притяжение вернулось само."
    ),
    "ar": (
        "المسافة هنا أنجع من الشرح. "
        "رسائل أقل وتبريرات أقل ومساحة أكبر ليعود الجذب وحده."
    ),
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
            "fa": "اطمینان: medium — سیگنال قابل استفاده؛ جا برای تنظیم بگذار.",
            "ru": "Уверенность: medium — рабочий сигнал; оставьте запас.",
            "ar": "الثقة: medium — إشارة قابلة للاستخدام؛ اتركي هامش تعديل.",
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
            f"الإجراء: {action}. تجنبي: {avoid}. {conf}"
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
            f"{impact} الإجراء: {action}. تجنبي: {avoid}."
        ),
    }[lang]
    return executive, strategic


_GHOST_AVOID: dict[str, str] = {
    "en": "chasing, over-texting, and explaining the silence",
    "fa": "تعقیب، پیام زیاد و توضیح سکوت",
    "ru": "погоня, лишние сообщения и оправдания тишины",
    "ar": "المطاردة وكثرة الرسائل وشرح الصمت",
}


def render_ghost_days_reading(
    windows: list[dict[str, Any]],
    *,
    lang: str = "en",
    horizon_days: int = 14,
) -> dict[str, Any]:
    """
    Build a three-layer Power Calendar Ghost Days reading from scored windows.
    Each window: { date, score, rating }.
    """
    lang = _pick_lang(lang)
    avoid = _GHOST_AVOID[lang]
    if not windows:
        confidence = _window_confidence(0)
        action = {
            "en": "Stay warm and brief until a clearer pull-back window",
            "fa": "تا پنجرهٔ عقب‌نشینی واضح، گرم و کوتاه بمان",
            "ru": "Оставайтесь тёплой и краткой до более ясного окна дистанции",
            "ar": "ابقي دافئة ومختصرة حتى نافذة انسحاب أوضح",
        }[lang]
        signal = {
            "en": "No strong pull-back window shows in the next horizon.",
            "fa": "در افق پیشِ رو پنجرهٔ عقب‌نشینی قوی دیده نمی‌شود.",
            "ru": "В горизонте нет сильного окна дистанции.",
            "ar": "لا تظهر نافذة انسحاب قوية في الأفق.",
        }[lang]
        impact = {
            "en": "What this changes today: keep contact light; do not manufacture distance.",
            "fa": "تأثیر امروز: تماس را سبک نگه دار؛ فاصلهٔ ساختگی نساز.",
            "ru": "Что меняется сегодня: держите контакт лёгким; не создавайте дистанцию искусственно.",
            "ar": "ما يتغيّر اليوم: أبقي التواصل خفيفاً؛ لا تختلقي مسافة.",
        }[lang]
        executive, strategic = _window_bundle(
            lang=lang,
            headline=GHOST_HEADLINE["subtle"][lang],
            signal=signal,
            interpretation=GHOST_STRATEGY[lang],
            impact=impact,
            action=action,
            avoid=avoid,
            confidence=confidence,
        )
        return {
            "executive": executive,
            "strategic": strategic,
            "technical": f"action=rest_recovery · horizon={horizon_days}d · windows=0",
            "headline": GHOST_HEADLINE["subtle"][lang],
            "intensity": "subtle",
            "confidence": confidence,
            "action": action,
            "avoid": avoid,
        }

    top = windows[0]
    top_score = int(top.get("score", 0))
    if top_score >= 75:
        intensity = "strong"
    elif top_score >= 60:
        intensity = "moderate"
    else:
        intensity = "subtle"
    confidence = _window_confidence(top_score)

    headline = GHOST_HEADLINE[intensity][lang]
    date_list = ", ".join(
        f"{w['date']} ({int(w.get('score', 0))}/100)" for w in windows[:5]
    )
    action = {
        "en": f"Pull back hardest on {top['date']}",
        "fa": f"بیشترین عقب‌نشینی در {top['date']}",
        "ru": f"Максимальная дистанция {top['date']}",
        "ar": f"انسحبي بقوة في {top['date']}",
    }[lang]
    signal = {
        "en": f"Strongest distance window: {top['date']} ({top_score}/100).",
        "fa": f"قوی‌ترین پنجرهٔ فاصله: {top['date']} ({top_score}/100).",
        "ru": f"Сильнейшее окно дистанции: {top['date']} ({top_score}/100).",
        "ar": f"أقوى نافذة مسافة: {top['date']} ({top_score}/100).",
    }[lang]
    interpretation = {
        "en": (
            f"{GHOST_STRATEGY[lang]} The clearest window lands on {top['date']} "
            f"({top_score}/100)."
        ),
        "fa": (
            f"{GHOST_STRATEGY[lang]} واضح‌ترین پنجره در {top['date']} "
            f"({top_score}/100) است."
        ),
        "ru": (
            f"{GHOST_STRATEGY[lang]} Самое ясное окно — {top['date']} "
            f"({top_score}/100)."
        ),
        "ar": (
            f"{GHOST_STRATEGY[lang]} أوضح نافذة في {top['date']} "
            f"({top_score}/100)."
        ),
    }[lang]
    impact = {
        "en": "What this changes today: silence can work harder than another reply.",
        "fa": "تأثیر امروز: سکوت می‌تواند بهتر از یک پاسخ دیگر کار کند.",
        "ru": "Что меняется сегодня: тишина может работать сильнее ещё одного ответа.",
        "ar": "ما يتغيّر اليوم: الصمت قد يعمل أقوى من ردّ إضافي.",
    }[lang]
    windows_note = {
        "en": f"Also watch: {date_list}.",
        "fa": f"همچنین ببین: {date_list}.",
        "ru": f"Также смотрите: {date_list}.",
        "ar": f"راقبي أيضاً: {date_list}.",
    }[lang]
    executive, strategic = _window_bundle(
        lang=lang,
        headline=headline,
        signal=signal,
        interpretation=interpretation,
        impact=impact,
        action=action,
        avoid=avoid,
        confidence=confidence,
        score_note=f"({top_score}/100)",
        windows_note=windows_note,
    )

    technical = (
        f"action=rest_recovery · horizon={horizon_days}d · top={top['date']} "
        f"score={top_score} · confidence={confidence} · avoid={avoid} "
        f"· windows={date_list}"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
        "action": action,
        "avoid": avoid,
    }


# ── Money-Ask Days (Power Calendar — Venus money windows) ────────────────────

MONEY_ASK_HEADLINE: dict[str, dict[str, str]] = {
    "strong": {
        "en": "Ask — money sky is open",
        "fa": "بخواه — آسمان پول باز است",
        "ru": "Просите — денежное небо открыто",
        "ar": "اطلبي — سماء المال مفتوحة",
    },
    "moderate": {
        "en": "Warm ask windows ahead",
        "fa": "پنجره‌های درخواست گرم در پیش",
        "ru": "Впереди тёплые окна просьбы",
        "ar": "نوافذ طلب دافئة قادمة",
    },
    "subtle": {
        "en": "Soft money-ask timing",
        "fa": "زمان‌بندی درخواست پول ملایم",
        "ru": "Мягкий тайминг денежной просьбы",
        "ar": "توقيت طلب مال خفيف",
    },
}

MONEY_ASK_STRATEGY: dict[str, str] = {
    "en": (
        "Clear asks land better than pressure. "
        "Name the amount, keep it short, and ask once — no stacked follow-ups the same day."
    ),
    "fa": (
        "درخواست شفاف بهتر از فشار می‌نشیند. "
        "مبلغ را بگو، کوتاه بخواه، یک‌بار — همان روز پیگیری انباشته نکن."
    ),
    "ru": (
        "Ясная просьба работает лучше давления. "
        "Назовите сумму, держите коротко, просите один раз — без серии follow-up в тот же день."
    ),
    "ar": (
        "الطلب الواضح أنجع من الضغط. "
        "اذكري المبلغ واختصري واطلبي مرة — بلا متابعات متكدسة في اليوم نفسه."
    ),
}

_MONEY_ASK_AVOID: dict[str, str] = {
    "en": "apologizing for the ask, stacking follow-ups, and vague amounts",
    "fa": "عذرخواهی برای درخواست، پیگیری انباشته و مبلغ مبهم",
    "ru": "извинения за просьбу, серии follow-up и размытые суммы",
    "ar": "الاعتذار عن الطلب وتكديس المتابعة والمبالغ المبهمة",
}


def render_money_ask_days_reading(
    windows: list[dict[str, Any]],
    *,
    lang: str = "en",
    horizon_days: int = 14,
) -> dict[str, Any]:
    """
    Build a three-layer Power Calendar Money-Ask Days reading.
    Each window: { date, score, rating }. Same shape as Ghost Days.
    """
    lang = _pick_lang(lang)
    avoid = _MONEY_ASK_AVOID[lang]
    if not windows:
        confidence = _window_confidence(0)
        action = {
            "en": "Hold the ask until a clearer money window",
            "fa": "تا پنجرهٔ پول واضح، درخواست را نگه دار",
            "ru": "Отложите просьбу до более ясного денежного окна",
            "ar": "أجّلي الطلب حتى نافذة مال أوضح",
        }[lang]
        signal = {
            "en": "No strong money window shows in the next horizon.",
            "fa": "در افق پیشِ رو پنجرهٔ پول قوی دیده نمی‌شود.",
            "ru": "В горизонте нет сильного денежного окна.",
            "ar": "لا تظهر نافذة مال قوية في الأفق.",
        }[lang]
        impact = {
            "en": "What this changes today: prepare the number; do not force the ask.",
            "fa": "تأثیر امروز: مبلغ را آماده کن؛ درخواست را زور نزن.",
            "ru": "Что меняется сегодня: подготовьте сумму; не форсируйте просьбу.",
            "ar": "ما يتغيّر اليوم: جهّزي الرقم؛ لا تفرضي الطلب.",
        }[lang]
        executive, strategic = _window_bundle(
            lang=lang,
            headline=MONEY_ASK_HEADLINE["subtle"][lang],
            signal=signal,
            interpretation=MONEY_ASK_STRATEGY[lang],
            impact=impact,
            action=action,
            avoid=avoid,
            confidence=confidence,
        )
        return {
            "executive": executive,
            "strategic": strategic,
            "technical": (
                f"action=finance_transaction · horizon={horizon_days}d · windows=0"
            ),
            "headline": MONEY_ASK_HEADLINE["subtle"][lang],
            "intensity": "subtle",
            "confidence": confidence,
            "action": action,
            "avoid": avoid,
        }

    top = windows[0]
    top_score = int(top.get("score", 0))
    if top_score >= 75:
        intensity = "strong"
    elif top_score >= 60:
        intensity = "moderate"
    else:
        intensity = "subtle"
    confidence = _window_confidence(top_score)

    headline = MONEY_ASK_HEADLINE[intensity][lang]
    date_list = ", ".join(
        f"{w['date']} ({int(w.get('score', 0))}/100)" for w in windows[:5]
    )
    action = {
        "en": f"Make the money ask on {top['date']}",
        "fa": f"درخواست پول را در {top['date']} بکن",
        "ru": f"Сделайте денежную просьбу {top['date']}",
        "ar": f"اطلبي المال في {top['date']}",
    }[lang]
    signal = {
        "en": f"Strongest ask window: {top['date']} ({top_score}/100).",
        "fa": f"قوی‌ترین پنجرهٔ درخواست: {top['date']} ({top_score}/100).",
        "ru": f"Сильнейшее окно просьбы: {top['date']} ({top_score}/100).",
        "ar": f"أقوى نافذة طلب: {top['date']} ({top_score}/100).",
    }[lang]
    interpretation = {
        "en": (
            f"{MONEY_ASK_STRATEGY[lang]} The clearest window lands on {top['date']} "
            f"({top_score}/100)."
        ),
        "fa": (
            f"{MONEY_ASK_STRATEGY[lang]} واضح‌ترین پنجره در {top['date']} "
            f"({top_score}/100) است."
        ),
        "ru": (
            f"{MONEY_ASK_STRATEGY[lang]} Самое ясное окно — {top['date']} "
            f"({top_score}/100)."
        ),
        "ar": (
            f"{MONEY_ASK_STRATEGY[lang]} أوضح نافذة في {top['date']} "
            f"({top_score}/100)."
        ),
    }[lang]
    impact = {
        "en": "What this changes today: a short, numbered ask beats a long pitch.",
        "fa": "تأثیر امروز: درخواست کوتاه با عدد بهتر از توضیح طولانی است.",
        "ru": "Что меняется сегодня: короткая просьба с цифрой сильнее длинной речи.",
        "ar": "ما يتغيّر اليوم: طلب قصير برقم أقوى من شرح طويل.",
    }[lang]
    windows_note = {
        "en": f"Also watch: {date_list}.",
        "fa": f"همچنین ببین: {date_list}.",
        "ru": f"Также смотрите: {date_list}.",
        "ar": f"راقبي أيضاً: {date_list}.",
    }[lang]
    executive, strategic = _window_bundle(
        lang=lang,
        headline=headline,
        signal=signal,
        interpretation=interpretation,
        impact=impact,
        action=action,
        avoid=avoid,
        confidence=confidence,
        score_note=f"({top_score}/100)",
        windows_note=windows_note,
    )

    technical = (
        f"action=finance_transaction · horizon={horizon_days}d · top={top['date']} "
        f"score={top_score} · confidence={confidence} · avoid={avoid} "
        f"· windows={date_list}"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
        "action": action,
        "avoid": avoid,
    }


# ── Yes Day (Power Calendar — ask / commit / sign) ───────────────────────────

_YES_AVOID: dict[str, str] = {
    "en": "rushing the ask, vague terms, and signing under pressure",
    "fa": "عجله در درخواست، شروط مبهم و امضا زیر فشار",
    "ru": "спешка в просьбе, размытые условия и подпись под давлением",
    "ar": "استعجال الطلب وشروط مبهمة والتوقيع تحت ضغط",
}


def render_yes_day_reading(
    *,
    ask: dict[str, Any],
    commit: dict[str, Any],
    sign: dict[str, Any],
    horizon_days: int = 14,
    lang: str = "en",
) -> dict[str, Any]:
    """
    Power Calendar — Yes Day.

    Expects ask/commit/sign slots: date, score, confidence, action_type.
    """
    lang = _pick_lang(lang)
    avoid = _YES_AVOID[lang]
    slots = (ask, commit, sign)
    scores = [int(s.get("score", 0)) for s in slots]
    avg = int(round(sum(scores) / max(1, len(scores))))
    confidence = _window_confidence(avg)
    intensity = (
        "strong" if avg >= 75 else "moderate" if avg >= 60 else "subtle"
    )

    ask_d = str(ask.get("date") or "—")
    commit_d = str(commit.get("date") or "—")
    sign_d = str(sign.get("date") or "—")

    headline = {
        "en": f"Ask on {ask_d}",
        "fa": f"در {ask_d} بخواه",
        "ru": f"Просите {ask_d}",
        "ar": f"اطلبي في {ask_d}",
    }[lang]

    conf = _confidence_clause(confidence, lang)
    action = {
        "en": f"Open the ask on {ask_d}, then hold terms until {commit_d}",
        "fa": f"درخواست را در {ask_d} باز کن، بعد شروط را تا {commit_d} نگه دار",
        "ru": f"Откройте просьбу {ask_d}, затем держите условия до {commit_d}",
        "ar": f"افتحي الطلب في {ask_d} ثم أمسكي الشروط حتى {commit_d}",
    }[lang]
    reason = {
        "en": (
            f"Ask timing peaks {ask_d}; commitment aligns when approval and terms "
            f"both rise ({commit_d}); signing follows clarity timing ({sign_d})."
        ),
        "fa": (
            f"اوج درخواست {ask_d} است؛ تعهد وقتی تأیید و شروط هم‌زمان بالا می‌روند "
            f"({commit_d})؛ امضا با زمان وضوح ({sign_d})."
        ),
        "ru": (
            f"Пик просьбы {ask_d}; обязательство — когда одобрение и условия "
            f"совпадают ({commit_d}); подпись — ясность ({sign_d})."
        ),
        "ar": (
            f"ذروة الطلب {ask_d}؛ الالتزام حين يرتفع الموافقة والشروط معاً "
            f"({commit_d})؛ التوقيع بتوقيت الوضوح ({sign_d})."
        ),
    }[lang]
    impact = {
        "en": "What this changes today: sequence the ask — do not compress ask, commit, and sign into one push.",
        "fa": "تأثیر امروز: درخواست را مرحله‌بندی کن — درخواست، تعهد و امضا را در یک فشار جمع نکن.",
        "ru": "Что меняется сегодня: разведите шаги — не сжимайте просьбу, обязательство и подпись в один рывок.",
        "ar": "ما يتغيّر اليوم: رتّبي الطلب — لا تضغطي الطلب والالتزام والتوقيع في دفعة واحدة.",
    }[lang]

    executive = {
        "en": (
            f"Best time to ask: {ask_d}. Best time to commit: {commit_d}. "
            f"Best time to sign: {sign_d}. Avoid: {avoid}. "
            f"{conf} Action: {action}."
        ),
        "fa": (
            f"بهترین زمان درخواست: {ask_d}. بهترین زمان تعهد: {commit_d}. "
            f"بهترین زمان امضا: {sign_d}. پرهیز: {avoid}. "
            f"{conf} اقدام: {action}."
        ),
        "ru": (
            f"Лучшее время просить: {ask_d}. Лучшее время обязаться: {commit_d}. "
            f"Лучшее время подписать: {sign_d}. Избегать: {avoid}. "
            f"{conf} Действие: {action}."
        ),
        "ar": (
            f"أفضل وقت للطلب: {ask_d}. أفضل وقت للالتزام: {commit_d}. "
            f"أفضل وقت للتوقيع: {sign_d}. تجنبي: {avoid}. "
            f"{conf} الإجراء: {action}."
        ),
    }[lang]

    strategic = {
        "en": f"{reason} {conf} {impact} Action: {action}. Avoid: {avoid}.",
        "fa": f"{reason} {conf} {impact} اقدام: {action}. پرهیز: {avoid}.",
        "ru": f"{reason} {conf} {impact} Действие: {action}. Избегать: {avoid}.",
        "ar": f"{reason} {conf} {impact} الإجراء: {action}. تجنبي: {avoid}.",
    }[lang]

    technical = (
        f"horizon={horizon_days}d · ask={ask.get('action_type')}@{ask_d} "
        f"score={int(ask.get('score', 0))} · "
        f"commit={commit.get('action_type')}@{commit_d} "
        f"score={int(commit.get('score', 0))} · "
        f"sign={sign.get('action_type')}@{sign_d} "
        f"score={int(sign.get('score', 0))} · "
        f"confidence={confidence} · avoid={avoid}"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
        "avoid": avoid,
        "reason": reason,
        "ask": ask_d,
        "commit": commit_d,
        "sign": sign_d,
        "action": action,
    }


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
    """
    Build a three-layer Power Calendar Hot Attraction Days reading.
    Each window: { date, score, rating }.
    """
    lang = _pick_lang(lang)
    avoid = _HOT_AVOID[lang]
    if not windows:
        confidence = _window_confidence(0)
        action = {
            "en": "Stay magnetic and selective until a clearer heat window",
            "fa": "تا پنجرهٔ حرارت واضح، مگنتیک و انتخابی بمان",
            "ru": "Оставайтесь магнитной и избирательной до более ясного окна жара",
            "ar": "ابقي جذابة وانتقائية حتى نافذة حرارة أوضح",
        }[lang]
        signal = {
            "en": "No strong heat window shows in the next horizon.",
            "fa": "در افق پیشِ رو پنجرهٔ حرارت قوی دیده نمی‌شود.",
            "ru": "В горизонте нет сильного окна жара.",
            "ar": "لا تظهر نافذة حرارة قوية في الأفق.",
        }[lang]
        impact = {
            "en": "What this changes today: protect allure; do not force chemistry.",
            "fa": "تأثیر امروز: جذابیت را حفظ کن؛ شیمی را زور نزن.",
            "ru": "Что меняется сегодня: берегите притяжение; не форсируйте химию.",
            "ar": "ما يتغيّر اليوم: احمي الجاذبية؛ لا تفرضي الكيمياء.",
        }[lang]
        executive, strategic = _window_bundle(
            lang=lang,
            headline=HOT_HEADLINE["subtle"][lang],
            signal=signal,
            interpretation=HOT_STRATEGY[lang],
            impact=impact,
            action=action,
            avoid=avoid,
            confidence=confidence,
        )
        return {
            "executive": executive,
            "strategic": strategic,
            "technical": f"action=hot_attraction · horizon={horizon_days}d · windows=0",
            "headline": HOT_HEADLINE["subtle"][lang],
            "intensity": "subtle",
            "confidence": confidence,
            "action": action,
            "avoid": avoid,
        }

    top = windows[0]
    top_score = int(top.get("score", 0))
    if top_score >= 75:
        intensity = "strong"
    elif top_score >= 60:
        intensity = "moderate"
    else:
        intensity = "subtle"
    confidence = _window_confidence(top_score)

    headline = HOT_HEADLINE[intensity][lang]
    date_list = ", ".join(
        f"{w['date']} ({int(w.get('score', 0))}/100)" for w in windows[:5]
    )
    action = {
        "en": f"Show up for heat on {top['date']}",
        "fa": f"برای حرارت در {top['date']} حاضر شو",
        "ru": f"Выходите на жар {top['date']}",
        "ar": f"احضري للحرارة في {top['date']}",
    }[lang]
    signal = {
        "en": f"Strongest heat window: {top['date']} ({top_score}/100).",
        "fa": f"قوی‌ترین پنجرهٔ حرارت: {top['date']} ({top_score}/100).",
        "ru": f"Сильнейшее окно жара: {top['date']} ({top_score}/100).",
        "ar": f"أقوى نافذة حرارة: {top['date']} ({top_score}/100).",
    }[lang]
    interpretation = {
        "en": (
            f"{HOT_STRATEGY[lang]} The clearest window lands on {top['date']} "
            f"({top_score}/100)."
        ),
        "fa": (
            f"{HOT_STRATEGY[lang]} واضح‌ترین پنجره در {top['date']} "
            f"({top_score}/100) است."
        ),
        "ru": (
            f"{HOT_STRATEGY[lang]} Самое ясное окно — {top['date']} "
            f"({top_score}/100)."
        ),
        "ar": (
            f"{HOT_STRATEGY[lang]} أوضح نافذة في {top['date']} "
            f"({top_score}/100)."
        ),
    }[lang]
    impact = {
        "en": "What this changes today: choose one real encounter over scattered attention.",
        "fa": "تأثیر امروز: یک برخورد واقعی را به توجه پراکنده ترجیح بده.",
        "ru": "Что меняется сегодня: выберите одну живую встречу вместо рассеянного внимания.",
        "ar": "ما يتغيّر اليوم: اختاري لقاءً حقيقياً واحداً بدل الانتباه المبعثر.",
    }[lang]
    windows_note = {
        "en": f"Also watch: {date_list}.",
        "fa": f"همچنین ببین: {date_list}.",
        "ru": f"Также смотрите: {date_list}.",
        "ar": f"راقبي أيضاً: {date_list}.",
    }[lang]
    executive, strategic = _window_bundle(
        lang=lang,
        headline=headline,
        signal=signal,
        interpretation=interpretation,
        impact=impact,
        action=action,
        avoid=avoid,
        confidence=confidence,
        score_note=f"({top_score}/100)",
        windows_note=windows_note,
    )

    technical = (
        f"action=hot_attraction · horizon={horizon_days}d · top={top['date']} "
        f"score={top_score} · confidence={confidence} · avoid={avoid} "
        f"· windows={date_list}"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
        "action": action,
        "avoid": avoid,
    }


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
        "fa": {"primary": "رز براق", "accent": "آبی پودری"},
        "ru": {"primary": "Нежная роза", "accent": "Пудрово-голубой"},
        "ar": {"primary": "وردي خجول", "accent": "أزرق بودري"},
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
    """Style Timing — Today's Color from transit Moon sign."""
    lang = _pick_lang(lang)
    raw_sign = (moon_sign or "").lower()
    known = raw_sign in MOON_SIGN_COLORS
    sign = raw_sign if known else "cancer"
    colors = MOON_SIGN_COLORS[sign][lang]
    sign_name = SIGN_LABEL[sign][lang]
    primary = colors["primary"]
    accent = colors["accent"]
    # Confidence from resolved Moon + mid-sign clarity (edges softer).
    deg = float(moon_degree) % 30.0
    if not known:
        confidence = "low"
    elif 5.0 <= deg <= 25.0:
        confidence = "high"
    else:
        confidence = "medium"

    opp = _SIGN_OPPOSITE.get(sign, "aquarius")
    clash = MOON_SIGN_COLORS[opp][lang]["primary"]
    action = {
        "en": f"Wear {primary} with {accent} accent",
        "fa": f"{primary} با اکسنت {accent} بپوش",
        "ru": f"Наденьте {primary} с акцентом {accent}",
        "ar": f"ارتدي {primary} مع لمسة {accent}",
    }[lang]
    avoid = {
        "en": f"flooding the look with {clash}",
        "fa": f"غرق استایل در {clash}",
        "ru": f"заливать образ цветом {clash}",
        "ar": f"إغراق الإطلالة بـ {clash}",
    }[lang]

    headline = {
        "en": f"Wear {primary}",
        "fa": f"{primary} بپوش",
        "ru": f"Наденьте: {primary}",
        "ar": f"ارتدي {primary}",
    }[lang]

    conf = _confidence_clause(confidence, lang)
    impact = {
        "en": "What this changes today: one clean color story reads intentional; clutter reads unsure.",
        "fa": "تأثیر امروز: یک داستان رنگی تمیز هدفمند دیده می‌شود؛ شلوغی نامطمئن.",
        "ru": "Что меняется сегодня: один чистый цвет читается как намерение; пестрота — как неуверенность.",
        "ar": "ما يتغيّر اليوم: قصة لون نظيفة تُقرأ كقصد؛ الفوضى كتردد.",
    }[lang]
    executive = {
        "en": (
            f"Action: {action}. Avoid: {avoid}. "
            f"Moon in {sign_name}. {conf}"
        ),
        "fa": (
            f"اقدام: {action}. پرهیز: {avoid}. "
            f"ماه در {sign_name}. {conf}"
        ),
        "ru": (
            f"Действие: {action}. Избегать: {avoid}. "
            f"Луна в {sign_name}. {conf}"
        ),
        "ar": (
            f"الإجراء: {action}. تجنبي: {avoid}. "
            f"القمر في {sign_name}. {conf}"
        ),
    }[lang]

    strategic = {
        "en": (
            f"Today’s color signal follows Moon in {sign_name}: lead with {primary}, "
            f"finish with {accent} in shoes, lips, or one accessory. "
            f"{conf} {impact} Action: {action}. Avoid: {avoid}."
        ),
        "fa": (
            f"سیگنال رنگ امروز از ماه در {sign_name}: با {primary} شروع کن، "
            f"با {accent} در کفش، لب یا یک اکسسوری تمام کن. "
            f"{conf} {impact} اقدام: {action}. پرهیز: {avoid}."
        ),
        "ru": (
            f"Цветовой сигнал дня — Луна в {sign_name}: основа {primary}, "
            f"акцент {accent} в обуви, губах или одном аксессуаре. "
            f"{conf} {impact} Действие: {action}. Избегать: {avoid}."
        ),
        "ar": (
            f"إشارة لون اليوم من القمر في {sign_name}: ابدئي بـ {primary}، "
            f"وأكملي بـ {accent} في الحذاء أو الشفاه أو إكسسوار واحد. "
            f"{conf} {impact} الإجراء: {action}. تجنبي: {avoid}."
        ),
    }[lang]

    technical = (
        f"transit_moon={sign} {moon_degree:.2f}° · date={target_date} "
        f"· primary={primary} · accent={accent} · action={action} "
        f"· avoid={avoid} · confidence={confidence}"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": "moderate",
        "sign": sign_name,
        "confidence": confidence,
        "action": action,
        "avoid": avoid,
    }


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
    avoid_family = SIGN_SCENT_NOTES[_SIGN_OPPOSITE[venus]][lang]["family"]
    avoid = {
        "en": f"{avoid_family} overload",
        "fa": f"اشباع {avoid_family}",
        "ru": f"перегруз {avoid_family}",
        "ar": f"إفراط {avoid_family}",
    }[lang]

    venus_el = _SIGN_ELEMENT[venus]
    match_asc = venus_el == _SIGN_ELEMENT[asc]
    match_moon = venus_el == _SIGN_ELEMENT[n_moon]
    match_day = venus_el == _SIGN_ELEMENT[t_moon]
    if match_asc and (match_moon or match_day):
        confidence = "high"
    elif match_asc or match_moon or match_day:
        confidence = "medium"
    else:
        confidence = "low"
    intensity = (
        "strong"
        if confidence == "high"
        else "moderate"
        if confidence == "medium"
        else "subtle"
    )

    v_name = SIGN_LABEL[venus][lang]
    m_name = SIGN_LABEL[n_moon][lang]
    a_name = SIGN_LABEL[asc][lang]
    tm_name = SIGN_LABEL[t_moon][lang]

    reason = {
        "en": (
            f"Natal Venus {v_name} and Moon {m_name} set the blend; "
            f"Asc {a_name} sets the room; Transit Moon {tm_name} "
            f"tints the finish."
        ),
        "fa": (
            f"زهرهٔ تولد {v_name} و ماه {m_name} ترکیب را می‌سازند؛ "
            f"طلوع {a_name} فضا را؛ ماه ترانزیت {tm_name} "
            f"پایان را رنگ می‌زند."
        ),
        "ru": (
            f"Натальная Венера {v_name} и Луна {m_name} задают смесь; "
            f"Асц {a_name} — пространство; транзитная Луна {tm_name} "
            f"завершает тон."
        ),
        "ar": (
            f"الزهرة الولادية {v_name} والقمر {m_name} يحددان المزيج؛ "
            f"الصاعد {a_name} يحدد المكان؛ قمر العبور {tm_name} "
            f"يلوّن اللمسة الأخيرة."
        ),
    }[lang]

    headline = {
        "en": f"Wear {fragrance_family}",
        "fa": f"{fragrance_family} بزن",
        "ru": f"Носите: {fragrance_family}",
        "ar": f"ارتدي {fragrance_family}",
    }[lang]

    accent_bit = {
        "en": f" Accent: {accent_note}." if accent_note else "",
        "fa": f" اکسنت: {accent_note}." if accent_note else "",
        "ru": f" Акцент: {accent_note}." if accent_note else "",
        "ar": f" لمسة: {accent_note}." if accent_note else "",
    }[lang]

    conf = _confidence_clause(confidence, lang)
    action = {
        "en": f"Wear {fragrance_family} for a {occasion}",
        "fa": f"برای {occasion} عطر {fragrance_family} بزن",
        "ru": f"Нанесите {fragrance_family} для: {occasion}",
        "ar": f"ارتدي {fragrance_family} لمناسبة {occasion}",
    }[lang]
    impact = {
        "en": "What this changes today: scent should match the room you enter, not every mood you feel.",
        "fa": "تأثیر امروز: عطر باید با فضایی که وارد می‌شوی هم‌خوان باشد، نه با هر حال.",
        "ru": "Что меняется сегодня: аромат под пространство, не под каждое настроение.",
        "ar": "ما يتغيّر اليوم: العطر للمكان الذي تدخلينه لا لكل مزاج.",
    }[lang]

    executive = {
        "en": (
            f"Family: {fragrance_family}. Primary notes: {primary_notes}."
            f"{accent_bit} Occasion: {occasion}. Avoid: {avoid}. "
            f"{conf} Action: {action}."
        ),
        "fa": (
            f"خانواده: {fragrance_family}. نت‌های اصلی: {primary_notes}."
            f"{accent_bit} موقعیت: {occasion}. پرهیز: {avoid}. "
            f"{conf} اقدام: {action}."
        ),
        "ru": (
            f"Семейство: {fragrance_family}. Основные ноты: {primary_notes}."
            f"{accent_bit} Повод: {occasion}. Избегать: {avoid}. "
            f"{conf} Действие: {action}."
        ),
        "ar": (
            f"العائلة: {fragrance_family}. النوتات الأساسية: {primary_notes}."
            f"{accent_bit} المناسبة: {occasion}. تجنبي: {avoid}. "
            f"{conf} الإجراء: {action}."
        ),
    }[lang]

    strategic = {
        "en": (
            f"{reason} Finish note from rising {a_name}: {aura['note']}. "
            f"{conf} {impact} Action: {action}. Avoid: {avoid}."
        ),
        "fa": (
            f"{reason} نت پایانی از طلوع {a_name}: {aura['note']}. "
            f"{conf} {impact} اقدام: {action}. پرهیز: {avoid}."
        ),
        "ru": (
            f"{reason} Финиш от восхода {a_name}: {aura['note']}. "
            f"{conf} {impact} Действие: {action}. Избегать: {avoid}."
        ),
        "ar": (
            f"{reason} لمسة ختامية من الصاعد {a_name}: {aura['note']}. "
            f"{conf} {impact} الإجراء: {action}. تجنبي: {avoid}."
        ),
    }[lang]

    technical = (
        f"date={target_date} · natal_venus={venus} · natal_moon={n_moon} "
        f"· asc={asc} · transit_moon={t_moon} · dominant_element={dominant_element} "
        f"· family={fragrance_family} · primary={primary_notes} "
        f"· accent={accent_note or 'none'} · occasion={occasion} "
        f"· avoid={avoid} · confidence={confidence}"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "sign": SIGN_LABEL[lead_sign][lang],
        "fragrance_family": fragrance_family,
        "primary_notes": primary_notes,
        "accent_note": accent_note,
        "occasion": occasion,
        "avoid": avoid,
        "reason": reason,
        "confidence": confidence,
        "action": action,
    }


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
    """
    Style Timing — Live / Reel Time.

    Expects each window dict: window, score, confidence, reason, action_type.
    """
    lang = _pick_lang(lang)
    slots = {
        "posting": posting,
        "filming": filming,
        "live_stream": live_stream,
    }
    scores = [int(slots[k].get("score", 0)) for k in slots]
    avg = int(round(sum(scores) / max(1, len(scores))))
    confidence = _live_reel_confidence(avg)
    intensity = (
        "strong" if avg >= 75 else "moderate" if avg >= 60 else "subtle"
    )

    def _label(key: str) -> str:
        return {
            "posting": {
                "en": "Post",
                "fa": "پست",
                "ru": "Пост",
                "ar": "نشر",
            },
            "filming": {
                "en": "Film",
                "fa": "فیلم‌برداری",
                "ru": "Съёмка",
                "ar": "تصوير",
            },
            "live_stream": {
                "en": "Live",
                "fa": "لایو",
                "ru": "Эфир",
                "ar": "بث",
            },
        }[key][lang]

    def _line(key: str) -> str:
        w = slots[key]
        return (
            f"{_label(key)} {w.get('window', '—')} "
            f"({int(w.get('score', 0))}/100, {w.get('confidence', 'low')})"
        )

    headline = {
        "en": f"Post {_safe_window(posting)}",
        "fa": f"پست {_safe_window(posting)}",
        "ru": f"Пост {_safe_window(posting)}",
        "ar": f"انشر {_safe_window(posting)}",
    }[lang]

    conf = _confidence_clause(confidence, lang)
    post_w = posting.get("window", "—")
    film_w = filming.get("window", "—")
    live_w = live_stream.get("window", "—")
    action = {
        "en": f"Post in {post_w}; film in {film_w}",
        "fa": f"در {post_w} پست کن؛ در {film_w} فیلم بگیر",
        "ru": f"Публикуйте в {post_w}; снимайте в {film_w}",
        "ar": f"انشري في {post_w}؛ صوّري في {film_w}",
    }[lang]
    impact = {
        "en": "What this changes today: separate capture from publish — do not force both into the weakest hour.",
        "fa": "تأثیر امروز: فیلم‌برداری را از انتشار جدا کن — هر دو را در ضعیف‌ترین ساعت فشار نده.",
        "ru": "Что меняется сегодня: отделите съёмку от публикации — не сжимайте оба в слабый час.",
        "ar": "ما يتغيّر اليوم: افصلي التصوير عن النشر — لا تضغطي كلاهما في أضعف ساعة.",
    }[lang]

    executive = {
        "en": (
            f"Best posting: {post_w}. "
            f"Best filming: {film_w}. "
            f"Best live stream: {live_w}. "
            f"{conf} Action: {action}."
        ),
        "fa": (
            f"بهترین پست: {post_w}. "
            f"بهترین فیلم‌برداری: {film_w}. "
            f"بهترین لایو: {live_w}. "
            f"{conf} اقدام: {action}."
        ),
        "ru": (
            f"Лучший пост: {post_w}. "
            f"Лучшая съёмка: {film_w}. "
            f"Лучший эфир: {live_w}. "
            f"{conf} Действие: {action}."
        ),
        "ar": (
            f"أفضل نشر: {post_w}. "
            f"أفضل تصوير: {film_w}. "
            f"أفضل بث: {live_w}. "
            f"{conf} الإجراء: {action}."
        ),
    }[lang]

    reason_bits = []
    for key in ("posting", "filming", "live_stream"):
        w = slots[key]
        reason = (w.get("reason") or "").strip()
        if reason:
            reason_bits.append(f"{_label(key)}: {reason}")
        else:
            reason_bits.append(
                f"{_label(key)}: {_LIVE_REEL_FOCUS[key][lang]}"
            )
    reason = " ".join(reason_bits)

    strategic = {
        "en": (
            f"Posting peaks {_safe_window(posting)} for reach; filming peaks "
            f"{_safe_window(filming)}; live peaks {_safe_window(live_stream)}. "
            f"{_line('posting')}. {_line('filming')}. {_line('live_stream')}. "
            f"Reason: {reason} {conf} {impact} Action: {action}."
        ),
        "fa": (
            f"اوج پست {_safe_window(posting)}؛ فیلم {_safe_window(filming)}؛ "
            f"لایو {_safe_window(live_stream)}. "
            f"{_line('posting')}. {_line('filming')}. {_line('live_stream')}. "
            f"دلیل: {reason} {conf} {impact} اقدام: {action}."
        ),
        "ru": (
            f"Пик поста {_safe_window(posting)}; съёмки {_safe_window(filming)}; "
            f"эфира {_safe_window(live_stream)}. "
            f"{_line('posting')}. {_line('filming')}. {_line('live_stream')}. "
            f"Причина: {reason} {conf} {impact} Действие: {action}."
        ),
        "ar": (
            f"ذروة النشر {_safe_window(posting)}؛ التصوير {_safe_window(filming)}؛ "
            f"البث {_safe_window(live_stream)}. "
            f"{_line('posting')}. {_line('filming')}. {_line('live_stream')}. "
            f"السبب: {reason} {conf} {impact} الإجراء: {action}."
        ),
    }[lang]

    technical = (
        f"date={target_date} · posting={posting.get('action_type')}@"
        f"{posting.get('window')} score={int(posting.get('score', 0))} · "
        f"filming={filming.get('action_type')}@{filming.get('window')} "
        f"score={int(filming.get('score', 0))} · "
        f"live_stream={live_stream.get('action_type')}@{live_stream.get('window')} "
        f"score={int(live_stream.get('score', 0))} · "
        f"confidence={confidence} · avg={avg}"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
        "reason": reason,
        "action": action,
    }


def _safe_window(slot: dict[str, Any]) -> str:
    return str(slot.get("window") or "—")


# ── Date Outfit (Style Timing — Venus/Asc + Moon color + meeting hour) ───────

# style / accessory / avoid keyed by sign (localized). Reuses MOON_SIGN_COLORS
# + SIGN_SCENT_NOTES for color and fragrance family.
SIGN_DATE_LOOK: dict[str, dict[str, dict[str, str]]] = {
    "aries": {
        "en": {
            "style": "sharp & bold",
            "accessory": "metallic cuff",
            "avoid": "overly soft pastels",
        },
        "fa": {
            "style": "تیز و جسور",
            "accessory": "دستبند فلزی",
            "avoid": "پاستل‌های خیلی نرم",
        },
        "ru": {
            "style": "чёткий и смелый",
            "accessory": "металлический браслет",
            "avoid": "слишком мягкие пастели",
        },
        "ar": {
            "style": "حاد وجريء",
            "accessory": "سوار معدني",
            "avoid": "الباستيل الناعم جداً",
        },
    },
    "taurus": {
        "en": {
            "style": "soft luxe",
            "accessory": "silk scarf",
            "avoid": "harsh neon",
        },
        "fa": {
            "style": "لوکس نرم",
            "accessory": "شال ابریشمی",
            "avoid": "نئون تند",
        },
        "ru": {
            "style": "мягкая роскошь",
            "accessory": "шёлковый шарф",
            "avoid": "резкий неон",
        },
        "ar": {
            "style": "فاخر ناعم",
            "accessory": "وشاح حريري",
            "avoid": "النيون الحاد",
        },
    },
    "gemini": {
        "en": {
            "style": "playful layered",
            "accessory": "statement earrings",
            "avoid": "one heavy costume look",
        },
        "fa": {
            "style": "لایه‌لایه بازیگوش",
            "accessory": "گوشواره شاخص",
            "avoid": "یک استایل کاستیوم سنگین",
        },
        "ru": {
            "style": "игривый многослойный",
            "accessory": "яркие серьги",
            "avoid": "один тяжёлый костюмный образ",
        },
        "ar": {
            "style": "مرح متعدد الطبقات",
            "accessory": "أقراط مميزة",
            "avoid": "إطلالة تنكر ثقيلة واحدة",
        },
    },
    "cancer": {
        "en": {
            "style": "romantic soft",
            "accessory": "pearl detail",
            "avoid": "cold hard edges",
        },
        "fa": {
            "style": "رمانتیک نرم",
            "accessory": "جزئیات مروارید",
            "avoid": "لبه‌های سرد و سخت",
        },
        "ru": {
            "style": "романтика и мягкость",
            "accessory": "жемчужный акцент",
            "avoid": "холодные жёсткие линии",
        },
        "ar": {
            "style": "رومانسي ناعم",
            "accessory": "لمسة لؤلؤ",
            "avoid": "الحواف الباردة الصلبة",
        },
    },
    "leo": {
        "en": {
            "style": "spotlight glam",
            "accessory": "gold hoop",
            "avoid": "muted beige-only",
        },
        "fa": {
            "style": "درخشش مرکز توجه",
            "accessory": "حلقه طلایی",
            "avoid": "فقط بژ بی‌روح",
        },
        "ru": {
            "style": "гламур в свете",
            "accessory": "золотые кольца",
            "avoid": "только тусклый беж",
        },
        "ar": {
            "style": "بريق الأضواء",
            "accessory": "حلق ذهبي",
            "avoid": "البيج الباهت وحده",
        },
    },
    "virgo": {
        "en": {
            "style": "clean tailored",
            "accessory": "minimal chain",
            "avoid": "messy layering",
        },
        "fa": {
            "style": "دوخت تمیز",
            "accessory": "زنجیر مینیمال",
            "avoid": "لایه‌بندی شلخته",
        },
        "ru": {
            "style": "чистый крой",
            "accessory": "минимальная цепь",
            "avoid": "хаотичное многослойе",
        },
        "ar": {
            "style": "مفصل نظيف",
            "accessory": "سلسلة بسيطة",
            "avoid": "الطبقات الفوضوية",
        },
    },
    "libra": {
        "en": {
            "style": "balanced chic",
            "accessory": "delicate bracelet",
            "avoid": "harsh contrast clash",
        },
        "fa": {
            "style": "شیک متعادل",
            "accessory": "دستبند ظریف",
            "avoid": "کنتراست خشن",
        },
        "ru": {
            "style": "сбалансированный шик",
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
            "style": "dark magnetic",
            "accessory": "smoked ring",
            "avoid": "cute cartoon prints",
        },
        "fa": {
            "style": "تیره و مگنتیک",
            "accessory": "انگشتر دودی",
            "avoid": "چاپ‌های کارتونی بامزه",
        },
        "ru": {
            "style": "тёмный магнетизм",
            "accessory": "дымчатое кольцо",
            "avoid": "милые мультяшные принты",
        },
        "ar": {
            "style": "داكن وجذاب",
            "accessory": "خاتم دخاني",
            "avoid": "طباعات كرتونية لطيفة",
        },
    },
    "sagittarius": {
        "en": {
            "style": "easy wanderlust",
            "accessory": "bold boot or cuff",
            "avoid": "stiff formal armour",
        },
        "fa": {
            "style": "آسان و ماجراجو",
            "accessory": "بوت یا دستبند جسور",
            "avoid": "زره رسمی خشک",
        },
        "ru": {
            "style": "лёгкий странник",
            "accessory": "смелый ботинок или манжета",
            "avoid": "жёсткий формальный панцирь",
        },
        "ar": {
            "style": "تجوال سهل",
            "accessory": "حذاء أو سوار جريء",
            "avoid": "الدرع الرسمي الصلب",
        },
    },
    "capricorn": {
        "en": {
            "style": "structured power",
            "accessory": "leather strap watch",
            "avoid": "frilly excess",
        },
        "fa": {
            "style": "قدرت ساخت‌یافته",
            "accessory": "ساعت بند چرمی",
            "avoid": "زیادی چین‌دار",
        },
        "ru": {
            "style": "структурная сила",
            "accessory": "часы на кожаном ремешке",
            "avoid": "избыточная оборка",
        },
        "ar": {
            "style": "قوة منظمة",
            "accessory": "ساعة بحزام جلد",
            "avoid": "الزخرفة المفرطة",
        },
    },
    "aquarius": {
        "en": {
            "style": "modern edge",
            "accessory": "unexpected geometric piece",
            "avoid": "dated matchy sets",
        },
        "fa": {
            "style": "لبه مدرن",
            "accessory": "قطعه هندسی غیرمنتظره",
            "avoid": "ست‌های هم‌رنگ قدیمی",
        },
        "ru": {
            "style": "современный край",
            "accessory": "неожиданная геометрия",
            "avoid": "устаревшие парные комплекты",
        },
        "ar": {
            "style": "حافة حديثة",
            "accessory": "قطعة هندسية غير متوقعة",
            "avoid": "أطقم متطابقة قديمة",
        },
    },
    "pisces": {
        "en": {
            "style": "dreamy fluid",
            "accessory": "sheer or iridescent touch",
            "avoid": "rigid corporate lines",
        },
        "fa": {
            "style": "سیال و رویایی",
            "accessory": "لمس شفاف یا رنگین‌کمانی",
            "avoid": "خطوط خشک شرکتی",
        },
        "ru": {
            "style": "мечтательная текучесть",
            "accessory": "прозрачный или переливчатый акцент",
            "avoid": "жёсткие корпоративные линии",
        },
        "ar": {
            "style": "حالم سائل",
            "accessory": "لمسة شفافة أو قزحية",
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
    avoid = SIGN_DATE_LOOK[t_moon][lang]["avoid"]
    colors = MOON_SIGN_COLORS[t_moon][lang]
    primary = colors["primary"]
    accent = colors["accent"]
    fragrance = SIGN_SCENT_NOTES[venus][lang]["family"]
    window = meeting_window or "—"
    score_i = int(meeting_score)

    venus_el = _SIGN_ELEMENT[venus]
    element_boost = venus_el == _SIGN_ELEMENT[asc] or venus_el == _SIGN_ELEMENT[t_moon]
    if score_i >= 75 and element_boost:
        confidence = "high"
    elif score_i >= 60 or element_boost:
        confidence = "medium"
    else:
        confidence = "low"
    intensity = (
        "strong"
        if confidence == "high"
        else "moderate"
        if confidence == "medium"
        else "subtle"
    )

    headline = {
        "en": f"Wear {style}",
        "fa": f"{style} بپوش",
        "ru": f"Наденьте: {style}",
        "ar": f"ارتدي {style}",
    }[lang]

    conf = _confidence_clause(confidence, lang)
    action = {
        "en": f"Wear {style} in {primary} and meet in {window}",
        "fa": f"{style} با {primary} بپوش و در {window} ملاقات کن",
        "ru": f"Наденьте {style} в {primary} и встретьтесь в {window}",
        "ar": f"ارتدي {style} بـ {primary} والتقي في {window}",
    }[lang]
    impact = {
        "en": "What this changes today: one coherent look beats three mixed signals.",
        "fa": "تأثیر امروز: یک ظاهر منسجم بهتر از سه سیگنال درهم است.",
        "ru": "Что меняется сегодня: один цельный образ сильнее трёх смешанных сигналов.",
        "ar": "ما يتغيّر اليوم: إطلالة متماسكة أقوى من ثلاث إشارات مختلطة.",
    }[lang]
    executive = {
        "en": (
            f"Outfit: {style}. Primary {primary}, accent {accent}. "
            f"Accessories: {accessories}. Fragrance: {fragrance}. "
            f"Best meeting: {window}. Avoid: {avoid}. {conf} Action: {action}."
        ),
        "fa": (
            f"استایل: {style}. اصلی {primary}، اکسنت {accent}. "
            f"اکسسوری: {accessories}. عطر: {fragrance}. "
            f"بهترین ملاقات: {window}. پرهیز: {avoid}. {conf} اقدام: {action}."
        ),
        "ru": (
            f"Образ: {style}. Основной {primary}, акцент {accent}. "
            f"Аксессуары: {accessories}. Аромат: {fragrance}. "
            f"Лучшая встреча: {window}. Избегать: {avoid}. "
            f"{conf} Действие: {action}."
        ),
        "ar": (
            f"الإطلالة: {style}. أساسي {primary}، لمسة {accent}. "
            f"إكسسوارات: {accessories}. عطر: {fragrance}. "
            f"أفضل لقاء: {window}. تجنبي: {avoid}. {conf} الإجراء: {action}."
        ),
    }[lang]

    strategic = {
        "en": (
            f"Style from Venus in {SIGN_LABEL[venus][lang]} ({style}); "
            f"today’s color from Moon in {SIGN_LABEL[t_moon][lang]} "
            f"({primary} / {accent}); finish with rising "
            f"{SIGN_LABEL[asc][lang]} ({accessories}) and {fragrance} scent. "
            f"{conf} {impact} Action: {action}. Avoid: {avoid}."
        ),
        "fa": (
            f"استایل از زهره در {SIGN_LABEL[venus][lang]} ({style})؛ "
            f"رنگ امروز از ماه در {SIGN_LABEL[t_moon][lang]} "
            f"({primary} / {accent})؛ تمام با طلوع "
            f"{SIGN_LABEL[asc][lang]} ({accessories}) و عطر {fragrance}. "
            f"{conf} {impact} اقدام: {action}. پرهیز: {avoid}."
        ),
        "ru": (
            f"Стиль от Венеры в {SIGN_LABEL[venus][lang]} ({style}); "
            f"цвет дня от Луны в {SIGN_LABEL[t_moon][lang]} "
            f"({primary} / {accent}); финиш — восход "
            f"{SIGN_LABEL[asc][lang]} ({accessories}) и аромат {fragrance}. "
            f"{conf} {impact} Действие: {action}. Избегать: {avoid}."
        ),
        "ar": (
            f"الأسلوب من الزهرة في {SIGN_LABEL[venus][lang]} ({style})؛ "
            f"لون اليوم من القمر في {SIGN_LABEL[t_moon][lang]} "
            f"({primary} / {accent})؛ اللمسة من الصاعد "
            f"{SIGN_LABEL[asc][lang]} ({accessories}) وعطر {fragrance}. "
            f"{conf} {impact} الإجراء: {action}. تجنبي: {avoid}."
        ),
    }[lang]

    technical = (
        f"date={target_date} · venus={venus} · asc={asc} · moon={t_moon} "
        f"· style={style} · primary={primary} · accent={accent} "
        f"· accessories={accessories} · fragrance={fragrance} "
        f"· meeting={window} score={score_i} · avoid={avoid} "
        f"· confidence={confidence}"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
        "outfit_style": style,
        "primary_color": primary,
        "accent_color": accent,
        "accessories": accessories,
        "fragrance_family": fragrance,
        "best_meeting_time": window,
        "avoid": avoid,
        "action": action,
    }


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
    """
    Provider — Best Countries from Pathfinder relocation rankings.
    Each ranked item: label, score, verdict, strongest_use_case,
    opportunity, risk, recommended_next_action (optional).
    """
    lang = _pick_lang(lang)
    missing = list(missing_inputs or [])
    goal_l = _GOAL_LABEL.get(goal, _GOAL_LABEL["wealth"])[lang]

    if not ranked:
        confidence = "low"
        action = {
            "en": "Add a shortlist of countries or cities with valid coordinates",
            "fa": "فهرست کوتاهی از کشورها یا شهرها با مختصات معتبر اضافه کن",
            "ru": "Добавьте короткий список стран или городов с координатами",
            "ar": "أضيفي قائمة قصيرة لدول أو مدن بإحداثيات صالحة",
        }[lang]
        executive = {
            "en": (
                f"No ranked places for {goal_l} — valid location shortlist required. "
                f"Next: {action}. Confidence: {confidence}. "
                f"Missing: {', '.join(missing) if missing else 'locations'}."
            ),
            "fa": (
                f"برای {goal_l} رتبه‌بندی نیست — فهرست مکان معتبر لازم است. "
                f"قدم بعد: {action}. اطمینان: {confidence}. "
                f"کمبود: {', '.join(missing) if missing else 'locations'}."
            ),
            "ru": (
                f"Нет рейтинга для {goal_l} — нужен валидный список локаций. "
                f"Далее: {action}. Уверенность: {confidence}. "
                f"Не хватает: {', '.join(missing) if missing else 'locations'}."
            ),
            "ar": (
                f"لا ترتيب لـ {goal_l} — يلزم قائمة مواقع صالحة. "
                f"التالي: {action}. الثقة: {confidence}. "
                f"ناقص: {', '.join(missing) if missing else 'locations'}."
            ),
        }[lang]
        return {
            "executive": executive,
            "strategic": {
                "en": "Pathfinder relocation scores need resolvable geography — no invented ranks.",
                "fa": "امتیاز جابه‌جایی Pathfinder به جغرافیای قابل حل نیاز دارد — رتبه جعلی نیست.",
                "ru": "Скоринг релокации Pathfinder требует географии — без выдуманных рангов.",
                "ar": "درجات الانتقال Pathfinder تحتاج جغرافياً قابلة للحل — بلا ترتيب ملفّق.",
            }[lang],
            "technical": (
                f"engine=pathfinder.relocation · goal={goal} · ranked=0 · "
                f"missing={','.join(missing) if missing else 'locations'} · "
                f"confidence={confidence}"
            ),
            "headline": {
                "en": "Shortlist needed",
                "fa": "فهرست کوتاه لازم است",
                "ru": "Нужен короткий список",
                "ar": "يلزم قائمة قصيرة",
            }[lang],
            "intensity": "subtle",
            "confidence": confidence,
            "action": action,
            "missing_inputs": missing or ["locations"],
            "ranked": [],
            "explanation": executive,
        }

    top = ranked[0]
    top_score = int(top.get("score") or 0)
    if top_score >= 75:
        intensity = "strong"
        confidence = "high"
    elif top_score >= 60:
        intensity = "moderate"
        confidence = "medium"
    else:
        intensity = "subtle"
        confidence = "low"

    use_case = str(top.get("strongest_use_case") or "career")
    use_l = _AREA_LABEL.get(use_case, _AREA_LABEL["career"])[lang]
    label = str(top.get("label") or top.get("location") or "—")
    opportunity = str(top.get("opportunity") or "—")
    risk = str(top.get("risk") or "—")
    action = str(
        top.get("recommended_next_action")
        or {
            "en": f"Test a short stay focused on {goal_l} in {label}",
            "fa": f"اقامت کوتاه با تمرکز {goal_l} در {label} را آزمایش کن",
            "ru": f"Проверьте короткий визит ради {goal_l} в {label}",
            "ar": f"جرّبي إقامة قصيرة لـ {goal_l} في {label}",
        }[lang]
    )

    lines = []
    for i, r in enumerate(ranked[:5], start=1):
        rl = str(r.get("label") or r.get("location") or "—")
        rs = int(r.get("score") or 0)
        ru = _AREA_LABEL.get(str(r.get("strongest_use_case") or ""), {}).get(lang, "—")
        lines.append(f"{i}. {rl} ({rs}/100 · {ru})")
    rank_block = "\n".join(lines)

    headline = {
        "en": f"Top for {goal_l}: {label}",
        "fa": f"بهترین برای {goal_l}: {label}",
        "ru": f"Лучшее для {goal_l}: {label}",
        "ar": f"الأفضل لـ {goal_l}: {label}",
    }[lang]

    conf = _confidence_clause(confidence, lang)
    impact = {
        "en": f"What this changes today: treat {label} as a test market for {goal_l}, not a forever vow.",
        "fa": f"تأثیر امروز: {label} را بازار آزمایشی برای {goal_l} ببین، نه عهد ابدی.",
        "ru": f"Что меняется сегодня: считайте {label} тестовым рынком для {goal_l}, не вечным обетом.",
        "ar": f"ما يتغيّر اليوم: اعتبري {label} سوق اختبار لـ {goal_l} لا عهداً أبدياً.",
    }[lang]
    executive = {
        "en": (
            f"{headline} ({top_score}/100). Strongest use: {use_l}. "
            f"Opportunity: {opportunity}. Risk: {risk}. "
            f"Next: {action}. {conf} Action: {action}."
        ),
        "fa": (
            f"{headline} ({top_score}/100). قوی‌ترین کاربرد: {use_l}. "
            f"فرصت: {opportunity}. ریسک: {risk}. "
            f"قدم بعد: {action}. {conf} اقدام: {action}."
        ),
        "ru": (
            f"{headline} ({top_score}/100). Сильнее всего: {use_l}. "
            f"Возможность: {opportunity}. Риск: {risk}. "
            f"Далее: {action}. {conf} Действие: {action}."
        ),
        "ar": (
            f"{headline} ({top_score}/100). أقوى استخدام: {use_l}. "
            f"الفرصة: {opportunity}. المخاطر: {risk}. "
            f"التالي: {action}. {conf} الإجراء: {action}."
        ),
    }[lang]

    strategic = {
        "en": (
            f"{label} leads for {goal_l} ({top_score}/100), strongest for {use_l}. "
            f"Opportunity: {opportunity}. Watch the risk: {risk}.\n{rank_block}\n"
            f"{conf} {impact} Action: {action}."
        ),
        "fa": (
            f"{label} برای {goal_l} جلوست ({top_score}/100)، قوی‌ترین کاربرد {use_l}. "
            f"فرصت: {opportunity}. ریسک: {risk}.\n{rank_block}\n"
            f"{conf} {impact} اقدام: {action}."
        ),
        "ru": (
            f"{label} лидирует для {goal_l} ({top_score}/100), сильнее всего для {use_l}. "
            f"Возможность: {opportunity}. Риск: {risk}.\n{rank_block}\n"
            f"{conf} {impact} Действие: {action}."
        ),
        "ar": (
            f"{label} يتقدّم لـ {goal_l} ({top_score}/100)، الأقوى لـ {use_l}. "
            f"الفرصة: {opportunity}. المخاطر: {risk}.\n{rank_block}\n"
            f"{conf} {impact} الإجراء: {action}."
        ),
    }[lang]

    if missing:
        strategic += {
            "en": f"\nMissing inputs: {', '.join(missing)}.",
            "fa": f"\nورودی‌های ناقص: {', '.join(missing)}.",
            "ru": f"\nНе хватает: {', '.join(missing)}.",
            "ar": f"\nناقص: {', '.join(missing)}.",
        }[lang]

    technical = (
        f"engine=pathfinder.relocation · goal={goal} · top={label} "
        f"score={top_score} · use={use_case} · ranked={len(ranked)} · "
        f"confidence={confidence} · missing={','.join(missing) if missing else 'none'}"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
        "action": action,
        "missing_inputs": missing,
        "ranked": ranked,
        "explanation": {
            "en": f"Scores use relocated angles and significator houses for {goal_l}.",
            "fa": f"امتیازها از زوایای جابه‌جا و خانه‌های سیگنیفیکاتور برای {goal_l} است.",
            "ru": f"Очки — из релоцированных углов и домов сигнификатора для {goal_l}.",
            "ar": f"الدرجات من الزوايا المنقولة وبيوت الدلالة لـ {goal_l}.",
        }[lang],
    }


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
    """
    Provider — Business Geography from Pathfinder relocation (business blend).
    Ranked items mirror Best Countries with commercial risk framing.
    """
    lang = _pick_lang(lang)
    missing = list(missing_inputs or [])
    goal_l = _BUSINESS_GOAL_LABEL.get(goal, _BUSINESS_GOAL_LABEL["expansion"])[lang]

    if not ranked:
        confidence = "low"
        action = {
            "en": "Add a shortlist of markets or cities with valid coordinates",
            "fa": "فهرست کوتاهی از بازارها یا شهرها با مختصات معتبر اضافه کن",
            "ru": "Добавьте короткий список рынков или городов с координатами",
            "ar": "أضيفي قائمة أسواق أو مدن بإحداثيات صالحة",
        }[lang]
        executive = {
            "en": (
                f"No ranked markets for {goal_l} — valid location shortlist required. "
                f"Next: {action}. Confidence: {confidence}. "
                f"Missing: {', '.join(missing) if missing else 'locations'}."
            ),
            "fa": (
                f"برای {goal_l} رتبه‌بندی بازار نیست — فهرست مکان معتبر لازم است. "
                f"قدم بعد: {action}. اطمینان: {confidence}. "
                f"کمبود: {', '.join(missing) if missing else 'locations'}."
            ),
            "ru": (
                f"Нет рейтинга рынков для {goal_l} — нужен валидный список локаций. "
                f"Далее: {action}. Уверенность: {confidence}. "
                f"Не хватает: {', '.join(missing) if missing else 'locations'}."
            ),
            "ar": (
                f"لا ترتيب أسواق لـ {goal_l} — يلزم قائمة مواقع صالحة. "
                f"التالي: {action}. الثقة: {confidence}. "
                f"ناقص: {', '.join(missing) if missing else 'locations'}."
            ),
        }[lang]
        return {
            "executive": executive,
            "strategic": {
                "en": "Business Geography needs resolvable Pathfinder geography — no invented ranks.",
                "fa": "جغرافیای کسب‌وکار به جغرافیای Pathfinder قابل حل نیاز دارد — رتبه جعلی نیست.",
                "ru": "Business Geography требует валидной географии Pathfinder — без выдуманных рангов.",
                "ar": "جغرافيا الأعمال تحتاج جغرافيا Pathfinder قابلة للحل — بلا ترتيب ملفّق.",
            }[lang],
            "technical": (
                f"engine=pathfinder.relocation · mode=business · goal={goal} · "
                f"ranked=0 · missing={','.join(missing) if missing else 'locations'} · "
                f"confidence={confidence}"
            ),
            "headline": {
                "en": "Market shortlist needed",
                "fa": "فهرست بازار لازم است",
                "ru": "Нужен список рынков",
                "ar": "يلزم قائمة أسواق",
            }[lang],
            "intensity": "subtle",
            "confidence": confidence,
            "action": action,
            "missing_inputs": missing or ["locations"],
            "ranked": [],
            "explanation": executive,
        }

    top = ranked[0]
    top_score = int(top.get("score") or 0)
    if top_score >= 75:
        intensity = "strong"
        confidence = "high"
    elif top_score >= 60:
        intensity = "moderate"
        confidence = "medium"
    else:
        intensity = "subtle"
        confidence = "low"

    use_case = str(top.get("strongest_use_case") or "career")
    use_l = _BUSINESS_USE_LABEL.get(use_case, _BUSINESS_USE_LABEL["career"])[lang]
    label = str(top.get("label") or top.get("location") or "—")
    opportunity = str(top.get("opportunity") or "—")
    risk = str(top.get("commercial_risk") or top.get("risk") or "—")
    action = str(
        top.get("recommended_next_action")
        or {
            "en": f"Test a short business stay for {goal_l} in {label}",
            "fa": f"اقامت کاری کوتاه برای {goal_l} در {label} را آزمایش کن",
            "ru": f"Проверьте короткий деловой визит ради {goal_l} в {label}",
            "ar": f"جرّبي إقامة عمل قصيرة لـ {goal_l} في {label}",
        }[lang]
    )

    lines = []
    for i, r in enumerate(ranked[:5], start=1):
        rl = str(r.get("label") or r.get("location") or "—")
        rs = int(r.get("score") or 0)
        ru = _BUSINESS_USE_LABEL.get(str(r.get("strongest_use_case") or ""), {}).get(
            lang, "—"
        )
        lines.append(f"{i}. {rl} ({rs}/100 · {ru})")
    rank_block = "\n".join(lines)

    headline = {
        "en": f"Top market for {goal_l}: {label}",
        "fa": f"بهترین بازار برای {goal_l}: {label}",
        "ru": f"Лучший рынок для {goal_l}: {label}",
        "ar": f"أفضل سوق لـ {goal_l}: {label}",
    }[lang]

    conf = _confidence_clause(confidence, lang)
    impact = {
        "en": f"What this changes today: treat {label} as a market test for {goal_l}, not a permanent move.",
        "fa": f"تأثیر امروز: {label} را تست بازار برای {goal_l} ببین، نه جابه‌جایی دائمی.",
        "ru": f"Что меняется сегодня: считайте {label} рыночным тестом для {goal_l}, не постоянным переездом.",
        "ar": f"ما يتغيّر اليوم: اعتبري {label} اختبار سوق لـ {goal_l} لا انتقالاً دائماً.",
    }[lang]
    executive = {
        "en": (
            f"{headline} ({top_score}/100). Strongest business use: {use_l}. "
            f"Opportunity: {opportunity}. Commercial risk: {risk}. "
            f"Next: {action}. {conf} Action: {action}."
        ),
        "fa": (
            f"{headline} ({top_score}/100). قوی‌ترین کاربرد تجاری: {use_l}. "
            f"فرصت: {opportunity}. ریسک تجاری: {risk}. "
            f"قدم بعد: {action}. {conf} اقدام: {action}."
        ),
        "ru": (
            f"{headline} ({top_score}/100). Сильнейшее деловое применение: {use_l}. "
            f"Возможность: {opportunity}. Коммерческий риск: {risk}. "
            f"Далее: {action}. {conf} Действие: {action}."
        ),
        "ar": (
            f"{headline} ({top_score}/100). أقوى استخدام تجاري: {use_l}. "
            f"الفرصة: {opportunity}. المخاطر التجارية: {risk}. "
            f"التالي: {action}. {conf} الإجراء: {action}."
        ),
    }[lang]

    strategic = {
        "en": (
            f"{label} leads as a business market for {goal_l} ({top_score}/100), "
            f"strongest for {use_l}. Opportunity: {opportunity}. Commercial risk: {risk}.\n"
            f"{rank_block}\n{conf} {impact} Action: {action}."
        ),
        "fa": (
            f"{label} بازار تجاری پیشرو برای {goal_l} است ({top_score}/100)، "
            f"قوی‌ترین کاربرد {use_l}. فرصت: {opportunity}. ریسک تجاری: {risk}.\n"
            f"{rank_block}\n{conf} {impact} اقدام: {action}."
        ),
        "ru": (
            f"{label} лидирует как деловой рынок для {goal_l} ({top_score}/100), "
            f"сильнее всего для {use_l}. Возможность: {opportunity}. Риск: {risk}.\n"
            f"{rank_block}\n{conf} {impact} Действие: {action}."
        ),
        "ar": (
            f"{label} يتقدّم كسوق أعمال لـ {goal_l} ({top_score}/100)، "
            f"الأقوى لـ {use_l}. الفرصة: {opportunity}. المخاطر: {risk}.\n"
            f"{rank_block}\n{conf} {impact} الإجراء: {action}."
        ),
    }[lang]

    if missing:
        strategic += {
            "en": f"\nMissing inputs: {', '.join(missing)}.",
            "fa": f"\nورودی‌های ناقص: {', '.join(missing)}.",
            "ru": f"\nНе хватает: {', '.join(missing)}.",
            "ar": f"\nناقص: {', '.join(missing)}.",
        }[lang]

    technical = (
        f"engine=pathfinder.relocation · mode=business · goal={goal} · "
        f"top={label} score={top_score} · use={use_case} · ranked={len(ranked)} · "
        f"signals=jupiter,mercury,sun,saturn · houses=2,6,10,11 · "
        f"confidence={confidence} · missing={','.join(missing) if missing else 'none'}"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
        "action": action,
        "missing_inputs": missing,
        "ranked": ranked,
        "explanation": {
            "en": (
                f"Business blend of relocated wealth/career/community for {goal_l} "
                f"(Jupiter, Mercury, Sun, Saturn · houses 2/6/10/11)."
            ),
            "fa": (
                f"ترکیب تجاری ثروت/شغل/جامعهٔ جابه‌جا برای {goal_l} "
                f"(مشتری، عطارد، خورشید، زحل · خانه‌های ۲/۶/۱۰/۱۱)."
            ),
            "ru": (
                f"Деловой бленд релоцированных wealth/career/community для {goal_l} "
                f"(Юпитер, Меркурий, Солнце, Сатурн · дома 2/6/10/11)."
            ),
            "ar": (
                f"مزج تجاري لـ wealth/career/community المنقولة لـ {goal_l} "
                f"(المشتري، عطارد، الشمس، زحل · بيوت 2/6/10/11)."
            ),
        }[lang],
    }


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
    """
    Provider — Partner Profile.
    Ideal-partner tendencies from natal; optional synastry patterns.
    Never claims loyalty, wealth, dishonesty, or destiny about a person.
    """
    lang = _pick_lang(lang)
    missing = list(missing_inputs or [])
    traits = list(ideal_traits or [])
    patterns = list(compatibility_patterns or [])
    friction = list(friction_points or [])
    dyn = dict(dynamics or {})
    questions = list(verify_questions or [])
    goal_l = _PARTNERSHIP_GOAL_LABEL.get(goal, _PARTNERSHIP_GOAL_LABEL["romantic"])[lang]
    is_synastry = mode == "synastry"

    if confidence not in {"high", "medium", "low"}:
        confidence = "medium"
    if synastry_score is not None:
        if synastry_score >= 70:
            intensity = "strong"
        elif synastry_score >= 40:
            intensity = "moderate"
        else:
            intensity = "subtle"
    else:
        intensity = "moderate" if traits else "subtle"

    action = {
        "en": (
            "Compare chart tendencies with lived behaviour — ask the verify questions"
            if is_synastry
            else "Use this as a filter for dates, then verify with real conversations"
        ),
        "fa": (
            "تمایلات چارت را با رفتار واقعی مقایسه کن — سوالات راستی‌آزمایی را بپرس"
            if is_synastry
            else "این را فیلتر دوستیابی بدان، بعد با گفتگوی واقعی راستی‌آزمایی کن"
        ),
        "ru": (
            "Сверяйте тенденции карты с реальным поведением — задайте проверочные вопросы"
            if is_synastry
            else "Используйте как фильтр знакомств, затем проверяйте в разговорах"
        ),
        "ar": (
            "قارني ميول الخريطة بالسلوك المعاش — اسألي أسئلة التحقق"
            if is_synastry
            else "استخدمي هذا كمرشّح مواعيد ثم تحققي بمحادثات حقيقية"
        ),
    }[lang]

    traits_txt = "; ".join(traits[:4]) if traits else "—"
    patterns_txt = "; ".join(patterns[:3]) if patterns else {
        "en": "ideal-partner tendencies only (no second chart)",
        "fa": "فقط تمایلات شریک ایده‌آل (بدون چارت دوم)",
        "ru": "только тенденции идеального партнёра (без второй карты)",
        "ar": "ميول الشريك المثالي فقط (بدون خريطة ثانية)",
    }[lang]
    friction_txt = "; ".join(friction[:3]) if friction else {
        "en": "none flagged from synastry — still verify pacing and values",
        "fa": "از هم‌خوانی پرچم تنش نیست — باز هم ریتم و ارزش‌ها را چک کن",
        "ru": "синастрия не выделила трения — всё равно проверьте темп и ценности",
        "ar": "لا احتكاك من التوافق — تحققي من الإيقاع والقيم",
    }[lang]
    fin = dyn.get("financial") or "—"
    emo = dyn.get("emotional") or "—"
    pra = dyn.get("practical") or "—"
    q_txt = " / ".join(questions[:3]) if questions else "—"

    disclaimer = {
        "en": "Tendencies, not verified facts — not a loyalty, wealth, or destiny claim.",
        "fa": "تمایل است نه واقعیت تأییدشده — ادعای وفاداری، ثروت یا تقدیر نیست.",
        "ru": "Тенденции, не проверенные факты — не вердикт о верности, богатстве или судьбе.",
        "ar": "ميول لا حقائق مؤكدة — ليست حكماً بولاء أو ثروة أو قدر.",
    }[lang]

    headline = {
        "en": (
            f"Synastry check for {goal_l}"
            if is_synastry
            else f"Ideal partner sketch for {goal_l}"
        ),
        "fa": (
            f"بررسی هم‌خوانی برای {goal_l}"
            if is_synastry
            else f"طرح شریک ایده‌آل برای {goal_l}"
        ),
        "ru": (
            f"Синастрия для цели «{goal_l}»"
            if is_synastry
            else f"Эскиз идеального партнёра для «{goal_l}»"
        ),
        "ar": (
            f"فحص توافق لـ {goal_l}"
            if is_synastry
            else f"ملامح الشريك المثالي لـ {goal_l}"
        ),
    }[lang]

    score_bit = (
        f" Synastry score {synastry_score}/100."
        if is_synastry and synastry_score is not None
        else ""
    )

    conf = _confidence_clause(confidence, lang)
    impact = {
        "en": "What this changes today: use the sketch as a filter for dates — verify before you attach.",
        "fa": "تأثیر امروز: این طرح را فیلتر قرار ببین — قبل از وابستگی راستی‌آزمایی کن.",
        "ru": "Что меняется сегодня: используйте эскиз как фильтр — проверяйте до привязки.",
        "ar": "ما يتغيّر اليوم: استخدمي المخطط كفلتر — تحققي قبل التعلق.",
    }[lang]
    executive = {
        "en": (
            f"{headline}.{score_bit} Ideal traits: {traits_txt}. "
            f"Patterns: {patterns_txt}. Friction: {friction_txt}. "
            f"Dynamics — financial: {fin}; emotional: {emo}; practical: {pra}. "
            f"Verify: {q_txt}. Next: {action}. {conf} Action: {action}. {disclaimer}"
        ),
        "fa": (
            f"{headline}.{score_bit} ویژگی‌های ایده‌آل: {traits_txt}. "
            f"الگوها: {patterns_txt}. اصطکاک: {friction_txt}. "
            f"پویایی — مالی: {fin}; عاطفی: {emo}; عملی: {pra}. "
            f"راستی‌آزمایی: {q_txt}. قدم بعد: {action}. {conf} اقدام: {action}. {disclaimer}"
        ),
        "ru": (
            f"{headline}.{score_bit} Идеальные черты: {traits_txt}. "
            f"Паттерны: {patterns_txt}. Трение: {friction_txt}. "
            f"Динамика — финансы: {fin}; эмоции: {emo}; практика: {pra}. "
            f"Проверить: {q_txt}. Далее: {action}. {conf} Действие: {action}. {disclaimer}"
        ),
        "ar": (
            f"{headline}.{score_bit} السمات المثالية: {traits_txt}. "
            f"الأنماط: {patterns_txt}. الاحتكاك: {friction_txt}. "
            f"الديناميكيات — مالية: {fin}; عاطفية: {emo}; عملية: {pra}. "
            f"تحققي: {q_txt}. التالي: {action}. {conf} الإجراء: {action}. {disclaimer}"
        ),
    }[lang]

    strategic = {
        "en": (
            f"For {goal_l}, the chart leans toward: {traits_txt}. "
            f"Likely patterns: {patterns_txt}. Friction to watch: {friction_txt}. "
            f"Money / emotion / logistics: {fin} · {emo} · {pra}. "
            f"{conf} {impact} Action: {action}. Verify with: {q_txt}. {disclaimer}"
        ),
        "fa": (
            f"برای {goal_l} چارت به این سمت تمایل دارد: {traits_txt}. "
            f"الگوهای محتمل: {patterns_txt}. اصطکاک: {friction_txt}. "
            f"پول / عاطفه / عمل: {fin} · {emo} · {pra}. "
            f"{conf} {impact} اقدام: {action}. راستی‌آزمایی: {q_txt}. {disclaimer}"
        ),
        "ru": (
            f"Для {goal_l} карта склоняется к: {traits_txt}. "
            f"Паттерны: {patterns_txt}. Трение: {friction_txt}. "
            f"Деньги / эмоции / практика: {fin} · {emo} · {pra}. "
            f"{conf} {impact} Действие: {action}. Проверьте: {q_txt}. {disclaimer}"
        ),
        "ar": (
            f"لـ {goal_l} تميل الخريطة إلى: {traits_txt}. "
            f"أنماط محتملة: {patterns_txt}. احتكاك: {friction_txt}. "
            f"مال / عاطفة / عملي: {fin} · {emo} · {pra}. "
            f"{conf} {impact} الإجراء: {action}. تحققي بـ: {q_txt}. {disclaimer}"
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
        f"engine=relationship_profile+natal_aspects · mode={mode} · goal={goal} · "
        f"traits={len(traits)} · patterns={len(patterns)} · friction={len(friction)} · "
        f"synastry_score={synastry_score if synastry_score is not None else 'n/a'} · "
        f"confidence={confidence} · missing={','.join(missing) if missing else 'none'}"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
        "action": action,
        "missing_inputs": missing,
        "ideal_traits": traits,
        "compatibility_patterns": patterns,
        "friction_points": friction,
        "dynamics": dyn,
        "verify_questions": questions,
        "mode": mode,
        "explanation": disclaimer,
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
        "ru": "деловые",
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
    """Provider — Compatibility (synastry dimensions). No destiny/loyalty claims."""
    lang = _pick_lang(lang)
    missing = list(missing_inputs or [])
    dims = dict(dimensions or {})
    strengths_l = list(strengths or [])
    friction = list(friction_points or [])
    questions = list(verify_questions or [])
    rel_l = _COMPAT_REL_LABEL.get(
        relationship_type, _COMPAT_REL_LABEL["romantic"]
    )[lang]
    if confidence not in {"high", "medium", "low"}:
        confidence = "medium"

    disclaimer = {
        "en": "Patterns and tendencies — not destiny, loyalty, wealth, cheating, or guaranteed success.",
        "fa": "الگو و تمایل — نه تقدیر، وفاداری، ثروت، خیانت یا موفقیت تضمینی.",
        "ru": "Паттерны и тенденции — не судьба, верность, богатство, измена или гарантия успеха.",
        "ar": "أنماط وميول — ليست قدراً أو ولاء أو ثروة أو خيانة أو نجاحاً مضموناً.",
    }[lang]

    if overall_score is None and missing:
        action = {
            "en": "Add the other person's birth date, time, and place to score compatibility",
            "fa": "تاریخ، ساعت و محل تولد طرف مقابل را برای امتیاز هم‌خوانی اضافه کن",
            "ru": "Добавьте дату, время и место рождения второго человека для оценки",
            "ar": "أضيفي تاريخ ووقت ومكان ولادة الطرف الآخر لتقييم التوافق",
        }[lang]
        executive = {
            "en": (
                f"Compatibility for {rel_l} needs second-person birth data. "
                f"Next: {action}. Confidence: {confidence}. "
                f"Missing: {', '.join(missing)}. {disclaimer}"
            ),
            "fa": (
                f"هم‌خوانی {rel_l} به داده تولد نفر دوم نیاز دارد. "
                f"قدم بعد: {action}. اطمینان: {confidence}. "
                f"کمبود: {', '.join(missing)}. {disclaimer}"
            ),
            "ru": (
                f"Совместимость ({rel_l}) требует данных рождения второго человека. "
                f"Далее: {action}. Уверенность: {confidence}. "
                f"Не хватает: {', '.join(missing)}. {disclaimer}"
            ),
            "ar": (
                f"التوافق ({rel_l}) يحتاج بيانات ولادة الشخص الثاني. "
                f"التالي: {action}. الثقة: {confidence}. "
                f"ناقص: {', '.join(missing)}. {disclaimer}"
            ),
        }[lang]
        return {
            "executive": executive,
            "strategic": {
                "en": "No invented compatibility without a second chart.",
                "fa": "بدون چارت دوم هم‌خوانی جعلی نیست.",
                "ru": "Без второй карты совместимость не выдумывается.",
                "ar": "بلا خريطة ثانية لا يُختلق توافق.",
            }[lang],
            "technical": (
                f"engine=relationship_profile+synastry_aspects · rel={relationship_type} · "
                f"overall=n/a · missing={','.join(missing)} · confidence={confidence}"
            ),
            "headline": {
                "en": "Second chart needed",
                "fa": "چارت دوم لازم است",
                "ru": "Нужна вторая карта",
                "ar": "يلزم خريطة ثانية",
            }[lang],
            "intensity": "subtle",
            "confidence": confidence,
            "action": action,
            "missing_inputs": missing,
            "dimensions": dims,
            "explanation": disclaimer,
        }

    def _dim_line(key: str, label: str) -> str:
        d = dims.get(key) or {}
        score = d.get("score")
        band = _BAND_LABEL.get(str(d.get("band") or "unknown"), _BAND_LABEL["unknown"])[
            lang
        ]
        if score is None:
            return f"{label}: {band}"
        return f"{label}: {int(score)}/100 ({band})"

    labels = {
        "overall": {"en": "Overall", "fa": "کلی", "ru": "Общее", "ar": "عام"},
        "emotional": {
            "en": "Emotional",
            "fa": "عاطفی",
            "ru": "Эмоции",
            "ar": "عاطفي",
        },
        "communication": {
            "en": "Communication",
            "fa": "ارتباط",
            "ru": "Общение",
            "ar": "تواصل",
        },
        "chemistry": {
            "en": "Attraction/chemistry",
            "fa": "جذب/شیمی",
            "ru": "Притяжение/химия",
            "ar": "انجذاب/كيمياء",
        },
        "stability": {
            "en": "Stability/commitment",
            "fa": "ثبات/تعهد",
            "ru": "Стабильность/обязательства",
            "ar": "استقرار/التزام",
        },
        "growth": {
            "en": "Growth potential",
            "fa": "پتانسیل رشد",
            "ru": "Потенциал роста",
            "ar": "إمكان النمو",
        },
    }
    dim_block = " · ".join(
        _dim_line(k, labels[k][lang])
        for k in (
            "overall",
            "emotional",
            "communication",
            "chemistry",
            "stability",
            "growth",
        )
    )
    strengths_txt = "; ".join(strengths_l[:3]) if strengths_l else "—"
    friction_txt = "; ".join(friction[:3]) if friction else "—"
    q_txt = " / ".join(questions[:3]) if questions else "—"
    concern_bit = ""
    if concern and concern.strip():
        concern_bit = {
            "en": f" Concern noted: {concern.strip()[:80]}.",
            "fa": f" دغدغه: {concern.strip()[:80]}.",
            "ru": f" Запрос: {concern.strip()[:80]}.",
            "ar": f" القلق: {concern.strip()[:80]}.",
        }[lang]
    time_bit = f" {time_precision_note}" if time_precision_note else ""

    action = {
        "en": "Verify the top friction and strength points in one real conversation",
        "fa": "قوی‌ترین اصطکاک و قوت را در یک گفتگوی واقعی چک کن",
        "ru": "Проверьте главный плюс и трение в одном реальном разговоре",
        "ar": "تحققي من أقوى نقطة قوة واحتكاك في محادثة حقيقية",
    }[lang]

    if overall_score is not None and overall_score >= 70:
        intensity = "strong"
    elif overall_score is not None and overall_score >= 45:
        intensity = "moderate"
    else:
        intensity = "subtle"

    headline = {
        "en": f"Compatibility · {rel_l}",
        "fa": f"هم‌خوانی · {rel_l}",
        "ru": f"Совместимость · {rel_l}",
        "ar": f"التوافق · {rel_l}",
    }[lang]

    conf = _confidence_clause(confidence, lang)
    impact = {
        "en": "What this changes today: invest where strength shows; test friction in one real talk.",
        "fa": "تأثیر امروز: جایی سرمایه‌گذاری کن که قوت دیده می‌شود؛ اصطکاک را در یک گفتگوی واقعی تست کن.",
        "ru": "Что меняется сегодня: вкладывайтесь в силу; трение проверьте в одном реальном разговоре.",
        "ar": "ما يتغيّر اليوم: استثمري حيث تظهر القوة؛ اختبري الاحتكاك في حديث حقيقي واحد.",
    }[lang]
    executive = {
        "en": (
            f"{headline} — {overall_score}/100.{concern_bit}{time_bit} "
            f"{dim_block}. Strengths: {strengths_txt}. Friction: {friction_txt}. "
            f"Verify: {q_txt}. Next: {action}. {conf} Action: {action}. {disclaimer}"
        ),
        "fa": (
            f"{headline} — {overall_score}/100.{concern_bit}{time_bit} "
            f"{dim_block}. قوت: {strengths_txt}. اصطکاک: {friction_txt}. "
            f"راستی‌آزمایی: {q_txt}. قدم بعد: {action}. {conf} اقدام: {action}. {disclaimer}"
        ),
        "ru": (
            f"{headline} — {overall_score}/100.{concern_bit}{time_bit} "
            f"{dim_block}. Сильные стороны: {strengths_txt}. Трение: {friction_txt}. "
            f"Проверить: {q_txt}. Далее: {action}. {conf} Действие: {action}. {disclaimer}"
        ),
        "ar": (
            f"{headline} — {overall_score}/100.{concern_bit}{time_bit} "
            f"{dim_block}. نقاط القوة: {strengths_txt}. الاحتكاك: {friction_txt}. "
            f"تحققي: {q_txt}. التالي: {action}. {conf} الإجراء: {action}. {disclaimer}"
        ),
    }[lang]

    strategic = {
        "en": (
            f"For {rel_l}, overall sits at {overall_score}/100. "
            f"{dim_block}. Strengths: {strengths_txt}. Friction: {friction_txt}. "
            f"{conf} {impact} Action: {action}. Verify with: {q_txt}. {disclaimer}"
        ),
        "fa": (
            f"برای {rel_l} امتیاز کلی {overall_score}/100 است. "
            f"{dim_block}. قوت: {strengths_txt}. اصطکاک: {friction_txt}. "
            f"{conf} {impact} اقدام: {action}. راستی‌آزمایی: {q_txt}. {disclaimer}"
        ),
        "ru": (
            f"Для «{rel_l}» общий балл {overall_score}/100. "
            f"{dim_block}. Сильные стороны: {strengths_txt}. Трение: {friction_txt}. "
            f"{conf} {impact} Действие: {action}. Проверьте: {q_txt}. {disclaimer}"
        ),
        "ar": (
            f"لـ {rel_l} المجموع {overall_score}/100. "
            f"{dim_block}. نقاط القوة: {strengths_txt}. الاحتكاك: {friction_txt}. "
            f"{conf} {impact} الإجراء: {action}. تحققي بـ: {q_txt}. {disclaimer}"
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
        f"engine=relationship_profile+synastry_aspects · rel={relationship_type} · "
        f"overall={overall_score} · dims={','.join(dims.keys())} · "
        f"confidence={confidence} · missing={','.join(missing) if missing else 'none'}"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
        "action": action,
        "missing_inputs": missing,
        "dimensions": dims,
        "strengths": strengths_l,
        "friction_points": friction,
        "verify_questions": questions,
        "explanation": disclaimer,
    }


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
    """
    Shadow Room — Cheating Radar.
    Signals only — never states someone is cheating, lying, loyal, or hiding.
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
    if confidence not in {"high", "medium", "low"}:
        confidence = "medium"

    disclaimer = {
        "en": (
            "Signals only — never a verdict. No factual claim of cheating, lying, "
            "loyalty, disloyalty, or concealment."
        ),
        "fa": (
            "فقط سیگنال — هرگز حکم نیست. هیچ ادعای واقعی درباره خیانت، دروغ، "
            "وفاداری یا پنهان‌کاری مطرح نمی‌شود."
        ),
        "ru": (
            "Только сигналы — не приговор. Нет фактических утверждений об измене, "
            "лжи, верности или сокрытии."
        ),
        "ar": (
            "إشارات فقط — ليست حكماً. لا ادعاء واقعي بالخيانة أو الكذب أو الولاء "
            "أو الإخفاء."
        ),
    }[lang]

    rel_l = _COMPAT_REL_LABEL.get(
        relationship_type, _COMPAT_REL_LABEL["romantic"]
    )[lang]

    def _sig_line(key: str, label: str) -> str:
        s = sigs.get(key) or {}
        layer = str(s.get("layer") or "unknown")
        band = str(s.get("band") or "unknown")
        return f"{label}: {band}/{layer}"

    labels = {
        "trust_pressure": {
            "en": "Trust pressure",
            "fa": "فشار اعتماد",
            "ru": "Давление на доверие",
            "ar": "ضغط الثقة",
        },
        "communication_ambiguity": {
            "en": "Communication ambiguity",
            "fa": "ابهام ارتباط",
            "ru": "Неясность общения",
            "ar": "غموض التواصل",
        },
        "emotional_withdrawal": {
            "en": "Emotional withdrawal risk",
            "fa": "ریسک عقب‌نشینی عاطفی",
            "ru": "Риск эмоционального отхода",
            "ar": "خطر الانسحاب العاطفي",
        },
        "secrecy_avoidance": {
            "en": "Secrecy/avoidance signals",
            "fa": "سیگنال پنهان‌کاری/اجتناب",
            "ru": "Сигналы избегания/скрытности",
            "ar": "إشارات تجنّب/كتمان",
        },
    }
    sig_block = " · ".join(
        _sig_line(k, labels[k][lang])
        for k in (
            "trust_pressure",
            "communication_ambiguity",
            "emotional_withdrawal",
            "secrecy_avoidance",
        )
    )

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
        "en": "Verify with observable behaviour and calm questions — do not accuse",
        "fa": "با رفتار قابل مشاهده و سوال آرام راستی‌آزمایی کن — متهم نکن",
        "ru": "Проверяйте наблюдаемым поведением и спокойными вопросами — без обвинений",
        "ar": "تحققي بسلوك ملاحظ وأسئلة هادئة — دون اتهام",
    }[lang]

    mode_l = {
        "self": {
            "en": "self-pattern",
            "fa": "الگوی خود",
            "ru": "свой паттерн",
            "ar": "نمط ذاتي",
        },
        "synastry": {
            "en": "synastry signals",
            "fa": "سیگنال هم‌خوانی",
            "ru": "синастрические сигналы",
            "ar": "إشارات توافق",
        },
    }.get(mode, {}).get(lang, mode)

    headline = {
        "en": f"Cheating Radar · {rel_l} · {mode_l}",
        "fa": f"رادار خیانت · {rel_l} · {mode_l}",
        "ru": f"Радар верности · {rel_l} · {mode_l}",
        "ar": f"رادار الخيانة · {rel_l} · {mode_l}",
    }[lang]

    # Intensity from elevated inferred signals — not a guilt meter.
    elevated = sum(
        1
        for s in sigs.values()
        if str(s.get("band") or "") in {"elevated", "tension"}
        and str(s.get("layer") or "") == "inferred"
    )
    if elevated >= 3:
        intensity = "strong"
    elif elevated >= 1:
        intensity = "moderate"
    else:
        intensity = "subtle"

    conf = _confidence_clause(confidence, lang)
    impact = {
        "en": "What this changes today: gather observable proof before you escalate meaning.",
        "fa": "تأثیر امروز: قبل از بزرگ‌کردن معنا، شاهد قابل مشاهده جمع کن.",
        "ru": "Что меняется сегодня: соберите наблюдаемые факты до эскалации смысла.",
        "ar": "ما يتغيّر اليوم: اجمعي دليلاً ملحوظاً قبل تضخيم المعنى.",
    }[lang]
    executive = {
        "en": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Observed: {obs_txt}. Inferred: {inf_txt}. Unknown: {unk_txt}. "
            f"Verify behaviours: {beh_txt}. Questions: {q_txt}. "
            f"Next: {action}. {conf} Action: {action}. {disclaimer}"
        ),
        "fa": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"مشاهده: {obs_txt}. استنباط: {inf_txt}. نامشخص: {unk_txt}. "
            f"رفتار برای راستی‌آزمایی: {beh_txt}. سوالات: {q_txt}. "
            f"قدم بعد: {action}. {conf} اقدام: {action}. {disclaimer}"
        ),
        "ru": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Наблюдаемо: {obs_txt}. Вывод: {inf_txt}. Неизвестно: {unk_txt}. "
            f"Проверить поведение: {beh_txt}. Вопросы: {q_txt}. "
            f"Далее: {action}. {conf} Действие: {action}. {disclaimer}"
        ),
        "ar": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"ملاحظ: {obs_txt}. مستنتج: {inf_txt}. غير معروف: {unk_txt}. "
            f"سلوك للتحقق: {beh_txt}. أسئلة: {q_txt}. "
            f"التالي: {action}. {conf} الإجراء: {action}. {disclaimer}"
        ),
    }[lang]

    strategic = {
        "en": (
            f"Signal map: {sig_block}. Keep observed ({obs_txt}) separate from "
            f"inferred ({inf_txt}) and unknown ({unk_txt}). "
            f"{conf} {impact} Action: {action}. Ask calmly: {q_txt}. {disclaimer}"
        ),
        "fa": (
            f"نقشه سیگنال: {sig_block}. مشاهده ({obs_txt}) را از استنباط "
            f"({inf_txt}) و نامشخص ({unk_txt}) جدا نگه دار. "
            f"{conf} {impact} اقدام: {action}. آرام بپرس: {q_txt}. {disclaimer}"
        ),
        "ru": (
            f"Карта сигналов: {sig_block}. Отделяйте наблюдаемое ({obs_txt}) от "
            f"вывода ({inf_txt}) и неизвестного ({unk_txt}). "
            f"{conf} {impact} Действие: {action}. Спокойно спросите: {q_txt}. {disclaimer}"
        ),
        "ar": (
            f"خريطة الإشارات: {sig_block}. افصلي الملاحظ ({obs_txt}) عن "
            f"المستنتج ({inf_txt}) وغير المعروف ({unk_txt}). "
            f"{conf} {impact} الإجراء: {action}. اسألي بهدوء: {q_txt}. {disclaimer}"
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
        f"confidence={confidence} · missing={','.join(missing) if missing else 'none'} · "
        f"verdict=never"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
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
    """
    Shadow Room — Trust Patterns.
    Patterns only — never loyalty, dishonesty, betrayal, or trustworthiness verdicts.
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
    if confidence not in {"high", "medium", "low"}:
        confidence = "medium"

    disclaimer = {
        "en": (
            "Patterns only — never a verdict. No factual character claim about "
            "loyalty, honesty, concealment, or reliability."
        ),
        "fa": (
            "فقط الگو — هرگز حکم نیست. هیچ ادعای شخصیتی واقعی درباره وفاداری، "
            "صداقت، پنهان‌کاری یا قابلیت اتکا مطرح نمی‌شود."
        ),
        "ru": (
            "Только паттерны — не приговор. Нет фактических утверждений о характере "
            "в вопросах верности, честности, сокрытия или надёжности."
        ),
        "ar": (
            "أنماط فقط — ليست حكماً. لا ادعاء شخصي واقعي حول الولاء أو الصدق أو "
            "الكتمان أو الموثوقية."
        ),
    }[lang]

    rel_l = _COMPAT_REL_LABEL.get(
        relationship_type, _COMPAT_REL_LABEL["romantic"]
    )[lang]
    band_l = _BAND_LABEL

    def _sig_line(key: str, label: str) -> str:
        s = sigs.get(key) or {}
        layer = str(s.get("layer") or "unknown")
        band = str(s.get("band") or "unknown")
        bl = band_l.get(band, band_l["unknown"])[lang]
        return f"{label}: {bl}/{layer}"

    labels = {
        "trust_building": {
            "en": "Trust-building",
            "fa": "ساخت اعتماد",
            "ru": "Строительство доверия",
            "ar": "بناء الثقة",
        },
        "trust_pressure": {
            "en": "Trust pressure",
            "fa": "فشار اعتماد",
            "ru": "Давление на доверие",
            "ar": "ضغط الثقة",
        },
        "communication_reliability": {
            "en": "Communication reliability",
            "fa": "قابلیت اتکای ارتباط",
            "ru": "Надёжность общения",
            "ar": "موثوقية التواصل",
        },
        "boundary_risks": {
            "en": "Boundary risks",
            "fa": "ریسک مرزها",
            "ru": "Риски границ",
            "ar": "مخاطر الحدود",
        },
        "repair_opportunities": {
            "en": "Repair opportunities",
            "fa": "فرصت ترمیم",
            "ru": "Возможности ремонта",
            "ar": "فرص الإصلاح",
        },
    }
    order = (
        "trust_building",
        "trust_pressure",
        "communication_reliability",
        "boundary_risks",
        "repair_opportunities",
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
        "en": "Practice one repair step and verify with observable follow-through",
        "fa": "یک قدم ترمیم تمرین کن و با پیگیری قابل مشاهده راستی‌آزمایی کن",
        "ru": "Сделайте один шаг ремонта и проверьте наблюдаемым выполнением",
        "ar": "مارسي خطوة إصلاح واحدة وتحققي بالمتابعة الملحوظة",
    }[lang]

    mode_l = {
        "self": {
            "en": "self-pattern",
            "fa": "الگوی خود",
            "ru": "свой паттерн",
            "ar": "نمط ذاتي",
        },
        "synastry": {
            "en": "synastry patterns",
            "fa": "الگوهای هم‌خوانی",
            "ru": "синастрические паттерны",
            "ar": "أنماط توافق",
        },
    }.get(mode, {}).get(lang, mode)

    headline = {
        "en": f"Trust Patterns · {rel_l} · {mode_l}",
        "fa": f"الگوهای اعتماد · {rel_l} · {mode_l}",
        "ru": f"Паттерны доверия · {rel_l} · {mode_l}",
        "ar": f"أنماط الثقة · {rel_l} · {mode_l}",
    }[lang]

    tension_n = sum(
        1
        for s in sigs.values()
        if str(s.get("band") or "") == "tension" and str(s.get("layer") or "") == "inferred"
    )
    if tension_n >= 3:
        intensity = "strong"
    elif tension_n >= 1:
        intensity = "moderate"
    else:
        intensity = "subtle"

    conf = _confidence_clause(confidence, lang)
    impact = {
        "en": "What this changes today: gather observable proof before you escalate meaning.",
        "fa": "تأثیر امروز: قبل از بزرگ‌کردن معنا، شاهد قابل مشاهده جمع کن.",
        "ru": "Что меняется сегодня: соберите наблюдаемые факты до эскалации смысла.",
        "ar": "ما يتغيّر اليوم: اجمعي دليلاً ملحوظاً قبل تضخيم المعنى.",
    }[lang]
    executive = {
        "en": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Observed: {obs_txt}. Inferred: {inf_txt}. Unknown: {unk_txt}. "
            f"Verify behaviours: {beh_txt}. Questions: {q_txt}. "
            f"Next: {action}. {conf} Action: {action}. {disclaimer}"
        ),
        "fa": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"مشاهده: {obs_txt}. استنباط: {inf_txt}. نامشخص: {unk_txt}. "
            f"رفتار برای راستی‌آزمایی: {beh_txt}. سوالات: {q_txt}. "
            f"قدم بعد: {action}. {conf} اقدام: {action}. {disclaimer}"
        ),
        "ru": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Наблюдаемо: {obs_txt}. Вывод: {inf_txt}. Неизвестно: {unk_txt}. "
            f"Проверить поведение: {beh_txt}. Вопросы: {q_txt}. "
            f"Далее: {action}. {conf} Действие: {action}. {disclaimer}"
        ),
        "ar": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"ملاحظ: {obs_txt}. مستنتج: {inf_txt}. غير معروف: {unk_txt}. "
            f"سلوك للتحقق: {beh_txt}. أسئلة: {q_txt}. "
            f"التالي: {action}. {conf} الإجراء: {action}. {disclaimer}"
        ),
    }[lang]

    role_bits = []
    for planet in ("moon", "mercury", "venus", "jupiter", "saturn"):
        r = roles.get(planet) or {}
        role_bits.append(
            f"{planet}:{r.get('role') or '—'}={r.get('band') or 'unknown'}"
        )
    roles_txt = " · ".join(role_bits) if role_bits else "—"

    strategic = {
        "en": (
            f"Trust signal map: {sig_block}. Roles: {roles_txt}. "
            f"Keep observed ({obs_txt}) separate from inferred ({inf_txt}) and unknown ({unk_txt}). "
            f"{conf} {impact} Action: {action}. Ask calmly: {q_txt}. {disclaimer}"
        ),
        "fa": (
            f"نقشه اعتماد: {sig_block}. نقش‌ها: {roles_txt}. "
            f"مشاهده ({obs_txt}) را از استنباط ({inf_txt}) و نامشخص ({unk_txt}) جدا نگه دار. "
            f"{conf} {impact} اقدام: {action}. آرام بپرس: {q_txt}. {disclaimer}"
        ),
        "ru": (
            f"Карта доверия: {sig_block}. Роли: {roles_txt}. "
            f"Отделяйте наблюдаемое ({obs_txt}) от вывода ({inf_txt}) и неизвестного ({unk_txt}). "
            f"{conf} {impact} Действие: {action}. Спокойно спросите: {q_txt}. {disclaimer}"
        ),
        "ar": (
            f"خريطة الثقة: {sig_block}. الأدوار: {roles_txt}. "
            f"افصلي الملاحظ ({obs_txt}) عن المستنتج ({inf_txt}) وغير المعروف ({unk_txt}). "
            f"{conf} {impact} الإجراء: {action}. اسألي بهدوء: {q_txt}. {disclaimer}"
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
        f"planets=moon,mercury,venus,jupiter,saturn · roles={roles_txt} · "
        f"confidence={confidence} · missing={','.join(missing) if missing else 'none'} · "
        f"verdict=never"
    )

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
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


_COMM_RISK_BAND_LABEL: dict[str, dict[str, str]] = {
    "low": {"en": "low", "fa": "کم", "ru": "низкий", "ar": "منخفض"},
    "moderate": {
        "en": "moderate",
        "fa": "متوسط",
        "ru": "умеренный",
        "ar": "معتدل",
    },
    "elevated": {
        "en": "elevated",
        "fa": "بالا",
        "ru": "повышенный",
        "ar": "مرتفع",
    },
    "unknown": {
        "en": "unknown",
        "fa": "نامشخص",
        "ru": "неясно",
        "ar": "غير معروف",
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
    if confidence not in {"high", "medium", "low"}:
        confidence = "medium"

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
            "en": "Clarity risk",
            "fa": "ریسک وضوح",
            "ru": "Риск ясности",
            "ar": "مخاطر الوضوح",
        },
        "misunderstanding_risk": {
            "en": "Misunderstanding risk",
            "fa": "ریسک سوءتفاهم",
            "ru": "Риск недопонимания",
            "ar": "مخاطر سوء الفهم",
        },
        "emotional_reactivity": {
            "en": "Emotional reactivity",
            "fa": "واکنش‌پذیری عاطفی",
            "ru": "Эмоциональная реактивность",
            "ar": "ردة فعل عاطفية",
        },
        "avoidance_silence": {
            "en": "Avoidance/silence pattern",
            "fa": "الگوی اجتناب/سکوت",
            "ru": "Паттерн избегания/тишины",
            "ar": "نمط تجنّب/صمت",
        },
        "escalation_risk": {
            "en": "Escalation risk",
            "fa": "ریسک تشدید",
            "ru": "Риск эскалации",
            "ar": "مخاطر التصعيد",
        },
        "repair_capacity": {
            "en": "Repair capacity",
            "fa": "ظرفیت ترمیم",
            "ru": "Ёмкость ремонта",
            "ar": "سعة الإصلاح",
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
        "en": "Slow the next hard talk — one clear ask, one repair check, no accusation",
        "fa": "گفتگوی سخت بعدی را آهسته کن — یک درخواست روشن، یک چک ترمیم، بدون اتهام",
        "ru": "Замедлите следующий трудный разговор — один ясный запрос, одна проверка ремонта, без обвинений",
        "ar": "أبطئي الحديث الصعب التالي — طلب واضح واحد وفحص إصلاح بلا اتهام",
    }[lang]

    mode_l = {
        "self": {
            "en": "self-pattern",
            "fa": "الگوی خود",
            "ru": "свой паттерн",
            "ar": "نمط ذاتي",
        },
        "synastry": {
            "en": "synastry risk patterns",
            "fa": "الگوهای ریسک هم‌خوانی",
            "ru": "синастрические риски",
            "ar": "أنماط مخاطر توافق",
        },
    }.get(mode, {}).get(lang, mode)

    headline = {
        "en": f"Communication Risk · {rel_l} · {mode_l}",
        "fa": f"ریسک ارتباط · {rel_l} · {mode_l}",
        "ru": f"Риск общения · {rel_l} · {mode_l}",
        "ar": f"مخاطر التواصل · {rel_l} · {mode_l}",
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

    conf = _confidence_clause(confidence, lang)
    impact = {
        "en": "What this changes today: gather observable proof before you escalate meaning.",
        "fa": "تأثیر امروز: قبل از بزرگ‌کردن معنا، شاهد قابل مشاهده جمع کن.",
        "ru": "Что меняется сегодня: соберите наблюдаемые факты до эскалации смысла.",
        "ar": "ما يتغيّر اليوم: اجمعي دليلاً ملحوظاً قبل تضخيم المعنى.",
    }[lang]
    executive = {
        "en": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Observed: {obs_txt}. Inferred: {inf_txt}. Unknown: {unk_txt}. "
            f"Verify behaviours: {beh_txt}. Questions: {q_txt}. "
            f"Next: {action}. {conf} Action: {action}. {disclaimer}"
        ),
        "fa": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"مشاهده: {obs_txt}. استنباط: {inf_txt}. نامشخص: {unk_txt}. "
            f"رفتار برای راستی‌آزمایی: {beh_txt}. سوالات: {q_txt}. "
            f"قدم بعد: {action}. {conf} اقدام: {action}. {disclaimer}"
        ),
        "ru": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Наблюдаемо: {obs_txt}. Вывод: {inf_txt}. Неизвестно: {unk_txt}. "
            f"Проверить поведение: {beh_txt}. Вопросы: {q_txt}. "
            f"Далее: {action}. {conf} Действие: {action}. {disclaimer}"
        ),
        "ar": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"ملاحظ: {obs_txt}. مستنتج: {inf_txt}. غير معروف: {unk_txt}. "
            f"سلوك للتحقق: {beh_txt}. أسئلة: {q_txt}. "
            f"التالي: {action}. {conf} الإجراء: {action}. {disclaimer}"
        ),
    }[lang]

    strategic = {
        "en": (
            f"Communication risk map: {sig_block}. Roles: {roles_txt}. "
            f"Keep observed ({obs_txt}) separate from inferred ({inf_txt}) and unknown ({unk_txt}). "
            f"{conf} {impact} Action: {action}. Ask calmly: {q_txt}. {disclaimer}"
        ),
        "fa": (
            f"نقشه ریسک ارتباط: {sig_block}. نقش‌ها: {roles_txt}. "
            f"مشاهده ({obs_txt}) را از استنباط ({inf_txt}) و نامشخص ({unk_txt}) جدا نگه دار. "
            f"{conf} {impact} اقدام: {action}. آرام بپرس: {q_txt}. {disclaimer}"
        ),
        "ru": (
            f"Карта риска общения: {sig_block}. Роли: {roles_txt}. "
            f"Отделяйте наблюдаемое ({obs_txt}) от вывода ({inf_txt}) и неизвестного ({unk_txt}). "
            f"{conf} {impact} Действие: {action}. Спокойно спросите: {q_txt}. {disclaimer}"
        ),
        "ar": (
            f"خريطة مخاطر التواصل: {sig_block}. الأدوار: {roles_txt}. "
            f"افصلي الملاحظ ({obs_txt}) عن المستنتج ({inf_txt}) وغير المعروف ({unk_txt}). "
            f"{conf} {impact} الإجراء: {action}. اسألي بهدوء: {q_txt}. {disclaimer}"
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

    return {
        "executive": executive,
        "strategic": strategic,
        "technical": technical,
        "headline": headline,
        "intensity": intensity,
        "confidence": confidence,
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
