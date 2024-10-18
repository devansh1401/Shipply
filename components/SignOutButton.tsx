'use client';

import { signOutAction } from '@/app/actions/signOutAction';

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit">Sign out</button>
    </form>
  );
}
