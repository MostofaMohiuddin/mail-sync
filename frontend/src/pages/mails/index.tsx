import { useSession } from '../../hooks/userSession';

export default function Mail() {
  const { user } = useSession();

  return <div>Mail: {user?.username}</div>;
}
