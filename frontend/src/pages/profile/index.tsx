import { CalendarOutlined, LinkOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import useSWR from 'swr';

import EmailAddressList from './EmailAddressList';
import * as api from '../../api/LinkMailAddress';
import GlassCard from '../../components/ui/GlassCard';
import PageHeader from '../../components/ui/PageHeader';
import { useSession } from '../../hooks/userSession';
import { useThemeMode } from '../../hooks/useThemeMode';

export default function Profile() {
  const { user } = useSession();
  const { colors } = useThemeMode();
  const { data: linkedMailAddressResponse } = useSWR('/link-mail-address', api.getLinkedMailAddress, {
    revalidateOnMount: true,
    revalidateOnFocus: true,
  });

  const linkedCount = linkedMailAddressResponse?.data?.length ?? 0;

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account and connected mail." />

      {/* Hero band */}
      <div
        style={{
          position: 'relative',
          borderRadius: 20,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          padding: '56px 32px 76px',
          color: '#FFFFFF',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-30%',
            right: '-10%',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.55), transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-40%',
            left: '-10%',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.4), transparent 60%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <Avatar
            size={104}
            icon={<UserOutlined />}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '4px solid rgba(255,255,255,0.32)',
              fontSize: 48,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                opacity: 0.7,
                fontWeight: 600,
              }}
            >
              Signed in as
            </div>
            <h2
              style={{
                margin: '4px 0 0',
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              {user?.username || 'Guest'}
            </h2>
            <div style={{ marginTop: 14, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <Stat icon={<LinkOutlined />} label="Linked accounts" value={linkedCount} />
              <Stat icon={<MailOutlined />} label="Mail" value="Live sync" />
              <Stat icon={<CalendarOutlined />} label="Calendar" value="Connected" />
            </div>
          </div>
        </div>
      </div>

      {/* Linked accounts */}
      <div style={{ marginTop: -36, position: 'relative', zIndex: 2 }}>
        <GlassCard variant="solid" padding={0} style={{ background: colors.surface }}>
          <EmailAddressList />
        </GlassCard>
      </div>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.16)',
        backdropFilter: 'blur(10px)',
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <span style={{ opacity: 0.85, fontSize: 14 }}>{icon}</span>
      <span style={{ opacity: 0.7 }}>{label}:</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}
