import { useEffect, useState } from 'react';

import { CopyOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Spin, Tooltip } from 'antd';
import parse from 'html-react-parser';
import { convert } from 'html-to-text';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import useSWR from 'swr';

import * as api from '../../../api/Mail';

export default function AiReplyMail({ receivedMailBody }: { receivedMailBody: string }) {
  const [aiReply, setAiReply] = useState('');

  const { data, isLoading } = useSWR(['/mails/process-with-ai', receivedMailBody, 'REPLY'], () =>
    api.processMailWithAI({ data: { message: receivedMailBody, request_type: 'REPLY' } }),
  );

  useEffect(() => {
    setAiReply(data?.data?.processed_mail || '');
  }, [data]);

  return (
    <>
      <Card
        title="AI Reply"
        size="small"
        extra={
          <CopyToClipboard text={convert(aiReply)} onCopy={() => {}}>
            <Tooltip title="copy">
              <Button type="text" shape="circle" icon={<CopyOutlined />} disabled={isLoading} />
            </Tooltip>
          </CopyToClipboard>
        }
      >
        {isLoading ? (
          <Flex justify="center" align="center">
            <Spin tip="Loading..." size="default"></Spin>
          </Flex>
        ) : (
          <div style={{ fontSize: '0.9rem', textAlign: 'justify' }}>{parse(aiReply)}</div>
        )}
      </Card>
    </>
  );
}
