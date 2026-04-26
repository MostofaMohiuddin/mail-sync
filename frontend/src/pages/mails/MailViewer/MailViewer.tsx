import { Avatar, Tooltip, Typography } from 'antd';
import parse from 'html-react-parser';

import type { IEmailFullData } from '../../../common/types';
import { formatRelativeDate } from '../../../common/formatRelativeDate';
import { generateAvatarText, generateRandomColor } from '../../../common/utility';
import GlassCard from '../../../components/ui/GlassCard';
import { useThemeMode } from '../../../hooks/useThemeMode';

export default function MailViewer({ mail }: { mail: IEmailFullData }) {
  const { colors } = useThemeMode();
  const senderLabel = mail.sender.name || mail.sender.email;
  const avatarColor = generateRandomColor(senderLabel);

  return (
    <div className="as-animate-fade-in">
      <h1
        style={{
          margin: 0,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: colors.text,
          lineHeight: 1.25,
        }}
      >
        {mail.subject || '(no subject)'}
      </h1>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          padding: '12px 14px',
          background: colors.surfaceMuted,
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Avatar size={42} style={{ backgroundColor: avatarColor, fontWeight: 600, flexShrink: 0 }}>
            {generateAvatarText(senderLabel)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Typography.Text strong style={{ fontSize: 14, color: colors.text, display: 'block' }}>
              {mail.sender.name ? `${mail.sender.name}` : mail.sender.email}
            </Typography.Text>
            {mail.sender.name && (
              <Typography.Text style={{ fontSize: 12, color: colors.textSecondary, display: 'block' }}>
                &lt;{mail.sender.email}&gt;
              </Typography.Text>
            )}
            <Typography.Text style={{ fontSize: 12, color: colors.textSecondary, display: 'block' }}>
              To: {mail.receiver.email}
            </Typography.Text>
          </div>
        </div>
        <Tooltip title={new Date(mail.date).toLocaleString()} placement="topRight">
          <Typography.Text
            style={{
              fontSize: 12.5,
              color: colors.textSecondary,
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}
          >
            {formatRelativeDate(mail.date)}
          </Typography.Text>
        </Tooltip>
      </div>

      <GlassCard variant="solid" padding={24} style={{ marginTop: 20 }}>
        <div className="mail-body" style={{ color: colors.text, fontSize: 14, lineHeight: 1.65 }}>
          {parse(mail.body.html || mail.body.plain || '')}
        </div>
      </GlassCard>
    </div>
  );
}
