import type { ReactNode } from 'react';

import { Avatar, Tooltip, Typography } from 'antd';
import parse from 'html-react-parser';

import { formatRelativeDate } from '../../common/formatRelativeDate';
import { generateAvatarText, generateRandomColor } from '../../common/utility';
import { useThemeMode } from '../../hooks/useThemeMode';
import { radius } from '../../themes/tokens';

interface MailListItemProps {
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  receiver: string;
  unread?: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
}

export default function MailListItem({
  sender,
  subject,
  snippet,
  date,
  receiver,
  unread = false,
  onClick,
  trailing,
}: MailListItemProps) {
  const { colors } = useThemeMode();
  const avatarColor = generateRandomColor(sender);

  return (
    <div
      onClick={onClick}
      className="as-mail-row"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 16px 14px 18px',
        background: unread ? colors.primaryGradientSoft : colors.surface,
        border: `1px solid ${unread ? 'transparent' : colors.border}`,
        borderRadius: radius.lg,
        cursor: onClick ? 'pointer' : 'default',
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      {unread && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: colors.primaryGradient,
          }}
        />
      )}

      <Avatar
        size={40}
        style={{
          backgroundColor: avatarColor,
          flexShrink: 0,
          fontWeight: 600,
          boxShadow: unread ? `0 0 0 2px ${colors.primary}` : 'none',
        }}
      >
        {generateAvatarText(sender)}
      </Avatar>

      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 2,
          }}
        >
          <Typography.Text
            style={{
              fontSize: 14,
              fontWeight: unread ? 700 : 600,
              color: colors.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: '1 1 auto',
              minWidth: 0,
            }}
          >
            {sender}
          </Typography.Text>
          <Tooltip title={new Date(date).toLocaleString()} placement="topRight">
            <span
              style={{
                fontSize: 12,
                color: colors.textTertiary,
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}
            >
              {formatRelativeDate(date)}
            </span>
          </Tooltip>
        </div>

        <Typography.Text
          style={{
            display: 'block',
            fontSize: 13.5,
            fontWeight: unread ? 600 : 500,
            color: colors.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 2,
          }}
        >
          {subject || '(no subject)'}
        </Typography.Text>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Typography.Text
            style={{
              fontSize: 12.5,
              color: colors.textSecondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: '1 1 auto',
              minWidth: 0,
            }}
          >
            {snippet ? parse(snippet) : null}
          </Typography.Text>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 999,
              background: colors.surfaceMuted,
              color: colors.textSecondary,
              flexShrink: 0,
              fontWeight: 500,
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {receiver}
          </span>
        </div>
      </div>

      {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
    </div>
  );
}
