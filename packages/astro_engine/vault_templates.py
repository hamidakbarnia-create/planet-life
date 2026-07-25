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

    executive = {
        "en": f"{headline}: Mars in {sign_name}, house {house}.",
        "fa": f"{headline}: مریخ در {sign_name}، خانه {house}.",
        "ru": f"{headline}: Марс в {sign_name}, дом {house}.",
        "ar": f"{headline}: المريخ في {sign_name}، البيت {house}.",
    }[lang]

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
        "Ghost Days favour strategic distance, not drama. "
        "Less texting, fewer explanations, more space — so pull returns on its own. "
        "Moon, Saturn, and Neptune support withdrawal without collapse."
    ),
    "fa": (
        "روزهای غیبت فاصلهٔ استراتژیک است، نه درام. "
        "پیام کمتر، توضیح کمتر، فضای بیشتر — تا کشش خودش برگردد. "
        "ماه، زحل و نپتون از عقب‌نشینی بدون فروپاشی حمایت می‌کنند."
    ),
    "ru": (
        "Дни тишины — стратегическая дистанция, не драма. "
        "Меньше сообщений и объяснений, больше пространства — притяжение вернётся само. "
        "Луна, Сатурн и Нептун поддерживают отход без обвала."
    ),
    "ar": (
        "أيام الغياب مسافة استراتيجية لا دراما. "
        "رسائل أقل وتفسير أقل ومساحة أكثر — ليعود الجذب وحده. "
        "القمر وزحل ونبتون يدعمان الانسحاب دون انهيار."
    ),
}


def _window_confidence(score: int) -> str:
    if score >= 75:
        return "high"
    if score >= 60:
        return "medium"
    return "low"


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
        empty = {
            "en": (
                f"No strong ghost windows in the next horizon. "
                f"Action: {action}. Avoid: {avoid}. Confidence: {confidence}."
            ),
            "fa": (
                f"در افق پیشِ رو پنجرهٔ غیبت قوی نیست. "
                f"اقدام: {action}. پرهیز: {avoid}. اطمینان: {confidence}."
            ),
            "ru": (
                f"Сильных окон дистанции в горизонте нет. "
                f"Действие: {action}. Избегать: {avoid}. Уверенность: {confidence}."
            ),
            "ar": (
                f"لا نوافذ غياب قوية في الأفق. "
                f"الإجراء: {action}. تجنبي: {avoid}. الثقة: {confidence}."
            ),
        }
        return {
            "executive": empty[lang],
            "strategic": GHOST_STRATEGY[lang],
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
    executive = {
        "en": (
            f"{headline}. Action: {action} ({top_score}/100). "
            f"Avoid: {avoid}. Confidence: {confidence}."
        ),
        "fa": (
            f"{headline}. اقدام: {action} ({top_score}/100). "
            f"پرهیز: {avoid}. اطمینان: {confidence}."
        ),
        "ru": (
            f"{headline}. Действие: {action} ({top_score}/100). "
            f"Избегать: {avoid}. Уверенность: {confidence}."
        ),
        "ar": (
            f"{headline}. الإجراء: {action} ({top_score}/100). "
            f"تجنبي: {avoid}. الثقة: {confidence}."
        ),
    }[lang]

    strategic = GHOST_STRATEGY[lang] + " " + {
        "en": f"Priority windows: {date_list}.",
        "fa": f"پنجره‌های اولویت: {date_list}.",
        "ru": f"Приоритетные окна: {date_list}.",
        "ar": f"النوافذ ذات الأولوية: {date_list}.",
    }[lang]

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
        "Money-Ask Days favour clear asks with warm timing — not pressure. "
        "Name the amount, keep the ask short, and let Venus/Jupiter do the softening. "
        "Ask once; do not stack follow-ups the same day."
    ),
    "fa": (
        "روزهای درخواست پول درخواست شفاف با زمان‌بندی گرم است — نه فشار. "
        "مبلغ را بگو، کوتاه بخواه، و بگذار زهره/مشتری نرمش بسازند. "
        "یک‌بار بخواه؛ همان روز پیگیری انباشته نکن."
    ),
    "ru": (
        "Дни денежной просьбы — ясный запрос в тёплый тайминг, без давления. "
        "Назовите сумму, держите просьбу короткой — Венера/Юпитер смягчают. "
        "Просите один раз; не копите follow-up в тот же день."
    ),
    "ar": (
        "أيام طلب المال طلب واضح بتوقيت دافئ — لا ضغط. "
        "اذكري المبلغ واختصري الطلب واتركي الزهرة/المشتري يليّنان. "
        "اطلبي مرة؛ لا تكدسي المتابعات في اليوم نفسه."
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
            "en": "Hold the ask until a clearer Venus money window",
            "fa": "تا پنجرهٔ پول زهره واضح، درخواست را نگه دار",
            "ru": "Отложите просьбу до более ясного денежного окна Венеры",
            "ar": "أجّلي الطلب حتى نافذة مال زهرية أوضح",
        }[lang]
        empty = {
            "en": (
                f"No strong money-ask windows in the next horizon. "
                f"Action: {action}. Avoid: {avoid}. Confidence: {confidence}."
            ),
            "fa": (
                f"در افق پیشِ رو پنجرهٔ درخواست پول قوی نیست. "
                f"اقدام: {action}. پرهیز: {avoid}. اطمینان: {confidence}."
            ),
            "ru": (
                f"Сильных окон денежной просьбы в горизонте нет. "
                f"Действие: {action}. Избегать: {avoid}. Уверенность: {confidence}."
            ),
            "ar": (
                f"لا نوافذ طلب مال قوية في الأفق. "
                f"الإجراء: {action}. تجنبي: {avoid}. الثقة: {confidence}."
            ),
        }
        return {
            "executive": empty[lang],
            "strategic": MONEY_ASK_STRATEGY[lang],
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
    executive = {
        "en": (
            f"{headline}. Action: {action} ({top_score}/100). "
            f"Avoid: {avoid}. Confidence: {confidence}."
        ),
        "fa": (
            f"{headline}. اقدام: {action} ({top_score}/100). "
            f"پرهیز: {avoid}. اطمینان: {confidence}."
        ),
        "ru": (
            f"{headline}. Действие: {action} ({top_score}/100). "
            f"Избегать: {avoid}. Уверенность: {confidence}."
        ),
        "ar": (
            f"{headline}. الإجراء: {action} ({top_score}/100). "
            f"تجنبي: {avoid}. الثقة: {confidence}."
        ),
    }[lang]

    strategic = MONEY_ASK_STRATEGY[lang] + " " + {
        "en": f"Priority windows: {date_list}.",
        "fa": f"پنجره‌های اولویت: {date_list}.",
        "ru": f"Приоритетные окна: {date_list}.",
        "ar": f"النوافذ ذات الأولوية: {date_list}.",
    }[lang]

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

    reason = {
        "en": (
            f"Ask peaks on negotiation sky ({ask_d}); commit aligns when "
            f"approval and terms both rise ({commit_d}); sign follows "
            f"contract-clarity timing ({sign_d})."
        ),
        "fa": (
            f"اوج درخواست روی آسمان مذاکره ({ask_d})؛ تعهد وقتی تأیید و شروط "
            f"هم‌زمان بالا می‌روند ({commit_d})؛ امضا با زمان‌بندی وضوح قرارداد "
            f"({sign_d})."
        ),
        "ru": (
            f"Просьба пик на переговорах ({ask_d}); обязательство — когда "
            f"одобрение и условия совпадают ({commit_d}); подпись — ясность "
            f"контракта ({sign_d})."
        ),
        "ar": (
            f"ذروة الطلب على سماء التفاوض ({ask_d})؛ الالتزام حين يرتفع "
            f"الموافقة والشروط معاً ({commit_d})؛ التوقيع بتوقيت وضوح العقد "
            f"({sign_d})."
        ),
    }[lang]

    executive = {
        "en": (
            f"Best time to ask: {ask_d}. Best time to commit: {commit_d}. "
            f"Best time to sign: {sign_d}. Avoid: {avoid}. "
            f"Confidence: {confidence}."
        ),
        "fa": (
            f"بهترین زمان درخواست: {ask_d}. بهترین زمان تعهد: {commit_d}. "
            f"بهترین زمان امضا: {sign_d}. پرهیز: {avoid}. "
            f"اطمینان: {confidence}."
        ),
        "ru": (
            f"Лучшее время просить: {ask_d}. Лучшее время обязаться: {commit_d}. "
            f"Лучшее время подписать: {sign_d}. Избегать: {avoid}. "
            f"Уверенность: {confidence}."
        ),
        "ar": (
            f"أفضل وقت للطلب: {ask_d}. أفضل وقت للالتزام: {commit_d}. "
            f"أفضل وقت للتوقيع: {sign_d}. تجنبي: {avoid}. "
            f"الثقة: {confidence}."
        ),
    }[lang]

    strategic = {
        "en": f"{reason} Horizon {horizon_days}d.",
        "fa": f"{reason} افق {horizon_days} روز.",
        "ru": f"{reason} Горизонт {horizon_days}д.",
        "ar": f"{reason} الأفق {horizon_days} يوماً.",
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
        "Hot Attraction Days favour presence, body, and bold timing — not over-explaining. "
        "Lean into chemistry, touch, and magnetic silence. "
        "Venus, Mars, and Moon in romance/partnership houses fuel the heat."
    ),
    "fa": (
        "روزهای جذابیت داغ حضور، بدن و زمان‌بندی جسورانه است — نه توضیح زیاد. "
        "روی شیمی، لمس و سکوت مگنتیک تکیه کن. "
        "زهره، مریخ و ماه در خانه‌های عشق/شراکت حرارت را می‌سازند."
    ),
    "ru": (
        "Дни жаркого притяжения — присутствие, тело и смелый тайминг, не лишние слова. "
        "Химия, касание, магнитная тишина. "
        "Венера, Марс и Луна в домах романтики/партнёрства дают жар."
    ),
    "ar": (
        "أيام الجذب الحار حضور وجسد وتوقيت جريء — لا إفراط في الشرح. "
        "اعتمدي على الكيمياء واللمس والصمت الجاذب. "
        "الزهرة والمريخ والقمر في بيوت الحب/الشراكة يغذّون الحرارة."
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
        empty = {
            "en": (
                f"No strong heat windows in the next horizon. "
                f"Action: {action}. Avoid: {avoid}. Confidence: {confidence}."
            ),
            "fa": (
                f"در افق پیشِ رو پنجرهٔ حرارت قوی نیست. "
                f"اقدام: {action}. پرهیز: {avoid}. اطمینان: {confidence}."
            ),
            "ru": (
                f"Сильных окон жара в горизонте нет. "
                f"Действие: {action}. Избегать: {avoid}. Уверенность: {confidence}."
            ),
            "ar": (
                f"لا نوافذ حرارة قوية في الأفق. "
                f"الإجراء: {action}. تجنبي: {avoid}. الثقة: {confidence}."
            ),
        }
        return {
            "executive": empty[lang],
            "strategic": HOT_STRATEGY[lang],
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
    executive = {
        "en": (
            f"{headline}. Action: {action} ({top_score}/100). "
            f"Avoid: {avoid}. Confidence: {confidence}."
        ),
        "fa": (
            f"{headline}. اقدام: {action} ({top_score}/100). "
            f"پرهیز: {avoid}. اطمینان: {confidence}."
        ),
        "ru": (
            f"{headline}. Действие: {action} ({top_score}/100). "
            f"Избегать: {avoid}. Уверенность: {confidence}."
        ),
        "ar": (
            f"{headline}. الإجراء: {action} ({top_score}/100). "
            f"تجنبي: {avoid}. الثقة: {confidence}."
        ),
    }[lang]

    strategic = HOT_STRATEGY[lang] + " " + {
        "en": f"Priority windows: {date_list}.",
        "fa": f"پنجره‌های اولویت: {date_list}.",
        "ru": f"Приоритетные окна: {date_list}.",
        "ar": f"النوافذ ذات الأولوية: {date_list}.",
    }[lang]

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

    executive = {
        "en": (
            f"Action: {action}. Avoid: {avoid}. "
            f"Moon in {sign_name}. Confidence: {confidence}."
        ),
        "fa": (
            f"اقدام: {action}. پرهیز: {avoid}. "
            f"ماه در {sign_name}. اطمینان: {confidence}."
        ),
        "ru": (
            f"Действие: {action}. Избегать: {avoid}. "
            f"Луна в {sign_name}. Уверенность: {confidence}."
        ),
        "ar": (
            f"الإجراء: {action}. تجنبي: {avoid}. "
            f"القمر في {sign_name}. الثقة: {confidence}."
        ),
    }[lang]

    strategic = {
        "en": (
            f"Dress from the Moon in {sign_name}: lead with {primary}, "
            f"finish with {accent} in shoes, lips, or a single accessory. "
            "One clear color story reads as intentional attraction — not costume."
        ),
        "fa": (
            f"از ماه در {sign_name} لباس بپوش: با {primary} شروع کن، "
            f"با {accent} در کفش، لب یا یک اکسسوری تمام کن. "
            "یک داستان رنگی واضح جذابیت هدفمند است — نه لباس نمایشی."
        ),
        "ru": (
            f"Одевайтесь от Луны в {sign_name}: основа {primary}, "
            f"акцент {accent} в обуви, губах или одном аксессуаре. "
            "Один ясный цветовой сюжет — намеренное притяжение, не костюм."
        ),
        "ar": (
            f"البسي من القمر في {sign_name}: ابدئي بـ {primary}، "
            f"وأكملي بـ {accent} في الحذاء أو الشفاه أو إكسسوار واحد. "
            "قصة لون واضحة جذب مقصود — لا تنكر."
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
            f"Natal Venus {v_name} + Moon {m_name} set the blend; "
            f"Asc {a_name} sets the occasion; Transit Moon {tm_name} "
            f"tints the day ({dominant_element})."
        ),
        "fa": (
            f"زهرهٔ تولد {v_name} + ماه {m_name} ترکیب را می‌سازند؛ "
            f"طالع {a_name} موقعیت را؛ ماه ترانزیت {tm_name} "
            f"روز را رنگ می‌زند ({dominant_element})."
        ),
        "ru": (
            f"Натальная Венера {v_name} + Луна {m_name} задают смесь; "
            f"Асц {a_name} — повод; транзитная Луна {tm_name} "
            f"окрашивает день ({dominant_element})."
        ),
        "ar": (
            f"الزهرة الولادية {v_name} + القمر {m_name} يحددان المزيج؛ "
            f"الصاعد {a_name} المناسبة؛ قمر العبور {tm_name} "
            f"يلوّن اليوم ({dominant_element})."
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

    executive = {
        "en": (
            f"Family: {fragrance_family}. Primary notes: {primary_notes}."
            f"{accent_bit} Occasion: {occasion}. Avoid: {avoid}. "
            f"Confidence: {confidence}."
        ),
        "fa": (
            f"خانواده: {fragrance_family}. نت‌های اصلی: {primary_notes}."
            f"{accent_bit} موقعیت: {occasion}. پرهیز: {avoid}. "
            f"اطمینان: {confidence}."
        ),
        "ru": (
            f"Семейство: {fragrance_family}. Основные ноты: {primary_notes}."
            f"{accent_bit} Повод: {occasion}. Избегать: {avoid}. "
            f"Уверенность: {confidence}."
        ),
        "ar": (
            f"العائلة: {fragrance_family}. النوتات الأساسية: {primary_notes}."
            f"{accent_bit} المناسبة: {occasion}. تجنبي: {avoid}. "
            f"الثقة: {confidence}."
        ),
    }[lang]

    strategic = {
        "en": (
            f"{reason} Aura projection: Asc {a_name} ({aura['note']})."
        ),
        "fa": (
            f"{reason} پرتو طالع {a_name} ({aura['note']})."
        ),
        "ru": (
            f"{reason} Проекция Асц {a_name} ({aura['note']})."
        ),
        "ar": (
            f"{reason} إسقاط الصاعد {a_name} ({aura['note']})."
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

    executive = {
        "en": (
            f"Best posting: {posting.get('window', '—')}. "
            f"Best filming: {filming.get('window', '—')}. "
            f"Best live stream: {live_stream.get('window', '—')}. "
            f"Confidence: {confidence}."
        ),
        "fa": (
            f"بهترین پست: {posting.get('window', '—')}. "
            f"بهترین فیلم‌برداری: {filming.get('window', '—')}. "
            f"بهترین لایو: {live_stream.get('window', '—')}. "
            f"اطمینان: {confidence}."
        ),
        "ru": (
            f"Лучший пост: {posting.get('window', '—')}. "
            f"Лучшая съёмка: {filming.get('window', '—')}. "
            f"Лучший эфир: {live_stream.get('window', '—')}. "
            f"Уверенность: {confidence}."
        ),
        "ar": (
            f"أفضل نشر: {posting.get('window', '—')}. "
            f"أفضل تصوير: {filming.get('window', '—')}. "
            f"أفضل بث: {live_stream.get('window', '—')}. "
            f"الثقة: {confidence}."
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
            f"{_line('posting')}. {_line('filming')}. {_line('live_stream')}. "
            f"Reason: {reason}"
        ),
        "fa": (
            f"{_line('posting')}. {_line('filming')}. {_line('live_stream')}. "
            f"دلیل: {reason}"
        ),
        "ru": (
            f"{_line('posting')}. {_line('filming')}. {_line('live_stream')}. "
            f"Причина: {reason}"
        ),
        "ar": (
            f"{_line('posting')}. {_line('filming')}. {_line('live_stream')}. "
            f"السبب: {reason}"
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

    executive = {
        "en": (
            f"Outfit: {style}. Primary {primary}, accent {accent}. "
            f"Accessories: {accessories}. Fragrance: {fragrance}. "
            f"Best meeting: {window}. Avoid: {avoid}. Confidence: {confidence}."
        ),
        "fa": (
            f"استایل: {style}. اصلی {primary}، اکسنت {accent}. "
            f"اکسسوری: {accessories}. عطر: {fragrance}. "
            f"بهترین ملاقات: {window}. پرهیز: {avoid}. اطمینان: {confidence}."
        ),
        "ru": (
            f"Образ: {style}. Основной {primary}, акцент {accent}. "
            f"Аксессуары: {accessories}. Аромат: {fragrance}. "
            f"Лучшая встреча: {window}. Избегать: {avoid}. "
            f"Уверенность: {confidence}."
        ),
        "ar": (
            f"الإطلالة: {style}. أساسي {primary}، لمسة {accent}. "
            f"إكسسوارات: {accessories}. عطر: {fragrance}. "
            f"أفضل لقاء: {window}. تجنبي: {avoid}. الثقة: {confidence}."
        ),
    }[lang]

    strategic = {
        "en": (
            f"Lead with Natal Venus in {SIGN_LABEL[venus][lang]} ({style}), "
            f"color from Transit Moon in {SIGN_LABEL[t_moon][lang]} "
            f"({primary} / {accent}), finish with Ascendant "
            f"{SIGN_LABEL[asc][lang]} ({accessories}), and scent family "
            f"{fragrance}. Meet in {window}; skip {avoid}."
        ),
        "fa": (
            f"با زهرهٔ تولد در {SIGN_LABEL[venus][lang]} ({style}) شروع کن، "
            f"رنگ از ماه ترانزیت در {SIGN_LABEL[t_moon][lang]} "
            f"({primary} / {accent})، تمام با طالع "
            f"{SIGN_LABEL[asc][lang]} ({accessories})، و خانوادهٔ عطر "
            f"{fragrance}. ملاقات در {window}؛ از {avoid} پرهیز کن."
        ),
        "ru": (
            f"Ведите натальной Венерой в {SIGN_LABEL[venus][lang]} ({style}), "
            f"цвет — от транзитной Луны в {SIGN_LABEL[t_moon][lang]} "
            f"({primary} / {accent}), аксессуар — Асцендент "
            f"{SIGN_LABEL[asc][lang]} ({accessories}), аромат — "
            f"{fragrance}. Встреча в {window}; избегайте {avoid}."
        ),
        "ar": (
            f"ابدئي بالزهرة الولادية في {SIGN_LABEL[venus][lang]} ({style})، "
            f"اللون من قمر العبور في {SIGN_LABEL[t_moon][lang]} "
            f"({primary} / {accent})، وأكملي بالصاعد "
            f"{SIGN_LABEL[asc][lang]} ({accessories})، وعائلة العطر "
            f"{fragrance}. اللقاء في {window}؛ تجنبي {avoid}."
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

    executive = {
        "en": (
            f"{headline} ({top_score}/100). Strongest use: {use_l}. "
            f"Opportunity: {opportunity}. Risk: {risk}. "
            f"Next: {action}. Confidence: {confidence}."
        ),
        "fa": (
            f"{headline} ({top_score}/100). قوی‌ترین کاربرد: {use_l}. "
            f"فرصت: {opportunity}. ریسک: {risk}. "
            f"قدم بعد: {action}. اطمینان: {confidence}."
        ),
        "ru": (
            f"{headline} ({top_score}/100). Сильнее всего: {use_l}. "
            f"Возможность: {opportunity}. Риск: {risk}. "
            f"Далее: {action}. Уверенность: {confidence}."
        ),
        "ar": (
            f"{headline} ({top_score}/100). أقوى استخدام: {use_l}. "
            f"الفرصة: {opportunity}. المخاطر: {risk}. "
            f"التالي: {action}. الثقة: {confidence}."
        ),
    }[lang]

    strategic = {
        "en": f"Ranked by Pathfinder relocation for {goal_l}:\n{rank_block}",
        "fa": f"رتبه‌بندی جابه‌جایی Pathfinder برای {goal_l}:\n{rank_block}",
        "ru": f"Рейтинг релокации Pathfinder для {goal_l}:\n{rank_block}",
        "ar": f"ترتيب انتقال Pathfinder لـ {goal_l}:\n{rank_block}",
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

    executive = {
        "en": (
            f"{headline} ({top_score}/100). Strongest business use: {use_l}. "
            f"Opportunity: {opportunity}. Commercial risk: {risk}. "
            f"Next: {action}. Confidence: {confidence}."
        ),
        "fa": (
            f"{headline} ({top_score}/100). قوی‌ترین کاربرد تجاری: {use_l}. "
            f"فرصت: {opportunity}. ریسک تجاری: {risk}. "
            f"قدم بعد: {action}. اطمینان: {confidence}."
        ),
        "ru": (
            f"{headline} ({top_score}/100). Сильнейшее деловое применение: {use_l}. "
            f"Возможность: {opportunity}. Коммерческий риск: {risk}. "
            f"Далее: {action}. Уверенность: {confidence}."
        ),
        "ar": (
            f"{headline} ({top_score}/100). أقوى استخدام تجاري: {use_l}. "
            f"الفرصة: {opportunity}. المخاطر التجارية: {risk}. "
            f"التالي: {action}. الثقة: {confidence}."
        ),
    }[lang]

    strategic = {
        "en": (
            f"Ranked by Pathfinder relocation (Jupiter/Mercury/Sun/Saturn · "
            f"houses 2/6/10/11 via wealth·career·community) for {goal_l}:\n{rank_block}"
        ),
        "fa": (
            f"رتبه‌بندی جابه‌جایی Pathfinder (مشتری/عطارد/خورشید/زحل · "
            f"خانه‌های ۲/۶/۱۰/۱۱ از ثروت·شغل·جامعه) برای {goal_l}:\n{rank_block}"
        ),
        "ru": (
            f"Рейтинг релокации Pathfinder (Юпитер/Меркурий/Солнце/Сатурн · "
            f"дома 2/6/10/11 через wealth·career·community) для {goal_l}:\n{rank_block}"
        ),
        "ar": (
            f"ترتيب انتقال Pathfinder (المشتري/عطارد/الشمس/زحل · "
            f"بيوت 2/6/10/11 عبر ثروة·مهنة·مجتمع) لـ {goal_l}:\n{rank_block}"
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

    executive = {
        "en": (
            f"{headline}.{score_bit} Ideal traits: {traits_txt}. "
            f"Patterns: {patterns_txt}. Friction: {friction_txt}. "
            f"Dynamics — financial: {fin}; emotional: {emo}; practical: {pra}. "
            f"Verify: {q_txt}. Next: {action}. Confidence: {confidence}. {disclaimer}"
        ),
        "fa": (
            f"{headline}.{score_bit} ویژگی‌های ایده‌آل: {traits_txt}. "
            f"الگوها: {patterns_txt}. اصطکاک: {friction_txt}. "
            f"پویایی — مالی: {fin}; عاطفی: {emo}; عملی: {pra}. "
            f"راستی‌آزمایی: {q_txt}. قدم بعد: {action}. اطمینان: {confidence}. {disclaimer}"
        ),
        "ru": (
            f"{headline}.{score_bit} Идеальные черты: {traits_txt}. "
            f"Паттерны: {patterns_txt}. Трение: {friction_txt}. "
            f"Динамика — финансы: {fin}; эмоции: {emo}; практика: {pra}. "
            f"Проверить: {q_txt}. Далее: {action}. Уверенность: {confidence}. {disclaimer}"
        ),
        "ar": (
            f"{headline}.{score_bit} السمات المثالية: {traits_txt}. "
            f"الأنماط: {patterns_txt}. الاحتكاك: {friction_txt}. "
            f"الديناميكيات — مالية: {fin}; عاطفية: {emo}; عملية: {pra}. "
            f"تحققي: {q_txt}. التالي: {action}. الثقة: {confidence}. {disclaimer}"
        ),
    }[lang]

    strategic = {
        "en": (
            f"Goal={goal_l}. Mode={'synastry' if is_synastry else 'ideal_only'}. "
            f"Separate chart tendencies from real-life proof. "
            f"Questions: {q_txt}."
        ),
        "fa": (
            f"هدف={goal_l}. حالت={'هم‌خوانی' if is_synastry else 'فقط ایده‌آل'}. "
            f"تمایل چارت را از اثبات واقعی جدا کن. "
            f"سوالات: {q_txt}."
        ),
        "ru": (
            f"Цель={goal_l}. Режим={'синастрия' if is_synastry else 'только идеал'}. "
            f"Отделяйте тенденции карты от проверки в жизни. "
            f"Вопросы: {q_txt}."
        ),
        "ar": (
            f"الهدف={goal_l}. الوضع={'توافق' if is_synastry else 'مثالي فقط'}. "
            f"افصلي ميول الخريطة عن الإثبات الواقعي. "
            f"الأسئلة: {q_txt}."
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

    executive = {
        "en": (
            f"{headline} — {overall_score}/100.{concern_bit}{time_bit} "
            f"{dim_block}. Strengths: {strengths_txt}. Friction: {friction_txt}. "
            f"Verify: {q_txt}. Next: {action}. Confidence: {confidence}. {disclaimer}"
        ),
        "fa": (
            f"{headline} — {overall_score}/100.{concern_bit}{time_bit} "
            f"{dim_block}. قوت: {strengths_txt}. اصطکاک: {friction_txt}. "
            f"راستی‌آزمایی: {q_txt}. قدم بعد: {action}. اطمینان: {confidence}. {disclaimer}"
        ),
        "ru": (
            f"{headline} — {overall_score}/100.{concern_bit}{time_bit} "
            f"{dim_block}. Сильные стороны: {strengths_txt}. Трение: {friction_txt}. "
            f"Проверить: {q_txt}. Далее: {action}. Уверенность: {confidence}. {disclaimer}"
        ),
        "ar": (
            f"{headline} — {overall_score}/100.{concern_bit}{time_bit} "
            f"{dim_block}. نقاط القوة: {strengths_txt}. الاحتكاك: {friction_txt}. "
            f"تحققي: {q_txt}. التالي: {action}. الثقة: {confidence}. {disclaimer}"
        ),
    }[lang]

    strategic = {
        "en": (
            f"Weighted for {rel_l} via relationship_profile aspect tables. "
            f"Harmony, tension, and unknown bands are separate. Questions: {q_txt}."
        ),
        "fa": (
            f"وزن‌دهی برای {rel_l} با جدول جنبه‌های relationship_profile. "
            f"هماهنگی، تنش و نامشخص جدا هستند. سوالات: {q_txt}."
        ),
        "ru": (
            f"Взвешено для «{rel_l}» таблицами аспектов relationship_profile. "
            f"Гармония, напряжение и unknown разделены. Вопросы: {q_txt}."
        ),
        "ar": (
            f"موزون لـ {rel_l} عبر جداول جوانب relationship_profile. "
            f"الانسجام والتوتر وغير المعروف منفصلان. الأسئلة: {q_txt}."
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

    executive = {
        "en": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Observed: {obs_txt}. Inferred: {inf_txt}. Unknown: {unk_txt}. "
            f"Verify behaviours: {beh_txt}. Questions: {q_txt}. "
            f"Next: {action}. Confidence: {confidence}. {disclaimer}"
        ),
        "fa": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"مشاهده: {obs_txt}. استنباط: {inf_txt}. نامشخص: {unk_txt}. "
            f"رفتار برای راستی‌آزمایی: {beh_txt}. سوالات: {q_txt}. "
            f"قدم بعد: {action}. اطمینان: {confidence}. {disclaimer}"
        ),
        "ru": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Наблюдаемо: {obs_txt}. Вывод: {inf_txt}. Неизвестно: {unk_txt}. "
            f"Проверить поведение: {beh_txt}. Вопросы: {q_txt}. "
            f"Далее: {action}. Уверенность: {confidence}. {disclaimer}"
        ),
        "ar": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"ملاحظ: {obs_txt}. مستنتج: {inf_txt}. غير معروف: {unk_txt}. "
            f"سلوك للتحقق: {beh_txt}. أسئلة: {q_txt}. "
            f"التالي: {action}. الثقة: {confidence}. {disclaimer}"
        ),
    }[lang]

    strategic = {
        "en": (
            f"Separate observed input, inferred pattern, and unknown. "
            f"Mode={mode}. Use verification — never accusation. Questions: {q_txt}."
        ),
        "fa": (
            f"ورودی مشاهده، الگوی استنباطی و نامشخص را جدا کن. "
            f"حالت={mode}. راستی‌آزمایی — نه اتهام. سوالات: {q_txt}."
        ),
        "ru": (
            f"Отделяйте наблюдаемый ввод, вывод и неизвестное. "
            f"Режим={mode}. Проверка — не обвинение. Вопросы: {q_txt}."
        ),
        "ar": (
            f"افصلي المدخل الملاحظ والنمط المستنتج وغير المعروف. "
            f"الوضع={mode}. تحقق — لا اتهام. الأسئلة: {q_txt}."
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

    executive = {
        "en": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Observed: {obs_txt}. Inferred: {inf_txt}. Unknown: {unk_txt}. "
            f"Verify behaviours: {beh_txt}. Questions: {q_txt}. "
            f"Next: {action}. Confidence: {confidence}. {disclaimer}"
        ),
        "fa": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"مشاهده: {obs_txt}. استنباط: {inf_txt}. نامشخص: {unk_txt}. "
            f"رفتار برای راستی‌آزمایی: {beh_txt}. سوالات: {q_txt}. "
            f"قدم بعد: {action}. اطمینان: {confidence}. {disclaimer}"
        ),
        "ru": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Наблюдаемо: {obs_txt}. Вывод: {inf_txt}. Неизвестно: {unk_txt}. "
            f"Проверить поведение: {beh_txt}. Вопросы: {q_txt}. "
            f"Далее: {action}. Уверенность: {confidence}. {disclaimer}"
        ),
        "ar": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"ملاحظ: {obs_txt}. مستنتج: {inf_txt}. غير معروف: {unk_txt}. "
            f"سلوك للتحقق: {beh_txt}. أسئلة: {q_txt}. "
            f"التالي: {action}. الثقة: {confidence}. {disclaimer}"
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
            f"Moon/Mercury/Venus/Jupiter/Saturn roles for {rel_l}: {roles_txt}. "
            f"Separate observed, inferred, and unknown. Questions: {q_txt}."
        ),
        "fa": (
            f"نقش ماه/عطارد/زهره/مشتری/زحل برای {rel_l}: {roles_txt}. "
            f"مشاهده، استنباط و نامشخص را جدا کن. سوالات: {q_txt}."
        ),
        "ru": (
            f"Роли Луна/Меркурий/Венера/Юпитер/Сатурн для «{rel_l}»: {roles_txt}. "
            f"Отделяйте наблюдаемое, вывод и неизвестное. Вопросы: {q_txt}."
        ),
        "ar": (
            f"أدوار القمر/عطارد/الزهرة/المشتري/زحل لـ {rel_l}: {roles_txt}. "
            f"افصلي الملاحظ والمستنتج وغير المعروف. الأسئلة: {q_txt}."
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

    executive = {
        "en": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Observed: {obs_txt}. Inferred: {inf_txt}. Unknown: {unk_txt}. "
            f"Verify behaviours: {beh_txt}. Questions: {q_txt}. "
            f"Next: {action}. Confidence: {confidence}. {disclaimer}"
        ),
        "fa": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"مشاهده: {obs_txt}. استنباط: {inf_txt}. نامشخص: {unk_txt}. "
            f"رفتار برای راستی‌آزمایی: {beh_txt}. سوالات: {q_txt}. "
            f"قدم بعد: {action}. اطمینان: {confidence}. {disclaimer}"
        ),
        "ru": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"Наблюдаемо: {obs_txt}. Вывод: {inf_txt}. Неизвестно: {unk_txt}. "
            f"Проверить поведение: {beh_txt}. Вопросы: {q_txt}. "
            f"Далее: {action}. Уверенность: {confidence}. {disclaimer}"
        ),
        "ar": (
            f"{headline}.{concern_bit}{time_bit} {sig_block}. "
            f"ملاحظ: {obs_txt}. مستنتج: {inf_txt}. غير معروف: {unk_txt}. "
            f"سلوك للتحقق: {beh_txt}. أسئلة: {q_txt}. "
            f"التالي: {action}. الثقة: {confidence}. {disclaimer}"
        ),
    }[lang]

    strategic = {
        "en": (
            f"Mercury/Moon/Mars/Saturn/Jupiter/Venus roles for {rel_l}: {roles_txt}. "
            f"Separate observed, inferred, and unknown. Questions: {q_txt}."
        ),
        "fa": (
            f"نقش عطارد/ماه/مریخ/زحل/مشتری/زهره برای {rel_l}: {roles_txt}. "
            f"مشاهده، استنباط و نامشخص را جدا کن. سوالات: {q_txt}."
        ),
        "ru": (
            f"Роли Меркурий/Луна/Марс/Сатурн/Юпитер/Венера для «{rel_l}»: {roles_txt}. "
            f"Отделяйте наблюдаемое, вывод и неизвестное. Вопросы: {q_txt}."
        ),
        "ar": (
            f"أدوار عطارد/القمر/المريخ/زحل/المشتري/الزهرة لـ {rel_l}: {roles_txt}. "
            f"افصلي الملاحظ والمستنتج وغير المعروف. الأسئلة: {q_txt}."
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
