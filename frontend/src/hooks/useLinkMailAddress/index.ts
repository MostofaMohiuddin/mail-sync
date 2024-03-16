import { useCallback, useState } from 'react';

import * as api from '../../api/LinkMailAddress';
import type { EmailType, IUserLinkedMail } from '../../common/types';

export const useLinkMailAddress = () => {
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
