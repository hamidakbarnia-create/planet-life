import { notFound } from 'next/navigation';
import { ChartTestClient } from './ChartTestClient';

/** Dev-only visual regression page. Blocked in production unless PLAYWRIGHT test flag is set. */
export default function ChartTestPage() {
  const allowTest =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_CHART_TEST === '1';

  if (!allowTest) {
    notFound();
  }

  return <ChartTestClient />;
}
