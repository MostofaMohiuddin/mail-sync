import { Outlet, Navigate } from 'react-router-dom';

import { useSession } from '../../hooks/userSession';

export const RequireAuth = () => {
  const { isAuthenticated } = useSession();
  return isAuthenticated ? <Outlet /> : <Navigate to="/sign-in" />;
};
