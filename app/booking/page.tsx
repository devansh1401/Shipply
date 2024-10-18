import { auth } from '@/auth';
import BookingPageComponent from '@/components/booking-page';

export default async function BookingPage() {
  const session = await auth();

  return <BookingPageComponent session={session} />;
}
