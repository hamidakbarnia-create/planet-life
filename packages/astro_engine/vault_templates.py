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
    """
    Build a three-layer reading from a MarsVerdict dict (from verdict_to_dict).
    Returns executive (one line), strategic (paragraph), technical (facts).
    """
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

    executive = f"{headline}: Mars in {sign_name}, house {house}."

    strategic_parts = [sign_line, house_line]
    if dignity_line:
        strategic_parts.append(dignity_line)
    strategic_parts.extend(aspect_lines)
    if retro:
        retro_copy = {
            "en": "Mars retrograde in your natal chart: desire revisits old patterns. You may return to the same type of man until you break the script.",
            "fa": "مریخ رتروگراد در چارت تولد: میل الگوهای قدیمی رو تکرار می‌کنه. ممکنه تا وقتی سناریو رو نشکنی همون نوع مرد برگرده.",
            "ru": "Марс ретрограден: желание возвращается к старым сценариям.",
            "ar": "المريخ رجعي: الرغبة تعيد أنماطاً قديمة.",
        }
        strategic_parts.append(retro_copy[lang])

    strategic = " ".join(strategic_parts)

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
    }
