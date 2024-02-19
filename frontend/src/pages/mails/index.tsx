// import { useEffect } from 'react';

import useSWR from 'swr';

import EmailList from './EmailList';
import * as api from '../../api/Mail';

export default function Mail() {
  const { data, isLoading } = useSWR('/mails', api.getMails, { revalidateOnFocus: false });
  return <EmailList data={data?.data} loading={isLoading} />;
}
