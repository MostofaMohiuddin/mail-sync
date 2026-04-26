/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';

import { Flex } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import useSWR from 'swr';

import CalendarView from './Calendar';
import DayCalendar from './DayCalendar';
import * as calendarApi from '../../api/Calendar';
import * as linkedMailApi from '../../api/LinkMailAddress';
import type { IEvent, IEventsResponse, IUserLinkedMail } from '../../common/types';
import GlassCard from '../../components/ui/GlassCard';
import Loader from '../../components/Loader';
import PageHeader from '../../components/ui/PageHeader';

export default function Calendar() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [sortedEvents, setSortedEvents] = useState({} as Record<string, IEvent[]>);
  const [userLinkedMail, setUserLinkedMail] = useState({});
  const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs());
  const getFormattedDateString = (date: Dayjs) => date.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
  const { data, isLoading } = useSWR(['/calendars/events', selectedDay.format('YYYY MM')], () =>
    calendarApi.getEvents({
      query: `time_min=${getFormattedDateString(selectedDay.startOf('month'))}&time_max=${getFormattedDateString(selectedDay.endOf('month'))}`,
    }),
  );
  const { data: linkedMailAddressResponse, isLoading: isLoadingMailAddresses } = useSWR(
    '/link-mail-address',
    linkedMailApi.getLinkedMailAddress,
    { revalidateOnMount: true, revalidateOnFocus: true },
  );
  const calendarRef = useRef<any>(null);

  useEffect(() => {
    const events: IEvent[] = [];
    data?.data.forEach((item: IEventsResponse) => {
      events.push(...item.events.map((event) => ({ ...event, userEmail: item.email })));
    });
    setEvents(events || []);
  }, [data]);

  useEffect(() => {
    const sortedEvents: Record<string, IEvent[]> = {};
    events.forEach((event) => {
      const start = dayjs(event.start);
      sortedEvents[start.format('MMDD')] = [...(sortedEvents[start.format('MMDD')] || []), event];
    });
    for (const [key, value] of Object.entries(sortedEvents)) {
      sortedEvents[key] = value.sort((a, b) => (dayjs(a.start).isBefore(dayjs(b.start)) ? -1 : 1));
    }
    setSortedEvents(sortedEvents);
  }, [events]);

  useEffect(() => {
    const userLinkedMail: { [key: string]: string } = {};
    linkedMailAddressResponse?.data.forEach((item: IUserLinkedMail) => {
      userLinkedMail[item.email] = item.picture;
    });
    setUserLinkedMail(userLinkedMail);
  }, [linkedMailAddressResponse]);

  const handleDateChange = (date: Dayjs) => {
    setSelectedDay(date);
    if (!calendarRef.current) return;
    const calendarApi = calendarRef.current.getApi();
    const dateToSet = date.toDate();
    calendarApi.gotoDate(dateToSet);
  };

  return (
    <>
      <Loader loading={isLoading || isLoadingMailAddresses} />

      <PageHeader
        title="Calendar"
        subtitle={`${selectedDay.format('MMMM YYYY')} · ${events.length} event${events.length === 1 ? '' : 's'}`}
      />

      <Flex justify="space-between" gap={20} wrap="wrap">
        <GlassCard variant="solid" padding={16} style={{ flex: '1 1 480px', minWidth: 0, height: '78vh', overflow: 'auto' }}>
          <CalendarView setSelectedDay={handleDateChange} events={sortedEvents} userLinkedMail={userLinkedMail} />
        </GlassCard>
        <GlassCard variant="solid" padding={16} style={{ flex: '1 1 380px', minWidth: 0, height: '78vh', overflow: 'hidden' }}>
          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--as-text-secondary)' }}>
            {selectedDay.format('dddd, MMMM D')}
          </div>
          <DayCalendar events={events} calendarRef={calendarRef} initialDate={selectedDay} />
        </GlassCard>
      </Flex>
    </>
  );
}
