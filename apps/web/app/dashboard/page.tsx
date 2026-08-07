'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  translateAnalysis,
  type AstroLang,
  type AnalysisPayload,
} from '@/lib/astrology-i18n';
import { AnalysisResultBreakdown } from '@/components/AnalysisResultBreakdown';
import { parseAnalyzeResponse } from '@/lib/score-breakdown';
import { BottomNav, VaultPill } from '@/components/BottomNav';
import { BrandLogo } from '@/components/BrandLogo';
import { ActionDisclaimer } from '@/components/disclaimers/ActionDisclaimer';
import { ModuleDisclaimerBanner } from '@/components/disclaimers/ModuleDisclaimerBanner';
import { loadBirthProfile } from '@/lib/birth-profile';
import type { DisclaimerLang } from '@/lib/disclaimers';
import { BRAND_I18N } from '@/lib/brand';
import type { BrandLang } from '@/lib/brand';
import { localeFontFamily } from '@/lib/brand-theme';
import { HOME_LANGS } from '@/lib/home-i18n';
import type { CitySelection } from '@/lib/chart-types';
import { useQueuedEffect } from '@/lib/use-queued-effect';

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'https://api.metioro.com';

const LANGS = {
  en: {
    dir: 'ltr', name: 'EN',
    title: 'METIORO', sub: BRAND_I18N.en.tagline,
    bdate: 'Birth Date', btime: 'Birth Time',
    loc: 'City of Birth', tdate: 'Target Date', action: 'Action',
    analyze: 'Analyze timing', loading: 'Analyzing…',
    business: 'Business', finance: 'Finance', realestate: 'Real Estate',
    rec: 'Guidance', opps: '✦ Favorable signals', risks: '⚡ Watch Out For',
    themes: '◈ Key Themes', timing: '◷ Timing Notes',
    placeholder: 'Type a city name...', noResults: 'No cities found', searching: 'Searching...',
    calendar: 'Calendar',
    people: 'People',
    profile: 'Profile',
    actions_business: { business_launch:'Business Launch', negotiation:'Negotiation', hiring:'Hiring', networking:'Networking', creative_work:'Creative Work', travel:'Travel' },
    actions_finance: { investment:'Investment', finance_transaction:'Finance Transaction', negotiation:'Negotiation', contract_signing:'Contract Signing' },
    actions_re: { real_estate:'Real Estate Purchase', contract_signing:'Contract Signing', investment:'Investment', negotiation:'Negotiation' },
  },
  ru: {
    dir: 'ltr', name: 'RU',
    title: 'METIORO', sub: BRAND_I18N.ru.tagline,
    bdate: 'Дата рождения', btime: 'Время рождения',
    loc: 'Город рождения', tdate: 'Целевая дата', action: 'Действие',
    analyze: 'Анализировать', loading: 'Анализ…',
    business: 'Бизнес', finance: 'Финансы', realestate: 'Недвижимость',
    rec: 'Рекомендация', opps: '✦ Благоприятные сигналы', risks: '⚡ Остерегайтесь',
    themes: '◈ Ключевые темы', timing: '◷ Заметки о времени',
    placeholder: 'Введите город...', noResults: 'Города не найдены', searching: 'Поиск...',
    calendar: 'Календарь',
    people: 'Люди',
    profile: 'Профиль',
    actions_business: { business_launch:'Запуск бизнеса', negotiation:'Переговоры', hiring:'Найм', networking:'Нетворкинг', creative_work:'Творческая работа', travel:'Путешествие' },
    actions_finance: { investment:'Инвестиция', finance_transaction:'Финансовая операция', negotiation:'Переговоры', contract_signing:'Подписание контракта' },
    actions_re: { real_estate:'Покупка недвижимости', contract_signing:'Подписание контракта', investment:'Инвестиция', negotiation:'Переговоры' },
  },
  fa: {
    dir: 'rtl', name: 'FA',
    title: 'METIORO', sub: BRAND_I18N.fa.tagline,
    bdate: 'تاریخ تولد', btime: 'زمان تولد',
    loc: 'شهر تولد', tdate: 'تاریخ هدف', action: 'نوع فعالیت',
    analyze: 'تحلیل زمان‌بندی', loading: 'در حال تحلیل…',
    business: 'کسب‌وکار', finance: 'مالی', realestate: 'مسکن',
    rec: 'راهنمایی', opps: '✦ سیگنال‌های مساعد', risks: '⚡ هشدارها',
    themes: '◈ موضوعات کلیدی', timing: '◷ نکات زمانی',
    placeholder: 'نام شهر را بنویسید...', noResults: 'شهری یافت نشد', searching: 'جستجو...',
    calendar: 'تقویم',
    people: 'افراد',
    profile: 'پروفایل',
    actions_business: { business_launch:'راه‌اندازی کسب‌وکار', negotiation:'مذاکره', hiring:'استخدام', networking:'شبکه‌سازی', creative_work:'کار خلاقانه', travel:'سفر' },
    actions_finance: { investment:'سرمایه‌گذاری', finance_transaction:'تراکنش مالی', negotiation:'مذاکره', contract_signing:'امضای قرارداد' },
    actions_re: { real_estate:'خرید ملک', contract_signing:'امضای قرارداد', investment:'سرمایه‌گذاری', negotiation:'مذاکره' },
  },
  ar: {
    dir: 'rtl', name: 'AR',
    title: 'METIORO', sub: BRAND_I18N.ar.tagline,
    bdate: 'تاريخ الميلاد', btime: 'وقت الميلاد',
    loc: 'مدينة الميلاد', tdate: 'التاريخ المستهدف', action: 'نوع النشاط',
    analyze: 'تحليل التوقيت', loading: 'جاري التحليل…',
    business: 'أعمال', finance: 'مالية', realestate: 'عقارات',
    rec: 'التوجيه', opps: '✦ إشارات مواتية', risks: '⚡ تحذيرات',
    themes: '◈ المواضيع الرئيسية', timing: '◷ ملاحظات التوقيت',
    placeholder: 'اكتب اسم مدينة...', noResults: 'لا توجد مدن', searching: 'جاري البحث...',
    calendar: 'التقويم',
    people: 'الأشخاص',
    profile: 'الملف',
    actions_business: { business_launch:'إطلاق مشروع', negotiation:'مفاوضة', hiring:'توظيف', networking:'شبكات', creative_work:'عمل إبداعي', travel:'سفر' },
    actions_finance: { investment:'استثمار', finance_transaction:'معاملة مالية', negotiation:'مفاوضة', contract_signing:'توقيع عقد' },
    actions_re: { real_estate:'شراء عقار', contract_signing:'توقيع عقد', investment:'استثمار', negotiation:'مفاوضة' },
  },
};

const DOMAIN_ACTIONS: Record<string, string[]> = {
  business: ['business_launch','negotiation','hiring','networking','creative_work','travel'],
  finance: ['investment','finance_transaction','negotiation','contract_signing'],
  'real-estate': ['real_estate','contract_signing','investment','negotiation'],
};

const SCORE_MSG: Record<string, Record<string, string>> = {
  en: {
    high: 'Strong timing support. This is a favorable window — move forward with confidence and clear intent.',
    mid: 'Mixed signals today. Thoughtful preparation and flexibility will serve you well right now.',
    low: 'Patience is advised. Waiting briefly may reveal a stronger window ahead.',
  },
  ru: {
    high: 'Сильная поддержка тайминга. Благоприятное окно — действуйте уверенно и осознанно.',
    mid: 'Сегодня смешанные сигналы. Тщательная подготовка и гибкость сейчас будут полезны.',
    low: 'Рекомендуется терпение. Небольшое ожидание может открыть более сильное окно.',
  },
  fa: {
    high: 'پشتیبانی قوی از زمان‌بندی. پنجره مساعد است — با اطمینان و قصد روشن پیش بروید.',
    mid: 'امروز سیگنال‌های متنوعی وجود دارد. آمادگی دقیق و انعطاف‌پذیری بهترین مسیر است.',
    low: 'صبر توصیه می‌شود. کمی انتظار می‌تواند پنجره قوی‌تری نشان دهد.',
  },
  ar: {
    high: 'دعم قوي للتوقيت. نافذة مواتية — تقدّم بثقة ونية واضحة.',
    mid: 'إشارات متباينة اليوم. الاستعداد الدقيق والمرونة أفضل مسار الآن.',
    low: 'يُنصح بالصبر. انتظار قصير قد يكشف نافذة أقوى.',
  },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const [lang, setLang] = useState<keyof typeof LANGS>('en');
  const [domain, setDomain] = useState('business');
  const [form, setForm] = useState({ birth_date:'1990-06-15', birth_time:'14:30', location:'New York', target_date: new Date().toISOString().split('T')[0], action_type:'business_launch' });
  const [rawResult, setRawResult] = useState<AnalysisPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cities, setCities] = useState<CitySelection[]>([]);
  const [citySearch, setCitySearch] = useState('New York');
  const [showCities, setShowCities] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [moduleBannerDismissed, setModuleBannerDismissed] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = LANGS[lang];

  const result = useMemo(
    () => (rawResult ? translateAnalysis(rawResult, lang as AstroLang) : null),
    [rawResult, lang]
  );

  const [bdY, bdM, bdD] = form.birth_date.split('-');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCities(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useQueuedEffect(() => {
    const saved = loadBirthProfile();
    if (saved) {
      setForm(f => ({
        ...f,
        birth_date: saved.birth_date,
        birth_time: saved.birth_time,
        location: saved.location,
        action_type: saved.action_type || f.action_type,
      }));
      setCitySearch(saved.location);
    }
  }, []);

  const searchCities = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setCities([]); return; }
    setCityLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setCities(data);
      } catch { setCities([]); }
      setCityLoading(false);
    }, 300);
  }, []);

  const selectCity = (city: CitySelection) => {
    setCitySearch(city.short);
    setForm(f => ({ ...f, location: city.short }));
    setShowCities(false);
  };

  const getActions = () => {
    const key = domain === 'business' ? 'actions_business' : domain === 'finance' ? 'actions_finance' : 'actions_re';
    return t[key as keyof typeof t] as Record<string, string>;
  };

  const analyze = async () => {
    setModuleBannerDismissed(false);
    setLoading(true); setError(''); setRawResult(null); setAnimated(false);
    try {
      const res = await fetch(`${API}/api/${domain}/analyze`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.detail) setError(data.detail);
      else {
        const parsed = parseAnalyzeResponse(data);
        setRawResult({
          ...data,
          scoreBreakdown: parsed.breakdown,
          scoreReasoning: parsed.reasoning,
        });
        setTimeout(() => setAnimated(true), 100);
      }
    } catch {
      setError('Cannot connect to API. Make sure the backend is running on port 8000.');
    }
    setLoading(false);
  };

  const getStyle = (s: number) => {
    if (s >= 65) return { color:'#4ade80', border:'#4ade80', bg:'rgba(74,222,128,0.06)' };
    if (s >= 45) return { color:'#fbbf24', border:'#fbbf24', bg:'rgba(251,191,36,0.06)' };
    return { color:'#f87171', border:'#f87171', bg:'rgba(248,113,113,0.06)' };
  };

  const getMsgKey = (s: number) => s >= 65 ? 'high' : s >= 45 ? 'mid' : 'low';

  return (
    <div style={{ direction: t.dir as 'ltr' | 'rtl', fontFamily: localeFontFamily(lang), fontFeatureSettings: '"kern"' }}
        className="min-h-screen bg-[#070B14] text-white pl-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500&display=swap');
        @import url('https://fonts.googleapis.com/earlyaccess/vazirmatn.css');
        .fc{font-family:'Cinzel',serif} .fi{font-family:'Inter',sans-serif}
        .fade-up{animation:fu 0.5s ease forwards;opacity:0;transform:translateY(12px)}
        @keyframes fu{to{opacity:1;transform:translateY(0)}}
        .score-ring{transition:stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)}
        .city-row:hover{background:rgba(251,191,36,0.06)}
        *{font-variant-numeric:normal !important}
        input,select{...
        input,select{background:rgba(255,255,255,0.04)!important;border:1px solid rgba(255,255,255,0.08)!important;color:white!important;border-radius:10px}
        select option{background:#070B14 !important;color:white !important}
        input:focus,select:focus{border-color:rgba(251,191,36,0.35)!important;outline:none!important}
        select::-webkit-scrollbar{width:4px}
        select::-webkit-scrollbar-track{background:#0d1220}
        select::-webkit-scrollbar-thumb{background:#fbbf24;border-radius:2px}
        .shimmer{background:linear-gradient(90deg,rgba(255,255,255,0.02) 0%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.02) 100%);background-size:200% 100%;animation:sh 1.5s infinite}
        @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>

      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <BrandLogo lang={lang as BrandLang} href="/home" size="md" showTagline />
        <div className="flex items-center gap-3">
          <VaultPill label={HOME_LANGS[lang]?.nav?.['/vault'] ?? 'Vault'} />
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
            {(Object.keys(LANGS) as Array<keyof typeof LANGS>).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className="fi px-2.5 py-1 text-xs rounded-md border transition-all"
                style={lang===l ? {borderColor:'rgba(251,191,36,0.5)',color:'#fbbf24',background:'rgba(251,191,36,0.06)'} : {borderColor:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.3)'}}>
                {LANGS[l].name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8">
          {[{key:'business',icon:'◈',label:t.business},{key:'finance',icon:'◎',label:t.finance},{key:'real-estate',icon:'⬡',label:t.realestate}].map(d => (
            <button key={d.key}
              onClick={() => { setDomain(d.key); setForm(f => ({...f, action_type:DOMAIN_ACTIONS[d.key][0]})); setRawResult(null); }}
              className="fi flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all"
              style={domain===d.key ? {borderColor:'rgba(251,191,36,0.5)',color:'#fbbf24',background:'rgba(251,191,36,0.06)'} : {borderColor:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.4)'}}>
              <span className="text-xs">{d.icon}</span>{d.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 rounded-2xl p-6" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)'}}>

            <div className="grid gap-3 mb-3" style={{gridTemplateColumns:'3fr 2fr'}}>
              <div>
                <label className="fi block text-[11px] mb-1.5" style={{color:'rgba(255,255,255,0.35)'}}>{t.bdate}</label>
                <div className="grid gap-1" style={{gridTemplateColumns:'1fr 2fr 2.5fr'}}>
                  <select value={bdD} onChange={e => setForm(f => ({...f, birth_date:`${bdY}-${bdM}-${e.target.value}`}))} className="fi px-1 py-2.5 text-sm">
                    {Array.from({length:31},(_,i)=>String(i+1).padStart(2,'0')).map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={bdM} onChange={e => setForm(f => ({...f, birth_date:`${bdY}-${e.target.value}-${bdD}`}))} className="fi px-1 py-2.5 text-sm">
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m,i)=><option key={m} value={m}>{MONTHS[i]}</option>)}
                  </select>
                  <select value={bdY} onChange={e => setForm(f => ({...f, birth_date:`${e.target.value}-${bdM}-${bdD}`}))} className="fi px-1 py-2.5 text-sm">
                    {Array.from({length:100},(_,i)=>String(new Date().getFullYear()-i)).map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="fi block text-[11px] mb-1.5" style={{color:'rgba(255,255,255,0.35)'}}>{t.btime}</label>
                <input type="time" value={form.birth_time} onChange={e => setForm(f => ({...f,birth_time:e.target.value}))} className="fi w-full px-3 py-2.5 text-sm"/>
              </div>
            </div>

            <div className="mb-3 relative" ref={cityRef}>
              <label className="fi block text-[11px] mb-1.5" style={{color:'rgba(255,255,255,0.35)'}}>{t.loc}</label>
              <input type="text" value={citySearch} placeholder={t.placeholder}
                onChange={e => { setCitySearch(e.target.value); setForm(f => ({...f,location:e.target.value})); searchCities(e.target.value); setShowCities(true); }}
                onFocus={() => citySearch.length >= 2 && setShowCities(true)}
                className="fi w-full px-3 py-2.5 text-sm"/>
              {showCities && (cityLoading || cities.length > 0) && (
                <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl" style={{background:'#0d1220',border:'1px solid rgba(255,255,255,0.1)'}}>
                  {cityLoading && <div className="fi px-4 py-3 text-xs" style={{color:'rgba(255,255,255,0.3)'}}>{t.searching}</div>}
                  {!cityLoading && cities.length === 0 && <div className="fi px-4 py-3 text-xs" style={{color:'rgba(255,255,255,0.3)'}}>{t.noResults}</div>}
                  {cities.map((city, i) => (
                    <div key={i} className="city-row px-4 py-2.5 cursor-pointer transition-colors" onMouseDown={() => selectCity(city)}>
                      <div className="fi text-sm" style={{color:'rgba(255,255,255,0.8)'}}>{city.short}</div>
                      <div className="fi text-[11px] truncate" style={{color:'rgba(255,255,255,0.3)'}}>{city.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="fi block text-[11px] mb-1.5" style={{color:'rgba(255,255,255,0.35)'}}>{t.tdate}</label>
              <input type="date" value={form.target_date} onChange={e => setForm(f => ({...f,target_date:e.target.value}))} className="fi w-full px-3 py-2.5 text-sm"/>
            </div>

            <div className="mb-5">
              <label className="fi block text-[11px] mb-1.5" style={{color:'rgba(255,255,255,0.35)'}}>{t.action}</label>
              <select value={form.action_type} onChange={e => setForm(f => ({...f,action_type:e.target.value}))} className="fi w-full px-3 py-2.5 text-sm">
                {Object.entries(getActions()).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <button onClick={analyze} disabled={loading} className="fc w-full py-3 rounded-xl text-sm tracking-widest transition-all disabled:opacity-40"
              style={{background:'linear-gradient(135deg,#d97706,#f59e0b)',color:'#000',boxShadow:'0 0 20px rgba(251,191,36,0.15)'}}>
              {loading ? t.loading : t.analyze}
            </button>

            {error && <div className="fi mt-4 p-3 rounded-lg text-xs leading-relaxed" style={{background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.15)',color:'#fca5a5'}}>{error}</div>}
          </div>

          <div className="lg:col-span-3">
            {!result && !loading && (
              <div className="h-full min-h-64 flex flex-col items-center justify-center gap-3 rounded-2xl" style={{border:'1px solid rgba(255,255,255,0.04)'}}>
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none" opacity="0.15">
                  <circle cx="22" cy="22" r="19" stroke="white" strokeWidth="0.5"/>
                  <circle cx="22" cy="22" r="11" stroke="white" strokeWidth="0.5"/>
                  <circle cx="22" cy="22" r="3" stroke="white" strokeWidth="1"/>
                  <line x1="22" y1="3" x2="22" y2="41" stroke="white" strokeWidth="0.3"/>
                  <line x1="3" y1="22" x2="41" y2="22" stroke="white" strokeWidth="0.3"/>
                </svg>
                <div className="fi text-xs tracking-wider" style={{color:'rgba(255,255,255,0.15)'}}>Your analysis will appear here</div>
              </div>
            )}

            {loading && (
              <div className="space-y-3 pt-2">
                <div className="shimmer rounded-2xl h-28"/>
                <div className="shimmer rounded-2xl h-14"/>
                <div className="shimmer rounded-2xl h-20"/>
                <div className="shimmer rounded-2xl h-16"/>
              </div>
            )}

            {result && (() => {
              const ex = result.executive;
              const st = result.strategic;
              const s = getStyle(ex.score);
              const C = 2 * Math.PI * 36;
              const offset = C - (ex.score / 100) * C;
              const msg = SCORE_MSG[lang]?.[getMsgKey(ex.score)] || SCORE_MSG.en[getMsgKey(ex.score)];
              return (
                <div className="space-y-4">
                  {!moduleBannerDismissed && (
                    <ModuleDisclaimerBanner
                      lang={lang as DisclaimerLang}
                      onDismiss={() => setModuleBannerDismissed(true)}
                    />
                  )}
                  <div className="fade-up rounded-2xl p-6" style={{background:s.bg,border:'1px solid rgba(255,255,255,0.07)',animationDelay:'0ms'}}>
                    <div className="flex items-center gap-5">
                      <div className="relative flex-shrink-0">
                        <svg width="88" height="88" viewBox="0 0 88 88">
                          <circle cx="44" cy="44" r="36" stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none"/>
                          <circle cx="44" cy="44" r="36" stroke={s.border} strokeWidth="5" fill="none"
                            strokeDasharray={C} strokeDashoffset={animated ? offset : C}
                            strokeLinecap="round" transform="rotate(-90 44 44)" className="score-ring"/>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="fc text-2xl" style={{color:s.color}}>{ex.score}</span>
                          <span className="fi text-[10px]" style={{color:'rgba(255,255,255,0.3)'}}>/100</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="fc text-lg mb-1" style={{color:s.color}}>{ex.rating}</div>
                        <div className="fi text-xs mb-3" style={{color:'rgba(255,255,255,0.4)'}}>{ex.activity}</div>
                        <div className="fi text-sm italic leading-relaxed" style={{color:'rgba(255,255,255,0.65)'}}>&ldquo;{msg}&rdquo;</div>
                      </div>
                    </div>
                  </div>

                  <AnalysisResultBreakdown breakdown={result.scoreBreakdown} />

                  <div className="fade-up rounded-2xl p-5" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',animationDelay:'80ms'}}>
                    <div className="fi text-[10px] tracking-widest mb-2 uppercase" style={{color:'rgba(255,255,255,0.25)'}}>{t.rec}</div>
                    <p className="fi text-sm leading-relaxed" style={{color:'rgba(255,255,255,0.75)'}}>{ex.recommendation}</p>
                    {ex.score >= 85 && (
                      <ActionDisclaimer lang={lang as DisclaimerLang} />
                    )}
                  </div>

                  {Array.isArray(st?.opportunity_factors) && st.opportunity_factors.length > 0 && (
                    <div className="fade-up rounded-2xl p-5" style={{background:'rgba(74,222,128,0.03)',border:'1px solid rgba(74,222,128,0.1)',animationDelay:'160ms'}}>
                      <div className="fc text-xs tracking-wider mb-3" style={{color:'#4ade80'}}>{t.opps}</div>
                      <div className="space-y-2">
                        {st.opportunity_factors.slice(0,4).map((o: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-xs mt-0.5" style={{color:'#4ade80'}}>◆</span>
                            <span className="fi text-xs leading-relaxed" style={{color:'rgba(255,255,255,0.55)'}}>{o}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(st?.risk_factors) && st.risk_factors.length > 0 && (
                    <div className="fade-up rounded-2xl p-5" style={{background:'rgba(248,113,113,0.03)',border:'1px solid rgba(248,113,113,0.1)',animationDelay:'240ms'}}>
                      <div className="fc text-xs tracking-wider mb-3" style={{color:'#f87171'}}>{t.risks}</div>
                      <div className="space-y-2">
                        {st.risk_factors.slice(0,4).map((r: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-xs mt-0.5" style={{color:'#f87171'}}>▲</span>
                            <span className="fi text-xs leading-relaxed" style={{color:'rgba(255,255,255,0.55)'}}>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(Array.isArray(st?.key_themes) && st.key_themes.length > 0 || Array.isArray(st?.timing_notes) && st.timing_notes.length > 0) && (
                    <div className="fade-up grid grid-cols-2 gap-3" style={{animationDelay:'320ms'}}>
                      {Array.isArray(st?.key_themes) && st.key_themes.length > 0 && (
                        <div className="rounded-2xl p-4" style={{background:'rgba(251,191,36,0.03)',border:'1px solid rgba(251,191,36,0.08)'}}>
                          <div className="fc text-xs tracking-wider mb-3" style={{color:'#fbbf24'}}>{t.themes}</div>
                          {st.key_themes.slice(0,3).map((th: string, i: number) => (
                            <div key={i} className="fi text-[11px] leading-relaxed py-1.5" style={{color:'rgba(255,255,255,0.45)',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>{th}</div>
                          ))}
                        </div>
                      )}
                      {Array.isArray(st?.timing_notes) && st.timing_notes.length > 0 && (
                        <div className="rounded-2xl p-4" style={{background:'rgba(96,165,250,0.03)',border:'1px solid rgba(96,165,250,0.08)'}}>
                          <div className="fc text-xs tracking-wider mb-3" style={{color:'#60a5fa'}}>{t.timing}</div>
                          {st.timing_notes.slice(0,3).map((tn: string, i: number) => (
                            <div key={i} className="fi text-[11px] leading-relaxed py-1.5" style={{color:'rgba(255,255,255,0.45)',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>{tn}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      <BottomNav labels={HOME_LANGS[lang as keyof typeof HOME_LANGS].nav} />
    </div>
  );
}
