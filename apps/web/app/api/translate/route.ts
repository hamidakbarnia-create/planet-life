import { NextRequest, NextResponse } from 'next/server';
import {
  translateRecommendation,
  type AstroLang,
} from '@/lib/astrology-i18n';

export async function POST(req: NextRequest) {
  const { text, lang } = await req.json();
  const translated = translateRecommendation(
    text ?? '',
    (lang ?? 'en') as AstroLang
  );
  return NextResponse.json({ translated });
}
