import type { AppLang } from './app-settings';
import type { InsightSectionKey, RelationshipProfileKey } from './relationship-profile';

type SectionLabels = Record<InsightSectionKey, string>;

const SECTION_LABELS: Record<AppLang, SectionLabels> = {
  en: {
    emotional_bond: 'Emotional bond',
    stability: 'Stability & commitment',
    communication: 'Communication',
    power_dynamic: 'Power & authority',
    shared_goals: 'Shared goals',
    trust: 'Trust & reliability',
    chemistry: 'Chemistry & attraction',
    boundaries: 'Boundaries & roles',
    growth: 'Growth & learning',
    practical_fit: 'Practical fit',
  },
  ru: {
    emotional_bond: 'Эмоциональная связь',
    stability: 'Стабильность и обязательства',
    communication: 'Коммуникация',
    power_dynamic: 'Власть и роли',
    shared_goals: 'Общие цели',
    trust: 'Доверие и надёжность',
    chemistry: 'Химия и притяжение',
    boundaries: 'Границы и роли',
    growth: 'Рост и обучение',
    practical_fit: 'Практическая совместимость',
  },
  fa: {
    emotional_bond: 'پیوند عاطفی',
    stability: 'ثبات و تعهد',
    communication: 'ارتباط',
    power_dynamic: 'قدرت و نقش‌ها',
    shared_goals: 'اهداف مشترک',
    trust: 'اعتماد و اتکا',
    chemistry: 'کشش و جذابیت',
    boundaries: 'مرزها و نقش‌ها',
    growth: 'رشد و یادگیری',
    practical_fit: 'تناسب عملی',
  },
  ar: {
    emotional_bond: 'الرابط العاطفي',
    stability: 'الاستقرار والالتزام',
    communication: 'التواصل',
    power_dynamic: 'السلطة والأدوار',
    shared_goals: 'الأهداف المشتركة',
    trust: 'الثقة والاعتماد',
    chemistry: 'الكيمياء والانجذاب',
    boundaries: 'الحدود والأدوار',
    growth: 'النمو والتعلّم',
    practical_fit: 'الملاءمة العملية',
  },
};

const PROFILE_LABELS: Record<AppLang, Record<RelationshipProfileKey, string>> = {
  en: {
    spouse: 'Spouse',
    romantic_partner: 'Romantic partner',
    business_partner: 'Business partner',
    cofounder: 'Co-founder',
    employee: 'Employee',
    employer: 'Employer',
    friend: 'Friend',
    family: 'Family',
    parent_child: 'Parent / child',
    mentor: 'Mentor',
    investor: 'Investor',
    client: 'Client',
  },
  ru: {
    spouse: 'Супруг(а)',
    romantic_partner: 'Романтический партнёр',
    business_partner: 'Деловой партнёр',
    cofounder: 'Сооснователь',
    employee: 'Сотрудник',
    employer: 'Работодатель',
    friend: 'Друг',
    family: 'Семья',
    parent_child: 'Родитель / ребёнок',
    mentor: 'Наставник',
    investor: 'Инвестор',
    client: 'Клиент',
  },
  fa: {
    spouse: 'همسر',
    romantic_partner: 'شریک عاطفی',
    business_partner: 'شریک تجاری',
    cofounder: 'هم‌بنیان‌گذار',
    employee: 'کارمند',
    employer: 'کارفرما',
    friend: 'دوست',
    family: 'خانواده',
    parent_child: 'والد / فرزند',
    mentor: 'مربی',
    investor: 'سرمایه‌گذار',
    client: 'مشتری',
  },
  ar: {
    spouse: 'زوج/ة',
    romantic_partner: 'شريك عاطفي',
    business_partner: 'شريك عمل',
    cofounder: 'مؤسس مشارك',
    employee: 'موظف',
    employer: 'صاحب عمل',
    friend: 'صديق',
    family: 'عائلة',
    parent_child: 'والد / طفل',
    mentor: 'مرشد',
    investor: 'مستثمر',
    client: 'عميل',
  },
};

export function insightSectionLabel(lang: AppLang, key: InsightSectionKey): string {
  return SECTION_LABELS[lang]?.[key] ?? SECTION_LABELS.en[key];
}

export function relationshipProfileLabel(
  lang: AppLang,
  key: RelationshipProfileKey
): string {
  return PROFILE_LABELS[lang]?.[key] ?? PROFILE_LABELS.en[key];
}
