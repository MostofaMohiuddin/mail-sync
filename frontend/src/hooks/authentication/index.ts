import { useCallback, useState } from 'react';

import * as api from '../../api/Authentication';
import type { ISignInData, ISignUpData } from '../../common/types';

export const useAuthentication = () => {
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async (data: ISignInData) => {
    setLoading(true);
    const { response } = await api.signIn({ ...data });
    setLoading(false);
    return response?.data;
  }, []);

  const signUp = useCallback(async (data: ISignUpData) => {
    setLoading(true);
    const { response } = await api.signUp({ ...data });
    setLoading(false);
    return response?.data;
  }, []);

  const signOut = useCallback(async () => {
    return 'ok';
  }, []);

  return {
    loading,
    signIn,
    signOut,
    signUp,
  };
};
