/** Planet Life natal chart calculation defaults — single source for UI and docs. */
export const CHART_DEFAULTS = {
  zodiac: 'Tropical',
  zodiacKey: 'tropical',
  houseSystem: 'Placidus',
  houseSystemKey: 'placidus',
  nodeType: 'Mean Node (☊)',
  nodeTypeKey: 'mean',
  siderealAyanamsa: 'Fagan-Bradley',
  ephemeris: 'Swiss Ephemeris',
} as const;

export const CHART_TRUST_LINE =
  'Calculated with Swiss Ephemeris. Timezone and coordinates are shown in Calculation Details.';
