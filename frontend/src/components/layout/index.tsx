import React, { useState, type ReactNode } from 'react';

import { CalendarOutlined, MailOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, theme } from 'antd';
import { useNavigate } from 'react-router-dom';

import CustomHeader from './Header';
// import Title from 'antd/lib/typography/Title';

const { Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(label: React.ReactNode, key: React.Key, icon?: React.ReactNode, children?: MenuItem[]): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('Emails', '/emails', <MailOutlined />),
  getItem('Calendar', '/calendar', <CalendarOutlined />),
  // getItem('User', 'sub1', <UserOutlined />, [getItem('Tom', '3'), getItem('Bill', '4'), getItem('Alex', '5')]),
  // getItem('Team', 'sub2', <TeamOutlined />, [getItem('Team 1', '6'), getItem('Team 2', '8')]),
  // getItem('Files', '9', <FileOutlined />),
];

export default function CustomLayout({ children, title }: { children: ReactNode; title: string }) {
  const [collapsed, setCollapsed] = useState(true);
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const onClickMenuItem: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="demo-logo-vertical">LOGO</div>
        <Menu theme="dark" onClick={onClickMenuItem} defaultSelectedKeys={['/emails']} mode="inline" items={items} />
      </Sider>
      <Layout>
        <CustomHeader title={title} />
        <Content style={{ margin: '0 16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: '85vh',
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
