'use client';

import Link from 'next/link';
import type { AppLang } from '@/lib/app-settings';
import {
  getAskProductCopy,
  offerNegotiationBackToAsk,
  OFFER_NEGOTIATION_DECISION_TYPE_ID,
} from '@/lib/ask-product';

/** Result-page return link. Offer Negotiation uses dedicated localized copy. */
export function DecisionCaseResultBackLink({
  lang,
  decisionTypeId,
}: {
  lang: AppLang;
  decisionTypeId?: string;
}) {
  const copy = getAskProductCopy(lang);
  const label =
    decisionTypeId === OFFER_NEGOTIATION_DECISION_TYPE_ID
      ? offerNegotiationBackToAsk(lang)
      : copy.backToAsk;

  return (
    <Link
      href="/ask"
      className="fi text-sm text-[#93B4FF] hover:text-white"
      data-testid="result-back-to-ask"
    >
      {label}
    </Link>
  );
}
