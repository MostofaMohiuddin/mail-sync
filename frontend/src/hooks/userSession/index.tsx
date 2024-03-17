import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';

import * as authApi from '../../api/Authentication';
import * as mailApi from '../../api/LinkMailAddress';
import * as userApi from '../../api/User';
import type { ISignInData, IUser, IUserLinkedMail } from '../../common/types';
import Loader from '../../components/Loader';

interface IUserCtx {
  user: IUser | null;
  linkedMailAddresses: IUserLinkedMail[] | null;
  isAuthenticated: boolean;
  signIn: (data: ISignInData) => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<IUserCtx>({
  user: null,
  linkedMailAddresses: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  signIn: async () => {},
  signOut: () => {},
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState(null);
  const [linkedMailAddresses, setLinkedMailAddresses] = useState<IUserLinkedMail[] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const navigate = useNavigate();
  const { mutate } = useSWRConfig();

  const clearCache = () => mutate(() => true, undefined, false);

  useEffect(() => {
    // Check if access token exists in local storage
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      // If access token exists, update isAuthenticated to true
      setIsAuthenticated(true);
    }
  }, []);

  const hasAccessToken = !!localStorage.getItem('access_token');

  const { data: userData, isLoading: isUserLoading } = useSWR(hasAccessToken ? '/user' : null, userApi.getUser);
  const { data: linkedMailAddressResponse, isLoading: isLinkMailAddressLoading } = useSWR(
    hasAccessToken ? '/link-mail-address' : null,
    mailApi.getLinkedMailAddress,
  );

  useEffect(() => {
    setUser(userData?.data);
  }, [userData]);

  useEffect(() => {
    setLinkedMailAddresses(linkedMailAddressResponse?.data);
  }, [linkedMailAddressResponse]);

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
    clearCache();
    // Update isAuthenticated to false
    setIsAuthenticated(false);
    // Navigate to login page or any other route
    navigate('/sign-in');
  };

  return (
    <SessionContext.Provider value={{ user, isAuthenticated, signIn, signOut, linkedMailAddresses }}>
      {isUserLoading || isLinkMailAddressLoading ? <Loader loading /> : children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  return useContext(SessionContext);
};
