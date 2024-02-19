import { Avatar, Flex, Typography } from 'antd';
import parse from 'html-react-parser';

import type { IEmailFullData } from '../../../common/types';
import { generateAvatarText, generateRandomColor } from '../../../common/utility';

export default function MailViewer({ mail }: { mail: IEmailFullData }) {
  return (
    <>
      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px' }}>{mail.subject}</div>
      <Flex justify="space-between">
        <Flex>
          <Avatar style={{ backgroundColor: generateRandomColor(mail.sender.name || mail.sender.email) }} size={50}>
            {generateAvatarText(mail?.sender?.name || mail?.sender?.email || '')}
          </Avatar>
          <Flex vertical justify="space-between" style={{ padding: '2px 16px' }}>
            <Typography.Text strong style={{ fontSize: '1rem' }}>
              {mail.sender.name ? `${mail.sender.name} <${mail.sender.email}>` : mail.sender.email}
            </Typography.Text>
            <Typography.Text type="secondary">To: {mail.receiver.email}</Typography.Text>
          </Flex>
        </Flex>
        <Typography.Text type="secondary">
          {new Date(mail.date).toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography.Text>
      </Flex>
      <div style={{ marginTop: '32px' }}>{parse(mail.body.html || mail.body.plain || '')}</div>
    </>
  );
}
