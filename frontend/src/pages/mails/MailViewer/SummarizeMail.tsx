import { useEffect, useState } from 'react';

import { Spin } from 'antd';
import parse from 'html-react-parser';
import useSWR from 'swr';

import * as api from '../../../api/Mail';

export default function SummarizeMail({ text }: { text: string }) {
  const [summary, setSummary] = useState('');

  const { data, isLoading } = useSWR(
    ['/mails/process-with-ai', text],
    () => api.summarizeMail({ data: { message: text, request_type: 'SUMMARY' } }),
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    setSummary(data?.data?.processed_mail || '');
  }, [data]);

  return isLoading ? (
    <Spin tip="Loading..."></Spin>
  ) : (
    <>
      <div style={{ fontSize: '1rem', textAlign: 'justify' }}>{parse(summary)}</div>
    </>
  );
}
