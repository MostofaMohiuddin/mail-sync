import { Avatar, Divider, Flex, List, Skeleton, Typography } from 'antd';
import parse from 'html-react-parser';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useNavigate } from 'react-router-dom';

import type { IEmailMetadata } from '../../common/types';
import { generateAvatarText, generateRandomColor } from '../../common/utility';

export default function EmailList({
  data,
  loadMoreData,
}: {
  data: IEmailMetadata[];
  hasMore: boolean;
  loadMoreData: () => void;
}) {
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
    <div id="scrollableDiv" style={{ height: '80vh', overflow: 'auto', padding: '0 16px' }}>
      <InfiniteScroll
        dataLength={data.length}
        next={loadMoreData}
        hasMore={true}
        loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
        endMessage={<Divider plain>It is all, nothing more 🤐</Divider>}
        scrollableTarget="scrollableDiv"
      >
        <List
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
      </InfiniteScroll>
    </div>
  );
}
