import { auth } from '@/auth';
import { MainPage } from '@/components/main-page';
import SignInButton from '@/components/SignInButton';

export default async function Home() {
  const session = await auth();

  return (
    <div>
      {session ? (
        <MainPage session={session} />
      ) : (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">
            Welcome to the On-Demand Logistics Platform
          </h1>
          <p className="mb-4">
            Please sign in to book a ride or access the driver dashboard
          </p>
          <SignInButton />
        </div>
      )}
    </div>
  );
}
