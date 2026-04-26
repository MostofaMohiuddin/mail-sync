import { useEffect, useState } from 'react';

import { DeleteOutlined, GoogleOutlined, PlusOutlined, YahooOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, Skeleton, type MenuProps } from 'antd';
import useSWR, { useSWRConfig } from 'swr';

import * as api from '../../api/LinkMailAddress';
import { EmailType, type IUserLinkedMail } from '../../common/types';
import EmptyState from '../../components/ui/EmptyState';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { useThemeMode } from '../../hooks/useThemeMode';
import { radius } from '../../themes/tokens';

export default function EmailAddressList() {
  const { colors } = useThemeMode();
  const [mails, setMails] = useState<IUserLinkedMail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { mutate } = useSWRConfig();

  const { data: linkedMailAddressResponse, isLoading: isLoadingMailAddresses } = useSWR(
    '/link-mail-address',
    api.getLinkedMailAddress,
    {
      revalidateOnMount: true,
      revalidateOnFocus: true,
    },
  );

  useEffect(() => {
    setMails(linkedMailAddressResponse?.data || []);
  }, [linkedMailAddressResponse]);

  const linkEmail = async (emailType: EmailType) => {
    const res = await api.getOauthUrl({ query: `email_type=${emailType}` });
    window.open(res?.data?.redirect_link, '_blank', 'noreferrer');
  };

  const unlinkMail = async (email: string) => {
    setIsLoading(true);
    const data = await api.unlinkMailAddress({ query: `email=${email}` });
    if (data?.status === 204) {
      mutate('/link-mail-address');
      mutate((key) => Array.isArray(key) && key[0] === '/mails', undefined, { revalidate: false });
    }
    setIsLoading(false);
  };

  const items: MenuProps['items'] = [
    {
      key: 'gmail',
      label: <span style={{ fontSize: 13 }}>Google</span>,
      icon: <GoogleOutlined />,
      onClick: () => linkEmail(EmailType.GMAIL),
    },
    {
      key: 'yahoo',
      label: <span style={{ fontSize: 13 }}>Yahoo</span>,
      icon: <YahooOutlined />,
      disabled: true,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <SectionHeader
        eyebrow="Connected accounts"
        title="Linked Mail Addresses"
        description="Mail and calendar are pulled from these connected accounts."
        action={
          <Dropdown menu={{ items }} trigger={['hover']} placement="bottomRight" arrow>
            <Button type="primary" icon={<PlusOutlined />} style={{ background: colors.primaryGradient, border: 'none' }}>
              Add account
            </Button>
          </Dropdown>
        }
      />

      {isLoadingMailAddresses || isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: 16,
                background: colors.surfaceMuted,
                borderRadius: radius.lg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Skeleton avatar active paragraph={{ rows: 1 }} title={false} />
            </div>
          ))}
        </div>
      ) : mails.length === 0 ? (
        <EmptyState
          icon={<GoogleOutlined />}
          title="No linked accounts yet"
          description="Connect your first Google account to start syncing mail and calendar."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {mails.map((item) => (
            <div
              key={item.email}
              style={{
                padding: 16,
                borderRadius: radius.lg,
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(15,23,42,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar src={item.picture} size={44} />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: colors.surface,
                        border: `2px solid ${colors.surface}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        color: '#EA4335',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <GoogleOutlined />
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: colors.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.email_name || item.email}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.email}
                    </div>
                  </div>
                </div>
                <Button
                  type="text"
                  shape="circle"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => unlinkMail(item.email)}
                  aria-label={`Unlink ${item.email}`}
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <StatusBadge variant="success">Connected</StatusBadge>
              </div>
            </div>
          ))}

          {/* Add-account dashed card */}
          <Dropdown menu={{ items }} trigger={['hover']} placement="topLeft" arrow>
            <div
              style={{
                padding: 16,
                borderRadius: radius.lg,
                border: `1.5px dashed ${colors.borderStrong}`,
                background: 'transparent',
                color: colors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
                gap: 6,
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.color = colors.primary;
                e.currentTarget.style.background = colors.primaryGradientSoft;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.borderStrong;
                e.currentTarget.style.color = colors.textSecondary;
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <PlusOutlined style={{ fontSize: 20 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Add another account</span>
            </div>
          </Dropdown>
        </div>
      )}
    </div>
  );
}
