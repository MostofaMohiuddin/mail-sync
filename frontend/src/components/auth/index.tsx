import { useEffect } from 'react';

import { Outlet, useNavigate } from 'react-router-dom';

import { useSession } from '../../hooks/userSession';
import Loader from '../Loader';

export const RequireAuth = () => {
  const { getUser, accessToken, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessToken && !loading) {
      navigate('/sign-in'); // Redirect to sign-in page if there's no access token
    } else {
      getUser();
    }
  }, [accessToken, loading]);

  if (loading) {
    return <Loader loading />;
  }

  return <Outlet />;
};
