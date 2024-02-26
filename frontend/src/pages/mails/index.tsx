// import { useEffect } from 'react';

import { useEffect, useState } from 'react';

import { EditOutlined, PlusOutlined, LinkOutlined } from '@ant-design/icons';
import { Drawer, FloatButton } from 'antd';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';

import EmailList from './EmailList';
import ReplyMail from './ReplyMail';
import * as api from '../../api/Mail';
import type { IEmailMetadata, INextPageToken } from '../../common/types';
import { useSession } from '../../hooks/userSession';

export default function Mail() {
  const [emails, setEmails] = useState<IEmailMetadata[]>([]);
  const [nextPageTokens, setNextPageTokens] = useState<string>('');
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [pageNo, setPageNo] = useState<number>(1);
  const { data, isLoading } = useSWR(
    ['/mails', pageNo],
    () => api.getMails({ query: `next_page_tokens=${nextPageTokens}` }),
    {
      refreshInterval: 5000000,
    },
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { linkedMailAddresses } = useSession();

  const navigate = useNavigate();

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };
  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const loadMoreData = () => {
    setPageNo(pageNo + 1);
  };

  useEffect(() => {
    if (!isLoading && data) {
      setEmails((emails) => [...emails, ...data.data.mails]);
      setNextPageTokens(
        data.data.next_page_tokens.map((item: INextPageToken) => `${item.email},${item.next_page_token}`).join(';'),
      );
      setHasMore(!!data.data.next_page_tokens.length);
    }
  }, [data, isLoading]);

  return (
    <>
      <div style={{ width: isDrawerOpen ? '50%' : '100%', transition: 'all 0.3s' }}>
        <EmailList data={emails} hasMore={!!hasMore} loadMoreData={loadMoreData} isComposeMail={isDrawerOpen} />
      </div>

      <Drawer
        title="Compose Mail"
        placement="right"
        width={'45%'}
        onClose={closeDrawer}
        open={isDrawerOpen}
        mask={false}
      >
        <ReplyMail />
      </Drawer>

      {linkedMailAddresses && linkedMailAddresses.length !== 0 ? (
        <FloatButton.Group
          shape="circle"
          style={{ right: '40px', bottom: '8vh' }}
          trigger="hover"
          type="primary"
          icon={<PlusOutlined />}
        >
          <FloatButton
            tooltip={<div>Link Your Mails</div>}
            onClick={() => navigate('/profile')}
            icon={<LinkOutlined />}
          />
          <FloatButton tooltip={<div>Compose Mail</div>} onClick={openDrawer} icon={<EditOutlined />} />
        </FloatButton.Group>
      ) : (
        <FloatButton
          tooltip={<div>Link Your Mails</div>}
          onClick={() => navigate('/profile')}
          icon={<LinkOutlined />}
          type="primary"
          style={{ right: '40px', bottom: '8vh' }}
        />
      )}
    </>
  );
}
