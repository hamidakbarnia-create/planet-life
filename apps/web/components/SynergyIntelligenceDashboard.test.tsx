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
    expect(businessView.sectionTitle).toContain('Business Partner');
    expect(spouseView.sectionTitle).toContain('Spouse');
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
});
