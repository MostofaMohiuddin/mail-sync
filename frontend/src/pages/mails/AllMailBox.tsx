import { useEffect, useState } from 'react';

import useSWR from 'swr';

import EmailList from './components/EmailList';
import * as api from '../../api/Mail';
import type { IEmailMetadata, INextPageToken } from '../../common/types';

export default function AllMailBox({ isDrawerOpen }: { isDrawerOpen: boolean }) {
  const [emailsPage1, setEmailsPage1] = useState<IEmailMetadata[]>([]);
  const [emails, setEmails] = useState<IEmailMetadata[]>([]);
  const [nextPageTokens, setNextPageTokens] = useState<string>('');
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [pageNo, setPageNo] = useState<number>(1);
  const { data, isLoading } = useSWR(pageNo > 1 ? ['/mails', pageNo] : null, () =>
    api.getMails({ query: `next_page_tokens=${nextPageTokens}` }),
  );

  const { data: data1, isLoading: isLoading1 } = useSWR(['/mails', 1], () => api.getMails(), {
    refreshInterval: 20000,
  });

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
    </>
  );
}
