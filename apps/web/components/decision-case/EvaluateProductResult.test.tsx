import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EvaluateProductResult } from './EvaluateProductResult';
import { buildEvaluatePresentation } from '@/lib/ask-product';
import { bindDemoStubPackage } from '@/lib/decision-case';
import { getAskProductCopy } from '@/lib/ask-product';

afterEach(() => cleanup());

function runtimePkg() {
  const base = bindDemoStubPackage({
    caseId: '11111111-1111-4111-8111-111111111111',
    caseVersion: 1,
    intake: { target_date: '2026-08-18', role: 'Engineer' },
  });
  return {
    ...base,
    engine_id: 'decision-engine-car-interview-v1',
    confidence: { value: 70, precision_level: 'L3' as const, penalties: [] },
  };
}

describe('EvaluateProductResult first viewport', () => {
  it.each(['en', 'fa', 'ar', 'ru'] as const)(
    'renders consumer order without debug/Unknown for %s',
    (lang) => {
      const model = buildEvaluatePresentation(runtimePkg(), lang);
      expect(model).not.toBeNull();
      const { container } = render(
        <EvaluateProductResult lang={lang} model={model!} />
      );
      const root = screen.getByTestId('evaluate-product-result');
      expect(root.getAttribute('dir')).toBe(getAskProductCopy(lang).dir);

      const text = container.textContent ?? '';
      expect(text).not.toMatch(/\bUnknown\b/);
      expect(text).not.toMatch(/engine_id|dq_status|schema_version|Package/i);
      expect(text).not.toMatch(/best window|alternative|avoid/i);
      expect(screen.getByTestId('result-verdict').textContent).toBe(
        model!.verdict
      );
      expect(screen.getByTestId('result-meaning').textContent).toBe(
        model!.meaning
      );

      const html = container.innerHTML;
      const topicAt = html.indexOf(model!.topic);
      const dateAt = html.indexOf(model!.date.primary);
      const verdictAt = html.indexOf(model!.verdict);
      const meaningAt = html.indexOf(model!.meaning);
      expect(topicAt).toBeGreaterThanOrEqual(0);
      expect(dateAt).toBeGreaterThan(topicAt);
      expect(verdictAt).toBeGreaterThan(dateAt);
      expect(meaningAt).toBeGreaterThan(verdictAt);
    }
  );
});
