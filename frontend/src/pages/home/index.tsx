import { useMemo } from 'react';

import {
  ArrowRightOutlined,
  BellOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  InboxOutlined,
  LinkOutlined,
  MailOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Skeleton, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';

import * as calendarApi from '../../api/Calendar';
import * as mailApi from '../../api/Mail';
import * as scheduleApi from '../../api/Schedule';
import { formatRelativeDate } from '../../common/formatRelativeDate';
import type { IEmailMetadata, IEvent, IEventsResponse, IScheduleMail } from '../../common/types';
import { generateAvatarText, generateRandomColor } from '../../common/utility';
import EmptyState from '../../components/ui/EmptyState';
import GlassCard from '../../components/ui/GlassCard';
import MailListItem from '../../components/ui/MailListItem';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { useSession } from '../../hooks/userSession';
import { useThemeMode } from '../../hooks/useThemeMode';
import { radius } from '../../themes/tokens';

const greetingFor = (hour: number) => {
  if (hour < 5) return 'Burning the midnight oil';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Working late';
};

export default function Home() {
  const navigate = useNavigate();
  const { colors } = useThemeMode();
  const { user, linkedMailAddresses, notifications } = useSession();
  const now = dayjs();

  // Mail (use the same endpoint the inbox uses; cached together via SWR)
  const { data: mailsResp, isLoading: isMailsLoading } = useSWR(['/mails', 1], () => mailApi.getMails());
  const recentMails: IEmailMetadata[] = mailsResp?.data?.mails ?? [];

  // Calendar — current month
  const { data: eventsResp, isLoading: isEventsLoading } = useSWR(
    linkedMailAddresses && linkedMailAddresses.length > 0 ? ['/calendars/events', now.format('YYYY MM')] : null,
    () =>
      calendarApi.getEvents({
        query: `time_min=${now.startOf('month').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')}&time_max=${now
          .endOf('month')
          .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')}`,
      }),
  );
  const allEvents: IEvent[] = useMemo(() => {
    const list: IEvent[] = [];
    eventsResp?.data?.forEach((item: IEventsResponse) => {
      list.push(...item.events.map((e) => ({ ...e, userEmail: item.email })));
    });
    return list.sort((a, b) => (dayjs(a.start).isBefore(dayjs(b.start)) ? -1 : 1));
  }, [eventsResp]);

  const todayEvents = allEvents.filter((e) => dayjs(e.start).isSame(now, 'day'));
  const upcomingEvents = allEvents.filter((e) => dayjs(e.start).isAfter(now)).slice(0, 5);
  const eventsThisWeek = allEvents.filter(
    (e) => dayjs(e.start).isAfter(now.startOf('day')) && dayjs(e.start).isBefore(now.endOf('day').add(7, 'day')),
  ).length;

  // Scheduled mails
  const { data: scheduledResp, isLoading: isScheduledLoading } = useSWR('/get-schedule-mails', () =>
    scheduleApi.getScheduleMails(),
  );
  const scheduledMails: IScheduleMail[] = scheduledResp?.data ?? [];
  const pendingScheduled = scheduledMails.filter((m) => m.status === 'pending');

  const unreadNotifications = notifications?.filter(({ status }) => status === 'unread').length ?? 0;
  const linkedCount = linkedMailAddresses?.length ?? 0;

  const linkedPictureByEmail = useMemo(() => {
    const map: Record<string, string> = {};
    linkedMailAddresses?.forEach((m) => {
      map[m.email] = m.picture;
    });
    return map;
  }, [linkedMailAddresses]);

  const summarySentence = useMemo(() => {
    const parts: string[] = [];
    parts.push(`${unreadNotifications} new important mail${unreadNotifications === 1 ? '' : 's'}`);
    parts.push(`${todayEvents.length} event${todayEvents.length === 1 ? '' : 's'} today`);
    if (pendingScheduled.length > 0) {
      parts.push(`${pendingScheduled.length} mail${pendingScheduled.length === 1 ? '' : 's'} scheduled`);
    }
    return parts.join(' · ');
  }, [unreadNotifications, todayEvents.length, pendingScheduled.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Greeting hero */}
      <div
        style={{
          position: 'relative',
          borderRadius: radius.xl,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          padding: '36px 36px 32px',
          color: '#FFFFFF',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-30%',
            right: '-5%',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.55), transparent 60%)',
            filter: 'blur(40px)',
            animation: 'as-float-orb 16s ease-in-out infinite',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-50%',
            left: '20%',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.4), transparent 60%)',
            filter: 'blur(50px)',
            animation: 'as-float-orb 20s ease-in-out infinite reverse',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                opacity: 0.7,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              {now.format('dddd, MMMM D')}
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
              }}
            >
              {greetingFor(now.hour())}, {user?.username || 'friend'}.
            </h1>
            <p style={{ margin: '10px 0 0', fontSize: 15, opacity: 0.8, lineHeight: 1.5 }}>{summarySentence}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button
              size="large"
              icon={<EditOutlined />}
              onClick={() => navigate('/emails')}
              style={{
                background: 'rgba(255,255,255,0.95)',
                color: '#312E81',
                fontWeight: 600,
                border: 'none',
                boxShadow: '0 8px 18px rgba(0,0,0,0.14)',
              }}
            >
              Compose
            </Button>
            <Button
              size="large"
              icon={<InboxOutlined />}
              onClick={() => navigate('/emails')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.24)',
                backdropFilter: 'blur(10px)',
              }}
            >
              Open inbox
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <StatCard
          icon={<LinkOutlined />}
          label="Linked accounts"
          value={linkedCount}
          accent={colors.primary}
          tint={colors.primaryGradientSoft}
        />
        <StatCard
          icon={<BellOutlined />}
          label="Important unread"
          value={unreadNotifications}
          accent={colors.warning}
          tint="rgba(245,158,11,0.12)"
        />
        <StatCard
          icon={<ClockCircleOutlined />}
          label="Scheduled mails"
          value={pendingScheduled.length}
          accent={colors.info}
          tint="rgba(59,130,246,0.12)"
        />
        <StatCard
          icon={<CalendarOutlined />}
          label="Events this week"
          value={eventsThisWeek}
          accent={colors.success}
          tint="rgba(16,185,129,0.12)"
        />
      </div>

      {/* Two-column grid: recent mail + agenda */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 16,
          alignItems: 'flex-start',
        }}
        className="home-grid"
      >
        {/* Recent mail */}
        <GlassCard variant="solid" padding={20}>
          <SectionHeader
            eyebrow="Inbox"
            title="Recent mail"
            description={
              linkedCount === 0 ? 'Link your first account to start syncing' : 'Latest from across your accounts'
            }
            action={
              linkedCount > 0 && (
                <Link
                  to="/emails"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.primary,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  View all <ArrowRightOutlined />
                </Link>
              )
            }
          />
          {linkedCount === 0 ? (
            <EmptyState
              size="md"
              icon={<MailOutlined />}
              title="No accounts connected yet"
              description="Connect Gmail to start syncing mail and calendar."
              action={
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={() => navigate('/profile')}
                  style={{ background: colors.primaryGradient, border: 'none' }}
                >
                  Link an account
                </Button>
              }
            />
          ) : isMailsLoading && recentMails.length === 0 ? (
            <div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: 14,
                    marginBottom: 8,
                    borderRadius: radius.lg,
                    background: colors.surfaceMuted,
                  }}
                >
                  <Skeleton avatar active paragraph={{ rows: 2, width: ['80%', '60%'] }} title={false} />
                </div>
              ))}
            </div>
          ) : recentMails.length === 0 ? (
            <EmptyState
              size="md"
              icon={<InboxOutlined />}
              title="No mail yet"
              description="When new mail arrives, it shows up here."
            />
          ) : (
            <div>
              {recentMails.slice(0, 5).map((item) => (
                <MailListItem
                  key={`${item.id}-${item.receiver?.email}`}
                  sender={item.sender.name ? item.sender.name : item.sender.email}
                  subject={item.subject}
                  snippet={item.snippet}
                  date={item.date}
                  receiver={item.receiver.email}
                  onClick={() => navigate(`/emails/${item.receiver.email}/${item.id}`)}
                />
              ))}
            </div>
          )}
        </GlassCard>

        {/* Right column: agenda + scheduled */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GlassCard variant="solid" padding={20}>
            <SectionHeader
              eyebrow="Agenda"
              title="Up next"
              description={now.format('MMM D')}
              action={
                <Link
                  to="/calendar"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.primary,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Calendar <ArrowRightOutlined />
                </Link>
              }
            />
            {isEventsLoading && upcomingEvents.length === 0 ? (
              <div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      borderRadius: radius.md,
                      background: colors.surfaceMuted,
                    }}
                  >
                    <Skeleton active paragraph={{ rows: 1 }} title={{ width: '70%' }} />
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <EmptyState
                size="sm"
                icon={<CalendarOutlined />}
                title="Nothing on the calendar"
                description={linkedCount === 0 ? 'Link an account to see events.' : 'Enjoy the quiet.'}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingEvents.map((event) => (
                  <EventRow key={event.id} event={event} picture={linkedPictureByEmail[event.userEmail]} />
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard variant="solid" padding={20}>
            <SectionHeader
              eyebrow="Outbox"
              title="Scheduled mail"
              description={pendingScheduled.length === 0 ? 'Nothing queued' : `${pendingScheduled.length} pending`}
              action={
                <Link
                  to="/schedule/mails"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.primary,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Manage <ArrowRightOutlined />
                </Link>
              }
            />
            {isScheduledLoading && scheduledMails.length === 0 ? (
              <Skeleton active paragraph={{ rows: 2 }} title={false} />
            ) : pendingScheduled.length === 0 ? (
              <EmptyState
                size="sm"
                icon={<ClockCircleOutlined />}
                title="No scheduled mail"
                description="Use the Compose drawer to queue a send."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingScheduled.slice(0, 3).map((m) => (
                  <ScheduledRow key={m.id} mail={m} />
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Quick actions */}
      <GlassCard variant="solid" padding={20}>
        <SectionHeader
          eyebrow="Quick actions"
          title="Get things done"
          description="Jump straight into the most-used flows"
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          <ActionTile
            icon={<EditOutlined />}
            label="Compose mail"
            sub="Write or schedule a send"
            onClick={() => navigate('/emails')}
          />
          <ActionTile
            icon={<ThunderboltOutlined />}
            label="Auto reply"
            sub="Set out-of-office"
            onClick={() => navigate('/schedule/auto-reply')}
          />
          <ActionTile
            icon={<LinkOutlined />}
            label="Link account"
            sub="Connect Gmail"
            onClick={() => navigate('/profile')}
          />
          <ActionTile
            icon={<CalendarOutlined />}
            label="Open calendar"
            sub="Today's schedule"
            onClick={() => navigate('/calendar')}
          />
        </div>
      </GlassCard>

      <style>{`
        @media (max-width: 960px) {
          .home-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
  tint: string;
}) {
  const { colors } = useThemeMode();
  return (
    <GlassCard variant="solid" padding={18} hoverable>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: tint,
            color: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {value}
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6, fontWeight: 500 }}>{label}</div>
        </div>
      </div>
    </GlassCard>
  );
}

function EventRow({ event, picture }: { event: IEvent; picture?: string }) {
  const { colors } = useThemeMode();
  const start = dayjs(event.start);
  const isToday = start.isSame(dayjs(), 'day');
  const isTomorrow = start.isSame(dayjs().add(1, 'day'), 'day');
  const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : start.format('ddd, MMM D');
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: 12,
        borderRadius: radius.md,
        background: colors.surfaceMuted,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          width: 56,
          flexShrink: 0,
          textAlign: 'center',
          padding: '6px 0',
          borderRadius: radius.sm,
          background: colors.primaryGradientSoft,
          color: colors.primary,
          fontWeight: 700,
          fontSize: 13,
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.75 }}>{start.format('MMM').toUpperCase()}</div>
        <div style={{ fontSize: 18 }}>{start.format('DD')}</div>
      </div>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <Typography.Text
          strong
          style={{
            display: 'block',
            fontSize: 13.5,
            color: colors.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {event.title || '(no title)'}
        </Typography.Text>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          {dayLabel} · {start.format('HH:mm')}
          {event.end ? `–${dayjs(event.end).format('HH:mm')}` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          {picture && <Avatar size={18} src={picture} />}
          <Typography.Text
            style={{
              fontSize: 11,
              color: colors.textTertiary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {event.userEmail}
          </Typography.Text>
          {event.video_conference_link && (
            <Tooltip title="Has video link">
              <VideoCameraOutlined style={{ fontSize: 12, color: colors.primary }} />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

function ScheduledRow({ mail }: { mail: IScheduleMail }) {
  const { colors } = useThemeMode();
  const senderEmail = mail.sender_details?.email || '';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        borderRadius: radius.md,
        background: colors.surfaceMuted,
        border: `1px solid ${colors.border}`,
      }}
    >
      <Avatar
        size={32}
        style={{ background: generateRandomColor(senderEmail), fontSize: 12, fontWeight: 600, flexShrink: 0 }}
      >
        {generateAvatarText(senderEmail || mail.receiver)}
      </Avatar>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
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
          {mail.subject || '(no subject)'}
        </Typography.Text>
        <Typography.Text
          style={{
            fontSize: 11.5,
            color: colors.textSecondary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
          }}
        >
          To {mail.receiver} · sends {formatRelativeDate(mail.scheduled_at)}
        </Typography.Text>
      </div>
      <StatusBadge variant="info">PENDING</StatusBadge>
    </div>
  );
}

function ActionTile({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  const { colors } = useThemeMode();
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: radius.lg,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms',
        font: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(15,23,42,0.06)';
        e.currentTarget.style.borderColor = colors.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = colors.border;
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: colors.primaryGradient,
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
          boxShadow: '0 6px 14px rgba(99,102,241,0.3)',
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{label}</div>
        <div style={{ fontSize: 12, color: colors.textSecondary }}>{sub}</div>
      </div>
      <PlusOutlined style={{ marginLeft: 'auto', color: colors.textTertiary, fontSize: 12 }} />
    </button>
  );
}
