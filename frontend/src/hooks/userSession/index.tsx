import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

import * as api from '../../api/User';
import type { IUser } from '../../common/types';

interface IUserCtx {
  loading: boolean;
  accessToken: string | null;
  setAccessToken: any;
  refreshToken: string | null;
  user: IUser | null;
  getUser: () => Promise<void>;
  setRefreshToken: any;
  error: string | null;
}

const SessionContext = createContext<IUserCtx>({
  loading: false,
  accessToken: null,
  setAccessToken: null,
  refreshToken: null,
  user: null,
  getUser: async () => {},
  setRefreshToken: null,
  error: null,
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (storedAccessToken) setAccessToken(storedAccessToken);
    if (storedRefreshToken) setRefreshToken(storedRefreshToken);
    getUser();
  }, []);

  const getUser = async () => {
    try {
      setLoading(true);
      const { response } = await api.getUser();
      setUser(response?.data);
    } catch (e) {
      setError('Error fetching user data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{ loading, accessToken, setAccessToken, refreshToken, setRefreshToken, user, getUser, error }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  return useContext(SessionContext);
};
