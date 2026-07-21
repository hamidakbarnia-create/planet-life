/** Map English DecisionFrame scaffold phrases to locale-aware display copy. */

import type { AppLang } from '@/lib/app-settings';
import { askCopy } from './ask-local-copy';
import { localizeIntent } from '@/lib/decision-ui-i18n';
import type { AskIntent, TimeHorizon } from './types';

const FRAME_PHRASE_KEYS: Record<string, string> = {
  'Time horizon not stated': 'frame.unknown.timeHorizon',
  'Explicit options not stated': 'frame.unknown.options',
  'Decision verb unclear': 'frame.unknown.decisionVerb',
  'Main concern not fully stated': 'frame.unknown.mainConcern',
  'Treating timing as flexible unless clarified': 'frame.assumption.timingFlexible',
  'Framing as a proceed / wait / gather-information decision':
    'frame.assumption.proceedWaitGather',
  'Interpreting the question as a decision-support request':
    'frame.assumption.decisionSupport',
  'Identify the highest-leverage next move for the stated question':
    'frame.objective.default',
  'Primary concern not fully stated': 'frame.concern.unstated',
  'Stated concern around downside or regret': 'frame.concern.downside',
  'Financial or resource exposure (inferred)': 'frame.concern.financial',
  'People impact (inferred)': 'frame.concern.people',
  'Unknown — reversibility not stated': 'frame.reversibility.unknown',
  'Low — language suggests hard-to-reverse outcomes': 'frame.reversibility.low',
  'High — reversible or trial framing present': 'frame.reversibility.high',
  'Untitled decision': 'run.untitled',
};

export function localizeFramePhrase(locale: AppLang, text: string): string {
  const key = FRAME_PHRASE_KEYS[text.trim()];
  if (key) return askCopy(locale, key);
  // Composite objectives that embed the user question
  const resolve =
    /^Resolve whether to proceed:\s*(.+)$/i.exec(text.trim()) ||
    /^Improve outcomes related to:\s*(.+)$/i.exec(text.trim());
  if (resolve) {
    return askCopy(locale, 'frame.objective.resolve', { detail: resolve[1]! });
  }
  return text;
}

export function localizeFrameHorizon(
  locale: AppLang,
  horizon: TimeHorizon
): string {
  return askCopy(locale, `frame.horizon.${horizon}`);
}

export function localizeFrameIntent(locale: AppLang, intent: AskIntent): string {
  return localizeIntent(intent, locale);
}

export function localizeFrameList(locale: AppLang, items: string[]): string {
  return items.map((item) => localizeFramePhrase(locale, item)).join('; ');
}
