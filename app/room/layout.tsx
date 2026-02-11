import { Metadata } from 'next';
import { getCustomServerSession } from '@/services/Auth/getCustomServerSession';
import { MovexProvider } from '@/providers/MovexProvider';
import { authOptions } from '@/services/Auth';

export const metadata: Metadata = {
  title: 'Room | Chessroulette',
  description: '',
};

export default async function RoomLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MovexProvider session={await getCustomServerSession(authOptions)}>
      {children}
    </MovexProvider>
  );
}
