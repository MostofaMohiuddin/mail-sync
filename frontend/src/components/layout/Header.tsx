import { useMemo, useState } from 'react';

import {
  BellOutlined,
  CheckOutlined,
  InboxOutlined,
  LogoutOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Dropdown, Flex, Input, Popover, Tooltip, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { Header } from 'antd/es/layout/layout';
import parse from 'html-react-parser';
import { Link, useNavigate } from 'react-router-dom';
import { useSWRConfig } from 'swr';

import * as api from '../../api/ImportantMailNotification';
import { formatRelativeDate } from '../../common/formatRelativeDate';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useSession } from '../../hooks/userSession';
import { radius } from '../../themes/tokens';
import EmptyState from '../ui/EmptyState';
import GlassCard from '../ui/GlassCard';
import ThemeToggle from '../ui/ThemeToggle';

export default function CustomHeader({ title }: { title: string }) {
  const { mutate } = useSWRConfig();
  const navigate = useNavigate();
  const { colors, mode } = useThemeMode();
  const { user, signOut, notifications } = useSession();

  const [openNotificationPanel, setOpenNotificationPanel] = useState(false);

  const hideNotificationPanel = () => setOpenNotificationPanel(false);

  const unreadCount = useMemo(
    () => notifications?.filter(({ status }) => status === 'unread').length ?? 0,
    [notifications],
  );

  const markAllAsRead = () => {
    if (!notifications || unreadCount === 0) return;
    const ids = notifications.filter(({ status }) => status === 'unread').map(({ id }) => id);
    api.markImportantMailNotificationAsRead({ data: ids });
    mutate('/important-mail/notifications');
  };

  const handleNotificationPanelOpenChange = (newOpen: boolean) => {
    if (!newOpen && unreadCount > 0) {
      markAllAsRead();
    }
    setOpenNotificationPanel(newOpen);
  };

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <Link rel="noopener noreferrer" to="/profile" style={{ fontSize: 13 }}>
          Profile
        </Link>
      ),
      icon: <UserOutlined />,
    },
    {
      key: '2',
      label: (
        <span rel="noopener noreferrer" style={{ fontSize: 13 }} onClick={signOut}>
          Sign Out
        </span>
      ),
      icon: <LogoutOutlined />,
    },
  ];

  const notificationContent = (
    <GlassCard variant="solid" padding={0} style={{ width: 420, maxHeight: 480, overflow: 'hidden' }}>
      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>
          Notifications
          {unreadCount > 0 && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                background: colors.primaryGradientSoft,
                color: colors.primary,
                fontWeight: 600,
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button type="text" size="small" icon={<CheckOutlined />} onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div style={{ maxHeight: 380, overflow: 'auto', padding: 8 }}>
        {!notifications || notifications.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<InboxOutlined />}
            title="You're all caught up"
            description="New important mail will appear here."
          />
        ) : (
          notifications.map(({ id, mail_metadata, status }) => {
            const isUnread = status === 'unread';
            return (
              <div
                key={id}
                onClick={() => {
                  navigate(`/emails/${mail_metadata.receiver.email}/${mail_metadata.id}`);
                  hideNotificationPanel();
                }}
                style={{
                  padding: '10px 12px',
                  marginBottom: 6,
                  borderRadius: radius.md,
                  background: isUnread ? colors.primaryGradientSoft : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 150ms',
                }}
                onMouseEnter={(e) => {
                  if (!isUnread) e.currentTarget.style.background = colors.surfaceMuted;
                }}
                onMouseLeave={(e) => {
                  if (!isUnread) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Flex justify="space-between" align="flex-start" gap={8}>
                  <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                    <Typography.Text
                      strong
                      style={{
                        display: 'block',
                        fontSize: 13,
                        color: colors.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {mail_metadata.sender.email}
                    </Typography.Text>
                    <Typography.Text
                      style={{
                        display: 'block',
                        fontSize: 12.5,
                        fontWeight: isUnread ? 600 : 500,
                        color: colors.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {mail_metadata.subject}
                    </Typography.Text>
                    <Typography.Text
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: colors.textSecondary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: 2,
                      }}
                    >
                      {parse(mail_metadata.snippet || '')}
                    </Typography.Text>
                  </div>
                  <Flex vertical align="flex-end" style={{ flexShrink: 0 }}>
                    <Typography.Text
                      style={{ fontSize: 11, color: colors.textTertiary, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatRelativeDate(mail_metadata.date)}
                    </Typography.Text>
                    <Typography.Text
                      style={{
                        fontSize: 10.5,
                        color: colors.textTertiary,
                        marginTop: 2,
                        maxWidth: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {mail_metadata.receiver.email}
                    </Typography.Text>
                  </Flex>
                </Flex>
              </div>
            );
          })
        )}
      </div>
    </GlassCard>
  );

  return (
    <Header
      style={{
        padding: '0 24px',
        background: mode === 'dark' ? 'rgba(17,25,51,0.62)' : 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: '-0.01em',
          color: colors.text,
        }}
      >
        {title}
      </div>

      <Flex align="center" gap={10}>
        <Tooltip title="Search coming soon" placement="bottom">
          <Input
            disabled
            prefix={<SearchOutlined style={{ color: colors.textTertiary }} />}
            placeholder="Search mail, people, events…"
            style={{
              width: 320,
              borderRadius: 999,
              background: colors.surfaceMuted,
              border: `1px solid ${colors.border}`,
            }}
          />
        </Tooltip>

        <ThemeToggle />

        <Popover
          content={notificationContent}
          trigger={['click']}
          placement="bottomRight"
          open={openNotificationPanel}
          onOpenChange={handleNotificationPanelOpenChange}
          arrow={false}
          overlayInnerStyle={{ padding: 0, background: 'transparent', boxShadow: 'none' }}
        >
          <div style={{ cursor: 'pointer', display: 'inline-flex' }}>
            <Badge count={unreadCount} offset={[-4, 4]}>
              <Button
                type="text"
                shape="circle"
                size="large"
                icon={<BellOutlined />}
                style={{
                  color: unreadCount > 0 ? colors.primary : colors.textSecondary,
                  fontSize: 18,
                }}
                aria-label="Notifications"
              />
            </Badge>
          </div>
        </Popover>

        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <div
            style={{
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 999,
              transition: 'background 150ms',
              display: 'inline-flex',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceMuted)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Avatar
              size={36}
              style={{
                background: colors.primaryGradient,
                fontWeight: 700,
                fontSize: 14,
                boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
              }}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </div>
        </Dropdown>
      </Flex>
    </Header>
  );
}
