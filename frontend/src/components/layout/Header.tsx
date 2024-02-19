import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, theme } from 'antd';
import type { MenuProps } from 'antd';
import { Header } from 'antd/es/layout/layout';
import { Link } from 'react-router-dom';

import { useSession } from '../../hooks/userSession';

export default function CustomHeader({ title }: { title: string }) {
  const {
    token: { colorBgContainer, colorPrimary },
  } = theme.useToken();
  const { user, signOut } = useSession();

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
      <Dropdown menu={{ items }} trigger={['hover']} placement="bottomRight">
        <div style={{ cursor: 'pointer' }}>
          <Avatar
            style={{ backgroundColor: colorPrimary, verticalAlign: 'middle', fontWeight: 'bold', fontSize: '1.2rem' }}
            size="large"
          >
            {user?.username.charAt(0).toUpperCase()}
          </Avatar>
        </div>
      </Dropdown>
    </Header>
  );
}
