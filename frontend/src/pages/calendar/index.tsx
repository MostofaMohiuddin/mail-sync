import { useEffect, useMemo, useState, type ReactNode } from 'react';

import type { DatesSetArg, EventClickArg, EventContentArg } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayjs from 'dayjs';
import useSWR from 'swr';

import { colorForAccount } from './eventColors';
import EventDetails from './EventDetails';
import * as calendarApi from '../../api/Calendar';
import type { IEvent, IEventsResponse } from '../../common/types';
import Loader from '../../components/Loader';
import PageHeader from '../../components/ui/PageHeader';
import '../../components/fullcalendar.css';
import { useThemeMode } from '../../hooks/useThemeMode';

const PANEL_WIDTH = 440;
const PANEL_MAX_HEIGHT = 'calc(100vh - 32px)';
const PANEL_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
const PANEL_TRANSITION = `width 300ms ${PANEL_EASING}, margin-left 300ms ${PANEL_EASING}`;
const TIME_VIEW_HEIGHT = 'calc(100vh - 240px)';

export default function CalendarPage() {
  const { colors } = useThemeMode();
  const [events, setEvents] = useState<IEvent[]>([]);
  const [currentView, setCurrentView] = useState<string>('dayGridMonth');
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [referenceMonth, setReferenceMonth] = useState<dayjs.Dayjs>(dayjs());

  const { data, isLoading } = useSWR(
    ['/calendars/events', referenceMonth.format('YYYY-MM')],
    () =>
      calendarApi.getEvents({
        query: `time_min=${referenceMonth.startOf('month').toISOString()}&time_max=${referenceMonth.endOf('month').toISOString()}`,
      }),
    { revalidateOnFocus: true },
  );

  useEffect(() => {
    const flat: IEvent[] = [];
    data?.data.forEach((item: IEventsResponse) => {
      flat.push(...item.events.map((event) => ({ ...event, userEmail: item.email })));
    });
    setEvents(flat);
  }, [data]);

  useEffect(() => {
    const id = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
    return () => window.clearTimeout(id);
  }, [isPanelOpen]);

  const closePanel = () => setIsPanelOpen(false);

  const visibleEvents = useMemo(() => {
    if (!visibleRange) return events;
    const { start, end } = visibleRange;
    return events.filter((e) => {
      const eventStart = new Date(e.start);
      return eventStart >= start && eventStart < end;
    });
  }, [events, visibleRange]);

  const subtitle = useMemo(() => {
    const n = visibleEvents.length;
    const noun = currentView === 'dayGridMonth' ? 'this month' : currentView === 'timeGridWeek' ? 'this week' : 'today';
    if (n === 0) return `No events ${noun}.`;
    if (n === 1) return `1 event ${noun}.`;
    return `${n} events ${noun}.`;
  }, [visibleEvents.length, currentView]);

  const fcEvents = useMemo(
    () =>
      events.map((e) => {
        const color = colorForAccount(e.userEmail);
        return {
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end,
          backgroundColor: color,
          borderColor: color,
          textColor: '#ffffff',
          extendedProps: { event: e },
        };
      }),
    [events],
  );

  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentView(arg.view.type);
    setVisibleRange({ start: arg.start, end: arg.end });
    // Re-anchor the SWR fetch to whichever month covers the middle of the range.
    const middle = dayjs(arg.start.getTime() + (arg.end.getTime() - arg.start.getTime()) / 2);
    if (middle.format('YYYY-MM') !== referenceMonth.format('YYYY-MM')) {
      setReferenceMonth(middle);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const ev = (clickInfo.event.extendedProps as { event?: IEvent }).event;
    if (ev) {
      setSelectedEvent(ev);
      setIsPanelOpen(true);
    }
  };

  const renderEventContent = (arg: EventContentArg): ReactNode => {
    const isTimeGrid = arg.view.type !== 'dayGridMonth';
    return (
      <div style={{ overflow: 'hidden', lineHeight: 1.25, padding: '0 2px', width: '100%' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 12,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {arg.event.title}
        </div>
        {isTimeGrid && arg.timeText ? (
          <div
            style={{
              fontSize: 11,
              opacity: 0.85,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {arg.timeText}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <Loader loading={isLoading} />
      <PageHeader title="Calendar" subtitle={subtitle} />

      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', minHeight: 600 }}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={fcEvents}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }}
            editable={false}
            selectable={false}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            datesSet={handleDatesSet}
            dayMaxEvents={true}
            weekends={true}
            height={currentView === 'dayGridMonth' ? 'auto' : TIME_VIEW_HEIGHT}
            scrollTime="07:00:00"
          />

          {events.length === 0 && currentView === 'dayGridMonth' ? (
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
              No events this month.
            </div>
          ) : null}
        </div>

        <div
          aria-hidden={!isPanelOpen}
          {...({ inert: !isPanelOpen ? '' : undefined } as Record<string, unknown>)}
          style={{
            width: isPanelOpen ? PANEL_WIDTH : 0,
            marginLeft: isPanelOpen ? 16 : 0,
            overflow: 'hidden',
            transition: PANEL_TRANSITION,
            flexShrink: 0,
            position: 'sticky',
            top: 16,
            maxHeight: PANEL_MAX_HEIGHT,
          }}
        >
          <div style={{ width: PANEL_WIDTH }}>
            <EventDetails event={selectedEvent} closePanel={closePanel} />
          </div>
        </div>
      </div>
    </>
  );
}
