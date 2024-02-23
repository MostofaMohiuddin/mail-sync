import { useEffect, useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Card, Divider, Drawer, FloatButton } from 'antd';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';

import MailViewer from './MailViewer';
import SummarizeMail from './SummarizeMail';
import * as api from '../../../api/Mail';
import type { IEmailFullData } from '../../../common/types';
import Loader from '../../../components/Loader';
import ReplyMail from '../ReplyMail';

export default function Mail() {
  const params = useParams();
  const [mail, setMail] = useState<IEmailFullData | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  const onCloseDrawer = () => {
    setOpenDrawer(false);
  };
  const onOpenDrawer = () => {
    setOpenDrawer(true);
  };

  const { data, isLoading } = useSWR(`/mails/${params.address}/${params.id}`, () => {
    if (!params?.id || !params?.address) return Promise.resolve({ data: null });
    return api.getMail({ param: { mail_id: params?.id || '', mail_address: params?.address || '' } });
  });

  useEffect(() => {
    setMail(data?.data);
  }, [data]);

  return isLoading || !mail ? (
    <Loader loading={isLoading} />
  ) : (
    <>
      <div style={{ width: openDrawer ? '50%' : '100%', transition: 'all 0.3s' }}>
        <MailViewer mail={mail} />
        <Divider />
        <Card title="Summary" size="small">
          <SummarizeMail text={mail?.body?.plain || ''} />
        </Card>
      </div>

      <Drawer title="Reply" placement="right" width={'45%'} onClose={onCloseDrawer} open={openDrawer} mask={false}>
        <ReplyMail receivedMail={mail} />
      </Drawer>

      <FloatButton
        tooltip={<div>Reply</div>}
        onClick={onOpenDrawer}
        icon={<EditOutlined />}
        type="primary"
        style={{ right: '40px', bottom: '8vh', width: '50px', height: '50px' }}
      />
    </>
  );
}
