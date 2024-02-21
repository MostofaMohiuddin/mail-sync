import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';

import * as authApi from '../../api/Authentication';
import * as userApi from '../../api/User';
import type { ISignInData, IUser } from '../../common/types';
import Loader from '../../components/Loader';

interface IUserCtx {
  user: IUser | null;
  isAuthenticated: boolean;
  signIn: (data: ISignInData) => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<IUserCtx>({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  signIn: async () => {},
  signOut: () => {},
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();
  useEffect(() => {
    // Check if access token exists in local storage
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      // If access token exists, update isAuthenticated to true
      setIsAuthenticated(true);
    }
  }, []);

  const hasAccessToken = !!localStorage.getItem('access_token');

  const { data, isLoading } = useSWR(hasAccessToken ? '/user' : null, userApi.getUser);

  useEffect(() => {
    setUser(data?.data);
  }, [data]);

  const signIn = async (data: ISignInData) => {
    const { response } = await authApi.signIn({ ...data });
    if (response) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      setIsAuthenticated(true); // Update isAuthenticated after signing in
      navigate('/');
    }
  };
  const signOut = () => {
    // Remove access token from local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Update isAuthenticated to false
    setIsAuthenticated(false);
    // Navigate to login page or any other route
    navigate('/sign-in');
  };

  return (
    <SessionContext.Provider value={{ user, isAuthenticated, signIn, signOut }}>
      {isLoading ? <Loader loading /> : children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  return useContext(SessionContext);
};
