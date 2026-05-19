import { NextRequest, NextResponse } from 'next/server';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  ru: {
    'Friction in the sky': 'Трение в небесах',
    'Delay or restructure': 'Отложите или пересмотрите',
    'business launch': 'запуск бизнеса',
    'unless urgent': 'если это не срочно',
    'shore up': 'укрепите',
    'visibility, momentum, and scalable growth': 'видимость, импульс и масштабируемый рост',
    'before committing': 'прежде чем брать обязательства',
    'Favorable energetic window': 'Благоприятное энергетическое окно',
    'Proceed with strategic actions': 'Действуйте стратегически',
    'Neutral-to-mixed timing': 'Нейтральное или смешанное время',
    'Viable for': 'Жизнеспособно для',
    'if capital allocation': 'если распределение капитала',
    'risk/reward': 'риск/вознаграждение',
    'and long-term yield is well-prepared': 'и долгосрочная доходность хорошо подготовлены',
    'avoid unnecessary risk': 'избегайте излишнего риска',
    'Good conditions for negotiation': 'Хорошие условия для переговоров',
    'Favor core priorities around': 'Отдайте приоритет основным задачам',
    'communication, rapport, and mutually beneficial terms': 'коммуникации, взаимопониманию и взаимовыгодным условиям',
    'keep contingency plans light': 'держите резервные планы простыми',
    'Delay or restructure real estate': 'Отложите или пересмотрите недвижимость',
    'asset security, valuation, and structural soundness': 'безопасность активов, оценку и структурную надёжность',
  },
  fa: {
    'Friction in the sky': 'اصطکاک در آسمان',
    'Delay or restructure': 'تأخیر یا بازساختاردهی',
    'business launch': 'راه‌اندازی کسب‌وکار',
    'unless urgent': 'مگر اینکه فوری باشد',
    'shore up': 'تقویت کنید',
    'visibility, momentum, and scalable growth': 'دیده‌شدن، شتاب و رشد مقیاس‌پذیر',
    'before committing': 'قبل از تعهد',
    'Favorable energetic window': 'پنجره انرژتیک مساعد',
    'Proceed with strategic actions': 'با اقدامات استراتژیک پیش بروید',
    'Neutral-to-mixed timing': 'زمان‌بندی خنثی تا مختلط',
    'Viable for': 'مناسب برای',
    'if capital allocation': 'اگر تخصیص سرمایه',
    'risk/reward': 'ریسک/بازده',
    'and long-term yield is well-prepared': 'و بازده بلندمدت خوب آماده شده باشد',
    'avoid unnecessary risk': 'از ریسک غیرضروری اجتناب کنید',
    'Good conditions for negotiation': 'شرایط خوب برای مذاکره',
    'Favor core priorities around': 'اولویت‌های اصلی را در نظر بگیرید',
    'communication, rapport, and mutually beneficial terms': 'ارتباط، اعتماد متقابل و شرایط سودمند',
    'keep contingency plans light': 'برنامه‌های اضطراری را ساده نگه دارید',
    'Delay or restructure real estate': 'خرید ملک را به تعویق بیندازید یا بازنگری کنید',
    'asset security, valuation, and structural soundness': 'امنیت دارایی، ارزیابی و استحکام ساختاری',
  },
  ar: {
    'Friction in the sky': 'احتكاك في السماء',
    'Delay or restructure': 'أخر أو أعد الهيكلة',
    'business launch': 'إطلاق المشروع',
    'unless urgent': 'ما لم يكن عاجلاً',
    'shore up': 'عزز',
    'visibility, momentum, and scalable growth': 'الظهور والزخم والنمو القابل للتوسع',
    'before committing': 'قبل الالتزام',
    'Favorable energetic window': 'نافذة طاقة مواتية',
    'Proceed with strategic actions': 'تصرف باستراتيجية',
    'Neutral-to-mixed timing': 'توقيت محايد إلى مختلط',
    'Viable for': 'مجدٍ لـ',
    'if capital allocation': 'إذا كان تخصيص رأس المال',
    'risk/reward': 'المخاطر/العائد',
    'and long-term yield is well-prepared': 'والعائد طويل المدى جيد الإعداد',
    'avoid unnecessary risk': 'تجنب المخاطر غير الضرورية',
    'Good conditions for negotiation': 'ظروف جيدة للتفاوض',
    'Favor core priorities around': 'أعطِ الأولوية للمحاور الأساسية',
    'communication, rapport, and mutually beneficial terms': 'التواصل والألفة والشروط المتبادلة المنفعة',
    'keep contingency plans light': 'اجعل خطط الطوارئ بسيطة',
    'Delay or restructure real estate': 'أخر أو أعد هيكلة العقارات',
    'asset security, valuation, and structural soundness': 'أمان الأصول والتقييم والمتانة الهيكلية',
  },
};

function translateText(text: string, lang: string): string {
  if (lang === 'en') return text;
  const dict = TRANSLATIONS[lang];
  if (!dict) return text;
  let result = text;
  Object.entries(dict).forEach(([en, tr]) => {
    result = result.replace(new RegExp(en, 'gi'), tr);
  });
  return result;
}

export async function POST(req: NextRequest) {
  const { text, lang } = await req.json();
  return NextResponse.json({ translated: translateText(text, lang) });
}