import { useState } from 'react';

import { UserOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { Avatar, Badge, Dropdown, Flex, List, Popover, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import { Header } from 'antd/es/layout/layout';
import dayjs from 'dayjs';
import parse from 'html-react-parser';
import { Link, useNavigate } from 'react-router-dom';

import { useSession } from '../../hooks/userSession';

export default function CustomHeader({ title }: { title: string }) {
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, colorPrimary },
  } = theme.useToken();
  const { user, signOut, notifications } = useSession();

  const [openNotificationPanel, setOpenNotificationPanel] = useState(false);

  const hideNotificationPanel = () => {
    setOpenNotificationPanel(false);
  };

  const handleNotificationPanelOpenChange = (newOpen: boolean) => {
    setOpenNotificationPanel(newOpen);
  };

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <Link rel="noopener noreferrer" to="/profile" style={{ fontSize: '0.92rem' }}>
          Profile
        </Link>
      ),
      icon: <UserOutlined />,
    },
    {
      key: '2',
      label: (
        <div rel="noopener noreferrer" style={{ fontSize: '0.92rem' }} onClick={signOut}>
          Sign Out
        </div>
      ),
      icon: <LogoutOutlined />,
    },
  ];

  const getNotificationList = () => {
    return (
      <>
        <List style={{ width: '500px' }}>
          {notifications?.map(({ id, mail_metadata }) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              key={id}
              onClick={() => {
                navigate(`/emails/${mail_metadata.receiver.email}/${mail_metadata.id}`);
                hideNotificationPanel();
              }}
              extra={
                <Flex vertical align="flex-end">
                  <Typography.Text type="secondary" style={{ fontSize: '0.7rem' }}>
                    {dayjs(mail_metadata.date).format('MMM DD')}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: '0.7rem' }}>
                    {mail_metadata.receiver.email}
                  </Typography.Text>
                </Flex>
              }
            >
              <Flex>
                <Flex>
                  <Flex justify="space-between" align="flex-start" vertical>
                    <Typography.Text strong style={{ fontSize: '0.9rem' }}>
                      {mail_metadata.sender.email}
                    </Typography.Text>
                    <Typography.Text strong ellipsis style={{ width: '200px', fontSize: '0.8rem' }}>
                      {mail_metadata.subject}
                    </Typography.Text>
                    <Typography.Text type="secondary" ellipsis style={{ width: '300px', fontSize: '0.75rem' }}>
                      {parse(mail_metadata.snippet)}
                    </Typography.Text>
                  </Flex>
                </Flex>
              </Flex>
            </List.Item>
          ))}
        </List>
      </>
    );
  };

  return (
    <Header
      style={{
        padding: '0 16px',
        background: colorBgContainer,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '1.3rem' }}>{title}</div>
      <Flex>
        <Popover
          content={getNotificationList()}
          style={{ width: '50vw' }}
          trigger={['hover']}
          placement="bottomRight"
          open={openNotificationPanel}
          onOpenChange={handleNotificationPanelOpenChange}
        >
          <div style={{ cursor: 'pointer' }}>
            <Badge count={notifications?.length}>
              <Avatar
                style={{
                  border: notifications?.length > 0 ? `1px solid ${colorPrimary}` : 'none',
                  backgroundColor: 'transparent',
                  verticalAlign: 'middle',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                }}
                size="large"
              >
                <BellOutlined style={{ color: colorPrimary }} />
              </Avatar>
            </Badge>
          </div>
        </Popover>
        <Dropdown menu={{ items }} trigger={['hover']} placement="bottomRight">
          <div style={{ cursor: 'pointer', marginLeft: '1rem' }}>
            <Avatar
              style={{ backgroundColor: colorPrimary, verticalAlign: 'middle', fontWeight: 'bold', fontSize: '1.2rem' }}
              size="large"
            >
              {user?.username.charAt(0).toUpperCase()}
            </Avatar>
          </div>
        </Dropdown>
      </Flex>
    </Header>
  );
}
