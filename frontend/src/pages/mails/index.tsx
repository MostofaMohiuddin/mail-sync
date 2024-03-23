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
  const [emailsPage1, setEmailsPage1] = useState<IEmailMetadata[]>([]);
  const [emails, setEmails] = useState<IEmailMetadata[]>([]);
  const [nextPageTokens, setNextPageTokens] = useState<string>('');
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [pageNo, setPageNo] = useState<number>(1);
  const { data, isLoading } = useSWR(pageNo > 1 ? ['/mails', pageNo] : null, () =>
    api.getMails({ query: `next_page_tokens=${nextPageTokens}` }),
  );

  const { data: data1, isLoading: isLoading1 } = useSWR(['/mails', 1], () => api.getMails(), {
    refreshInterval: 500000,
  });

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

  useEffect(() => {
    if (!isLoading1 && data1) {
      setEmailsPage1(data1.data.mails);
      setNextPageTokens(
        data1.data.next_page_tokens.map((item: INextPageToken) => `${item.email},${item.next_page_token}`).join(';'),
      );
      setHasMore(!!data1.data.next_page_tokens.length);
    }
  }, [data1, isLoading1]);

  return (
    <>
      <div style={{ width: isDrawerOpen ? '50%' : '100%', transition: 'all 0.3s' }}>
        <EmailList
          data={emailsPage1.concat(emails)}
          hasMore={!!hasMore}
          loadMoreData={loadMoreData}
          isComposeMail={isDrawerOpen}
          isLoading={isLoading || isLoading1}
        />
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
