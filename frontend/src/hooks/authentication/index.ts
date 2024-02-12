import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import * as api from '../../api/Authentication';
import type { ISignInData, ISignUpData } from '../../common/types';

export const useAuthentication = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const signIn = useCallback(async (data: ISignInData) => {
    setLoading(true);
    const { response } = await api.signIn({ ...data });
    if (response?.data) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      navigate('/'); // Redirect to home page after sign in
    }
    setLoading(false);
  }, []);

  const signUp = useCallback(async (data: ISignUpData) => {
    setLoading(true);
    await api.signUp({ ...data });
    setLoading(false);
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
