import { useCallback, useState } from 'react';

import * as api from '../../api/Mail';
import type { EmailType } from '../../common/types';

export interface IUserLinkedMail {
  username: string;
  email: string;
  picture: string;
  email_name: string;
}

export const useMail = () => {
  const [loading, setLoading] = useState(false);

  const getLinkedMails = useCallback(async (): Promise<IUserLinkedMail[]> => {
    setLoading(true);
    const { response } = await api.getLinkedMailAddress();
    setLoading(false);
    return response?.data;
  }, []);

  const getOauthUrl = useCallback(async (email_type: EmailType) => {
    setLoading(true);
    const { response } = await api.getOauthUrl({ query: `email_type=${email_type}` });
    setLoading(false);
    return response?.data;
  }, []);

  const linkMailAddress = useCallback(async (code: string, email_type: EmailType) => {
    setLoading(true);
    const { response } = await api.linkMailAddress({ data: { code, email_type } });
    setLoading(false);
    return response?.data;
  }, []);

  return {
    loading,
    getLinkedMails,
    getOauthUrl,
    linkMailAddress,
  };
};
