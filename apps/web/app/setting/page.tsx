import { redirect } from 'next/navigation';

/** Legacy URL — some bookmarks use /setting (singular). */
export default function SettingRedirectPage() {
  redirect('/settings');
}
