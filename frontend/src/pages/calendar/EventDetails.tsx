import { useState, type ReactNode } from 'react';

import {
  CalendarOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Flex } from 'antd';
import dayjs from 'dayjs';

import { colorForAccount } from './eventColors';
import type { IEvent } from '../../common/types';
import { generateAvatarText, generateRandomColor } from '../../common/utility';
import { useThemeMode } from '../../hooks/useThemeMode';

interface EventDetailsProps {
  event: IEvent | null;
  closePanel: () => void;
}

const DESCRIPTION_LINE_LIMIT = 6;

export default function EventDetails({ event, closePanel }: EventDetailsProps) {
  const { colors } = useThemeMode();
  const [showFullDescription, setShowFullDescription] = useState(false);

  if (!event) {
    return null;
  }

  const start = dayjs(event.start);
  const end = dayjs(event.end);
  const sameDay = start.isSame(end, 'day');
  const dateText = sameDay
    ? `${start.format('ddd, DD MMM YYYY')} · ${start.format('hh:mm A')} – ${end.format('hh:mm A')}`
    : `${start.format('ddd, DD MMM YYYY hh:mm A')} → ${end.format('ddd, DD MMM YYYY hh:mm A')}`;

  const description = event.description?.trim() ?? '';
  const descriptionLines = description ? description.split(/\r?\n/) : [];
  const truncatedDescription =
    !showFullDescription && descriptionLines.length > DESCRIPTION_LINE_LIMIT
      ? descriptionLines.slice(0, DESCRIPTION_LINE_LIMIT).join('\n')
      : description;

  const accountColor = colorForAccount(event.userEmail);

  const Row = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 0',
        borderBottom: `1px solid ${colors.border}`,
        fontSize: 13,
      }}
    >
      <div style={{ color: colors.textSecondary, fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0, color: colors.text }}>{children}</div>
    </div>
  );

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 14px',
          borderBottom: `1px solid ${colors.border}`,
          background: colors.surfaceMuted,
        }}
      >
        <Flex align="center" gap={8} style={{ minWidth: 0 }}>
          <span
            style={{
              width: 10,
              height: 10,
              background: accountColor,
              borderRadius: 2,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: colors.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.title}
          </span>
        </Flex>
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={closePanel} aria-label="Close panel" />
      </div>

      <div style={{ maxHeight: 'calc(100vh - 160px)', overflow: 'auto', padding: '0 14px' }}>
        <Row icon={<CalendarOutlined />}>
          {sameDay ? (
            <>
              <div style={{ fontWeight: 600 }}>{start.format('ddd, DD MMM YYYY')}</div>
              <div style={{ color: colors.textSecondary, marginTop: 2 }}>
                {start.format('hh:mm A')} – {end.format('hh:mm A')}
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 600 }}>{dateText}</div>
          )}
        </Row>
        <Row icon={<UserOutlined />}>{event.userEmail}</Row>
        {event.location ? <Row icon={<EnvironmentOutlined />}>{event.location}</Row> : null}
        {description ? (
          <Row icon={<FileTextOutlined />}>
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{truncatedDescription}</div>
            {descriptionLines.length > DESCRIPTION_LINE_LIMIT ? (
              <Button
                type="link"
                size="small"
                style={{ padding: 0, marginTop: 4 }}
                onClick={() => setShowFullDescription((v) => !v)}
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </Button>
            ) : null}
          </Row>
        ) : null}
        {event.attendees?.length > 0 ? (
          <Row icon={<TeamOutlined />}>
            <div style={{ marginBottom: 8 }}>
              {event.attendees.length} attendee{event.attendees.length === 1 ? '' : 's'}
            </div>
            <Flex wrap="wrap" gap={6}>
              {event.attendees.map((att) => (
                <Flex
                  key={att}
                  align="center"
                  gap={6}
                  style={{
                    padding: '4px 8px 4px 4px',
                    borderRadius: 999,
                    background: colors.surfaceMuted,
                    border: `1px solid ${colors.border}`,
                    fontSize: 12,
                    maxWidth: '100%',
                  }}
                >
                  <Avatar size={18} style={{ background: generateRandomColor(att), fontSize: 9, flexShrink: 0 }}>
                    {generateAvatarText(att)}
                  </Avatar>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 200,
                    }}
                  >
                    {att}
                  </span>
                </Flex>
              ))}
            </Flex>
          </Row>
        ) : null}
        {event.video_conference_link ? (
          <Row icon={<VideoCameraOutlined />}>
            <Button
              type="primary"
              size="small"
              href={event.video_conference_link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join meeting
            </Button>
          </Row>
        ) : null}
      </div>
    </div>
  );
}
