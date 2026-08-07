import type { OperationResultViewModel } from '@/lib/decision-frame';
import { CompareResultView } from './CompareResultView';
import { EvaluateResultView } from './EvaluateResultView';
import { FindResultView } from './FindResultView';

export function OperationResultRouter({
  model,
}: {
  model: OperationResultViewModel;
}) {
  if (model.operation === 'compare') {
    return <CompareResultView model={model} />;
  }
  if (model.operation === 'find') {
    return <FindResultView model={model} />;
  }
  return <EvaluateResultView model={model} />;
}
