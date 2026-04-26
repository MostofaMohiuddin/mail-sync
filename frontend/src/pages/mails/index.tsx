import { useState } from 'react';

import { EditOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { Drawer, FloatButton } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import AllMailBox from './AllMailBox';
import ReplyMail from './ReplyMail';
import SingleMailBox from './SingleMailBox';
import PageHeader from '../../components/ui/PageHeader';
import { useSession } from '../../hooks/userSession';

export default function Mail() {
  const params = useParams();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { linkedMailAddresses } = useSession();

  const navigate = useNavigate();

  const closeDrawer = () => setIsDrawerOpen(false);
  const openDrawer = () => setIsDrawerOpen(true);

  const subtitle = params.address
    ? `Showing messages for ${params.address}`
    : `All inboxes · ${linkedMailAddresses?.length ?? 0} linked account${(linkedMailAddresses?.length ?? 0) === 1 ? '' : 's'}`;

  return (
    <>
      <PageHeader title={params.address ? params.address : 'Inbox'} subtitle={subtitle} />

      {params.address ? <SingleMailBox isDrawerOpen={isDrawerOpen} /> : <AllMailBox isDrawerOpen={isDrawerOpen} />}

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
          style={{ right: 40, bottom: '8vh' }}
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
          style={{ right: 40, bottom: '8vh' }}
        />
      )}
    </>
  );
}
