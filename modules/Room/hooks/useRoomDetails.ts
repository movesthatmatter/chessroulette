import { useParams } from 'next/navigation';

export const useRoomDetails = () => {
  const params = useParams<Partial<{ roomId: string }>>();

  if (!params.roomId) {
    return undefined;
  }

  return {
    roomId: params.roomId,
  };
};
