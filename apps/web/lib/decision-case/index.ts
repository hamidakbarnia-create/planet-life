export {
  CANONICAL_CAR_INTERVIEW_FIELD_IDS,
  CANONICAL_CAR_INTERVIEW_REQUIRED_FIELD_IDS,
  CAR_INTERVIEW_DECISION_TYPE_ID,
  CAR_INTERVIEW_FAMILY_ID,
  CAR_INTERVIEW_FORM_FIELDS,
  CAR_INTERVIEW_LABEL,
  demoHasFirstRequiredAnswer,
  demoMissingRequiredFields,
  demoRequiredFieldsPresent,
  mergeCarInterviewFormAnswers,
  normalizeFormAnswer,
  type CarInterviewFormField,
  type CarInterviewIntake,
  type CarInterviewSlotId,
} from './car-interview-form';
export {
  DEMO_STUB_NOTICE,
  STUB_ENGINE_ID,
  assertPackageRenderContract,
  bindDemoStubPackage,
} from './demo-stub-fixture';
export {
  bindDemoCarInterviewPackage,
  getDemoCase,
  listDemoCases,
  listLocalDemoEvents,
  resetClientDemoAdapterForTests,
  saveDemoCarInterviewAnswers,
  type DemoCaseRecord,
  type DemoUiState,
  type LocalDemoEvent,
} from './client-demo-adapter';
export type { DecisionEvaluationPackage } from './package-types';
