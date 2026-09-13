import { describe, expect, it } from 'vitest';

import {
  collapseRepeatedReason,
  interpretationRepeatsAction,
  localizedStatementAlreadyOwned,
  statementAlreadyPresent,
  uniqueSentences,
  validityWarningAlreadyPresent,
} from './vault-reading-safeguards';

describe('Vault safeguard dedupe', () => {
  it('detects a localized safeguard without English-only keywords', () => {
    expect(
      statementAlreadyPresent(
        'اعتبار پیش‌بینی تأیید نشده است.',
        'اعتبار پیش‌بینی تأیید نشده است.',
      ),
    ).toBe(true);
    expect(
      statementAlreadyPresent(
        'Timing scores are symbolic weights.',
        'Predictive validity has not been established.',
      ),
    ).toBe(false);
    expect(
      statementAlreadyPresent(
        'Risk patterns only — never a verdict.',
        'Predictive validity has not been established.',
      ),
    ).toBe(false);
  });

  it('does not hide a validity warning merely because another limitation exists', () => {
    const limitation =
      'Actual behavior and fidelity are unknown. Birth data cannot detect cheating.';
    expect(
      statementAlreadyPresent(
        limitation,
        'Predictive validity has not been established.',
      ),
    ).toBe(false);
    expect(uniqueSentences([limitation, 'Predictive validity has not been established.'])).toHaveLength(3);
  });

  it('omits a Heat-style validity paraphrase without hiding a distinct limitation', () => {
    expect(
      validityWarningAlreadyPresent(
        'Timing scores are symbolic weights, not probabilities of attraction. Predictive validity is unestablished; consent and another person’s response cannot be inferred.',
        'Predictive validity has not been established.',
      ),
    ).toBe(true);
    expect(
      validityWarningAlreadyPresent(
        'Прогностическая достоверность не установлена; согласие неизвестно.',
        'Предсказательная достоверность не подтверждена.',
      ),
    ).toBe(true);
    expect(
      validityWarningAlreadyPresent(
        'لم تثبت صلاحيتها للتنبؤ؛ ولا يمكن استنتاج الموافقة.',
        'لم تثبت صلاحية هذه القراءة للتنبؤ.',
      ),
    ).toBe(true);
    expect(
      validityWarningAlreadyPresent(
        'Actual behavior and fidelity are unknown. Birth data cannot detect cheating.',
        'Predictive validity has not been established.',
      ),
    ).toBe(false);
  });

  it('hides Overall Situation only for a complete normalized duplicate', () => {
    expect(
      interpretationRepeatsAction(
        'Choose whether to discuss money after reviewing the real terms and evidence',
        'Choose whether to discuss money after reviewing the real terms and evidence.',
      ),
    ).toBe(true);
    expect(
      interpretationRepeatsAction(
        'If useful, take an intentional pause, briefly explain it and agree a return time',
        'If useful, take an intentional pause, briefly explain it and agree a return time',
      ),
    ).toBe(true);
    expect(
      interpretationRepeatsAction(
        'Выберите, обсуждать ли деньги после проверки реальных условий и оснований.',
        'Выберите, обсуждать ли деньги после проверки реальных условий и оснований',
      ),
    ).toBe(true);
    expect(
      interpretationRepeatsAction(
        'پس از بررسی شرایط و شواهد واقعی تصمیم بگیرید که آیا درباره پول گفتگو کنید',
        'پس از بررسی شرایط و شواهد واقعی تصمیم بگیرید که آیا درباره پول گفتگو کنید.',
      ),
    ).toBe(true);
    expect(
      interpretationRepeatsAction(
        'قرّر إن كنت ستناقش المال بعد مراجعة الشروط والأدلة الفعلية',
        'قرّر إن كنت ستناقش المال بعد مراجعة الشروط والأدلة الفعلية.',
      ),
    ).toBe(true);
  });

  it('keeps an interpretation that repeats the action plus distinct information', () => {
    expect(
      interpretationRepeatsAction(
        'Choose whether to discuss money after reviewing the real terms and evidence. Also check the written contract and whether you can afford it.',
        'Choose whether to discuss money after reviewing the real terms and evidence.',
      ),
    ).toBe(false);
    expect(
      interpretationRepeatsAction(
        'Reduce pressure if you need space. Briefly communicate the pause and agree when to return to the conversation. Do not use distance to influence another person.',
        'If useful, take an intentional pause, briefly explain it and agree a return time',
      ),
    ).toBe(false);
    expect(
      interpretationRepeatsAction(
        'If you choose to discuss money, first check the amount, terms, affordability and evidence. A timing rank is only a symbolic comparison of the dates evaluated.',
        'Choose whether to discuss money after reviewing the real terms and evidence',
      ),
    ).toBe(false);
    expect(
      interpretationRepeatsAction(
        'Выберите, обсуждать ли деньги после проверки реальных условий и оснований. Сначала сверьте сумму и письменные условия.',
        'Выберите, обсуждать ли деньги после проверки реальных условий и оснований.',
      ),
    ).toBe(false);
    expect(
      interpretationRepeatsAction(
        'پس از بررسی شرایط و شواهد واقعی تصمیم بگیرید که آیا درباره پول گفتگو کنید. مبلغ و توان پرداخت را جداگانه بسنجید.',
        'پس از بررسی شرایط و شواهد واقعی تصمیم بگیرید که آیا درباره پول گفتگو کنید.',
      ),
    ).toBe(false);
    expect(
      interpretationRepeatsAction(
        'قرّر إن كنت ستناقش المال بعد مراجعة الشروط والأدلة الفعلية. راجع المبلغ وشروط العقد أيضاً.',
        'قرّر إن كنت ستناقش المال بعد مراجعة الشروط والأدلة الفعلية.',
      ),
    ).toBe(false);
  });

  it('owns Arabic scent-alternatives when Overall joins them with a comma', () => {
    const older =
      'هذه مجموعات نغمات بديلة للمقارنة، وليست مزيجاً واحداً مطلوباً، ولا تصف الشخصية.';
    const canonical =
      'هذه مجموعات نغمات بديلة للمقارنة، وليست مزيجاً واحداً مطلوباً.';
    expect(statementAlreadyPresent(older, canonical)).toBe(false);
    expect(localizedStatementAlreadyOwned(older, canonical)).toBe(true);
    expect(older).toContain('ولا تصف الشخصية');
    expect(
      localizedStatementAlreadyOwned(
        'العطر خيار اختياري للمظهر، وليس وسيلة لضمان الانجذاب.',
        canonical,
      ),
    ).toBe(false);
  });

  it('collapses exact repeated sentences and semicolon clauses', () => {
    expect(
      uniqueSentences([
        'Predictive validity has not been established.',
        'Predictive validity has not been established.',
      ]),
    ).toEqual(['Predictive validity has not been established.']);
    expect(
      collapseRepeatedReason(
        'Sun-axis symbolism in this shortlist; Sun-axis symbolism in this shortlist; Jupiter weight',
      ),
    ).toBe('Sun-axis symbolism in this shortlist; Jupiter weight');
    expect(
      collapseRepeatedReason('موضوع أول؛ موضوع أول؛ موضوع ثان'),
    ).toBe('موضوع أول؛ موضوع ثان');
  });
});
