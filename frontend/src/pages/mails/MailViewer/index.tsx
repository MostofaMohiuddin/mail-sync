import { useEffect, useState } from 'react';

import { Divider, Button, Drawer } from 'antd';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';

import MailViewer from './MailViewer';
import SummarizeMail from './SummarizeMail';
import * as api from '../../../api/Mail';
import type { IEmailFullData } from '../../../common/types';
import Loader from '../../../components/Loader';

// import { useMail } from '../../../hooks/useMail';

export default function Mail() {
  const params = useParams();
  const [mail, setMail] = useState<IEmailFullData | null>(null);
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const { data, isLoading } = useSWR(
    `/mails/${params.address}/${params.id}`,
    () => {
      if (!params?.id || !params?.address) return Promise.resolve({ data: null });
      return api.getMail({ param: { mail_id: params?.id || '', mail_address: params?.address || '' } });
    },
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    setMail(data?.data);
  }, [data]);

  return isLoading || !mail ? (
    <Loader loading={isLoading} />
  ) : (
    <>
      <MailViewer mail={mail} />
      <Divider>
        <h4>Summary</h4>
      </Divider>
      <Button type="primary" onClick={showDrawer}>
        Open
      </Button>

      <Drawer title="Summary" onClose={onClose} open={open} maskClosable>
        <SummarizeMail text={mail?.body?.plain || ''} />
      </Drawer>
    </>
  );
}
