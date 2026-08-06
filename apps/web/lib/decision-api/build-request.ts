import type { AppLang } from '../app-settings';
import type { ExecutableDecisionRequest } from '../decision-execution';
import type { ProfileRecord } from '../profile/profile-types';
import type {
  BuildDecisionExecuteRequestResult,
  DecisionExecuteTransportRequest,
} from './types';

export function buildRequestId(
  guidedQuestionId: string,
  actionType: string
): string {
  return `${guidedQuestionId}:${actionType}`;
}

/** Mechanical location string from stored birth place (chart-api convention). */
function profileLocationString(profile: ProfileRecord): string {
  return (
    profile.birth_place?.short?.trim() ||
    profile.birth_place?.name?.trim() ||
    ''
  );
}

/**
 * Build Decision API v1 transport request from Guided Ready inputs only.
 * Mechanical mapping only. Rejections mirror transport-contract constraints;
 * no client-side policy or semantic invention is introduced.
 */
export function buildDecisionExecuteRequest(input: {
  request: ExecutableDecisionRequest;
  profile: ProfileRecord;
  locale: AppLang;
}): BuildDecisionExecuteRequestResult {
  const { request, profile, locale } = input;
  const { execution } = request;

  if (
    !profile.birth_date?.trim() ||
    !profile.birth_time?.trim() ||
    !profile.action_type?.trim()
  ) {
    return { ok: false, reason: 'incomplete_profile' };
  }

  const location = profileLocationString(profile);
  if (!location) {
    return { ok: false, reason: 'missing_location' };
  }

  const latitude = profile.birth_place?.lat;
  const longitude = profile.birth_place?.lon;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, reason: 'invalid_coordinates' };
  }

  const transport: DecisionExecuteTransportRequest = {
    request_id: buildRequestId(execution.guidedQuestionId, execution.actionType),
    display_text: request.displayText,
    action_type: execution.actionType,
    guided_question_id: execution.guidedQuestionId,
    category_id: execution.categoryId,
    needs_time: execution.needsTime,
    locale,
    profile: {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location,
      latitude,
      longitude,
      action_type: profile.action_type,
    },
  };

  return { ok: true, request: transport };
}
