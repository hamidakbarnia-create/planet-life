import { initials } from '@/lib/people-storage';

export function PersonAvatar({
  name,
  photoDataUrl,
  size = 48,
  borderColor = 'rgba(255,255,255,0.15)',
}: {
  name: string;
  photoDataUrl?: string;
  size?: number;
  borderColor?: string;
}) {
  if (photoDataUrl) {
    return (
      <img
        src={photoDataUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover border-2"
        style={{ width: size, height: size, borderColor }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold border-2"
      style={{
        width: size,
        height: size,
        background: 'rgba(251,191,36,0.12)',
        color: '#fbbf24',
        borderColor,
        fontSize: size * 0.32,
      }}
    >
      {initials(name)}
    </div>
  );
}
