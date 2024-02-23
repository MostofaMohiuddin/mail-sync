import { useState } from 'react';

import { SendOutlined } from '@ant-design/icons';
import { Button, Flex, Select, notification } from 'antd';

import ReplyDataInput from './ReplyDataInput';
import * as api from '../../../api/Mail';
import RichTextEditor from '../../../components/RichTextEditor';
import { useSession } from '../../../hooks/userSession';

export default function UserReplyMail({ receiverEmail }: { receiverEmail?: string }) {
  const [plainBody, setPlainBody] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [receiver, setReceiver] = useState(receiverEmail || '');
  const [subject, setSubject] = useState('');
  const [sender, setSender] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { linkedMailAddresses } = useSession();

  const sendMail = async () => {
    setIsLoading(true);
    const res = await api.sendMail({ data: { receiver, subject, body: { html: htmlBody, plain: plainBody }, sender } });
    if (res?.data?.labelIds?.length > 0 && res?.data?.labelIds[0] === 'SENT') {
      notification.success({
        message: 'Mail Sent',
        description: 'Your mail has been sent successfully.',
      });
    }
    setIsLoading(false);
  };

  return (
    <>
      <div
        style={{
          border: '1px solid #ddd',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          padding: '8px 10px',
          backgroundColor: '#f5f5f5',
          fontSize: '0.9rem',
          fontWeight: 'bold',
        }}
      >
        New Mail
      </div>

      <ReplyDataInput value={receiver} setValue={setReceiver} placeholder="Recipient" />
      <ReplyDataInput value={subject} setValue={setSubject} placeholder="Subject" />
      <Flex
        justify="space-between"
        align="center"
        style={{ border: '1px solid #ddd', borderBottom: 'none', padding: '4px 0px' }}
      >
        <Select
          value={sender}
          defaultValue="lucy"
          style={{ width: '100%', fontSize: '0.85rem' }}
          variant="borderless"
          onChange={(value) => {
            setSender(value);
          }}
          placeholder="Sender"
          options={linkedMailAddresses?.map((mail) => ({
            value: mail.email,
            label: `From: ${mail.email_name} <${mail.email}>`,
            email: mail.email,
            name: mail.email_name,
            picture: mail.picture,
          }))}
          optionRender={(option) => (
            <Flex align="center" justify="start">
              <img
                src={option.data.picture}
                alt={option.data.name}
                style={{ width: '24px', height: '24px', borderRadius: '50%' }}
              />
              <span style={{ paddingLeft: '0.5rem' }}>{option.data.email}</span>
            </Flex>
          )}
        />
      </Flex>

      <RichTextEditor setHtmlValue={setHtmlBody} setPlainValue={setPlainBody} />

      <Flex justify="flex-end" style={{ marginTop: '8px' }}>
        <span></span>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={sendMail}
          loading={isLoading}
          disabled={htmlBody && plainBody && sender && receiver && subject ? false : true}
        >
          Send
        </Button>
      </Flex>
    </>
  );
}
