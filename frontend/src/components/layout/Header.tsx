import { Avatar, Dropdown, theme } from 'antd';
import type { MenuProps } from 'antd';
import { Header } from 'antd/es/layout/layout';
import { Link } from 'react-router-dom';

import { useSession } from '../../hooks/userSession';

export default function CustomHeader({ title }: { title: string }) {
  const {
    token: { colorBgContainer, colorPrimary },
  } = theme.useToken();
  const { user } = useSession();

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <Link rel="noopener noreferrer" to="/mails">
          1st menu item
        </Link>
      ),
    },
    {
      key: '2',
      label: (
        <a target="_blank" rel="noopener noreferrer" href="https://www.aliyun.com">
          2nd menu item (disabled)
        </a>
      ),
    },
  ];

  return (
    <Header
      style={{
        padding: 0,
        background: colorBgContainer,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '1.3rem', marginLeft: '16px' }}>{title}</div>
      <Dropdown menu={{ items }} trigger={['hover']}>
        <div style={{ cursor: 'pointer' }}>
          <Avatar style={{ backgroundColor: colorPrimary, verticalAlign: 'middle', marginRight: '16px' }} size="large">
            {user?.username.charAt(0).toUpperCase()}
          </Avatar>
        </div>
      </Dropdown>
    </Header>
  );
}
