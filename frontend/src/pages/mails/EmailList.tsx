import { Avatar, Flex, List, Typography } from 'antd';
import parse from 'html-react-parser';
import { useNavigate } from 'react-router-dom';

import type { IEmailMetadata } from '../../common/types';
import { generateAvatarText, generateRandomColor } from '../../common/utility';

export default function EmailList({ data, loading }: { data: IEmailMetadata[]; loading: boolean }) {
  const navigate = useNavigate();
  const dataSource = data
    ? data.map((item) => {
        return {
          sender: item.sender.name ? item.sender.name : item.sender.email,
          subject: item.subject,
          snippet: item.snippet,
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
          receiver: item.receiver.email,
          id: item.id,
        };
      })
    : [];
  return (
    <List
      loading={loading}
      itemLayout="horizontal"
      dataSource={dataSource}
      renderItem={(item) => (
        <List.Item
          style={{ cursor: 'pointer' }}
          key={item.date}
          onClick={() => {
            navigate(`/emails/${item.receiver}/${item.id}`);
          }}
          extra={
            <Flex vertical align="flex-end">
              <Typography.Text type="secondary" style={{ fontSize: '0.8rem' }}>
                {item.date}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: '0.8rem' }}>
                {item.receiver}
              </Typography.Text>
            </Flex>
          }
        >
          <Flex>
            <Flex>
              <div style={{ marginRight: '0.8rem', paddingTop: '0.2rem' }}>
                <Avatar style={{ backgroundColor: generateRandomColor(item.sender) }} size="large">
                  {<span>{generateAvatarText(item.sender)}</span>}
                </Avatar>
              </div>
              <Flex justify="space-between" align="flex-start" vertical>
                <Typography.Text strong style={{ fontSize: '1rem' }}>
                  {item.sender}
                </Typography.Text>
                <Typography.Text strong ellipsis style={{ width: '50vw' }}>
                  {item.subject}
                </Typography.Text>
                <Typography.Text type="secondary" ellipsis style={{ width: '50vw' }}>
                  {parse(item.snippet)}
                </Typography.Text>
              </Flex>
            </Flex>
          </Flex>
        </List.Item>
      )}
    />
  );
}
