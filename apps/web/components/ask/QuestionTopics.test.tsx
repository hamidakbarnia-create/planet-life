import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QuestionTopics } from '@/components/ask/QuestionTopics';
import { getAllQuestionCategories } from '@/lib/question-library';

const categories = getAllQuestionCategories();

describe('QuestionTopics', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      }
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders category tabs and a dedicated indicator track below them', () => {
    render(
      <QuestionTopics
        categories={categories}
        selectedCategoryId="career-work"
        onSelect={() => {}}
        lang="en"
        label="Suggested topics"
      />
    );

    expect(screen.getByTestId('question-topics')).toBeTruthy();
    expect(screen.getByRole('tablist', { name: /suggested topics/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /career & work/i })).toBeTruthy();
    expect(screen.getByTestId('question-topics-track')).toBeTruthy();
    expect(screen.getByTestId('question-topics-indicator')).toBeTruthy();
  });

  it('marks the selected category and notifies on change', () => {
    const onSelect = vi.fn();
    render(
      <QuestionTopics
        categories={categories}
        selectedCategoryId="career-work"
        onSelect={onSelect}
        lang="en"
        label="Suggested topics"
      />
    );

    const career = screen.getByRole('tab', { name: /career & work/i });
    const love = screen.getByRole('tab', { name: /love & people/i });
    expect(career.getAttribute('aria-selected')).toBe('true');
    expect(love.getAttribute('aria-selected')).toBe('false');

    fireEvent.click(love);
    expect(onSelect).toHaveBeenCalledWith('relationships');
  });

  it('localizes category labels', () => {
    render(
      <QuestionTopics
        categories={categories}
        selectedCategoryId="career-work"
        onSelect={() => {}}
        lang="ru"
        label="Темы для вопроса"
      />
    );

    expect(screen.getByRole('tab', { name: /карьера и работа/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /любовь и люди/i })).toBeTruthy();
  });

  it('positions the indicator with translateX and scaleX only', () => {
    const rect = (left: number, width: number) => ({
      x: left,
      y: 0,
      top: 0,
      bottom: 40,
      left,
      right: left + width,
      width,
      height: 40,
      toJSON() {
        return {};
      },
    });

    render(
      <QuestionTopics
        categories={categories}
        selectedCategoryId="career-work"
        onSelect={() => {}}
        lang="en"
        label="Suggested topics"
      />
    );

    const scroll = screen.getByRole('tablist');
    const tab = screen.getByRole('tab', { name: /career & work/i });
    vi.spyOn(scroll, 'getBoundingClientRect').mockReturnValue(rect(0, 400) as DOMRect);
    vi.spyOn(tab, 'getBoundingClientRect').mockReturnValue(rect(12, 140) as DOMRect);

    fireEvent.scroll(scroll);

    const indicator = screen.getByTestId('question-topics-indicator') as HTMLElement;
    expect(indicator.style.transform).toMatch(/translateX\(12px\)\s*scaleX\(140\)/);
    expect(indicator.style.left).toBe('');
    expect(indicator.style.width).toBe('');
  });
});
