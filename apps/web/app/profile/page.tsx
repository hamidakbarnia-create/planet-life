'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  NatalChart,
  type ChartPlanet,
  type NatalChartLabels,
} from '@/components/NatalChart';
import { BottomNav, VaultPill } from '@/components/BottomNav';
import { HOME_LANGS } from '@/lib/home-i18n';
import type { AppLang } from '@/lib/app-settings';
import { loadBirthProfile, saveBirthProfile } from '@/lib/birth-profile';

const ZODIAC = [
  { sign: 'Aries', symbol: '♈', dates: 'Mar 21 – Apr 19', stone: 'Diamond', colorName: 'Red', color: '#ef4444', element: 'Fire', planet: 'Mars' },
  { sign: 'Taurus', symbol: '♉', dates: 'Apr 20 – May 20', stone: 'Emerald', colorName: 'Green', color: '#22c55e', element: 'Earth', planet: 'Venus' },
  { sign: 'Gemini', symbol: '♊', dates: 'May 21 – Jun 20', stone: 'Agate', colorName: 'Yellow', color: '#eab308', element: 'Air', planet: 'Mercury' },
  { sign: 'Cancer', symbol: '♋', dates: 'Jun 21 – Jul 22', stone: 'Pearl', colorName: 'Silver Blue', color: '#a5f3fc', element: 'Water', planet: 'Moon' },
  { sign: 'Leo', symbol: '♌', dates: 'Jul 23 – Aug 22', stone: 'Ruby', colorName: 'Gold Orange', color: '#f97316', element: 'Fire', planet: 'Sun' },
  { sign: 'Virgo', symbol: '♍', dates: 'Aug 23 – Sep 22', stone: 'Sapphire', colorName: 'Indigo', color: '#6366f1', element: 'Earth', planet: 'Mercury' },
  { sign: 'Libra', symbol: '♎', dates: 'Sep 23 – Oct 22', stone: 'Opal', colorName: 'Pink', color: '#ec4899', element: 'Air', planet: 'Venus' },
  { sign: 'Scorpio', symbol: '♏', dates: 'Oct 23 – Nov 21', stone: 'Topaz', colorName: 'Dark Red', color: '#dc2626', element: 'Water', planet: 'Pluto' },
  { sign: 'Sagittarius', symbol: '♐', dates: 'Nov 22 – Dec 21', stone: 'Turquoise', colorName: 'Purple', color: '#8b5cf6', element: 'Fire', planet: 'Jupiter' },
  { sign: 'Capricorn', symbol: '♑', dates: 'Dec 22 – Jan 19', stone: 'Garnet', colorName: 'Dark Gray', color: '#64748b', element: 'Earth', planet: 'Saturn' },
  { sign: 'Aquarius', symbol: '♒', dates: 'Jan 20 – Feb 18', stone: 'Amethyst', colorName: 'Cyan', color: '#06b6d4', element: 'Air', planet: 'Uranus' },
  { sign: 'Pisces', symbol: '♓', dates: 'Feb 19 – Mar 20', stone: 'Aquamarine', colorName: 'Ocean Blue', color: '#0ea5e9', element: 'Water', planet: 'Neptune' },
];

const PLANET_LABELS: Record<string, Record<string, string>> = {
  en: { sun:'Sun', moon:'Moon', mercury:'Mercury', venus:'Venus', mars:'Mars', jupiter:'Jupiter', saturn:'Saturn', uranus:'Uranus', neptune:'Neptune', pluto:'Pluto', north_node:'North Node' },
  ru: { sun:'Солнце', moon:'Луна', mercury:'Меркурий', venus:'Венера', mars:'Марс', jupiter:'Юпитер', saturn:'Сатурн', uranus:'Уран', neptune:'Нептун', pluto:'Плутон', north_node:'Северный узел' },
  fa: { sun:'خورشید', moon:'ماه', mercury:'عطارد', venus:'زهره', mars:'مریخ', jupiter:'مشتری', saturn:'زحل', uranus:'اورانوس', neptune:'نپتون', pluto:'پلوتون', north_node:'گره شمالی' },
  ar: { sun:'الشمس', moon:'القمر', mercury:'عطارد', venus:'الزهرة', mars:'المريخ', jupiter:'المشتري', saturn:'زحل', uranus:'أورانوس', neptune:'نبتون', pluto:'بلوتو', north_node:'العقدة الشمالية' },
};

const ASPECT_LABELS: Record<string, Record<string, string>> = {
  en: { trine:'Trine', square:'Square', sextile:'Sextile', opposition:'Opposition', conjunction:'Conjunction' },
  ru: { trine:'Трин', square:'Квадрат', sextile:'Секстиль', opposition:'Оппозиция', conjunction:'Соединение' },
  fa: { trine:'تثلیث', square:'تربیع', sextile:'سدسی', opposition:'مقابله', conjunction:'اقتران' },
  ar: { trine:'تثليث', square:'تربيع', sextile:'تسديس', opposition:'مقابلة', conjunction:'اقتران' },
};

const LANGS = {
  en: { name:'EN', dir:'ltr', tagline:'Astrological Intelligence', yourData:'Your Birth Data', nameLabel:'Name', bdate:'Birth Date', btime:'Birth Time', city:'Birth City', generate:'Generate Chart', save:'Save Profile', saved:'Saved ✓', loading:'Loading...', natalChart:'Natal Chart', element:'Element', planet:'Ruling Planet', stone:'Lucky Stone', color:'Power Color', lifePath:'Life Path Number', dashboard:'Dashboard', calendar:'Calendar', people:'People', profile:'Profile', placeholder:'Type a city name...', searching:'Searching...', noResults:'No cities found', chartEmpty:'Click Generate Chart', elementsTitle:'Elemental balance', strengthsTitle:'Your chart strengths', elFire:'Fire', elEarth:'Earth', elAir:'Air', elWater:'Water' },
  ru: { name:'RU', dir:'ltr', tagline:'Астрологический анализ', yourData:'Ваши данные рождения', nameLabel:'Имя', bdate:'Дата рождения', btime:'Время рождения', city:'Город рождения', generate:'Создать карту', save:'Сохранить профиль', saved:'Сохранено ✓', loading:'Загрузка...', natalChart:'Натальная карта', element:'Стихия', planet:'Управляющая планета', stone:'Счастливый камень', color:'Цвет силы', lifePath:'Число жизненного пути', dashboard:'Панель', calendar:'Календарь', people:'Люди', profile:'Профиль', placeholder:'Введите город...', searching:'Поиск...', noResults:'Города не найдены', chartEmpty:'Нажмите «Создать карту»', elementsTitle:'Баланс стихий', strengthsTitle:'Сильные стороны карты', elFire:'Огонь', elEarth:'Земля', elAir:'Воздух', elWater:'Вода' },
  fa: { name:'FA', dir:'rtl', tagline:'هوش نجومی', yourData:'اطلاعات تولد شما', nameLabel:'نام', bdate:'تاریخ تولد', btime:'زمان تولد', city:'شهر تولد', generate:'تولید نقشه', save:'ذخیره پروفایل', saved:'ذخیره شد ✓', loading:'در حال بارگذاری...', natalChart:'نقشه تولدی', element:'عنصر', planet:'سیاره حاکم', stone:'سنگ خوش‌شانسی', color:'رنگ قدرت', lifePath:'عدد مسیر زندگی', dashboard:'داشبورد', calendar:'تقویم', people:'افراد', profile:'پروفایل', placeholder:'نام شهر را بنویسید...', searching:'جستجو...', noResults:'شهری یافت نشد', chartEmpty:'روی «تولید نقشه» کلیک کنید', elementsTitle:'عناصر وجودی', strengthsTitle:'نقاط قوت چارت شما', elFire:'آتش', elEarth:'خاک', elAir:'باد', elWater:'آب' },
  ar: { name:'AR', dir:'rtl', tagline:'الذكاء الفلكي', yourData:'بيانات ميلادك', nameLabel:'الاسم', bdate:'تاريخ الميلاد', btime:'وقت الميلاد', city:'مدينة الميلاد', generate:'إنشاء الخريطة', save:'حفظ الملف', saved:'تم الحفظ ✓', loading:'جاري التحميل...', natalChart:'خريطة الميلاد', element:'العنصر', planet:'الكوكب الحاكم', stone:'حجر الحظ', color:'لون القوة', lifePath:'رقم مسار الحياة', dashboard:'لوحة التحكم', calendar:'التقويم', people:'الأشخاص', profile:'الملف', placeholder:'اكتب اسم مدينة...', searching:'جاري البحث...', noResults:'لا توجد مدن', chartEmpty:'انقر «إنشاء الخريطة»', elementsTitle:'التوازن العنصري', strengthsTitle:'نقاط قوة خريطتك', elFire:'نار', elEarth:'تراب', elAir:'هواء', elWater:'ماء' },
};

const ZODIAC_TRANS: Record<string, Record<string, string>> = {
  ru: { Aries:'Овен', Taurus:'Телец', Gemini:'Близнецы', Cancer:'Рак', Leo:'Лев', Virgo:'Дева', Libra:'Весы', Scorpio:'Скорпион', Sagittarius:'Стрелец', Capricorn:'Козерог', Aquarius:'Водолей', Pisces:'Рыбы', Fire:'Огонь', Earth:'Земля', Air:'Воздух', Water:'Вода', Diamond:'Бриллиант', Emerald:'Изумруд', Agate:'Агат', Pearl:'Жемчуг', Ruby:'Рубин', Sapphire:'Сапфир', Opal:'Опал', Topaz:'Топаз', Turquoise:'Бирюза', Garnet:'Гранат', Amethyst:'Аметист', Aquamarine:'Аквамарин', Red:'Красный', Green:'Зелёный', Yellow:'Жёлтый', 'Silver Blue':'Серебристо-синий', 'Gold Orange':'Золотисто-оранжевый', Indigo:'Индиго', Pink:'Розовый', 'Dark Red':'Тёмно-красный', Purple:'Фиолетовый', 'Dark Gray':'Тёмно-серый', Cyan:'Голубой', 'Ocean Blue':'Морской синий' },
  fa: { Aries:'حمل', Taurus:'ثور', Gemini:'جوزا', Cancer:'سرطان', Leo:'اسد', Virgo:'سنبله', Libra:'میزان', Scorpio:'عقرب', Sagittarius:'قوس', Capricorn:'جدی', Aquarius:'دلو', Pisces:'حوت', Fire:'آتش', Earth:'خاک', Air:'هوا', Water:'آب', Diamond:'الماس', Emerald:'زمرد', Agate:'عقیق', Pearl:'مروارید', Ruby:'یاقوت', Sapphire:'یاقوت کبود', Opal:'اوپال', Topaz:'توپاز', Turquoise:'فیروزه', Garnet:'گارنت', Amethyst:'آمتیست', Aquamarine:'آکوامارین', Red:'قرمز', Green:'سبز', Yellow:'زرد', 'Silver Blue':'آبی نقره‌ای', 'Gold Orange':'نارنجی طلایی', Indigo:'نیلی', Pink:'صورتی', 'Dark Red':'قرمز تیره', Purple:'بنفش', 'Dark Gray':'خاکستری تیره', Cyan:'فیروزه‌ای', 'Ocean Blue':'آبی اقیانوسی' },
  ar: { Aries:'الحمل', Taurus:'الثور', Gemini:'الجوزاء', Cancer:'السرطان', Leo:'الأسد', Virgo:'العذراء', Libra:'الميزان', Scorpio:'العقرب', Sagittarius:'القوس', Capricorn:'الجدي', Aquarius:'الدلو', Pisces:'الحوت', Fire:'نار', Earth:'أرض', Air:'هواء', Water:'ماء', Diamond:'ألماس', Emerald:'زمرد', Agate:'عقيق', Pearl:'لؤلؤ', Ruby:'ياقوت', Sapphire:'ياقوت أزرق', Opal:'أوبال', Topaz:'توباز', Turquoise:'فيروز', Garnet:'جارنت', Amethyst:'أميثيست', Aquamarine:'أكوامارين', Red:'أحمر', Green:'أخضر', Yellow:'أصفر', 'Silver Blue':'أزرق فضي', 'Gold Orange':'برتقالي ذهبي', Indigo:'نيلي', Pink:'وردي', 'Dark Red':'أحمر داكن', Purple:'بنفسجي', 'Dark Gray':'رمادي داكن', Cyan:'سماوي', 'Ocean Blue':'أزرق محيطي' },
};

const LIFE_PATH: Record<number, Record<string, string>> = {
  1: { en:'The Leader — Independent, pioneering, ambitious. Born to lead and innovate.', ru:'Лидер — Независимый, новаторский, амбициозный.', fa:'رهبر — مستقل، پیشگام، جاه‌طلب.', ar:'القائد — مستقل، رائد، طموح.' },
  2: { en:'The Diplomat — Cooperative, sensitive, balanced. A natural peacemaker.', ru:'Дипломат — Кооперативный, чувствительный, сбалансированный.', fa:'دیپلمات — همکار، حساس، متعادل.', ar:'الدبلوماسي — تعاوني، حساس، متوازن.' },
  3: { en:'The Creator — Expressive, joyful, artistic. Communication is your superpower.', ru:'Творец — Выразительный, радостный, артистичный.', fa:'خالق — بیانگر، شاد، هنری.', ar:'المبدع — معبر، مبهج، فني.' },
  4: { en:'The Builder — Practical, disciplined, reliable. You create lasting foundations.', ru:'Строитель — Практичный, дисциплинированный, надёжный.', fa:'سازنده — عملی، منضبط، قابل اعتماد.', ar:'البنّاء — عملي، منضبط، موثوق.' },
  5: { en:'The Explorer — Free-spirited, adventurous, versatile. Change fuels your soul.', ru:'Путешественник — Свободный, предприимчивый, разносторонний.', fa:'کاوشگر — آزاداندیش، ماجراجو، چندوجهی.', ar:'المستكشف — حر الروح، مغامر، متعدد المواهب.' },
  6: { en:'The Nurturer — Caring, responsible, harmonious. You heal and protect.', ru:'Опекун — Заботливый, ответственный, гармоничный.', fa:'پرورش‌دهنده — مراقب، مسئول، هماهنگ.', ar:'الراعي — رعاية، مسؤول، متناسق.' },
  7: { en:'The Seeker — Analytical, intuitive, spiritual. You seek deeper truth.', ru:'Искатель — Аналитический, интуитивный, духовный.', fa:'جستجوگر — تحلیلگر، شهودی، معنوی.', ar:'الباحث — تحليلي، حدسي، روحاني.' },
  8: { en:'The Achiever — Powerful, ambitious, material mastery. Built for success.', ru:'Достигатель — Мощный, амбициозный, материальное мастерство.', fa:'دستاوردگر — قدرتمند، جاه‌طلب، تسلط مادی.', ar:'المنجز — قوي، طموح، إتقان مادي.' },
  9: { en:'The Humanitarian — Compassionate, wise, universal. You serve the greater good.', ru:'Гуманист — Сострадательный, мудрый, универсальный.', fa:'بشردوست — دلسوز، حکیم، جهانی.', ar:'الإنساني — رحيم، حكيم، عالمي.' },
  11: { en:'Master Number 11 — Highly intuitive visionary. Spiritual illuminator.', ru:'Мастер-число 11 — Высокоинтуитивный провидец.', fa:'عدد استاد ۱۱ — بینش‌گر بسیار شهودی.', ar:'رقم الماستر 11 — رؤيوي بديهي للغاية.' },
  22: { en:'Master Number 22 — The Master Builder. Turns dreams into reality.', ru:'Мастер-число 22 — Великий Строитель.', fa:'عدد استاد ۲۲ — سازنده بزرگ.', ar:'رقم الماستر 22 — البنّاء العظيم.' },
  33: { en:'Master Number 33 — The Master Teacher. Pure love and healing.', ru:'Мастер-число 33 — Великий Учитель.', fa:'عدد استاد ۳۳ — معلم بزرگ.', ar:'رقم الماستر 33 — المعلم العظيم.' },
};

function getZodiac(d: string) {
  if (!d) return null;
  const dt = new Date(d); const m = dt.getMonth()+1; const day = dt.getDate();
  if((m===3&&day>=21)||(m===4&&day<=19))return ZODIAC[0];
  if((m===4&&day>=20)||(m===5&&day<=20))return ZODIAC[1];
  if((m===5&&day>=21)||(m===6&&day<=20))return ZODIAC[2];
  if((m===6&&day>=21)||(m===7&&day<=22))return ZODIAC[3];
  if((m===7&&day>=23)||(m===8&&day<=22))return ZODIAC[4];
  if((m===8&&day>=23)||(m===9&&day<=22))return ZODIAC[5];
  if((m===9&&day>=23)||(m===10&&day<=22))return ZODIAC[6];
  if((m===10&&day>=23)||(m===11&&day<=21))return ZODIAC[7];
  if((m===11&&day>=22)||(m===12&&day<=21))return ZODIAC[8];
  if((m===12&&day>=22)||(m===1&&day<=19))return ZODIAC[9];
  if((m===1&&day>=20)||(m===2&&day<=18))return ZODIAC[10];
  return ZODIAC[11];
}

function getLifePath(d: string): number {
  if(!d)return 1;
  const digits = d.replace(/-/g,'').split('').map(Number);
  let sum = digits.reduce((a,b)=>a+b,0);
  while(sum>9&&sum!==11&&sum!==22&&sum!==33){
    sum=sum.toString().split('').map(Number).reduce((a,b)=>a+b,0);
  }
  return sum;
}

function tr(text: string, lang: string): string {
  const dict = ZODIAC_TRANS[lang];
  if(!dict)return text;
  return dict[text]||text;
}

function buildSignNames(lang: string): Record<string, string> {
  const out: Record<string, string> = {};
  ZODIAC.forEach((z) => {
    out[z.sign] = tr(z.sign, lang);
  });
  return out;
}

const PROFILE_NAME_KEY = 'planet-life-profile-name';

export default function Profile() {
  const [lang, setLang] = useState<keyof typeof LANGS>('en');
  const [birthDate, setBirthDate] = useState('1990-06-15');
  const [birthTime, setBirthTime] = useState('14:30');
  const [location, setLocation] = useState('New York');
  const [name, setName] = useState('');
  const [chartPlanets, setChartPlanets] = useState<Record<string, ChartPlanet> | null>(null);
  const [ascendant, setAscendant] = useState(0);
  const [chartError, setChartError] = useState('');
  const [loading, setLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('New York');
  const [cities, setCities] = useState<any[]>([]);
  const [showCities, setShowCities] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);
  const toastTimerRef = useRef<number | null>(null);
  const t = LANGS[lang];
  const zodiac = getZodiac(birthDate);
  const lifePath = getLifePath(birthDate);

  useEffect(() => {
    const saved = loadBirthProfile();
    const savedName = localStorage.getItem(PROFILE_NAME_KEY);
    if (saved) {
      setBirthDate(saved.birth_date);
      setBirthTime(saved.birth_time);
      setLocation(saved.location);
      setCitySearch(saved.location);
    }
    if (savedName) setName(savedName);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleSaveProfile = useCallback(() => {
    saveBirthProfile({
      birth_date: birthDate,
      birth_time: birthTime,
      location,
      action_type: 'business_launch',
    });
    localStorage.setItem(PROFILE_NAME_KEY, name);
    setSavedToast(true);
    if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setSavedToast(false);
      toastTimerRef.current = null;
    }, 2000);
  }, [birthDate, birthTime, location, name]);

  const chartLabels: NatalChartLabels = useMemo(
    () => ({
      empty: t.chartEmpty,
      elementsTitle: t.elementsTitle,
      strengthsTitle: t.strengthsTitle,
      elements: {
        fire: t.elFire,
        earth: t.elEarth,
        air: t.elAir,
        water: t.elWater,
      },
      planetNames: PLANET_LABELS[lang] ?? PLANET_LABELS.en,
      signNames: buildSignNames(lang),
      aspectLegend: ASPECT_LABELS[lang] ?? ASPECT_LABELS.en,
      lang,
    }),
    [lang, t]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if(cityRef.current&&!cityRef.current.contains(e.target as Node))setShowCities(false);
    };
    document.addEventListener('mousedown', handler);
    return ()=>document.removeEventListener('mousedown',handler);
  },[]);

  const searchCities = useCallback((q: string) => {
    if(debounceRef.current)clearTimeout(debounceRef.current);
    if(q.length<2){setCities([]);return;}
    setCityLoading(true);
    debounceRef.current = setTimeout(async()=>{
      try{
        const res=await fetch(`/api/cities?q=${encodeURIComponent(q)}`);
        const data=await res.json();
        setCities(data);
      }catch{setCities([]);}
      setCityLoading(false);
    },300);
  },[]);

  const selectCity = (city: any) => {
    setCitySearch(city.short);
    setLocation(city.short);
    setShowCities(false);
  };

  const generateChart = async () => {
    setLoading(true);
    setChartError('');
    setChartPlanets(null);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';
      const res = await fetch(`${apiBase}/api/business/chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth_date: birthDate,
          birth_time: birthTime,
          location: location,
          action_type: 'business_launch',
          target_date: new Date().toISOString().split('T')[0],
        }),
      });
      const data = await res.json();
      if (data.detail) {
        setChartError(typeof data.detail === 'string' ? data.detail : 'Chart request failed');
      } else if (data.planets) {
        const parsed: Record<string, ChartPlanet> = {};
        Object.entries(data.planets).forEach(([name, info]) => {
          const p = info as ChartPlanet;
          parsed[name] = {
            longitude: p.longitude,
            sign: p.sign,
            degree: p.degree,
            house: p.house,
            retrograde: Boolean(p.retrograde),
          };
        });
        setChartPlanets(parsed);
        setAscendant(typeof data.ascendant === 'number' ? data.ascendant : 0);
      }
    } catch {
      setChartError('Cannot connect to API. Start the backend on port 8000.');
    }
    setLoading(false);
  };

  return (
    <div style={{direction:t.dir as any, fontFamily:(lang==='fa'||lang==='ar')?'Vazirmatn,sans-serif':'Inter,sans-serif'}} className="min-h-screen bg-[#070B14] text-white pl-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500&display=swap');
        @import url('https://fonts.googleapis.com/earlyaccess/vazirmatn.css');
        .fc{font-family:'Cinzel',serif}.fi{font-family:'Inter',sans-serif}
        input,select{background:rgba(255,255,255,0.04)!important;border:1px solid rgba(255,255,255,0.08)!important;color:white!important;border-radius:10px;color-scheme:dark}
        input:focus,select:focus{border-color:rgba(251,191,36,0.35)!important;outline:none!important}
        select option{background:#0d1220!important;color:#ffffff!important}
        input[type="time"]::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1) brightness(1.4);opacity:0.9;cursor:pointer}
        .city-row:hover{background:rgba(251,191,36,0.06)}
      `}</style>

      <nav className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="13" stroke="#fbbf24" strokeWidth="0.5" opacity="0.4"/>
            <circle cx="15" cy="15" r="7" stroke="#fbbf24" strokeWidth="0.5" opacity="0.6"/>
            <circle cx="15" cy="15" r="2.5" fill="#fbbf24"/>
          </svg>
          <div className="flex flex-col leading-tight">
            <span className="fc text-lg tracking-widest" style={{color:'#fbbf24'}}>Planet Life</span>
            <span className="fi text-[10px] tracking-wider" style={{color:'rgba(255,255,255,0.35)'}}>{t.tagline}</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <VaultPill label={HOME_LANGS[(lang as AppLang) || 'en']?.nav?.['/vault'] ?? 'Vault'} />
          <span
            className="fi text-[10px] tracking-[0.18em] px-2.5 py-1 rounded-md uppercase"
            title="Subscription tier — paywall ships in Sprint R3"
            style={{
              border: '1px solid rgba(251,191,36,0.18)',
              background: 'rgba(251,191,36,0.04)',
              color: 'rgba(251,191,36,0.65)',
            }}
          >
            Free
          </span>
          <div className="flex gap-1">
            {(Object.keys(LANGS) as Array<keyof typeof LANGS>).map(l=>(
              <button key={l} onClick={()=>setLang(l)}
                className="fi px-2.5 py-1 text-xs rounded-md border transition-all"
                style={lang===l?{borderColor:'rgba(251,191,36,0.5)',color:'#fbbf24',background:'rgba(251,191,36,0.06)'}:{borderColor:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.3)'}}>
                {LANGS[l].name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <div className="rounded-2xl p-4" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="fc text-sm tracking-widest mb-3" style={{color:'#fbbf24'}}>{t.yourData}</div>
            <div className="space-y-2.5">
              <div>
                <label className="fi block text-[11px] mb-1" style={{color:'rgba(255,255,255,0.35)'}}>{t.nameLabel}</label>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="..." className="fi w-full px-3 py-2 text-sm"/>
              </div>
              <div>
                <label className="fi block text-[11px] mb-1" style={{color:'rgba(255,255,255,0.35)'}}>{t.bdate}</label>
                <div className="grid grid-cols-3 gap-1">
  <select value={birthDate.split('-')[2]} onChange={e=>setBirthDate(`${birthDate.split('-')[0]}-${birthDate.split('-')[1]}-${e.target.value}`)} className="fi px-2 py-2 text-sm">
    {Array.from({length:31},(_,i)=>String(i+1).padStart(2,'0')).map(d=><option key={d} value={d}>{d}</option>)}
  </select>
  <select value={birthDate.split('-')[1]} onChange={e=>setBirthDate(`${birthDate.split('-')[0]}-${e.target.value}-${birthDate.split('-')[2]}`)} className="fi px-2 py-2 text-sm">
    {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m,i)=><option key={m} value={m}>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}</option>)}
  </select>
  <select value={birthDate.split('-')[0]} onChange={e=>setBirthDate(`${e.target.value}-${birthDate.split('-')[1]}-${birthDate.split('-')[2]}`)} className="fi px-2 py-2 text-sm">
    {Array.from({length:100},(_,i)=>String(new Date().getFullYear()-i)).map(y=><option key={y} value={y}>{y}</option>)}
  </select>
</div>
              </div>
              <div>
                <label className="fi block text-[11px] mb-1" style={{color:'rgba(255,255,255,0.35)'}}>{t.btime}</label>
                <input type="time" value={birthTime} onChange={e=>setBirthTime(e.target.value)} className="fi w-full px-3 py-2 text-sm"/>
              </div>
              <div ref={cityRef} className="relative">
                <label className="fi block text-[11px] mb-1" style={{color:'rgba(255,255,255,0.35)'}}>{t.city}</label>
                <input type="text" value={citySearch} placeholder={t.placeholder}
                  onChange={e=>{setCitySearch(e.target.value);setLocation(e.target.value);searchCities(e.target.value);setShowCities(true);}}
                  onFocus={()=>citySearch.length>=2&&setShowCities(true)}
                  className="fi w-full px-3 py-2 text-sm"/>
                {showCities&&(cityLoading||cities.length>0)&&(
                  <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl" style={{background:'#0d1220',border:'1px solid rgba(255,255,255,0.1)'}}>
                    {cityLoading&&<div className="fi px-4 py-3 text-xs" style={{color:'rgba(255,255,255,0.3)'}}>{t.searching}</div>}
                    {!cityLoading&&cities.length===0&&<div className="fi px-4 py-3 text-xs" style={{color:'rgba(255,255,255,0.3)'}}>{t.noResults}</div>}
                    {cities.map((city,i)=>(
                      <div key={i} className="city-row px-4 py-2.5 cursor-pointer transition-colors" onMouseDown={()=>selectCity(city)}>
                        <div className="fi text-sm" style={{color:'rgba(255,255,255,0.8)'}}>{city.short}</div>
                        <div className="fi text-[11px] truncate" style={{color:'rgba(255,255,255,0.3)'}}>{city.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="fc w-full py-2.5 rounded-xl text-sm tracking-widest border transition-colors"
                style={{
                  background: 'rgba(34,197,94,0.12)',
                  borderColor: 'rgba(34,197,94,0.45)',
                  color: '#86efac',
                }}
              >
                {t.save}
              </button>
              <button onClick={generateChart} disabled={loading}
                className="fc w-full py-2.5 rounded-xl text-sm tracking-widest disabled:opacity-40"
                style={{background:'linear-gradient(135deg,#d97706,#f59e0b)',color:'#000'}}>
                {loading ? t.loading : t.generate}
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-6 flex flex-col items-center" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="fc text-sm tracking-widest mb-4" style={{color:'#fbbf24'}}>{t.natalChart}</div>
            {loading ? (
                <div className="w-[320px] min-h-[320px] flex items-center justify-center">
                  <div className="fi text-xs" style={{color:'rgba(255,255,255,0.2)'}}>{t.loading}</div>
                </div>
              ) : (
                <NatalChart
                  planets={chartPlanets}
                  ascendant={ascendant}
                  labels={chartLabels}
                  empty={!chartPlanets}
                />
              )}
            {chartError && (
              <p className="fi mt-3 text-xs text-center px-2" style={{color:'#fca5a5'}}>{chartError}</p>
            )}
          </div>

          <div className="space-y-4">
            {zodiac&&(
              <div className="rounded-2xl p-5" style={{background:'rgba(0,0,0,0.4)',border:`1px solid ${zodiac.color}30`}}>
                <div className="flex items-center gap-3 mb-4">
                  <span style={{fontSize:'38px'}}>{zodiac.symbol}</span>
                  <div>
                    <div className="fc text-xl" style={{color:zodiac.color}}>{tr(zodiac.sign,lang)}</div>
                    <div className="fi text-xs" style={{color:'rgba(255,255,255,0.35)'}}>{zodiac.dates}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {label:t.element,value:tr(zodiac.element,lang)},
                    {label:t.planet,value:zodiac.planet},
                    {label:t.stone,value:tr(zodiac.stone,lang)},
                    {label:t.color,value:<span style={{color:zodiac.color}}>◉ {tr(zodiac.colorName,lang)}</span>},
                  ].map(item=>(
                    <div key={item.label} className="rounded-xl p-3" style={{background:'rgba(255,255,255,0.03)'}}>
                      <div className="fi text-[10px] mb-1" style={{color:'rgba(255,255,255,0.3)'}}>{item.label}</div>
                      <div className="fi text-sm" style={{color:'rgba(255,255,255,0.8)'}}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-2xl p-5" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(251,191,36,0.1)'}}>
              <div className="flex items-center gap-3 mb-2">
                <div className="fc text-3xl" style={{color:'#fbbf24'}}>{lifePath}</div>
                <div className="fi text-xs" style={{color:'rgba(255,255,255,0.35)'}}>{t.lifePath}</div>
              </div>
              <div className="fi text-xs leading-relaxed" style={{color:'rgba(255,255,255,0.55)'}}>{LIFE_PATH[lifePath]?.[lang]||LIFE_PATH[lifePath]?.en||''}</div>
            </div>
          </div>

        </div>
      </div>
      {savedToast && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] fi text-base px-6 py-3 rounded-xl shadow-2xl"
          style={{ background: '#16a34a', color: '#ffffff' }}
          role="status"
          aria-live="polite"
        >
          {t.saved}
        </div>
      )}
      <BottomNav labels={HOME_LANGS[(lang as AppLang) || 'en'].nav} />
    </div>
  );
}
