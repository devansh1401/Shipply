import { signOut } from '@/auth';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
    >
      Sign out
    </button>
  );
}
