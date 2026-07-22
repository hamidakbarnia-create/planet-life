import { describe, expect, it } from 'vitest';
import { LANDING_I18N, LANDING_LANG_OPTIONS } from '@/lib/landing-i18n';

describe('landing hero approved copy', () => {
  it('matches approved EN/FA/AR/RU hero strings exactly', () => {
    expect(LANDING_I18N.en.hero).toEqual({
      eyebrow: 'PERSONAL DECISION INTELLIGENCE',
      headline: 'Know your next move — and when to make it.',
      supporting:
        'METIORO helps you understand your most important timing periods, spot opportunities and risks, and decide your next step with confidence.',
      primaryCta: 'Start Free',
      secondaryCta: 'How It Works',
    });
    expect(LANDING_I18N.fa.hero).toEqual({
      eyebrow: 'هوش شخصی برای تصمیم‌گیری',
      headline: 'بدانید قدم بعدی چیست و چه زمانی باید آن را بردارید.',
      supporting:
        'METIORO به شما کمک می‌کند زمان‌های مهم زندگی‌تان را بهتر بشناسید، فرصت‌ها و ریسک‌ها را ببینید و برای قدم بعدی با اطمینان بیشتری تصمیم بگیرید.',
      primaryCta: 'شروع رایگان',
      secondaryCta: 'نحوه کار',
    });
    expect(LANDING_I18N.fa.dir).toBe('rtl');
    expect(LANDING_I18N.ar.hero).toEqual({
      eyebrow: 'ذكاء شخصي لاتخاذ القرار',
      headline: 'اعرف خطوتك التالية ومتى تتخذها.',
      supporting:
        'يساعدك METIORO على فهم الفترات المهمة في حياتك، واكتشاف الفرص والمخاطر، واتخاذ خطوتك التالية بثقة أكبر.',
      primaryCta: 'ابدأ مجانًا',
      secondaryCta: 'كيف يعمل',
    });
    expect(LANDING_I18N.ar.dir).toBe('rtl');
    expect(LANDING_I18N.ru.hero).toEqual({
      eyebrow: 'ПЕРСОНАЛЬНАЯ АНАЛИТИКА РЕШЕНИЙ',
      headline: 'Знайте, какой шаг сделать дальше — и когда.',
      supporting:
        'METIORO анализирует важные для вас периоды, помогает увидеть возможности и риски и подсказывает, каким может быть следующий шаг.',
      primaryCta: 'Начать бесплатно',
      secondaryCta: 'Как это работает',
    });
  });

  it('keeps all locales free of forbidden timing-signal phrasing in hero', () => {
    const banned = [
      'timing signals',
      'personal timing signals',
      'signals of time',
      'إشارات التوقيت',
      'سیگنال‌های زمانی',
      'сигналы времени',
      'See How It Works',
      'Every decision has a better time',
    ];
    for (const lang of LANDING_LANG_OPTIONS) {
      const blob = Object.values(LANDING_I18N[lang].hero).join('\n');
      for (const b of banned) {
        expect(blob.toLowerCase()).not.toContain(b.toLowerCase());
      }
    }
  });
});

describe('landing trust approved user-focused cards', () => {
  it('matches approved Card 1 and Card 2 copy in EN/FA/AR/RU', () => {
    expect(LANDING_I18N.en.trust.pillars.slice(2, 4)).toEqual([
      {
        title: 'Multiple sources of evidence',
        description:
          'Every insight is supported by structured analysis, documented methods, and traceable data.',
      },
      {
        title: 'Transparent analysis',
        description:
          'We explain the reasoning behind every recommendation in clear, easy-to-understand language.',
      },
    ]);
    expect(LANDING_I18N.fa.trust.pillars.slice(2, 4)).toEqual([
      {
        title: 'چندین منبع برای تحلیل',
        description:
          'هر تحلیل بر پایه داده‌های ساختاریافته، روش‌های مستند و اطلاعات قابل بررسی ارائه می‌شود.',
      },
      {
        title: 'تحلیل شفاف',
        description:
          'دلیل هر پیشنهاد را با زبانی ساده و قابل‌فهم توضیح می‌دهیم.',
      },
    ]);
    expect(LANDING_I18N.ar.trust.pillars.slice(2, 4)).toEqual([
      {
        title: 'مصادر متعددة للتحليل',
        description:
          'كل نتيجة تستند إلى تحليل منظم، وأساليب موثقة، وبيانات يمكن التحقق منها.',
      },
      {
        title: 'تحليل واضح',
        description:
          'نشرح المنطق وراء كل توصية بلغة واضحة وسهلة الفهم.',
      },
    ]);
    expect(LANDING_I18N.ru.trust.pillars.slice(2, 4)).toEqual([
      {
        title: 'Несколько источников анализа',
        description:
          'Каждый вывод основан на структурированном анализе, документированных методах и проверяемых данных.',
      },
      {
        title: 'Прозрачный анализ',
        description:
          'Мы объясняем логику каждой рекомендации простым и понятным языком.',
      },
    ]);
  });

  it('removes technical trust phrasing from all locales', () => {
    const banned = [
      'evidence framework',
      'evidence frameworks',
      'traceable inputs',
      'assumptions are stated',
      'uncertainty are stated',
      'uncertainty is stated',
      'چارچوب‌های متعدد شواهد',
      'ورودی‌های قابل‌ردیابی',
      'بیان می‌شوند — پنهان',
      'أطر أدلة متعددة',
      'مدخلات قابلة للتتبع',
      'مذكورة — لا مخفية',
      'Несколько основ доказательств',
      'прослеживаемые входные данные',
      'указаны явно — не скрыты',
    ];
    for (const lang of LANDING_LANG_OPTIONS) {
      const blob = LANDING_I18N[lang].trust.pillars
        .map((p) => `${p.title}\n${p.description}`)
        .join('\n');
      for (const b of banned) {
        expect(blob.toLowerCase()).not.toContain(b.toLowerCase());
      }
      expect(LANDING_I18N[lang].trust.pillars).toHaveLength(4);
      for (const p of LANDING_I18N[lang].trust.pillars) {
        expect(p.title.length).toBeLessThanOrEqual(48);
        expect(p.description.length).toBeLessThanOrEqual(160);
      }
    }
  });
});
