// import { useEffect } from 'react';

import { useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Drawer, FloatButton } from 'antd';
import useSWR from 'swr';

import EmailList from './EmailList';
import ReplyMail from './ReplyMail';
import * as api from '../../api/Mail';

export default function Mail() {
  const { data, isLoading } = useSWR('/mails', api.getMails);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };
  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  return (
    <>
      <EmailList data={data?.data} loading={isLoading} />

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

      <FloatButton
        tooltip={<div>Compose Mail</div>}
        onClick={openDrawer}
        icon={<EditOutlined />}
        type="primary"
        style={{ right: '40px', bottom: '8vh', width: '50px', height: '50px' }}
      />
    </>
  );
}
