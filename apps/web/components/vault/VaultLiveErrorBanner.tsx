import {
  vaultLiveErrorMessage,
  type VaultLiveErrorCopy,
} from '@/lib/vault-section-i18n';
import type { VaultRequestErrorKind } from '@/lib/vault-reading';

export function VaultLiveErrorBanner({
  kind,
  copy,
}: {
  kind: VaultRequestErrorKind;
  copy: VaultLiveErrorCopy;
}) {
  return (
    <p
      className="fi text-xs leading-relaxed"
      data-testid={`vault-reading-${kind}-error`}
      style={{ color: 'rgba(248,113,113,0.85)' }}
    >
      {vaultLiveErrorMessage(kind, copy)}
    </p>
  );
}
