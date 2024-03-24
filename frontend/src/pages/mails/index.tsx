// import { useEffect } from 'react';

import { useState } from 'react';

import { EditOutlined, PlusOutlined, LinkOutlined } from '@ant-design/icons';
import { Drawer, FloatButton } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import AllMailBox from './AllMailBox';
import ReplyMail from './ReplyMail';
import SingleMailBox from './SingleMailBox';
import { useSession } from '../../hooks/userSession';

export default function Mail() {
  const params = useParams();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { linkedMailAddresses } = useSession();

  const navigate = useNavigate();

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };
  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  return (
    <>
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
