import { auth } from '@/auth';
import SignInButton from '@/components/SignInButton';
import SignOutButton from '@/components/SignOutButton';

export default async function Home() {
  const session = await auth();

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      {session ? (
        <div>
          <p>Signed in as {session.user?.name}</p>
          <SignOutButton />
        </div>
      ) : (
        <div>
          <p>Not signed in</p>
          <SignInButton />
        </div>
      )}
    </div>
  );
}
