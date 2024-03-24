import type { DateSelectArg, EventClickArg } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import type { IScheduleAutoReply } from '../../../common/types';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Calendar({
  schedules,
  setStartDate,
  setEndDate,
  openDrawer,
  showModal,
  setSelectedSchedule,
}: {
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  openDrawer: () => void;
  showModal: () => void;
  setSelectedSchedule: (schedule: IScheduleAutoReply | null) => void;
  schedules: IScheduleAutoReply[];
}) {
  const getEvents = () =>
    schedules.map((schedule) => {
      return {
        id: schedule.id,
        start: dayjs(schedule.start_time).utc(true).local().tz('Asia/Dhaka').toISOString(),
        end: dayjs(schedule.end_time).utc(true).local().tz('Asia/Dhaka').toISOString(),
      };
    });

  const schedulesMapById = schedules.reduce(
    (acc, schedule) => {
      acc[schedule.id] = schedule;
      return acc;
    },
    {} as Record<string, IScheduleAutoReply>,
  );

  const handleCalendarDateSelect = (selectInfo: DateSelectArg) => {
    const calendarApi = selectInfo.view.calendar;
    setStartDate(dayjs(selectInfo.startStr));
    setEndDate(dayjs(selectInfo.endStr));
    calendarApi.unselect(); // clear date selection
    openDrawer();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedSchedule(schedulesMapById[clickInfo.event.id] || null);
    showModal();
  };

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={getEvents()}
        headerToolbar={{
          left: 'prev,next',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        editable={true}
        selectable={true}
        selectMirror={true}
        select={handleCalendarDateSelect}
        eventClick={handleEventClick}
        dayMaxEvents={true}
        weekends={true}
        height={'80vh'}
      />
    </>
  );
}
