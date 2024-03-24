import { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';
import useSWR from 'swr';

import EmailList from './components/EmailList';
import * as api from '../../api/Mail';
import type { IEmailMetadata } from '../../common/types';

export default function SingleMailBox({ isDrawerOpen }: { isDrawerOpen: boolean }) {
  const [emailsPage1, setEmailsPage1] = useState<IEmailMetadata[]>([]);
  const [emails, setEmails] = useState<IEmailMetadata[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string>('');
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [pageNo, setPageNo] = useState<number>(1);
  const params = useParams();
  const { data, isLoading } = useSWR(
    pageNo > 1 ? [`/mails/link-mail-addresses/${params.address}/mails`, pageNo] : null,
    () =>
      api.getMailsByLinkedAddress({
        param: {
          link_mail_address: params.address || '',
        },
        query: `next_page_token=${nextPageToken}`,
      }),
  );

  const { data: data1, isLoading: isLoading1 } = useSWR(
    [`/mails/link-mail-addresses/${params.address}/mails`, 1],
    () =>
      api.getMailsByLinkedAddress({
        param: {
          link_mail_address: params.address || '',
        },
        query: `next_page_token=${nextPageToken}`,
      }),
    {
      refreshInterval: 500000,
    },
  );

  const loadMoreData = () => {
    setPageNo(pageNo + 1);
  };

  useEffect(() => {
    if (!isLoading && data) {
      setEmails((emails) => [...emails, ...data.data.mails]);
      setNextPageToken(data.data.next_page_token);
      setHasMore(!!data.data.next_page_token);
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (!isLoading1 && data1) {
      setEmailsPage1(data1.data.mails);
      setNextPageToken(data1.data.next_page_token);
      setHasMore(!!data1.data.next_page_token);
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
