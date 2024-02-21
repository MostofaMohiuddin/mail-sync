import { useEffect, useState } from 'react';

import { Flex, Spin } from 'antd';
import parse from 'html-react-parser';
import useSWR from 'swr';

import * as api from '../../../api/Mail';

export default function SummarizeMail({ text }: { text: string }) {
  const [summary, setSummary] = useState('');

  const { data, isLoading } = useSWR(['/mails/process-with-ai', text, 'SUMMARY'], () =>
    api.processMailWithAI({ data: { message: text, request_type: 'SUMMARY' } }),
  );

  useEffect(() => {
    setSummary(data?.data?.processed_mail || '');
  }, [data]);

  return (
    <>
      {/* <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px' }}>Summary</div> */}
      {isLoading ? (
        <Flex justify="center" align="center">
          <Spin tip="Loading..." size="default"></Spin>
        </Flex>
      ) : (
        <div style={{ fontSize: '0.9rem', textAlign: 'justify' }}>{parse(summary)}</div>
      )}
    </>
  );
}
