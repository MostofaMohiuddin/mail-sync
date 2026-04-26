import { InboxOutlined } from '@ant-design/icons';
import { Divider, Skeleton } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useNavigate } from 'react-router-dom';

import type { IEmailMetadata } from '../../../common/types';
import EmptyState from '../../../components/ui/EmptyState';
import MailListItem from '../../../components/ui/MailListItem';
import { useThemeMode } from '../../../hooks/useThemeMode';

export default function EmailList({
  data,
  loadMoreData,
  hasMore,
  isComposeMail,
  isLoading,
}: {
  data: IEmailMetadata[];
  hasMore: boolean;
  loadMoreData: () => void;
  isComposeMail: boolean;
  isLoading: boolean;
}) {
  const navigate = useNavigate();
  const { colors } = useThemeMode();

  if (data.length === 0 && isLoading) {
    return (
      <div style={{ padding: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: 14,
              marginBottom: 8,
              borderRadius: 14,
              background: colors.surfaceMuted,
            }}
          >
            <Skeleton avatar active paragraph={{ rows: 2, width: ['80%', '60%'] }} title={false} />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ paddingTop: 48 }}>
        <EmptyState
          size="lg"
          icon={<InboxOutlined />}
          title="Your inbox is empty"
          description="When new mail arrives, it will appear here."
        />
      </div>
    );
  }

  return (
    <div
      id="scrollableDiv"
      style={{
        height: 'calc(100vh - 240px)',
        overflow: 'auto',
        paddingRight: 4,
        transition: 'all 0.3s',
      }}
    >
      <InfiniteScroll
        dataLength={data.length}
        next={loadMoreData}
        hasMore={hasMore}
        loader={
          <div
            style={{
              padding: 14,
              marginBottom: 8,
              borderRadius: 14,
              background: colors.surfaceMuted,
            }}
          >
            <Skeleton avatar active paragraph={{ rows: 2 }} title={false} />
          </div>
        }
        endMessage={
          <Divider plain style={{ color: colors.textTertiary, fontSize: 12 }}>
            You&apos;re all caught up · {data.length} message{data.length === 1 ? '' : 's'}
          </Divider>
        }
        scrollableTarget="scrollableDiv"
      >
        {data.map((item) => (
          <MailListItem
            key={`${item.id}-${item.receiver?.email}`}
            sender={item.sender.name ? item.sender.name : item.sender.email}
            subject={item.subject}
            snippet={item.snippet}
            date={item.date}
            receiver={item.receiver.email}
            onClick={() => navigate(`/emails/${item.receiver.email}/${item.id}`)}
          />
        ))}
      </InfiniteScroll>
      {isComposeMail && null}
    </div>
  );
}
