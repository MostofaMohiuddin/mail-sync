import { useState } from 'react';

import { CopyOutlined, ThunderboltOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Spin, Tooltip, Input, Divider } from 'antd';
import parse from 'html-react-parser';
import { convert } from 'html-to-text';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import * as api from '../../../api/Mail';
import { IProcessEmailType } from '../../../common/types';

export default function AiGenerateMail() {
  const [aiReply, setAiReply] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchAiReply = async () => {
    setIsLoading(true);
    const res = await api.processMailWithAI({ data: { message: prompt, request_type: IProcessEmailType.GENERATE } });
    setAiReply(res?.data?.processed_mail || '');
    setIsLoading(false);
  };

  return (
    <>
      <Card
        title="AI Generated Mail"
        size="small"
        actions={[
          <Tooltip title="Copy" key="copy">
            <CopyToClipboard text={convert(aiReply)} onCopy={() => {}}>
              <Button type="text" shape="circle" icon={<CopyOutlined />} disabled={isLoading || prompt === ''} />
            </CopyToClipboard>
          </Tooltip>,
          <Tooltip title="Clear" key="clear">
            <Button
              onClick={() => {
                setPrompt('');
                setAiReply('');
              }}
              disabled={isLoading || prompt === ''}
              shape="circle"
              icon={<DeleteOutlined />}
              type="text"
            />
          </Tooltip>,
          <Tooltip title="Generate" key="generate">
            <Button
              onClick={fetchAiReply}
              disabled={isLoading || prompt === ''}
              shape="circle"
              icon={<ThunderboltOutlined />}
              type="text"
            />
          </Tooltip>,
        ]}
      >
        <div style={{ marginBottom: 8, transition: 'all 0.3s' }}>
          {isLoading ? (
            <Flex justify="center" align="center">
              <Spin tip="Loading..." size="default"></Spin>
            </Flex>
          ) : (
            <div style={{ fontSize: '0.9rem', textAlign: 'justify' }}>{parse(aiReply)}</div>
          )}
        </div>
        {aiReply && <Divider />}
        <Input.TextArea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{ resize: 'none', border: 'none', boxShadow: 'none' }}
          autoSize={{ minRows: 2, maxRows: 5 }}
          placeholder="What email would you like to generate with AI?"
        />
        {/* <Flex justify="end" style={{ marginTop: '8px' }}>
          <Button onClick={fetchAiReply} disabled={isLoading || prompt === ''} icon={<ThunderboltOutlined />}>
            Generate
          </Button>
        </Flex> */}
      </Card>
    </>
  );
}
