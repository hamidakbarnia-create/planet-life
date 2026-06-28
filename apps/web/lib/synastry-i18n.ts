import type { AppLang } from './app-settings';
import type { SynastryAspect } from './synergy';

// Turns raw synastry aspects (e.g. "your Saturn conjunction their Moon, orb 0.1°")
// into human, psychological language plus a strength rating — so a non-expert
// reads the relationship at a glance instead of decoding astro jargon.

// 0 = exact/critical, larger = weaker. Stars out of 3.
export function orbStars(orb: number): number {
  if (orb <= 1) return 3;
  if (orb <= 3) return 2;
  return 1;
}

export function strengthLabel(lang: AppLang, orb: number): string {
  const map: Record<AppLang, [string, string, string]> = {
    // [weak, strong, critical]
    en: ['subtle', 'strong', 'pivotal'],
    ru: ['слабое', 'сильное', 'ключевое'],
    fa: ['ملایم', 'قوی', 'سرنوشت‌ساز'],
    ar: ['خفيف', 'قوي', 'مصيري'],
  };
  const s = map[lang] ?? map.en;
  if (orb <= 1) return s[2];
  if (orb <= 3) return s[1];
  return s[0];
}

// Short domain noun for each planet, used to compose a sensory label.
const DOMAIN: Record<AppLang, Record<string, string>> = {
  en: {
    sun: 'identity', moon: 'emotions', mercury: 'communication', venus: 'affection',
    mars: 'drive', jupiter: 'growth', saturn: 'commitment',
  },
  ru: {
    sun: 'личности', moon: 'эмоций', mercury: 'общения', venus: 'симпатии',
    mars: 'влечения', jupiter: 'роста', saturn: 'обязательств',
  },
  fa: {
    sun: 'هویت', moon: 'احساسات', mercury: 'گفتگو', venus: 'مهر و جذابیت',
    mars: 'انرژی و کشش', jupiter: 'رشد و خوش‌بینی', saturn: 'تعهد و ثبات',
  },
  ar: {
    sun: 'الهوية', moon: 'المشاعر', mercury: 'التواصل', venus: 'المودّة',
    mars: 'الدافع', jupiter: 'النمو', saturn: 'الالتزام',
  },
};

const HARMONY_WORD: Record<AppLang, string> = {
  en: 'Harmony in', ru: 'Гармония в', fa: 'هماهنگی در', ar: 'انسجام في',
};
const TENSION_WORD: Record<AppLang, string> = {
  en: 'Friction in', ru: 'Напряжение в', fa: 'چالش در', ar: 'توتر في',
};
const AND_WORD: Record<AppLang, string> = { en: 'and', ru: 'и', fa: 'و', ar: 'و' };
const SHARED_WORD: Record<AppLang, string> = {
  en: 'shared', ru: 'общих', fa: 'مشترک', ar: 'مشتركة',
};

const HARMONY_ASPECTS = new Set(['trine', 'sextile', 'conjunction']);

// A few marquee pairs get hand-tuned wording (per the product's psychological
// tone). Key is the alphabetically-sorted planet pair. Everything else falls
// back to the composed "{quality} {domainA} {and} {domainB}" label.
const PAIR_OVERRIDE: Record<string, Record<'harmony' | 'tension', Record<AppLang, string>>> = {
  'moon|sun': {
    harmony: {
      en: 'Deep resonance of identity and feeling',
      ru: 'Глубокий резонанс личности и чувств',
      fa: 'هم‌زبانی عمیق هویت و احساس',
      ar: 'انسجام عميق بين الهوية والمشاعر',
    },
    tension: {
      en: 'Logic vs. feeling needs balancing',
      ru: 'Логика и чувства требуют баланса',
      fa: 'نیاز به توازن میان منطق و احساس',
      ar: 'حاجة لموازنة العقل والمشاعر',
    },
  },
  'moon|venus': {
    harmony: {
      en: 'Natural warmth and easy closeness',
      ru: 'Естественная теплота и лёгкая близость',
      fa: 'صمیمیت و مهر طبیعی',
      ar: 'دفء طبيعي وقرب سهل',
    },
    tension: {
      en: 'Different ways of showing care',
      ru: 'Разные способы проявлять заботу',
      fa: 'تفاوت در شیوهٔ ابراز محبت',
      ar: 'اختلاف في التعبير عن الاهتمام',
    },
  },
  'mars|venus': {
    harmony: {
      en: 'Magnetic attraction and chemistry',
      ru: 'Магнетическое притяжение и химия',
      fa: 'کشش عاطفی و جذابیت',
      ar: 'انجذاب وكيمياء',
    },
    tension: {
      en: 'Passion that can turn to friction',
      ru: 'Страсть, способная перейти в трение',
      fa: 'اشتیاقی که می‌تواند به تنش بدل شود',
      ar: 'شغف قد يتحول إلى توتر',
    },
  },
  'moon|saturn': {
    harmony: {
      en: 'Stability, loyalty and a sense of home',
      ru: 'Стабильность, верность и чувство дома',
      fa: 'ثبات، وفاداری و حسِ خانه',
      ar: 'استقرار وولاء وإحساس بالبيت',
    },
    tension: {
      en: 'Can feel heavy or controlling — keep warmth alive',
      ru: 'Может ощущаться тяжело или контролирующе — берегите теплоту',
      fa: 'ممکن است حس سنگینی یا کنترل بدهد — گرمی رابطه را حفظ کنید',
      ar: 'قد يبدو ثقيلاً أو مُتحكِّماً — حافظوا على الدفء',
    },
  },
  'saturn|sun': {
    harmony: {
      en: 'Lasting respect and mutual responsibility',
      ru: 'Прочное уважение и взаимная ответственность',
      fa: 'احترام پایدار و مسئولیت‌پذیری متقابل',
      ar: 'احترام دائم ومسؤولية متبادلة',
    },
    tension: {
      en: 'Authority and freedom need negotiating',
      ru: 'Власть и свобода требуют согласования',
      fa: 'نیاز به مذاکره بر سر قدرت و آزادی',
      ar: 'حاجة للتفاوض على السلطة والحرية',
    },
  },
};

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

export function friendlyAspectLabel(lang: AppLang, row: SynastryAspect): string {
  const isHarmony = HARMONY_ASPECTS.has(row.aspect);
  const tone: 'harmony' | 'tension' = isHarmony ? 'harmony' : 'tension';
  const override = PAIR_OVERRIDE[pairKey(row.myPlanet, row.theirPlanet)];
  if (override) return override[tone][lang] ?? override[tone].en;

  const dom = DOMAIN[lang] ?? DOMAIN.en;
  const a = dom[row.myPlanet] ?? row.myPlanet;
  const b = dom[row.theirPlanet] ?? row.theirPlanet;
  const lead = isHarmony ? HARMONY_WORD[lang] : TENSION_WORD[lang];
  if (a === b) return `${lead} ${a} ${SHARED_WORD[lang]}`;
  return `${lead} ${a} ${AND_WORD[lang]} ${b}`;
}

// ---- Life-area breakdown of the overall compatibility score --------------
// Splits the single 0–100 number into a few felt domains so the user sees how
// the score is composed. Deterministic from the same aspects.

export interface LifeAreaScore {
  key: 'emotion' | 'stability' | 'communication';
  label: string;
  pct: number;
}

const AREA_PLANETS: Record<LifeAreaScore['key'], Set<string>> = {
  emotion: new Set(['sun', 'moon', 'venus']),
  stability: new Set(['saturn', 'sun', 'jupiter']),
  communication: new Set(['mercury', 'moon']),
};

const AREA_LABELS: Record<AppLang, Record<LifeAreaScore['key'], string>> = {
  en: { emotion: 'Affection & intimacy', stability: 'Stability & commitment', communication: 'Everyday understanding' },
  ru: { emotion: 'Чувства и близость', stability: 'Стабильность и обязательства', communication: 'Повседневное понимание' },
  fa: { emotion: 'عاطفه و صمیمیت', stability: 'ثبات و تعهد بلندمدت', communication: 'تفاهم روزمره و کلامی' },
  ar: { emotion: 'المودّة والحميمية', stability: 'الاستقرار والالتزام', communication: 'التفاهم اليومي' },
};

function orbStrength(orb: number, max = 8): number {
  return Math.max(0, 1 - orb / max);
}

export function computeLifeAreas(
  lang: AppLang,
  harmony: SynastryAspect[],
  tension: SynastryAspect[]
): LifeAreaScore[] {
  const labels = AREA_LABELS[lang] ?? AREA_LABELS.en;
  return (Object.keys(AREA_PLANETS) as LifeAreaScore['key'][]).map((key) => {
    const set = AREA_PLANETS[key];
    let score = 50;
    for (const h of harmony) {
      if (set.has(h.myPlanet) || set.has(h.theirPlanet)) score += 11 * orbStrength(h.orb);
    }
    for (const t of tension) {
      if (set.has(t.myPlanet) || set.has(t.theirPlanet)) score -= 12 * orbStrength(t.orb);
    }
    return { key, label: labels[key], pct: Math.max(0, Math.min(100, Math.round(score))) };
  });
}

// ---- Layer 4: deep analysis (hybrid) ---------------------------------------
// Core pairs get hand-written three-layer copy. Everything else gets a short
// modular keyword line — never a robotic paragraph.

export interface DeepAnalysis {
  story: string;
  strength: string;
  care: string;
}

export interface ModularLine {
  theme: string;
  impact: string;
  tip: string;
}

export type AspectInsight =
  | { kind: 'deep'; analysis: DeepAnalysis }
  | { kind: 'modular'; line: ModularLine };

const HARMONY_ASPECT_SET = new Set(['trine', 'sextile', 'conjunction']);

function isHarmony(aspect: string): boolean {
  return HARMONY_ASPECT_SET.has(aspect);
}

function aspectTone(aspect: string): 'harmony' | 'tension' {
  return isHarmony(aspect) ? 'harmony' : 'tension';
}

// Core pairs that deserve full three-layer copy (luminaries, Venus/Mars, Saturn).
const CORE_PAIRS = new Set([
  'moon|sun',
  'mars|venus',
  'moon|venus',
  'mars|moon',
  'moon|saturn',
  'saturn|sun',
]);

export function isCorePair(myPlanet: string, theirPlanet: string): boolean {
  return CORE_PAIRS.has(pairKey(myPlanet, theirPlanet));
}

// Hand-written three-layer analysis for core pairs × tone × language.
const DEEP_COPY: Record<
  string,
  Record<'harmony' | 'tension', Record<AppLang, DeepAnalysis>>
> = {
  'moon|sun': {
    harmony: {
      en: {
        story:
          'When you are together, identity and feeling speak the same language. One person lights the room; the other names what everyone is feeling.',
        strength: 'Mutual recognition — you feel seen without having to explain yourself.',
        care: 'Keep praising what is real, not only what is impressive.',
      },
      ru: {
        story:
          'Рядом друг с другом личность и чувства говорят на одном языке. Один освещает пространство, другой называет то, что все чувствуют.',
        strength: 'Взаимное узнавание — вас видят без долгих объяснений.',
        care: 'Хвалите настоящее, а не только впечатляющее.',
      },
      fa: {
        story:
          'در حضور هم، هویت و احساس هم‌زبان می‌شوند. یکی فضا را روشن می‌کند؛ دیگری آنچه همه حس می‌کنند را نام می‌برد.',
        strength: 'شناخت متقابل — بدون توضیح زیاد، دیده می‌شوید.',
        care: 'آنچه واقعی است را بیشتر از آنچه چشمگیر است ستایش کنید.',
      },
      ar: {
        story:
          'معاً، الهوية والمشاعر تتحدثان لغة واحدة. أحدهما يضيء المكان، والآخر يسمّي ما يشعر به الجميع.',
        strength: 'تعرّف متبادل — تُرى دون أن تشرح كثيراً.',
        care: 'امدحوا ما هو حقيقي، لا ما هو مبهر فقط.',
      },
    },
    tension: {
      en: {
        story:
          'One of you leads with logic and direction; the other leads with mood and memory. The gap is felt when needs are named too late.',
        strength: 'You can balance head and heart if you slow down before reacting.',
        care: 'Do not dismiss feelings as “dramatic,” or logic as “cold.”',
      },
      ru: {
        story:
          'Один ведёт логикой и направлением, другой — настроением и памятью. Разрыв ощущается, когда потребности называют слишком поздно.',
        strength: 'Голова и сердце уравновешиваются, если замедлиться перед реакцией.',
        care: 'Не обесценивайте чувства как «драму» или логику как «холод».',
      },
      fa: {
        story:
          'یکی با منطق و جهت جلو می‌رود؛ دیگری با خلق و خاطره. فاصله وقتی حس می‌شود که نیازها دیر نام برده شوند.',
        strength: 'اگر قبل از واکنش مکث کنید، تعادل عقل و احساس ممکن است.',
        care: 'احساس را «درام» و منطق را «سردی» نخوانید.',
      },
      ar: {
        story:
          'أحدهما يقود بالمنطق والاتجاه، والآخر بالمزاج والذاكرة. الفجوة تُحس عندما تُسمّى الحاجات متأخراً.',
        strength: 'يمكن موازنة العقل والقلب إذا أبطأتم قبل ردّ الفعل.',
        care: 'لا تقللوا من المشاعر كـ«دراما» ولا من المنطق كـ«برود».',
      },
    },
  },
  'moon|venus': {
    harmony: {
      en: {
        story:
          'Affection lands easily here — small gestures of care register as love, not performance.',
        strength: 'Emotional safety and warmth build quickly when you are present.',
        care: 'Do not take tenderness for granted once routine sets in.',
      },
      ru: {
        story:
          'Нежность здесь доходит легко — мелкие жесты заботы читаются как любовь, а не как игра.',
        strength: 'Эмоциональная безопасность и тепло растут, когда вы рядом.',
        care: 'Не принимайте нежность как должное, когда наступает рутина.',
      },
      fa: {
        story:
          'مهر اینجا راحت می‌رسد — حرکات کوچک محبت، عشق واقعی می‌خواند نه نمایش.',
        strength: 'امنیت عاطفی و گرما وقتی حضور دارید، زود ساخته می‌شود.',
        care: 'با روتین شدن، نرمی را مسلم نگیرید.',
      },
      ar: {
        story:
          'المودّة تصل بسهولة هنا — اللمسات الصغيرة تُقرأ حباً لا تمثيلاً.',
        strength: 'الأمان العاطفي والدفء ينموان بسرعة عند حضوركم.',
        care: 'لا تتّخذوا الرقة أمراً مفروغاً منه مع الروتين.',
      },
    },
    tension: {
      en: {
        story:
          'You may love in different currencies — one through comfort, the other through beauty or praise.',
        strength: 'Naming your love languages early prevents quiet resentment.',
        care: 'Avoid keeping score of who showed care “correctly.”',
      },
      ru: {
        story:
          'Вы можете любить разными «валютами» — один через уют, другой через красоту или признание.',
        strength: 'Если рано назвать языки любви, тихая обида не накопится.',
        care: 'Не ведите счёт, кто проявил заботу «правильно».',
      },
      fa: {
        story:
          'شاید هر کس عشق را با واحد دیگری بدهد — یکی با آرامش، دیگری با زیبایی یا ستایش.',
        strength: 'اگر زود زبان محبت را نام ببرید، کینهٔ خاموش جمع نمی‌شود.',
        care: 'حساب نکنید چه کسی «درست» محبت کرد.',
      },
      ar: {
        story:
          'قد تحبّون بعملات مختلفة — أحدهما بالراحة، والآخر بالجمال أو الثناء.',
        strength: 'تسمية لغات الحب مبكراً يمنع مرارة صامتة.',
        care: 'لا تحاسبوا على من أظهر الاهتمام «بشكل صحيح».',
      },
    },
  },
  'mars|venus': {
    harmony: {
      en: {
        story:
          'Desire and charm meet without awkwardness — attraction feels mutual, not one-sided.',
        strength: 'Chemistry that can stay playful if you keep curiosity alive.',
        care: 'Channel heat into shared projects, not only into winning arguments.',
      },
      ru: {
        story:
          'Желание и обаяние встречаются без неловкости — притяжение ощущается взаимным.',
        strength: 'Химия остаётся игривой, если сохранять любопытство.',
        care: 'Направляйте жар в общие дела, а не только в споры.',
      },
      fa: {
        story:
          'کشش و جذابیت بدون دست‌پاچگی می‌آیند — جذب متقابل حس می‌شود نه یک‌طرفه.',
        strength: 'شیمی که با کنجکاوی می‌تواند بازیگوش بماند.',
        care: 'گرما را به پروژه‌های مشترک ببرید، نه فقط به برد جدال.',
      },
      ar: {
        story:
          'الرغبة والجاذبية تلتقيان بلا إحراج — الانجذاب يبدو متبادلاً.',
        strength: 'كيمياء تبقى مرحة إذا حافظتم على الفضول.',
        care: 'وجّهوا الحرارة لمشاريع مشتركة لا للجدال فقط.',
      },
    },
    tension: {
      en: {
        story:
          'Spark can flip to friction fast — what excites one person may overwhelm the other.',
        strength: 'Honest pacing turns passion into fuel instead of fights.',
        care: 'Pause before sarcasm or sharp comebacks when tension rises.',
      },
      ru: {
        story:
          'Искра быстро становится трением — то, что возбуждает одного, может перегружать другого.',
        strength: 'Честный темп превращает страсть в топливо, а не в ссоры.',
        care: 'Пауза перед сарказмом, когда напряжение растёт.',
      },
      fa: {
        story:
          'جرقه سریع به اصطکاک بدل می‌شود — آنچه یکی را برمی‌انگیزد شاید دیگری را خسته کند.',
        strength: 'سرعت صادقانه، اشتیاق را سوخت می‌کند نه دعوا.',
        care: 'وقتی تنش بالا می‌رود، قبل از کنایه مکث کنید.',
      },
      ar: {
        story:
          'الشرارة قد تتحول سريعاً إلى احتكاك — ما يثير أحدهما قد يُرهق الآخر.',
        strength: 'إيقاع صادق يحوّل الشغف وقوداً لا معارك.',
        care: 'توقّفوا قبل السخرية عندما يعلو التوتر.',
      },
    },
  },
  'mars|moon': {
    harmony: {
      en: {
        story:
          'One person protects the mood; the other moves things forward — together you feel both safe and alive.',
        strength: 'Gentle initiative — action that respects feelings.',
        care: 'Check in emotionally before pushing for a decision.',
      },
      ru: {
        story:
          'Один бережёт настроение, другой двигает дела — вместе вы чувствуете и безопасность, и живость.',
        strength: 'Мягкая инициатива — действие с уважением к чувствам.',
        care: 'Сначала эмоционально сверьтесь, потом толкайте к решению.',
      },
      fa: {
        story:
          'یکی خلق را نگه می‌دارد؛ دیگری کار را جلو می‌برد — با هم هم امنیت دارید هم زنده‌گی.',
        strength: 'آغازگری ملایم — عملی که به احساس احترام می‌گذارد.',
        care: 'قبل از فشار برای تصمیم، احساسی هماهنگ شوید.',
      },
      ar: {
        story:
          'أحدهما يحمي المزاج، والآخر يدفع الأمور — معاً تشعرون بالأمان والحيوية.',
        strength: 'مبادرة لطيفة — فعل يحترم المشاعر.',
        care: 'تأكّدوا عاطفياً قبل الضغط نحو قرار.',
      },
    },
    tension: {
      en: {
        story:
          'Mood and impulse can collide — hurt feelings may trigger a sharp reply.',
        strength: 'Naming the feeling before the fix prevents escalation.',
        care: 'Do not use silence as punishment after a heated moment.',
      },
      ru: {
        story:
          'Настроение и импульс сталкиваются — обида может вызвать резкий ответ.',
        strength: 'Назовите чувство до решения — так не будет эскалации.',
        care: 'Не используйте молчание как наказание после вспышки.',
      },
      fa: {
        story:
          'خلق و تکانه می‌توانند برخورد کنند — آسیب‌دیدگی شاید پاسخ تند بدهد.',
        strength: 'قبل از راه‌حل، احساس را نام ببرید تا تشدید نشود.',
        care: 'بعد از لحظهٔ داغ، سکوت را مجازات نکنید.',
      },
      ar: {
        story:
          'المزاج والاندفاع قد يصطدمان — الجرح قد يولّد رداً حاداً.',
        strength: 'سمّوا الشعور قبل الإصلاح لتجنّب التصعيد.',
        care: 'لا تستخدموا الصمت عقاباً بعد لحظة ساخنة.',
      },
    },
  },
  'moon|saturn': {
    harmony: {
      en: {
        story:
          'This bond can feel like coming home — loyalty, structure, and emotional duty align.',
        strength: 'High staying power; you build something that lasts.',
        care: 'Keep rituals warm, not only efficient — Saturn loves order, the Moon needs tenderness.',
      },
      ru: {
        story:
          'Связь ощущается как дом — верность, структура и эмоциональный долг совпадают.',
        strength: 'Высокая устойчивость; вы строите надолго.',
        care: 'Ритуалы пусть будут тёплыми, не только эффективными — Сатурн любит порядок, Луна — нежность.',
      },
      fa: {
        story:
          'این پیوند شبیه برگشتن به خانه است — وفاداری، ساختار و مسئولیت عاطفی هم‌راستا می‌شوند.',
        strength: 'ماندگاری بالا؛ چیزی پایدار می‌سازید.',
        care: 'آیین‌ها گرم بمانند نه فقط منظم — زحل نظم می‌خواهد، ماه نرمی.',
      },
      ar: {
        story:
          'الرابط يشبه العودة للبيت — الولاء والبنية والواجب العاطفي يتوافقان.',
        strength: 'ثبات عالٍ؛ تبنون شيئاً يدوم.',
        care: 'اجعلوا الطقوس دافئة لا فعّالة فقط — زحل يحب النظام والقمر الحنان.',
      },
    },
    tension: {
      en: {
        story:
          'Care can read as control — one person tightens rules when the other needs softness.',
        strength: 'Clear boundaries can still feel loving if explained with patience.',
        care: 'Watch for “I am helping you” masking emotional distance.',
      },
      ru: {
        story:
          'Забота может читаться как контроль — один ужесточает правила, когда другому нужна мягкость.',
        strength: 'Чёткие границы могут ощущаться любовью, если объяснить терпеливо.',
        care: 'Следите, чтобы «я помогаю» не маскировало эмоциональную дистанцию.',
      },
      fa: {
        story:
          'مراقبت شاید کنترل خوانده شود — یکی قوانین را سفت می‌کند وقتی دیگری نرمی می‌خواهد.',
        strength: 'مرزهای روشن اگر با صبر توضیح داده شوند، همچنان محبت‌آمیزند.',
        care: 'مراقب باشید «دارم کمک می‌کنم» فاصلهٔ عاطفی را نپوشاند.',
      },
      ar: {
        story:
          'الرعاية قد تُقرأ سيطرة — أحدهما يشدّ القواعد حين يحتاج الآخر للّين.',
        strength: 'حدود واضحة قد تبدو محبة إن شُرحت بصبر.',
        care: 'احذروا أن «أساعدك» تخفي بُعداً عاطفياً.',
      },
    },
  },
  'saturn|sun': {
    harmony: {
      en: {
        story:
          'Respect runs deep — you take each other seriously and keep promises.',
        strength: 'Mature partnership energy; goals feel shared, not borrowed.',
        care: 'Leave room for joy — duty without play turns heavy.',
      },
      ru: {
        story:
          'Уважение глубокое — вы воспринимаете друг друга всерьёз и держите слово.',
        strength: 'Зрелая энергия союза; цели общие, не заимствованные.',
        care: 'Оставляйте место радости — долг без игры становится тяжёлым.',
      },
      fa: {
        story:
          'احترام عمیق است — یکدیگر را جدی می‌گیرید و به قول می‌مانید.',
        strength: 'انرژی همکاری بالغ؛ اهداف مشترک حس می‌شوند نه قرضی.',
        care: 'جا برای شادی بگذارید — وظیفه بدون بازی سنگین می‌شود.',
      },
      ar: {
        story:
          'الاحترام عميق — تأخذون بعضكم بجدية وتحفظون الوعد.',
        strength: 'طاقة شراكة ناضجة؛ الأهداف مشتركة لا مستعارة.',
        care: 'اتركوا مجالاً للفرح — الواجب بلا لعب يثقل.',
      },
    },
    tension: {
      en: {
        story:
          'Authority meets pride — criticism can land harder than intended.',
        strength: 'Direct feedback works when wrapped in respect, not score-keeping.',
        care: 'Do not confuse stability with silence about what hurts.',
      },
      ru: {
        story:
          'Власть встречает гордость — критика может ранить сильнее, чем задумано.',
        strength: 'Прямая обратная связь работает в уважении, не в подсчёте очков.',
        care: 'Не путайте стабильность с молчанием о боли.',
      },
      fa: {
        story:
          'قدرت با غرور برخورد می‌کند — انتقاد شاید سخت‌تر از قصد اثر بگذارد.',
        strength: 'بازخورد راستگو وقتی در احترام باشد کار می‌کند نه در حساب‌کشی.',
        care: 'ثبات را با سکوت دربارهٔ آسیب اشتباه نگیرید.',
      },
      ar: {
        story:
          'السلطة تلتقي بالكبرياء — النقد قد يؤلم أكثر من المقصود.',
        strength: 'الملاحظات الصريحة تنفع في الاحترام لا في الحساب.',
        care: 'لا تخلطوا الاستقرار بصمت عن الألم.',
      },
    },
  },
};

// Modular keyword bank for non-core aspects: theme ✦ impact ✦ tip.
const MOD_THEME: Record<AppLang, Record<string, string>> = {
  en: {
    sun: 'Shared purpose', moon: 'Emotional rhythm', mercury: 'Daily talk',
    venus: 'Affection style', mars: 'Drive & spark', jupiter: 'Shared growth', saturn: 'Structure & duty',
  },
  ru: {
    sun: 'Общая цель', moon: 'Эмоциональный ритм', mercury: 'Бытовое общение',
    venus: 'Стиль нежности', mars: 'Импульс и искра', jupiter: 'Совместный рост', saturn: 'Структура и долг',
  },
  fa: {
    sun: 'هدف مشترک', moon: 'ریتم احساسی', mercury: 'گفتگوی روزمره',
    venus: 'سبک محبت', mars: 'انرژی و جرقه', jupiter: 'رشد مشترک', saturn: 'ساختار و مسئولیت',
  },
  ar: {
    sun: 'هدف مشترك', moon: 'إيقاع عاطفي', mercury: 'حديث يومي',
    venus: 'أسلوب المودّة', mars: 'دافع وشرارة', jupiter: 'نمو مشترك', saturn: 'بنية وواجب',
  },
};

const MOD_IMPACT_POS: Record<AppLang, string[]> = {
  en: ['Easy synergy', 'Natural fit', 'Supportive flow', 'Gentle boost'],
  ru: ['Лёгкая синергия', 'Естественное совпадение', 'Поддерживающий поток', 'Мягкий плюс'],
  fa: ['هم‌افزایی آسان', 'تطابق طبیعی', 'جریان حمایتی', 'تقویت ملایم'],
  ar: ['تآزر سهل', 'انسجام طبيعي', 'تدفق داعم', 'دفعة لطيفة'],
};

const MOD_IMPACT_NEG: Record<AppLang, string[]> = {
  en: ['Friction to navigate', 'Different tempo', 'Needs patience', 'Watch the tone'],
  ru: ['Трение для проработки', 'Разный темп', 'Нужно терпение', 'Следите за тоном'],
  fa: ['اصطکاک قابل هدایت', 'سرعت متفاوت', 'نیاز به صبر', 'مراقب لحن باشید'],
  ar: ['احتكاك يحتاج توجّهاً', 'إيقاع مختلف', 'يحتاج صبراً', 'راقبوا النبرة'],
};

const MOD_TIP_POS: Record<AppLang, string[]> = {
  en: [
    'Celebrate small wins together.',
    'Keep one weekly ritual you both enjoy.',
    'Say aloud what you appreciate.',
    'Plan something light and fun soon.',
  ],
  ru: [
    'Отмечайте маленькие победы вместе.',
    'Оставьте один еженедельный ритуал на двоих.',
    'Говорите вслух, за что цените.',
    'Запланируйте что-то лёгкое и весёлое.',
  ],
  fa: [
    'پیروزی‌های کوچک را با هم جشن بگیرید.',
    'یک آیین هفتگی مشترک نگه دارید.',
    'قدردانی را با صدا بگویید.',
    'چیز سبک و شادی‌بخش برنامه‌ریزی کنید.',
  ],
  ar: [
    'احتفلوا بالانتصارات الصغيرة معاً.',
    'احتفظوا بطقس أسبوعي مشترك.',
    'عبّروا عن التقدير بصوت عالٍ.',
    'خطّطوا لشيء خفيف وممتع قريباً.',
  ],
};

const MOD_TIP_NEG: Record<AppLang, string[]> = {
  en: [
    'Pause before replying when stung.',
    'Name the need, not only the complaint.',
    'Take a walk before the hard talk.',
    'Agree on one repair gesture after tension.',
  ],
  ru: [
    'Пауза перед ответом, когда задело.',
    'Назовите потребность, не только жалобу.',
    'Прогулка перед трудным разговором.',
    'Один жест примирения после напряжения.',
  ],
  fa: [
    'وقتی آزرده شدید، قبل از پاسخ مکث کنید.',
    'نیاز را بگویید نه فقط شکایت را.',
    'قبل از گفتگوی سخت پیاده‌روی کنید.',
    'بعد از تنش یک حرکت آشتی توافق کنید.',
  ],
  ar: [
    'توقّفوا قبل الرد عند الانزعاج.',
    'سمّوا الحاجة لا الشكوى فقط.',
    'امشوا قبل الحديث الصعب.',
    'اتفقوا على إيماءة إصلاح بعد التوتر.',
  ],
};

function pickModular<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

function modularTheme(lang: AppLang, row: SynastryAspect): string {
  const themes = MOD_THEME[lang] ?? MOD_THEME.en;
  const a = themes[row.myPlanet] ?? row.myPlanet;
  const b = themes[row.theirPlanet] ?? row.theirPlanet;
  if (a === b) return a;
  const and = AND_WORD[lang] ?? 'and';
  return `${a} ${and} ${b}`;
}

export function buildModularLine(lang: AppLang, row: SynastryAspect): ModularLine {
  const harmonyTone = isHarmony(row.aspect);
  const seed = `${row.myPlanet}|${row.theirPlanet}|${row.aspect}`;
  return {
    theme: modularTheme(lang, row),
    impact: pickModular(harmonyTone ? MOD_IMPACT_POS[lang] : MOD_IMPACT_NEG[lang], seed),
    tip: pickModular(harmonyTone ? MOD_TIP_POS[lang] : MOD_TIP_NEG[lang], seed + '|tip'),
  };
}

export function formatModularLine(lang: AppLang, line: ModularLine): string {
  const sep = lang === 'fa' || lang === 'ar' ? ' ✦ ' : ' ✦ ';
  return `${line.theme}${sep}${line.impact}${sep}${line.tip}`;
}

export function getAspectInsight(lang: AppLang, row: SynastryAspect): AspectInsight {
  const tone = aspectTone(row.aspect);
  const key = pairKey(row.myPlanet, row.theirPlanet);
  const deep = DEEP_COPY[key]?.[tone]?.[lang] ?? DEEP_COPY[key]?.[tone]?.en;
  if (deep && isCorePair(row.myPlanet, row.theirPlanet)) {
    return { kind: 'deep', analysis: deep };
  }
  return { kind: 'modular', line: buildModularLine(lang, row) };
}

// Rank aspects by influence (tight orb + planet weight). Used to pick the
// top 3 harmony + top tension for featured deep copy on the page.
const PLANET_WEIGHT: Record<string, number> = {
  sun: 10, moon: 10, venus: 9, mars: 8, saturn: 9, jupiter: 6, mercury: 5,
};

const ASPECT_WEIGHT: Record<string, number> = {
  conjunction: 10, opposition: 8, square: 7, trine: 6, sextile: 5,
};

export function aspectInfluence(row: SynastryAspect): number {
  const pw = Math.max(PLANET_WEIGHT[row.myPlanet] ?? 4, PLANET_WEIGHT[row.theirPlanet] ?? 4);
  const aw = ASPECT_WEIGHT[row.aspect] ?? 5;
  const tight = Math.max(0, 1 - row.orb / 8);
  return pw * aw * (0.5 + tight);
}

function aspectRowKey(row: SynastryAspect): string {
  return `${row.myPlanet}|${row.theirPlanet}|${row.aspect}|${row.orb.toFixed(2)}`;
}

export interface FeaturedAspects {
  featured: SynastryAspect[];
  featuredKeys: Set<string>;
  secondary: SynastryAspect[];
}

export function pickFeaturedAspects(
  harmony: SynastryAspect[],
  tension: SynastryAspect[]
): FeaturedAspects {
  const topHarmony = [...harmony].sort((a, b) => aspectInfluence(b) - aspectInfluence(a)).slice(0, 3);
  const topTension = [...tension].sort((a, b) => aspectInfluence(b) - aspectInfluence(a)).slice(0, 1);
  const featured = [...topHarmony, ...topTension];
  const featuredKeys = new Set(featured.map(aspectRowKey));
  const secondary = [...harmony, ...tension]
    .filter((r) => !featuredKeys.has(aspectRowKey(r)))
    .sort((a, b) => aspectInfluence(b) - aspectInfluence(a));
  return { featured, featuredKeys, secondary };
}

export const LAYER_LABELS: Record<AppLang, { story: string; strength: string; care: string; more: string }> = {
  en: { story: 'The story', strength: 'Strength', care: 'Care', more: 'More aspects' },
  ru: { story: 'История связи', strength: 'Сила', care: 'Осторожность', more: 'Остальные аспекты' },
  fa: { story: 'داستان این زاویه', strength: 'نقطه قوت', care: 'مراقبت', more: 'ریز زوایا' },
  ar: { story: 'قصة هذا الجانب', strength: 'نقطة قوة', care: 'انتباه', more: 'جوانب إضافية' },
};
