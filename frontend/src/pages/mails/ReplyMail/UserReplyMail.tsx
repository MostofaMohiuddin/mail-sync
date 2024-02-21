import { useState } from 'react';

import { SendOutlined } from '@ant-design/icons';
import { Button, Flex, Input } from 'antd';

import RichTextEditor from '../../../components/RichTextEditor';

export default function UserReplyMail() {
  const [userReply, setUserReply] = useState('');

  return (
    <>
      <Flex
        justify="space-between"
        align="center"
        style={{ border: '1px solid #ddd', borderBottom: 'none', borderRadius: '8px 8px 0 0', padding: '0 8px' }}
      >
        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>To</span>
        <Input placeholder="email" variant="borderless" />
      </Flex>

      <RichTextEditor setHtmlValue={setUserReply} />

      <Flex justify="flex-end" style={{ marginTop: '8px' }}>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => {
            console.log(userReply);
          }}
          disabled
        >
          Send
        </Button>
      </Flex>
    </>
  );
}
