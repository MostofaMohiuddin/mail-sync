import '../../../components/fullcalendar.css';

import type { ReactNode } from 'react';
import { useState } from 'react';

import type { DateSelectArg, EventClickArg, EventContentArg } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { convert } from 'html-to-text';

import type { IScheduleAutoReply } from '../../../common/types';
import { useThemeMode } from '../../../hooks/useThemeMode';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Dhaka';
const EXCERPT_MAX = 60;

interface CalendarProps {
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  openDrawer: () => void;
  showModal: () => void;
  setSelectedSchedule: (schedule: IScheduleAutoReply | null) => void;
  schedules: IScheduleAutoReply[];
}

function bodyExcerpt(plain?: string, html?: string): string {
  const raw = plain || convert(html ?? '') || '';
  const firstLine =
    raw
      .split(/\r?\n/)
      .find((l) => l.trim().length > 0)
      ?.trim() ?? '';
  return firstLine.length > EXCERPT_MAX ? `${firstLine.slice(0, EXCERPT_MAX - 1)}…` : firstLine;
}

export default function Calendar({
  schedules,
  setStartDate,
  setEndDate,
  openDrawer,
  showModal,
  setSelectedSchedule,
}: CalendarProps) {
  const { colors } = useThemeMode();
  const [currentView, setCurrentView] = useState<string>('dayGridMonth');

  const schedulesById = schedules.reduce<Record<string, IScheduleAutoReply>>((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

  const events = schedules.map((schedule) => ({
    id: schedule.id,
    title: schedule.sender_details?.email ?? '',
    start: dayjs(schedule.start_time).utc(true).local().tz(TZ).toISOString(),
    end: dayjs(schedule.end_time).utc(true).local().tz(TZ).toISOString(),
    extendedProps: {
      excerpt: bodyExcerpt(schedule.body?.plain, schedule.body?.html),
      sender: schedule.sender_details?.email ?? '',
      startTime: schedule.start_time,
      endTime: schedule.end_time,
    },
  }));

  const handleCalendarDateSelect = (selectInfo: DateSelectArg) => {
    const calendarApi = selectInfo.view.calendar;
    setStartDate(dayjs(selectInfo.startStr));
    setEndDate(dayjs(selectInfo.endStr));
    calendarApi.unselect();
    openDrawer();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedSchedule(schedulesById[clickInfo.event.id] || null);
    showModal();
  };

  const renderEventContent = (arg: EventContentArg): ReactNode => {
    const ext = arg.event.extendedProps as {
      excerpt?: string;
      sender?: string;
      startTime?: string;
      endTime?: string;
    };
    const tooltip = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 600 }}>{ext.sender ?? ''}</span>
        <span style={{ fontSize: 12, opacity: 0.85 }}>
          {ext.startTime ? dayjs(ext.startTime).format('DD MMM, YYYY hh:mm A') : ''} →{' '}
          {ext.endTime ? dayjs(ext.endTime).format('DD MMM, YYYY hh:mm A') : ''}
        </span>
      </div>
    );
    return (
      <Tooltip title={tooltip} placement="top" mouseEnterDelay={0.2} destroyTooltipOnHide>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            lineHeight: 1.25,
            overflow: 'hidden',
            width: '100%',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {arg.event.title}
          </span>
          {ext.excerpt ? (
            <span style={{ fontSize: 11, opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ext.excerpt}
            </span>
          ) : null}
        </div>
      </Tooltip>
    );
  };

  return (
    <div style={{ position: 'relative', minHeight: 600 }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }}
        editable={false}
        selectable={true}
        selectMirror={true}
        select={handleCalendarDateSelect}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        dayMaxEvents={true}
        weekends={true}
        height="auto"
        datesSet={(arg) => setCurrentView(arg.view.type)}
      />

      {schedules.length === 0 && currentView === 'dayGridMonth' && (
        <div
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: colors.surface,
            border: `1px dashed ${colors.border}`,
            borderRadius: 12,
            padding: '12px 18px',
            color: colors.textSecondary,
            fontSize: 13,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
          }}
        >
          Drag any range of days to schedule an auto-reply.
        </div>
      )}
    </div>
  );
}
