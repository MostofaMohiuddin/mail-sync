import { useEffect, useState } from 'react';

import { Drawer } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import useSWR from 'swr';

import CalendarView from './Calendar';
import DayView from './DayView';
import * as calendarApi from '../../api/Calendar';
import * as linkedMailApi from '../../api/LinkMailAddress';
import type { IEvent, IEventsResponse, IUserLinkedMail } from '../../common/types';
import Loader from '../../components/Loader';

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
    {
      revalidateOnMount: true,
      revalidateOnFocus: true,
    },
  );

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };
  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    const events: IEvent[] = [];
    data?.data.forEach((item: IEventsResponse) => {
      events.push(
        ...item.events.map((event) => {
          return { ...event, userEmail: item.email };
        }),
      );
    });
    setEvents(events || []);
  }, [data]);

  useEffect(() => {
    const sortedEvents: Record<string, IEvent[]> = {};
    const eventIdsExist = new Set();
    events.forEach((event) => {
      const start = dayjs(event.start);
      if (eventIdsExist.has(event.id)) {
        return;
      }
      sortedEvents[start.format('MMDD')] = [...(sortedEvents[start.format('MMDD')] || []), event];
      eventIdsExist.add(event.id);
    });
    for (const [key, value] of Object.entries(sortedEvents)) {
      sortedEvents[key] = value.sort((a, b) => {
        return dayjs(a.start).isBefore(dayjs(b.start)) ? -1 : 1;
      });
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

  return (
    <>
      <Loader loading={isLoading || isLoadingMailAddresses} />
      <div style={{ width: isDrawerOpen ? '50%' : '100%', transition: 'all 0.3s' }}>
        <CalendarView
          setSelectedDay={setSelectedDay}
          events={sortedEvents}
          userLinkedMail={userLinkedMail}
          openDrawer={openDrawer}
        />
      </div>
      <Drawer
        title={`${selectedDay.format('dddd - DD MMMM, YYYY')}`}
        placement="right"
        width={'45%'}
        onClose={closeDrawer}
        open={isDrawerOpen}
        mask={false}
      >
        <DayView events={sortedEvents[selectedDay.format('MMDD')] || []} userLinkedMail={userLinkedMail} />
      </Drawer>
    </>
  );
}
