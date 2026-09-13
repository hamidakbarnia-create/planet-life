import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VAULT_READING_PRESENTATION_COPY } from '@/lib/vault-reading-presentation';

import { VaultConfidentialReading } from './VaultConfidentialReading';

describe('Arabic perfume explanation ownership', () => {
  it('renders alternatives once on older comma-joined payloads and keeps personality', () => {
    render(
      <VaultConfidentialReading
        lang="ar"
        reading={{
          executive: 'اتجاه عطري اختياري',
          strategic:
            'هذه مجموعات نغمات بديلة للمقارنة، وليست مزيجاً واحداً مطلوباً، ولا تصف الشخصية.',
          technical: '',
          headline: 'اتجاه عطري اختياري',
          action: 'يمكن مقارنة النغمات',
          interpretation:
            'هذه مجموعات نغمات بديلة للمقارنة، وليست مزيجاً واحداً مطلوباً، ولا تصف الشخصية.',
          evidence_status: 'unvalidated',
          data_completeness: 'supplied_unverified',
          limitation: 'العطر خيار اختياري للمظهر.',
          details: [{ label: 'النغمات العطرية', value: 'ورد + صندل' }],
        }}
        labels={VAULT_READING_PRESENTATION_COPY.ar}
      />,
    );
    expect(screen.queryByTestId('vault-scent-alternatives')).toBeNull();
    expect(
      screen.getByTestId('vault-confidential-reading').textContent,
    ).toContain('ولا تصف الشخصية');
    expect(screen.getByText('ورد + صندل')).toBeTruthy();
  });
});
