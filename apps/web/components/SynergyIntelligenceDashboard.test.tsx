import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { SynergyIntelligenceDashboard } from '@/components/SynergyIntelligenceDashboard';
import { RELATIONSHIP_PROFILES } from '@/lib/relationship-profile';
import { buildSynastryReasoning } from '@/lib/synastry-reasoning';
import {
  buildSynergyDashboardView,
  dashboardContainsBusinessIntelligence,
  dashboardContainsRomanticIntelligence,
} from '@/lib/synastry-dashboard';
import { computeSynastry, type SynergyResult } from '@/lib/synergy';

const CHART_A = {
  sun: { longitude: 10 },
  moon: { longitude: 95 },
  mercury: { longitude: 25 },
  venus: { longitude: 40 },
  mars: { longitude: 120 },
  jupiter: { longitude: 200 },
  saturn: { longitude: 300 },
};

const CHART_B = {
  sun: { longitude: 12 },
  moon: { longitude: 98 },
  mercury: { longitude: 30 },
  venus: { longitude: 130 },
  mars: { longitude: 125 },
  jupiter: { longitude: 205 },
  saturn: { longitude: 295 },
};

function buildResult(profileKey: keyof typeof RELATIONSHIP_PROFILES): SynergyResult {
  const profile = RELATIONSHIP_PROFILES[profileKey];
  const syn = computeSynastry(CHART_A, CHART_B, profile);
  const reasoning = buildSynastryReasoning(profile, syn.score, syn.harmony, syn.tension);
  return {
    ...syn,
    bestDays: [],
    profileKey: profile.key,
    reasoning,
    recommendations: [...profile.recommendationTemplates.aligned],
  };
}

afterEach(() => {
  cleanup();
});

describe('SynergyIntelligenceDashboard', () => {
  it('renders six distinct dashboard sections', () => {
    const profile = RELATIONSHIP_PROFILES.business_partner;
    const view = buildSynergyDashboardView('en', profile, buildResult('business_partner'));

    render(
      <SynergyIntelligenceDashboard view={view} lang="en" badgeLabel="Aligned" />
    );

    expect(screen.getByTestId('synergy-intelligence-dashboard')).toBeTruthy();
    expect(screen.getByTestId('section-overall')).toBeTruthy();
    expect(screen.getByTestId('section-strengths')).toBeTruthy();
    expect(screen.getByTestId('section-risks')).toBeTruthy();
    expect(screen.getByTestId('section-profile-intelligence')).toBeTruthy();
    expect(screen.getByTestId('section-recommendations')).toBeTruthy();
    expect(screen.getByTestId('section-evidence')).toBeTruthy();
  });

  it('renders different profile intelligence for business_partner vs spouse', () => {
    const businessView = buildSynergyDashboardView(
      'en',
      RELATIONSHIP_PROFILES.business_partner,
      buildResult('business_partner')
    );
    const spouseView = buildSynergyDashboardView(
      'en',
      RELATIONSHIP_PROFILES.spouse,
      buildResult('spouse')
    );

    expect(businessView.profileIntelligence.map((i) => i.label)).not.toEqual(
      spouseView.profileIntelligence.map((i) => i.label)
    );
    expect(businessView.sectionTitle).toBe('Business Partnership Analysis');
    expect(spouseView.sectionTitle).toBe('Spouse Relationship Analysis');
  });

  it('never shows romantic intelligence cards for business_partner', () => {
    const view = buildSynergyDashboardView(
      'en',
      RELATIONSHIP_PROFILES.business_partner,
      buildResult('business_partner')
    );

    expect(dashboardContainsRomanticIntelligence(view)).toBe(false);

    render(<SynergyIntelligenceDashboard view={view} lang="en" badgeLabel="Caution" />);

    const grid = screen.getByTestId('profile-intelligence-grid');
    expect(within(grid).queryByText(/^Love$/)).toBeNull();
    expect(within(grid).queryByText(/^Parenting$/)).toBeNull();
    expect(within(grid).getByText('Financial Trust')).toBeTruthy();
  });

  it('never shows ownership or governance cards for spouse', () => {
    const view = buildSynergyDashboardView(
      'en',
      RELATIONSHIP_PROFILES.spouse,
      buildResult('spouse')
    );

    expect(dashboardContainsBusinessIntelligence(view)).toBe(false);

    render(<SynergyIntelligenceDashboard view={view} lang="en" badgeLabel="Aligned" />);

    const grid = screen.getByTestId('profile-intelligence-grid');
    expect(within(grid).queryByText(/^Ownership$/)).toBeNull();
    expect(within(grid).queryByText(/^Governance$/)).toBeNull();
    expect(within(grid).getByText('Love')).toBeTruthy();
  });

  it('shows governance and capital growth for investor profile', () => {
    const view = buildSynergyDashboardView(
      'en',
      RELATIONSHIP_PROFILES.investor,
      buildResult('investor')
    );

    render(<SynergyIntelligenceDashboard view={view} lang="en" badgeLabel="Caution" />);

    const grid = screen.getByTestId('profile-intelligence-grid');
    expect(within(grid).getByText('Governance')).toBeTruthy();
    expect(within(grid).getByText('Capital Growth')).toBeTruthy();
    expect(within(grid).getByText('Board Dynamics')).toBeTruthy();
    expect(screen.getByTestId('dashboard-profile-label').textContent).toContain('Investor');
  });

  it('groups recommendations into do more, watch, and avoid', () => {
    const view = buildSynergyDashboardView(
      'en',
      RELATIONSHIP_PROFILES.client,
      buildResult('client')
    );

    render(<SynergyIntelligenceDashboard view={view} lang="en" badgeLabel="Aligned" />);

    expect(screen.getByTestId('rec-group-do-more')).toBeTruthy();
    expect(screen.getByTestId('rec-group-watch')).toBeTruthy();
    expect(screen.getByTestId('rec-group-avoid')).toBeTruthy();
  });

  it('renders featured evidence rows linked from strengths', () => {
    const view = buildSynergyDashboardView(
      'en',
      RELATIONSHIP_PROFILES.cofounder,
      buildResult('cofounder')
    );

    render(<SynergyIntelligenceDashboard view={view} lang="en" badgeLabel="Caution" />);

    expect(view.evidence.length).toBeGreaterThan(0);
    expect(screen.getByTestId('evidence-0')).toBeTruthy();
    if (view.strengths[0]) {
      expect(screen.getByTestId(`evidence-link-${view.strengths[0].evidenceId}`)).toBeTruthy();
    }
  });

  it('localizes FA spouse recommendations and group labels', () => {
    const view = buildSynergyDashboardView(
      'fa',
      RELATIONSHIP_PROFILES.spouse,
      buildResult('spouse')
    );

    render(
      <SynergyIntelligenceDashboard view={view} lang="fa" badgeLabel="هم‌راستا" dir="rtl" />
    );

    expect(screen.getByText('رابطه همسر')).toBeTruthy();
    expect(screen.getByText('بیشتر انجام دهید')).toBeTruthy();
    expect(screen.getByText('با دقت مراقب باشید')).toBeTruthy();
    expect(screen.getByText('اجتناب کنید')).toBeTruthy();

    const englishTemplates = RELATIONSHIP_PROFILES.spouse.recommendationTemplates;
    for (const text of [
      ...englishTemplates.aligned,
      ...englishTemplates.caution,
      ...englishTemplates.tension,
    ]) {
      expect(screen.queryByText(text)).toBeNull();
    }

    for (const rec of [
      ...view.recommendations.doMore,
      ...view.recommendations.watchCarefully,
      ...view.recommendations.avoid,
    ]) {
      expect(rec.text).toMatch(/[\u0600-\u06FF]/);
    }
  });

  it('does not display raw evidence ids in FA recommendations UI', () => {
    const view = buildSynergyDashboardView(
      'fa',
      RELATIONSHIP_PROFILES.spouse,
      buildResult('spouse')
    );

    const { container } = render(
      <SynergyIntelligenceDashboard view={view} lang="fa" badgeLabel="هم‌راستا" dir="rtl" />
    );

    expect(container.textContent).not.toMatch(/evidence-\d+/);
    expect(screen.getByTestId('evidence-link-evidence-0').textContent).toContain('شاهد');
  });

  it('localizes AR spouse recommendations and summary', () => {
    const view = buildSynergyDashboardView(
      'ar',
      RELATIONSHIP_PROFILES.spouse,
      buildResult('spouse')
    );

    render(
      <SynergyIntelligenceDashboard view={view} lang="ar" badgeLabel="متناسق" dir="rtl" />
    );

    const englishTemplates = RELATIONSHIP_PROFILES.spouse.recommendationTemplates;
    for (const text of [
      ...englishTemplates.aligned,
      ...englishTemplates.caution,
      ...englishTemplates.tension,
    ]) {
      expect(screen.queryByText(text)).toBeNull();
    }

    expect(view.overall.summary).toMatch(/[\u0600-\u06FF]/);
    expect(view.overall.summary).not.toContain('compatibility scores');
  });

  it('localizes RU spouse recommendations and summary', () => {
    const view = buildSynergyDashboardView(
      'ru',
      RELATIONSHIP_PROFILES.spouse,
      buildResult('spouse')
    );

    render(
      <SynergyIntelligenceDashboard view={view} lang="ru" badgeLabel="Совместимо" />
    );

    const englishTemplates = RELATIONSHIP_PROFILES.spouse.recommendationTemplates;
    for (const text of englishTemplates.aligned) {
      expect(screen.queryByText(text)).toBeNull();
    }

    expect(view.overall.summary).toMatch(/[А-Яа-яЁё]/);
    expect(view.overall.summary).not.toContain('compatibility scores');
  });

  it('shows stored relationship type on dashboard, not scoring profile key', () => {
    const view = buildSynergyDashboardView(
      'fa',
      RELATIONSHIP_PROFILES.parent_child,
      buildResult('spouse'),
      'mother'
    );

    render(
      <SynergyIntelligenceDashboard view={view} lang="fa" badgeLabel="تنش" dir="rtl" />
    );

    expect(screen.getByTestId('dashboard-profile-label').textContent).toBe('مادر');
    expect(screen.getByText('رابطه مادر')).toBeTruthy();
    expect(view.overall.summary).toContain('مادر');
    expect(view.overall.summary).not.toContain('والد / فرزند');
  });

  it('still renders English recommendations and labels in EN', () => {
    const view = buildSynergyDashboardView(
      'en',
      RELATIONSHIP_PROFILES.spouse,
      buildResult('spouse')
    );

    render(<SynergyIntelligenceDashboard view={view} lang="en" badgeLabel="Aligned" />);

    expect(screen.getByText('Do More')).toBeTruthy();
    expect(screen.getByText('Watch Carefully')).toBeTruthy();
    expect(screen.getByText('Avoid')).toBeTruthy();
    expect(
      screen.getByText(RELATIONSHIP_PROFILES.spouse.recommendationTemplates.aligned[0]!)
    ).toBeTruthy();
  });
});
