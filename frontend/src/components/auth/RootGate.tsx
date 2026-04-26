import { useSession } from '../../hooks/userSession';
import Home from '../../pages/home';
import Landing from '../../pages/landing';
import Layout from '../layout';

export const RootGate = () => {
  const { isAuthenticated } = useSession();
  if (isAuthenticated) {
    return (
      <Layout title="Home">
        <Home />
      </Layout>
    );
  }
  return <Landing />;
};
