import React, { useState, type ReactNode, useEffect } from 'react';

import { CalendarOutlined, MailOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, theme } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import CustomHeader from './Header';
import { useSession } from '../../hooks/userSession';

const { Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

export default function CustomLayout({ children, title }: { children: ReactNode; title: string }) {
  const [collapsed, setCollapsed] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const location = useLocation();
  const param = useParams();
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { linkedMailAddresses } = useSession();

  const onClickMenuItem: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  function getItem(label: React.ReactNode, key: React.Key, icon?: React.ReactNode, children?: MenuItem[]): MenuItem {
    return {
      key,
      icon,
      children,
      label,
    } as MenuItem;
  }

  const getLinkedMailAddressSubMenu = () => {
    const items = [getItem('All Inbox', '/emails')];
    linkedMailAddresses?.forEach((linkedMailAddress) =>
      items.push(
        getItem(
          linkedMailAddress.email.length > 15 ? linkedMailAddress.email.slice(0, 15) + '...' : linkedMailAddress.email,
          `/emails/link-mail-addresses/${linkedMailAddress.email}`,
        ),
      ),
    );
    return items;
  };

  useEffect(() => {
    const getSelectedKeys = () => {
      const keys = [];
      if (location.pathname === '/') {
        keys.push('/emailsSection');
        keys.push('/emails');
      } else if (location.pathname.includes('/emails')) {
        keys.push('/emailsSection');
        if (location.pathname.includes('/emails/link-mail-addresses') && param.address) {
          keys.push(`/emails/link-mail-addresses/${param.address}`);
        } else {
          keys.push('/emails');
        }
      } else if (location.pathname.includes('/calendar')) {
        keys.push('/calendar');
      } else if (location.pathname.includes('/schedule')) {
        keys.push('/schedule');
      }
      return keys;
    };

    setSelectedKeys(getSelectedKeys());
  }, [location.pathname, param.address]);

  const items: MenuItem[] = [
    getItem('Emails', '/emailsSection', <MailOutlined />, getLinkedMailAddressSubMenu()),
    getItem('Calendar', '/calendar', <CalendarOutlined />),
    getItem('Schedule', '/schedule', <ClockCircleOutlined />),
    // getItem('User', 'sub1', <UserOutlined />, [getItem('Tom', '3'), getItem('Bill', '4'), getItem('Alex', '5')]),
    // getItem('Team', 'sub2', <TeamOutlined />, [getItem('Team 1', '6'), getItem('Team 2', '8')]),
    // getItem('Files', '9', <FileOutlined />),
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="demo-logo-vertical">LOGO</div>
        <Menu
          theme="dark"
          onClick={onClickMenuItem}
          defaultSelectedKeys={['/emails']}
          mode="inline"
          items={items}
          selectedKeys={selectedKeys}
        />
      </Sider>
      <Layout>
        <CustomHeader title={title} />
        <Content style={{ margin: '0 16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 'calc(100vh - 146px)',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              marginTop: '16px',
            }}
          >
            {children}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Mail Sync</Footer>
      </Layout>
    </Layout>
  );
}
