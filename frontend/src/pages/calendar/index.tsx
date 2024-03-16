/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import useSWR from 'swr';

import CalendarView from './Calendar';
import * as calendarApi from '../../api/Calendar';
import * as linkedMailApi from '../../api/LinkMailAddress';
import type { IEvent, IEventsResponse, IUserLinkedMail } from '../../common/types';
import Loader from '../../components/Loader';

export default function Calendar() {
  const [events, setEvents] = useState<IEvent[]>([]);
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
    const userLinkedMail: { [key: string]: string } = {};
    linkedMailAddressResponse?.data.forEach((item: IUserLinkedMail) => {
      userLinkedMail[item.email] = item.picture;
    });
    setUserLinkedMail(userLinkedMail);
  }, [linkedMailAddressResponse]);

  return (
    <>
      <Loader loading={isLoading || isLoadingMailAddresses} />
      <CalendarView setSelectedDay={setSelectedDay} events={events} userLinkedMail={userLinkedMail} />
    </>
  );
}
