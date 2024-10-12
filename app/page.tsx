import { auth } from '@/auth';
import SignInButton from '@/components/SignInButton';
import SignOutButton from '@/components/SignOutButton';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">
        Welcome to the On-Demand Logistics Platform
      </h1>
      {session ? (
        <div>
          <p className="mb-4">Signed in as {session.user?.name}</p>
          <Link
            href="/booking"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
          >
            Book Now
          </Link>
          <SignOutButton />
        </div>
      ) : (
        <div>
          <p className="mb-4">Please sign in to book a ride</p>
          <SignInButton />
        </div>
      )}
    </div>
  );
}
