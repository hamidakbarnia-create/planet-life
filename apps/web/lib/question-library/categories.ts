import type { QuestionCategory } from './types';

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: 'career-work',
    order: 1,
    labels: {
      en: 'Career & Work',
      fa: 'مسیر شغلی و کار',
      ru: 'Карьера и работа',
      ar: 'المسار المهني والعمل',
    },
    descriptions: {
      en: 'Jobs, promotions, interviews, and professional moves',
      fa: 'شغل، ارتقا، مصاحبه و تصمیم‌های حرفه‌ای',
      ru: 'Работа, повышение, собеседования и карьерные шаги',
      ar: 'الوظائف والترقيات والمقابلات والخطوات المهنية',
    },
  },
  {
    id: 'relationships',
    order: 2,
    labels: {
      en: 'Love & People',
      fa: 'عشق و افراد',
      ru: 'Любовь и люди',
      ar: 'الحب والناس',
    },
    descriptions: {
      en: 'Partners, family talks, reconciliation, and connection',
      fa: 'شریک، گفتگوی خانوادگی، آشتی و تقویت ارتباط',
      ru: 'Партнёры, семейные разговоры, примирение и связь',
      ar: 'الشركاء والحوار العائلي والمصالحة والتواصل',
    },
  },
  {
    id: 'money-business',
    order: 3,
    labels: {
      en: 'Money & Business',
      fa: 'پول و تجارت',
      ru: 'Деньги и бизнес',
      ar: 'المال والأعمال',
    },
    descriptions: {
      en: 'Contracts, launches, investments, and financial moves',
      fa: 'قرارداد، لانچ، سرمایه‌گذاری و جابجایی مالی',
      ru: 'Контракты, запуски, инвестиции и финансовые шаги',
      ar: 'العقود والإطلاقات والاستثمارات والخطوات المالية',
    },
  },
  {
    id: 'health-wellness',
    order: 4,
    labels: {
      en: 'Health & Body',
      fa: 'سلامتی و بدن',
      ru: 'Здоровье и тело',
      ar: 'الصحة والجسد',
    },
    descriptions: {
      en: 'Treatments, fitness, recovery, and body-care timing',
      fa: 'درمان، تناسب اندام، ریکاوری و مراقبت از بدن',
      ru: 'Лечение, фитнес, восстановление и уход за телом',
      ar: 'العلاج واللياقة والتعافي والعناية بالجسد',
    },
  },
  {
    id: 'travel-place',
    order: 5,
    labels: {
      en: 'Travel & Place',
      fa: 'سفر و مکان',
      ru: 'Путешествия и место',
      ar: 'السفر والمكان',
    },
    descriptions: {
      en: 'Trips, relocation, property, and place changes',
      fa: 'سفر، مهاجرت، ملک و تغییر مکان',
      ru: 'Поездки, переезд, недвижимость и смена места',
      ar: 'الرحلات والانتقال والعقارات وتغيير المكان',
    },
  },
  {
    id: 'communication',
    order: 6,
    labels: {
      en: 'Communication & Voice',
      fa: 'ارتباط و صدا',
      ru: 'Коммуникация и голос',
      ar: 'التواصل والصوت',
    },
    descriptions: {
      en: 'Posts, pitches, presentations, and public expression',
      fa: 'پست، ارائه، پرزنتیشن و بیان عمومی',
      ru: 'Публикации, питчи, презентации и публичное выражение',
      ar: 'المنشورات والعروض والتقديمات والتعبير العام',
    },
  },
  {
    id: 'decisions-timing',
    order: 7,
    labels: {
      en: 'Decisions & Timing',
      fa: 'تصمیم و زمان‌بندی',
      ru: 'Решения и тайминг',
      ar: 'القرارات والتوقيت',
    },
    descriptions: {
      en: 'Risks, endings, fresh starts, and major choices',
      fa: 'ریسک، پایان، شروع تازه و انتخاب‌های بزرگ',
      ru: 'Риски, завершения, новые начала и важные выборы',
      ar: 'المخاطر والنهايات والبدايات الجديدة والخيارات الكبرى',
    },
  },
  {
    id: 'energy-focus',
    order: 8,
    labels: {
      en: 'Energy & Focus',
      fa: 'انرژی و تمرکز',
      ru: 'Энергия и фокус',
      ar: 'الطاقة والتركيز',
    },
    descriptions: {
      en: 'Attention, priorities, stamina, and daily momentum',
      fa: 'توجه، اولویت‌ها، استقامت و ریتم روزانه',
      ru: 'Внимание, приоритеты, выносливость и дневной ритм',
      ar: 'الانتباه والأولويات والقدرة على الاستمرار والإيقاع اليومي',
    },
  },
  {
    id: 'home-family',
    order: 9,
    labels: {
      en: 'Home & Family',
      fa: 'خانه و خانواده',
      ru: 'Дом и семья',
      ar: 'المنزل والعائلة',
    },
    descriptions: {
      en: 'Household moves, family events, and domestic decisions',
      fa: 'جابجایی خانه، رویداد خانوادگی و تصمیم‌های منزل',
      ru: 'Переезды, семейные события и бытовые решения',
      ar: 'انتقالات المنزل والمناسبات العائلية والقرارات المنزلية',
    },
  },
  {
    id: 'growth-learning',
    order: 10,
    labels: {
      en: 'Growth & Learning',
      fa: 'رشد و یادگیری',
      ru: 'Рост и обучение',
      ar: 'النمو والتعلم',
    },
    descriptions: {
      en: 'Skills, habits, study, and personal development',
      fa: 'مهارت، عادت، مطالعه و توسعه فردی',
      ru: 'Навыки, привычки, учёба и личное развитие',
      ar: 'المهارات والعادات والدراسة والتطور الشخصي',
    },
  },
];
