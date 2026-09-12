import type { AppLang } from './app-settings';

function englishAvailability(available: number, upcoming: number): string {
  const live =
    available === 1 ? '1 reading is available.' : `${available} readings are available.`;
  if (!upcoming) return live;
  const planned =
    upcoming === 1 ? '1 planned tool is not yet available.' : `${upcoming} planned tools are not yet available.`;
  return `${live} ${planned}`;
}

export const VAULT_AVAILABILITY: Record<AppLang, { live: string; note: string; summary: (available: number, upcoming: number) => string }> = {
  en: { live: 'Available', note: 'Availability describes implemented readings. Profile and partner requirements are shown with each tool.', summary: englishAvailability },
  ru: { live: 'Доступно', note: 'Отметка доступности означает, что инструмент работает. Требования к профилю и данным партнёра указаны рядом с ним.', summary: (a, u) => `Доступных инструментов: ${a}.${u ? ` Ещё в разработке: ${u}.` : ''}` },
  fa: { live: 'در دسترس', note: 'این نشان یعنی ابزار آماده استفاده است. نیاز به پروفایل یا اطلاعات همراه کنار هر ابزار مشخص شده است.', summary: (a, u) => `${a} ابزار در دسترس است.${u ? ` ${u} ابزار دیگر هنوز آماده نیست.` : ''}` },
  ar: { live: 'متاح', note: 'تشير الإتاحة إلى أن الأداة تعمل. تظهر متطلبات الملف وبيانات الطرف الآخر بجانب كل أداة.', summary: (a, u) => `عدد الأدوات المتاحة: ${a}.${u ? ` أدوات لم تتوفر بعد: ${u}.` : ''}` },
};
