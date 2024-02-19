import { useCallback, useState } from 'react';

import useSWR from 'swr';

import * as api from '../../api/Mail';
import type { IEmailFullData } from '../../common/types';

export const useMail = () => {
  const [loading, setLoading] = useState(false);
  const { data } = useSWR('/mails', api.getMails, { revalidateOnFocus: false });
  console.log(data);

  //   const getMails = useCallback(async (): Promise<IEmailMetadata[]> => {
  //     setLoading(true);
  //     const { response } = await api.getMails();
  //     setLoading(false);
  //     return response?.data;
  //   }, []);
  const getMails = useCallback(async (): Promise<any> => {
    const data = await api.getMails();
    console.log(data);
    return data.data;
  }, []);

  const getMail = useCallback(async (mail_id: string, mail_address: string): Promise<IEmailFullData> => {
    setLoading(true);
    const { response } = await api.getMail({ param: { mail_id, mail_address } });
    setLoading(false);
    return response?.data;
  }, []);

  const summarizeMail = useCallback(async (message: string): Promise<string> => {
    setLoading(true);
    const { response } = await api.summarizeMail({ data: { message, request_type: 'SUMMARY' } });
    setLoading(false);
    return response?.data?.processed_mail;
  }, []);

  return {
    loading,
    getMails,
    getMail,
    summarizeMail,
  };
};
