import React, { useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  CalendarOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Button, Dropdown, Layout, Menu, Tooltip } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import CustomHeader from './Header';
import { useSession } from '../../hooks/userSession';
import { useThemeMode } from '../../hooks/useThemeMode';
import { palette, radius, shadow, shadowDark } from '../../themes/tokens';
import Logo from '../ui/Logo';

const { Content, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

export default function CustomLayout({ children, title }: { children: ReactNode; title: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>(['/emailsSection', '/schedule']);
  const location = useLocation();
  const param = useParams();
  const navigate = useNavigate();
  const { mode, colors } = useThemeMode();
  const { linkedMailAddresses, user, signOut } = useSession();

  const sidebarPalette = palette[mode];
  const shadows = mode === 'dark' ? shadowDark : shadow;

  const onClickMenuItem: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  const getItem = (label: React.ReactNode, key: React.Key, icon?: React.ReactNode, children?: MenuItem[]): MenuItem =>
    ({ key, icon, children, label }) as MenuItem;

  const linkedMailSubItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [getItem('All Inbox', '/emails', <InboxOutlined />)];
    linkedMailAddresses?.forEach((linkedMailAddress) =>
      items.push(
        getItem(
          linkedMailAddress.email.length > 18 ? linkedMailAddress.email.slice(0, 18) + '…' : linkedMailAddress.email,
          `/emails/link-mail-addresses/${linkedMailAddress.email}`,
        ),
      ),
    );
    return items;
  }, [linkedMailAddresses]);

  useEffect(() => {
    const getSelectedKeys = () => {
      const keys: string[] = [];
      if (location.pathname === '/') {
        keys.push('/');
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
        if (location.pathname.includes('/schedule/mails')) keys.push('/schedule/mails');
        else if (location.pathname.includes('/schedule/auto-reply')) keys.push('/schedule/auto-reply');
      } else if (location.pathname.includes('/profile')) {
        keys.push('/profile');
      }
      return keys;
    };
    setSelectedKeys(getSelectedKeys());
  }, [location.pathname, param.address]);

  const items: MenuItem[] = [
    getItem('Home', '/', <HomeOutlined />),
    getItem('Mail', '/emailsSection', <MailOutlined />, linkedMailSubItems),
    getItem('Calendar', '/calendar', <CalendarOutlined />),
    getItem('Schedule', '/schedule', <ClockCircleOutlined />, [
      getItem('Scheduled Mails', '/schedule/mails'),
      getItem('Auto Reply', '/schedule/auto-reply'),
    ]),
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'signout',
      label: 'Sign out',
      icon: <LogoutOutlined />,
      onClick: signOut,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        trigger={null}
        width={248}
        collapsedWidth={80}
        style={{
          background: sidebarPalette.sidebarBg,
          boxShadow: shadows.lg,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '20px 0' : '20px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Logo collapsed={collapsed} size={collapsed ? 'sm' : 'md'} />
        </div>

        <div style={{ flex: '1 1 auto', overflow: 'auto', padding: '12px 6px' }}>
          <Menu
            theme="dark"
            mode="inline"
            onClick={onClickMenuItem}
            selectedKeys={selectedKeys}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={(keys) => setOpenKeys(keys as string[])}
            items={items}
            style={{ background: 'transparent', borderInlineEnd: 'none', fontSize: 14 }}
            inlineIndent={20}
          />
        </div>

        <div
          style={{
            padding: collapsed ? '12px 0' : '12px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: 8,
          }}
        >
          {!collapsed ? (
            <>
              <Dropdown menu={{ items: userMenuItems }} placement="topLeft" trigger={['click']}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: radius.md,
                    flex: '1 1 auto',
                    minWidth: 0,
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = sidebarPalette.sidebarHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar
                    size={32}
                    style={{
                      background: sidebarPalette.primaryGradient,
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <div style={{ minWidth: 0, flex: '1 1 auto', lineHeight: 1.2 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user?.username || 'Guest'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: sidebarPalette.sidebarTextMuted,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {linkedMailAddresses?.length ?? 0} linked account
                      {(linkedMailAddresses?.length ?? 0) === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
              </Dropdown>
              <Tooltip title="Collapse sidebar" placement="right">
                <Button
                  type="text"
                  size="small"
                  icon={<MenuFoldOutlined />}
                  onClick={() => setCollapsed(true)}
                  style={{ color: sidebarPalette.sidebarTextMuted, flexShrink: 0 }}
                  aria-label="Collapse sidebar"
                />
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Expand sidebar" placement="right">
              <Button
                type="text"
                shape="circle"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setCollapsed(false)}
                style={{ color: sidebarPalette.sidebarTextMuted }}
                aria-label="Expand sidebar"
              />
            </Tooltip>
          )}
        </div>
      </Sider>

      <Layout style={{ background: 'transparent' }}>
        <CustomHeader title={title} />
        <Content style={{ padding: '20px 24px 32px' }}>
          <div className="as-animate-fade-in-up" style={{ padding: '4px 4px 24px' }}>
            {children}
          </div>
          <div
            style={{
              textAlign: 'center',
              marginTop: 16,
              fontSize: 12,
              color: colors.textTertiary,
              letterSpacing: '0.04em',
            }}
          >
            MailSync · Crafted with care
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
